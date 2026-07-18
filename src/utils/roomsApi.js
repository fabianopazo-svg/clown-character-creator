import { doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, onSnapshot, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { getDefaultPlayState } from './playState';

// Excludes visually ambiguous characters (0/O, 1/I) since this gets typed by hand.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode(length = 5) {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function createRoom(mcUid, name = '') {
  let code;
  let attempts = 0;
  // Collision is very unlikely at this scale, but check anyway rather than assume.
  while (attempts < 5) {
    code = generateRoomCode();
    const snap = await getDoc(doc(db, 'rooms', code));
    if (!snap.exists()) break;
    attempts++;
  }

  await setDoc(doc(db, 'rooms', code), {
    code,
    name: name.trim(),
    mcUid,
    status: 'open',
    createdAt: serverTimestamp(),
    momentum: 0,
    suspicion: 0,
    spotlightHolder: null,
    houseDieResult: null, // null | 'cheers' | 'jeers' — last recorded House Die result
    houseDifficulty: 0, // MC-set modifier applied to every House Die roll this scene
  });

  return code;
}

// Fully deletes a room and everything under it — rolls and their
// reactions, prompts, every player's roster entry and private sheet, all
// live NPC trackers, the MC's private notes, and finally the room doc
// itself. Firestore doesn't
// cascade subcollection deletes on its own, so this enumerates and
// deletes each one explicitly. Only callable by the room's actual MC —
// enforced both here (mcUid check before starting) and independently by
// firestore.rules on every individual delete. Irreversible; callers
// should confirm with the user before calling this.
export async function deleteRoomCompletely(code, mcUid) {
  const roomCode = code.toUpperCase();
  const roomRef = doc(db, 'rooms', roomCode);

  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return; // already gone — nothing to do
  if (roomSnap.data().mcUid !== mcUid) {
    throw new Error('Only the MC who created this room can delete it.');
  }

  const rollsSnap = await getDocs(collection(db, 'rooms', roomCode, 'rolls'));
  for (const rollDoc of rollsSnap.docs) {
    const reactionsSnap = await getDocs(collection(db, 'rooms', roomCode, 'rolls', rollDoc.id, 'reactions'));
    await Promise.all(reactionsSnap.docs.map((r) => deleteDoc(r.ref)));
    await deleteDoc(rollDoc.ref);
  }

  const promptsSnap = await getDocs(collection(db, 'rooms', roomCode, 'prompts'));
  await Promise.all(promptsSnap.docs.map((p) => deleteDoc(p.ref)));

  const suspicionSpendsSnap = await getDocs(collection(db, 'rooms', roomCode, 'suspicionSpends'));
  await Promise.all(suspicionSpendsSnap.docs.map((s) => deleteDoc(s.ref)));

  const playersSnap = await getDocs(collection(db, 'rooms', roomCode, 'players'));
  for (const playerDoc of playersSnap.docs) {
    const privateSnap = await getDocs(collection(db, 'rooms', roomCode, 'players', playerDoc.id, 'private'));
    await Promise.all(privateSnap.docs.map((pd) => deleteDoc(pd.ref)));
    await deleteDoc(playerDoc.ref);
  }

  const mcNpcsSnap = await getDocs(collection(db, 'rooms', roomCode, 'mcNpcs'));
  await Promise.all(mcNpcsSnap.docs.map((d) => deleteDoc(d.ref)));

  const mcPrivateSnap = await getDocs(collection(db, 'rooms', roomCode, 'mcPrivate'));
  await Promise.all(mcPrivateSnap.docs.map((d) => deleteDoc(d.ref)));

  await deleteDoc(roomRef);
}

// MC-only room-level state: Momentum, Suspicion, House Die result, Spotlight
// holder. All four are flat top-level fields on the same room doc, gated by
// the existing "allow update: if resource.data.mcUid == request.auth.uid"
// rule — a non-MC caller's write is rejected server-side regardless of
// what the UI does, so this one function is safe to share across all four.
export async function updateRoomState(code, patch) {
  const roomRef = doc(db, 'rooms', code.toUpperCase());
  await updateDoc(roomRef, patch);
}

export async function getRoom(code) {
  const snap = await getDoc(doc(db, 'rooms', code.toUpperCase()));
  return snap.exists() ? snap.data() : null;
}

