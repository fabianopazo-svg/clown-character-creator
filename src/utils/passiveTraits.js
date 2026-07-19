import troupes from '../data/troupes.json';
import { getKnownGifts } from './knownGifts';

const TROUPE_TIER_ORDER = ['founding', 'affinity', 'recognition', 'legend'];

// Troupe passives unlocked at or below the character's current Renown.
// Troupe passives aren't gated by "knowing" them the way Path Gifts
// are — every Clown in a Troupe has all of that Troupe's passives,
// unlocked in order as their Renown rises.
function getTroupePassives(troupeId, renown) {
  const troupe = troupes.find((t) => t.id === troupeId);
  if (!troupe) return { troupe: null, unlocked: [] };

  const unlocked = TROUPE_TIER_ORDER
    .map((tier) => ({ tier, ...troupe.passives[tier] }))
    .filter((p) => p.renown != null && renown >= p.renown);

  return { troupe, unlocked };
}

// Path Gifts a character knows that happen to be passive (cost.type ===
// 'passive') — always-on traits rather than something rolled for.
function getPassivePathGifts(character) {
  const { knownGifts } = getKnownGifts(character);
  return knownGifts.filter((g) => g.cost?.type === 'passive');
}

// True to the Craft: a character whose Path is one of their Troupe's
// listed affinities gets a reward (per the rulebook's bonus-not-penalty
// design) — this just reports whether that condition is currently true,
// it doesn't compute what the bonus does mechanically.
function isTrueToTheCraft(troupe, pathId) {
  return !!troupe?.affinityPaths?.includes(pathId);
}

export function getPassiveTraits(character, renown) {
  const { troupe, unlocked: troupePassives } = getTroupePassives(character.troupeId, renown ?? 0);
  const pathPassives = getPassivePathGifts(character);
  const trueToTheCraft = isTrueToTheCraft(troupe, character.pathId);

  return { troupe, troupePassives, pathPassives, trueToTheCraft };
}
