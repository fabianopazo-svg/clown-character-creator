import core from '../data/core.json';
import paths from '../data/paths.json';
import troupes from '../data/troupes.json';
import gear from '../data/gear.json';
import { formatCost } from './formatCost';

let cachedIndex = null;

export function buildGlossaryIndex() {
  if (cachedIndex) return cachedIndex;

  const entries = [];
  const g = core.glossary;

  // Core mechanics
  entries.push({ category: 'Mechanics', title: g.roll.title, body: g.roll.text });
  entries.push({ category: 'Mechanics', title: g.houseDie.title, body: g.houseDie.text });
  entries.push({
    category: 'Mechanics',
    title: g.resultMatrix.title,
    body: `${g.resultMatrix.text} ${g.resultMatrix.rows.map(r => `${r.poolResult} + Cheers: ${r.cheers} ${r.poolResult} + Jeers: ${r.jeers}`).join(' ')}`,
  });
  entries.push({ category: 'Mechanics', title: g.pushingRolls.creativeGambit.name, body: g.pushingRolls.creativeGambit.text });
  entries.push({ category: 'Mechanics', title: g.pushingRolls.encore.name, body: g.pushingRolls.encore.text });
  entries.push({ category: 'Mechanics', title: g.turnAndBit.title, body: g.turnAndBit.text });

  g.resourceGlossary.forEach(r => entries.push({ category: 'Resource', title: r.name, body: r.text }));
  g.playStructure.forEach(p => entries.push({ category: 'Play Structure', title: p.name, body: p.text }));

  // Attributes & Skills
  core.attributes.forEach(a => entries.push({ category: 'Attribute', title: a.name, body: a.governs }));
  core.skills.forEach(s => entries.push({ category: 'Skill', title: s.name, body: s.covers }));

  // Personality traits
  core.personalityTraits.forEach(t => entries.push({ category: 'Personality Trait', title: t.name, body: t.effect }));

  // Age bands, ranks — small but genuinely looked-up-mid-session items
  core.ageBands.forEach(b => entries.push({
    category: 'Age Band',
    title: `${b.name} (${b.ageRange})`,
    body: `+1 ${b.bonus}, -1 ${b.penalty}. Starting Purse ${b.startingPurse} Coin.`,
  }));

  // Every Gift, every Path
  paths.forEach(path => {
    path.gifts.forEach(gradeBlock => {
      gradeBlock.list.forEach(gift => {
        const body = gift.effect || `${gift.domain || ''}${gift.limit ? ` (Limit: ${gift.limit})` : ''}`;
        const gradeLabel = gradeBlock.capstone ? 'Capstone' : `Grade ${gradeBlock.grade}`;
        const cost = formatCost(gift.cost);
        entries.push({
          category: `Gift — ${path.name}`,
          title: gift.name,
          body,
          meta: [gradeLabel, cost].filter(Boolean).join(' · '),
        });
      });
    });
  });

  // Troupe passives
  troupes.forEach(troupe => {
    const renownByKey = { founding: 1, affinity: 3, recognition: 6, legend: 9 };
    Object.entries(troupe.passives).forEach(([key, p]) => {
      entries.push({
        category: `Troupe — ${troupe.name}`,
        title: p.name,
        body: p.text,
        meta: `Renown ${renownByKey[key]}`,
      });
    });
  });

  // Gear
  const allGear = [...gear.mundaneGear, ...gear.classicClownProps, ...gear.troupeGear];
  allGear.forEach(item => entries.push({
    category: 'Gear',
    title: item.name,
    body: item.effect,
    meta: `${item.type} · ${item.rarity} · ${item.cost} Coin`,
  }));

  cachedIndex = entries;
  return entries;
}

export function searchGlossary(query, limit = 40) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const index = buildGlossaryIndex();

  const scored = [];
  for (const entry of index) {
    const titleMatch = entry.title.toLowerCase().includes(q);
    const bodyMatch = entry.body?.toLowerCase().includes(q);
    if (titleMatch || bodyMatch) {
      scored.push({ entry, score: titleMatch ? 2 : 1 });
    }
  }
  scored.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
  return scored.slice(0, limit).map(s => s.entry);
}
