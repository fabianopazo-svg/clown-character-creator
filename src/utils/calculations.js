import core from '../data/core.json';

export function getRankForRenown(renown) {
  const rank = core.ranks.find(r => renown >= r.renownRange[0] && renown <= r.renownRange[1]);
  return rank || core.ranks[0];
}

export function getPerformanceRankBonus(renown) {
  const entry = core.performance.rankBonusTable.find(
    r => renown >= r.renownRange[0] && renown <= r.renownRange[1]
  );
  return entry ? entry.bonus : 0;
}

export function getAgeBand(ageBandId) {
  return core.ageBands.find(b => b.id === ageBandId) || null;
}

export function applyAgeModifiers(attributes, ageBandId) {
  const band = getAgeBand(ageBandId);
  if (!band) return attributes;
  const result = { ...attributes };
  result[band.bonus] = (result[band.bonus] || 0) + 1;
  result[band.penalty] = (result[band.penalty] || 0) - 1;
  return result;
}

export function sumDots(dotsObject) {
  return Object.values(dotsObject).reduce((sum, v) => sum + (v || 0), 0);
}

export function calcStartingLaughter(finalAttributes) {
  return (finalAttributes.poise || 0) + (finalAttributes.charisma || 0);
}

export function calcHealthBoxes(finalSkills) {
  return 3 + (finalSkills.toughness || 0);
}
