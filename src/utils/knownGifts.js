import paths from '../data/paths.json';

// Returns the character's actually-known Gifts (not the full Path catalog)
// with a stable key per gift and its grade label attached. Shared between
// PlayerGifts (the display) and RollPanel (the roll-time selector) so
// both are guaranteed to agree on what a character "knows".
export function getKnownGifts(character) {
  const path = paths.find((p) => p.id === character.pathId);
  if (!path) return { path: null, usesDomain: false, knownGifts: [] };

  const usesDomain = path.id === 'illusionist';
  const knownGifts = [];

  for (const gradeBlock of path.gifts) {
    for (const gift of gradeBlock.list) {
      const known = gradeBlock.capstone
        ? character.capstoneGift === gift.name
        : character.gifts?.includes(gift.name);
      if (known) {
        const gradeLabel = gradeBlock.capstone ? 'Cap' : gradeBlock.grade;
        knownGifts.push({ ...gift, gradeLabel, key: `${gradeLabel}-${gift.name}` });
      }
    }
  }

  return { path, usesDomain, knownGifts };
}