export function subscribeRoom(code, callback) {
  return onSnapshot(doc(db, 'rooms', code.toUpperCase()), snap => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function joinRoomAsPlayer(code, uid, { displayName, character }) {
  const roomCode = code.toUpperCase();

  // If this Clown has never been opened in solo Play Mode, its `play` field is
  // still null — initialize it here so the room always has real resource
  // numbers to show, rather than a blank/undefined state.
  const characterWithPlay = character.play
    ? character
    : { ...character, play: getDefaultPlayState(character) };

  // Public roster doc: identity info only, readable by everyone in the room.
  // { merge: true } is deliberate — a returning player's notebook (and
  // anything else persistent stored on this doc) must survive a rejoin,
  // not get wiped by a full overwrite.
  const rosterRef = doc(db, 'rooms', roomCode, 'players', uid);
  await setDoc(rosterRef, {
    uid,
    displayName,
    ringName: character.ringName || '',
    troupeId: character.troupeId || '',
    pathId: character.pathId || '',
    subtypeId: character.subtypeId || '',
    renown: character.renown || 1,
    joinedAt: serverTimestamp(),
    present: true,
  }, { merge: true });

  // Private sheet doc: the full character, including live resources.
  // Readable only by this player or the room's MC — see firestore.rules.
  const sheetRef = doc(db, 'rooms', roomCode, 'players', uid, 'private', 'sheet');
  await setDoc(sheetRef, {
    character: characterWithPlay,
    updatedAt: serverTimestamp(),
  });
}

// A player editing their own resources from inside the room. Firestore
// rules already restrict writes on the private/sheet doc to
// request.auth.uid == playerId, so this can only ever succeed for the
// caller's own sheet — no extra guarding needed here.
//
// Uses updateDoc with a dotted field path rather than re-setting the whole
// character, so a single dot click only ever touches the one field it
// changed. This assumes the sheet doc already exists (it's created by
// joinRoomAsPlayer), which it always will by the time a player can see
// their own card to click on.
export async function updatePlayResource(code, uid, field, value) {
  const sheetRef = doc(db, 'rooms', code.toUpperCase(), 'players', uid, 'private', 'sheet');
  await updateDoc(sheetRef, {
    [`character.play.${field}`]: value,
    updatedAt: serverTimestamp(),
  });
}

export async function updatePlayPathResource(code, uid, key, value) {
  const sheetRef = doc(db, 'rooms', code.toUpperCase(), 'players', uid, 'private', 'sheet');
  await updateDoc(sheetRef, {
    [`character.play.pathResource.${key}`]: value,
    updatedAt: serverTimestamp(),
  });
}

// Removes a player from the *visible* roster — the MC and other players
// stop seeing them listed — without destroying their notebook or other
// persistent roster data. The private sheet (live resources) still gets
// deleted, since that's just a snapshot that's recreated fresh on rejoin
// anyway and has nothing worth keeping around while they're gone.
export async function leaveRoom(code, uid) {
  const roomCode = code.toUpperCase();
  const rosterRef = doc(db, 'rooms', roomCode, 'players', uid);
  await Promise.all([
    deleteDoc(doc(db, 'rooms', roomCode, 'players', uid, 'private', 'sheet')),
    updateDoc(rosterRef, { present: false }),
  ]);
}

// Notebook pages live as a plain array field on the public roster doc —
// readable by everyone in the room, writable only by the owner (same
// rule as the rest of that doc, no rules change needed). Firestore can't
// address one element of an array field directly, so callers read the
// current array from their already-live roster subscription, produce a
// new array locally (add a page / edit the last page's text / toggle a
// struck word on a past page), and pass the whole thing back here.
export async function updateNotebook(code, uid, notebook) {
  const rosterRef = doc(db, 'rooms', code.toUpperCase(), 'players', uid);
  await updateDoc(rosterRef, { notebook });
}

// Emoji reactions on a roll — one per player per roll, keyed by their own
// uid so setting a new emoji naturally overwrites their previous one.
export async function setReaction(code, rollId, uid, emoji) {
  const reactionRef = doc(db, 'rooms', code.toUpperCase(), 'rolls', rollId, 'reactions', uid);
  await setDoc(reactionRef, { emoji, reactedAt: serverTimestamp() });
}

export async function removeReaction(code, rollId, uid) {
  const reactionRef = doc(db, 'rooms', code.toUpperCase(), 'rolls', rollId, 'reactions', uid);
  await deleteDoc(reactionRef);
}

export function subscribeReactions(code, rollId, callback) {
  return onSnapshot(collection(db, 'rooms', code.toUpperCase(), 'rolls', rollId, 'reactions'), (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
  });
}

// Logs a roll to the room's roll history. Firestore rules enforce
// rollerUid == caller, and rolls are create-only (no edits/deletes) —
// this is meant to be an honest record of what actually happened.
// Returns the new document's id (used by Encore to reference its parent roll).
export async function createRoll(code, rollData) {
  const rollsRef = collection(db, 'rooms', code.toUpperCase(), 'rolls');
  const newDocRef = doc(rollsRef);
  await setDoc(newDocRef, {
    ...rollData,
    createdAt: serverTimestamp(),
  });
  return newDocRef.id;
}

// code, callback, and an optional count. Omit count (or pass null) to get
// every roll in the room's history, oldest excluded only by Firestore's
// own limits — for a small-group hobby game this never gets large enough
// to matter. Pass a count to cap it if that ever changes.
export function subscribeRollLog(code, callback, count = null) {
  const rollsRef = collection(db, 'rooms', code.toUpperCase(), 'rolls');
  const rollsQuery = count
    ? query(rollsRef, orderBy('createdAt', 'desc'), limit(count))
    : query(rollsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(rollsQuery, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// The broadcast signal that starts the drumroll sound playing for
// everyone in the room — written before the actual result is revealed.
// Every client's audio controller watches for this timestamp appearing
// on a roll it doesn't already know about, and plays the sound locally.
export async function startDrumrollReveal(code, rollId) {
  const rollRef = doc(db, 'rooms', code.toUpperCase(), 'rolls', rollId);
  await updateDoc(rollRef, { revealingAt: serverTimestamp() });
}

// Flips a Drumroll roll's `revealed` flag from false to true — this is
// what makes it visible to everyone else in Table Chat and lets the
// deferred room-level effects (Suspicion/Momentum) finally apply. See
// RollPanel's applyRoomDelta for why those specifically wait for this.
export async function revealRoll(code, rollId) {
  const rollRef = doc(db, 'rooms', code.toUpperCase(), 'rolls', rollId);
  await updateDoc(rollRef, { revealed: true });
}

// The rulebook names what Suspicion can be spent on (boss activations,
// complications, summoning the Ushers, forcing a Face roll, seizing the
// Spotlight) but never gives fixed costs — that's an MC judgment call
// each time, not a fixed price list. This logs whatever the MC decides,
// publicly, so the table sees the tension move in real time the same way
// rolls and prompts already do. For the two reasons with an unambiguous
// mechanical effect (seizing the Spotlight, or letting an enemy act after
// a Corpsing), this also sets spotlightHolder to 'mc' as a convenience.
export async function spendSuspicion(code, uid, { reason, amount, note }, currentSuspicion) {
  const roomCode = code.toUpperCase();
  const newSuspicion = Math.max(0, currentSuspicion - amount);
  const patch = { suspicion: newSuspicion };
  if (reason === 'seize_spotlight' || reason === 'let_enemy_act') {
    patch.spotlightHolder = 'mc';
  }
  await updateRoomState(code, patch);

  const spendsRef = collection(db, 'rooms', roomCode, 'suspicionSpends');
  await setDoc(doc(spendsRef), {
    reason,
    amount,
    note: note || '',
    spentByUid: uid,
    createdAt: serverTimestamp(),
  });
}

export function subscribeSuspicionSpends(code, callback) {
  return onSnapshot(collection(db, 'rooms', code.toUpperCase(), 'suspicionSpends'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Live NPC/monster trackers for the current session — MC-only (see
// firestore.rules' mcNpcs match). Each NPC is its own document so
// combat-time dot-clicking on one NPC's Health never touches the others.
export async function addNpc(code, npcData) {
  const npcsRef = collection(db, 'rooms', code.toUpperCase(), 'mcNpcs');
  const newDocRef = doc(npcsRef);
  await setDoc(newDocRef, { ...npcData, createdAt: serverTimestamp() });
  return newDocRef.id;
}

export async function updateNpc(code, npcId, patch) {
  const npcRef = doc(db, 'rooms', code.toUpperCase(), 'mcNpcs', npcId);
  await updateDoc(npcRef, patch);
}

export async function removeNpc(code, npcId) {
  const npcRef = doc(db, 'rooms', code.toUpperCase(), 'mcNpcs', npcId);
  await deleteDoc(npcRef);
}

export function subscribeNpcs(code, callback) {
  return onSnapshot(
    collection(db, 'rooms', code.toUpperCase(), 'mcNpcs'),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => callback([]), // permission-denied for a non-MC caller -> empty list, not a crash
  );
}

// Truly MC-only data — see firestore.rules' mcPrivate match. Non-MC
// callers get a permission-denied error, handled the same way as other
// privacy-gated subscriptions in this app: report null, don't crash.
export async function saveMcNotes(code, notes) {
  const ref = doc(db, 'rooms', code.toUpperCase(), 'mcPrivate', 'data');
  await setDoc(ref, { notes, updatedAt: serverTimestamp() }, { merge: true });
}

export function subscribeMcNotes(code, callback) {
  return onSnapshot(
    doc(db, 'rooms', code.toUpperCase(), 'mcPrivate', 'data'),
    (snap) => callback(snap.exists() ? snap.data() : { notes: '' }),
    () => callback(null),
  );
}

export function subscribePlayers(code, callback) {
  return onSnapshot(collection(db, 'rooms', code.toUpperCase(), 'players'), snap => {
    callback(snap.docs.map(d => d.data()));
  });
}

// A roll prompt: the MC posting "Roll for climbing the wall, Difficulty 3"
// into the chat log. Firestore rules restrict creation to this room's
// actual MC, tagged as themself.
export async function createPrompt(code, promptData) {
  const promptsRef = collection(db, 'rooms', code.toUpperCase(), 'prompts');
  await setDoc(doc(promptsRef), {
    ...promptData,
    createdAt: serverTimestamp(),
  });
}

export function subscribePrompts(code, callback) {
  const promptsQuery = query(
    collection(db, 'rooms', code.toUpperCase(), 'prompts'),
    orderBy('createdAt', 'asc'),
  );
  return onSnapshot(promptsQuery, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// The MC's Flop-award decision: grants the roller 0/1/2 Laughter (clamped
// to their laughterMax) and marks the roll as resolved so the buttons
// don't linger. Two separate writes rather than a transaction — at this
// scale (a single MC, a handful of players) the tiny window between them
// isn't a real risk, and if the second write somehow failed the player
// still got their Laughter, which is the part that actually matters.
export async function awardFlopLaughter(code, rollId, rollerUid, amount) {
  const roomCode = code.toUpperCase();
  const rollRef = doc(db, 'rooms', roomCode, 'rolls', rollId);

  if (amount > 0) {
    const sheetRef = doc(db, 'rooms', roomCode, 'players', rollerUid, 'private', 'sheet');
    const sheetSnap = await getDoc(sheetRef);
    if (!sheetSnap.exists()) throw new Error('Player sheet not found — cannot award Laughter.');
    const play = sheetSnap.data().character.play;
    const newLaughter = Math.min(play.laughterMax, (play.laughter || 0) + amount);
    await updateDoc(sheetRef, {
      'character.play.laughter': newLaughter,
      updatedAt: serverTimestamp(),
    });
  }

  await updateDoc(rollRef, { flopAwarded: amount });
}

// Subscribes to one player's private sheet (full character + live resources).
// Only resolves data if the caller passes Firestore's security rules —
// i.e. they're that player, or the room's MC. onError fires separately from
// onData so callers can tell "permission denied" apart from "doc doesn't
// exist yet" instead of both silently looking like "still loading".
export function subscribePlayerSheet(code, uid, onData, onError) {
  return onSnapshot(
    doc(db, 'rooms', code.toUpperCase(), 'players', uid, 'private', 'sheet'),
    snap => onData(snap.exists() ? snap.data() : null),
    err => {
      if (onError) onError(err);
      else onData(null);
    },
  );
}
