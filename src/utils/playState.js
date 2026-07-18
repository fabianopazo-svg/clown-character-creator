import paths from '../data/paths.json';
import { applyAgeModifiers, calcStartingLaughter, calcHealthBoxes } from './calculations';

function defaultPathResourceState(resourceType) {
  switch (resourceType) {
    case 'comfort':
      return { comfort: 0 };
    case 'laughter_and_debt':
      return { debt: 0 };
    case 'conviction':
      return { conviction: 0 };
    case 'cards':
      return { cardsInHand: 0 };
    case 'stance_and_grit':
      return { stance: null };
    default:
      // host / illusionist — no separate pool, Laughter is used directly.
      return {};
  }
}

export function getDefaultPlayState(character) {
  const path = paths.find(p => p.id === character.pathId);
  const finalAttributes = applyAgeModifiers(character.attributes, character.ageBandId);
  return {
    laughter: calcStartingLaughter(finalAttributes),
    laughterMax: calcStartingLaughter(finalAttributes),
    face: 7,
    faceMax: 10,
    health: calcHealthBoxes(character.skills),
    healthMax: calcHealthBoxes(character.skills),
    pathResource: defaultPathResourceState(path?.resourceType),
  };
}

// Highest Grade currently unlocked by Renown — used by the Pickpocket's Cards cap (2 + Grade)
// and could be reused anywhere else "current Grade" matters.
export function currentGradeForRenown(renown) {
  if (renown >= 10) return 5;
  if (renown >= 8) return 4;
  if (renown >= 5) return 3;
  if (renown >= 3) return 2;
  return 1;
}
