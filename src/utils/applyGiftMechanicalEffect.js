import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { resolveResourceTarget } from './giftCostRouting';

// Deliberately larger than any realistic resource max (Face/Comfort/etc
// top out around 10) — used for "fully restore" style effects (Ward
// Miracle's second variant). DotTracker renders any value >= max as
// simply "full", so overshooting on purpose is safe and simpler than
// needing to read the target's actual max first (which would require
// expanding read access to another player's sheet — see firestore.rules).
const FULL_RESTORE_INCREMENT = 20;

async function incrementPlayerResource(code, targetUid, resourceKey, amount) {
  const target = resolveResourceTarget(resourceKey);
  const fieldPath = target.kind === 'universal'
    ? `character.play.${target.field}`
    : `character.play.pathResource.${target.field}`;
  const sheetRef = doc(db, 'rooms', code.toUpperCase(), 'players', targetUid, 'private', 'sheet');
  await updateDoc(sheetRef, {
    [fieldPath]: increment(amount),
    updatedAt: serverTimestamp(),
  });
}

// Pure planning step: given a resolved (non-choice) effect and the
// concrete target list, what operations actually need to happen? No
// Firestore dependency, so this is directly testable.
export function planEffectOperations(effect, actingUid, { resolvedTargetUids, chosenAmount }) {
  if (!effect || effect.type === 'choice') return [];

  if (effect.type === 'transfer') {
    const amount = effect.amountMode === 'player_choice' ? (chosenAmount || 0) : (effect.amount || 0);
    if (amount <= 0) return [];
    // 'give' (default): actor loses, target(s) gain — e.g. Transfusion.
    // 'steal': actor gains, target(s) lose — e.g. Cut the Laughter.
    const actorSign = effect.direction === 'steal' ? 1 : -1;
    const targetSign = -actorSign;
    return [
      { targetUid: actingUid, resource: effect.resource, amount: actorSign * amount },
      ...resolvedTargetUids.map((targetUid) => ({ targetUid, resource: effect.resource, amount: targetSign * amount })),
    ];
  }

  // resource_delta
  const amount = effect.setToMax
    ? FULL_RESTORE_INCREMENT
    : (effect.amountMode === 'player_choice' ? (chosenAmount || 0) : (effect.amount || 0));
  if (amount === 0) return [];

  return resolvedTargetUids.map((targetUid) => ({ targetUid, resource: effect.resource, amount }));
}

export async function applyGiftMechanicalEffect(code, actingUid, mechanicalEffect, { resolvedTargetUids, chosenAmount }) {
  if (!mechanicalEffect) return;
  const operations = planEffectOperations(mechanicalEffect, actingUid, { resolvedTargetUids, chosenAmount });
  for (const op of operations) {
    await incrementPlayerResource(code, op.targetUid, op.resource, op.amount);
  }
}
