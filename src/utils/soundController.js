// Sound is broadcast, not streamed: every browser plays its own local
// copy of the same file on cue (a Firestore field change or a specific
// roll's revealingAt timestamp), rather than one client's audio position
// being synced to everyone else's. This module owns the actual <audio>
// elements and playback logic; React components just call these functions.

const MOOD_FILES = {
  neutral: "/audio/mood/mood-neutral.mp3",
  tense: "/audio/mood/mood-tense.mp3",
  high_energy: "/audio/mood/mood-high-energy.mp3",
};
const DRUMROLL_FILE = "/audio/sfx/drumroll.mp3";
const FADE_MS = 1500;

let moodElA = null;
let moodElB = null;
let activeIsA = true;
let currentMoodId = null;
let fadeRafId = null;
let unlocked = false;

function readStoredMute(key) {
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}
function writeStoredMute(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore — muting still works for this session even if storage is unavailable
  }
}
function readStoredVolume(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed)
      ? Math.min(1, Math.max(0, parsed))
      : fallback;
  } catch {
    return fallback;
  }
}
function writeStoredVolume(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

let musicMuted = readStoredMute("clown_musicMuted");
let drumrollMuted = readStoredMute("clown_drumrollMuted");
let musicVolume = readStoredVolume("clown_musicVolume", 0.2);
let drumrollVolume = readStoredVolume("clown_drumrollVolume", 0.4);

function ensureMoodElements() {
  if (moodElA) return;
  moodElA = new Audio();
  moodElA.loop = true;
  moodElA.volume = 0;
  moodElB = new Audio();
  moodElB.loop = true;
  moodElB.volume = 0;
}

function activeEl() {
  return activeIsA ? moodElA : moodElB;
}
function inactiveEl() {
  return activeIsA ? moodElB : moodElA;
}

// Browsers block audio playback until the page has had at least one real
// user gesture. Call this from a click handler once per session — it
// does a silent play-then-pause on both mood elements to "unlock" them,
// so later programmatic play() calls (triggered by remote Firestore
// changes, not a click) are allowed to actually play.
export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  ensureMoodElements();
  [moodElA, moodElB].forEach((el) => {
    const prevVolume = el.volume;
    el.volume = 0;
    el.play()
      .then(() => el.pause())
      .catch(() => {});
    el.volume = prevVolume;
  });
}

export function isUnlocked() {
  return unlocked;
}

export function getMusicMuted() {
  return musicMuted;
}
export function setMusicMuted(muted) {
  musicMuted = muted;
  writeStoredMute("clown_musicMuted", muted);
  if (!fadeRafId) {
    if (moodElA) moodElA.volume = musicMuted ? 0 : activeIsA ? musicVolume : 0;
    if (moodElB) moodElB.volume = musicMuted ? 0 : activeIsA ? 0 : musicVolume;
  }
}

export function getMusicVolume() {
  return musicVolume;
}
export function setMusicVolume(volume) {
  musicVolume = Math.min(1, Math.max(0, volume));
  writeStoredVolume("clown_musicVolume", musicVolume);
  // No fade in progress -- apply immediately for responsive slider feedback.
  // If a fade IS in progress, its next frame already reads musicVolume
  // fresh each tick, so it picks up the new target on its own.
  if (!fadeRafId && !musicMuted) {
    activeEl().volume = musicVolume;
  }
}

export function getDrumrollMuted() {
  return drumrollMuted;
}
export function setDrumrollMuted(muted) {
  drumrollMuted = muted;
  writeStoredMute("clown_drumrollMuted", muted);
}

export function getDrumrollVolume() {
  return drumrollVolume;
}
export function setDrumrollVolume(volume) {
  drumrollVolume = Math.min(1, Math.max(0, volume));
  writeStoredVolume("clown_drumrollVolume", drumrollVolume);
}

// Crossfades to a new mood (or fades out to silence if moodId is null/
// unrecognized). No-op if it's already the current mood — a room-doc
// snapshot firing again with the same value shouldn't restart the fade.
export function setMood(moodId) {
  if (moodId === currentMoodId) return;
  currentMoodId = moodId;
  ensureMoodElements();

  if (fadeRafId) {
    cancelAnimationFrame(fadeRafId);
    fadeRafId = null;
  }

  const outgoing = activeEl();
  const incoming = inactiveEl();
  const hasIncoming = moodId && MOOD_FILES[moodId];

  if (hasIncoming) {
    incoming.src = MOOD_FILES[moodId];
    incoming.currentTime = 0;
    incoming.volume = 0;
    if (unlocked) incoming.play().catch(() => {});
  }

  activeIsA = !activeIsA;

  const start = performance.now();
  const outgoingStartVolume = outgoing.volume;

  function step(now) {
    const t = Math.min(1, (now - start) / FADE_MS);
    if (!musicMuted) {
      outgoing.volume = outgoingStartVolume * (1 - t);
      if (hasIncoming) incoming.volume = t * musicVolume;
    } else {
      outgoing.volume = 0;
      incoming.volume = 0;
    }
    if (t < 1) {
      fadeRafId = requestAnimationFrame(step);
    } else {
      fadeRafId = null;
      outgoing.pause();
      outgoing.removeAttribute("src");
    }
  }
  fadeRafId = requestAnimationFrame(step);
}

// One-shot drumroll playback. Resolves once the sound finishes (or on
// error, or after a 6s safety timeout so a reveal can never get stuck
// forever if something about playback goes wrong). Each call gets its
// own fresh Audio element rather than reusing one, since drumrolls are
// fire-and-forget and could in principle overlap.
export function playDrumrollLocally() {
  return new Promise((resolve) => {
    const el = new Audio(DRUMROLL_FILE);
    el.volume = drumrollMuted ? 0 : drumrollVolume;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    el.addEventListener("ended", finish);
    el.addEventListener("error", finish);
    setTimeout(finish, 6000);
    el.play().catch(finish);
  });
}
