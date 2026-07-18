// Core dice-roll engine — pool math, the House Die, and the Result
// Matrix, straight from Chapter 2 of the rulebook. Deliberately excludes
// Creative Gambit and Encore; those layer on top of this later.
//
// Random generation (rollDie/rollDice) is kept separate from the pure
// rules math (derivePoolResult/deriveHouseDieResult/resolveOutcome) so
// the actual rules logic can be tested with exact, reproducible inputs
// instead of fighting with mocked randomness.

export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollDice(count, sides) {
  return Array.from({ length: Math.max(0, count) }, () => rollDie(sides));
}

// A pool's size: Attribute + Skill dots, plus any Specialty bonus dice
// (+1 each, or +2 for an exceptionally deep one — already encoded as
// specialty.value in character data). Returns a breakdown, not just the
// total, so the UI can show its work.
export function computePoolSize(attributeValue, skillValue, specialtyBonus = 0) {
  const total = Math.max(0, (attributeValue || 0) + (skillValue || 0) + (specialtyBonus || 0));
  return { attributeValue: attributeValue || 0, skillValue: skillValue || 0, specialtyBonus: specialtyBonus || 0, total };
}

// Pure — given already-rolled d10 values, each 8/9/10 is a normal success.
// House rule: if 2+ dice show a natural 10, EACH 10 (not the pool's other
// successes) is worth 2 successes instead of 1. An 8 or 9 is always worth
// exactly 1, crit or not — only the 10s themselves double.
//
// Example: [7,8,10,4,10,2] — the 8 is worth 1, each of the two 10s is
// worth 2 (since 2+ are present) — total 1 + 2 + 2 = 5.
//
// The same "2+ natural 10s" condition is also what makes a roll ELIGIBLE
// for the new Critical Success rules (see resolveRollOutcome) — one flag,
// two consequences.
export function derivePoolResult(diceValues) {
  const rawSuccesses = diceValues.filter(d => d >= 8).length;
  const tensCount = diceValues.filter(d => d === 10).length;
  const hasCritTens = tensCount >= 2;
  const successCount = diceValues.reduce((sum, d) => {
    if (d === 10) return sum + (hasCritTens ? 2 : 1);
    if (d >= 8) return sum + 1;
    return sum;
  }, 0);
  return { dice: diceValues, rawSuccesses, tensCount, hasCritTens, successCount };
}

export function rollPool(poolSize) {
  return derivePoolResult(rollDice(poolSize, 10));
}

// Pure — the House Die is a single d12 plus the MC's House Difficulty
// modifier for this scene. 7-12 after modifiers = Cheers, 1-6 = Jeers.
// The modifier can legally push the total below 1 or above 12; the
// >= 7 comparison still holds correctly either way.
export function deriveHouseDieResult(raw, houseDifficulty = 0) {
  const total = raw + (houseDifficulty || 0);
  return { raw, modifier: houseDifficulty || 0, total, outcome: total >= 7 ? 'cheers' : 'jeers' };
}

export function rollHouseDie(houseDifficulty = 0) {
  return deriveHouseDieResult(rollDie(12), houseDifficulty);
}

// The Result Matrix, now gated by a per-roll Difficulty (successes
// needed) instead of just "any success at all", plus the new Critical
// Success override:
//
// - Critical Success requires 2+ natural 10s AND successCount >= difficulty.
//   When both hold, it's a Critical regardless of Cheers/Jeers — this
//   OVERRIDES the normal quadrant below, including on Jeers, where a
//   plain success would otherwise be a Complication.
// - Otherwise, "success" now means successCount >= difficulty (not >= 1),
//   crossed against Cheers/Jeers exactly as before.
//
// difficulty defaults to 1 — a freeform roll with no MC-set target
// behaves exactly like the old "any success counts" rule.
export function resolveRollOutcome(poolResult, houseDieOutcome, difficulty = 1) {
  const meetsDifficulty = poolResult.successCount >= difficulty;

  if (poolResult.hasCritTens && meetsDifficulty) {
    return houseDieOutcome === 'cheers' ? 'critical_cheers' : 'critical_jeers';
  }

  if (meetsDifficulty && houseDieOutcome === 'cheers') return 'clean_success';
  if (meetsDifficulty && houseDieOutcome === 'jeers') return 'complication';
  if (!meetsDifficulty && houseDieOutcome === 'cheers') return 'flop';
  return 'corpsing';
}

export const OUTCOME_LABELS = {
  clean_success: 'Clean Success',
  complication: 'Complication',
  flop: 'Flop',
  corpsing: 'Corpsing',
  critical_cheers: 'Critical Success',
  critical_jeers: 'Critical Success (against the odds)',
};

export const OUTCOME_DESCRIPTIONS = {
  clean_success: 'It works cleanly. Gain 1 Laughter.',
  complication: 'It works, but the world tenses: the MC gains 1 Suspicion — a witness, a cost, an uncomfortable complication.',
  flop: "It didn't work — but it was glorious. Narrate the disaster.",
  corpsing: "It didn't work and it landed badly. The MC gains 2 Suspicion. The only fully bad result on the table.",
  critical_cheers: 'A spectacular success. Gain 2 Laughter and the party gains Momentum.',
  critical_jeers: "It should have gone wrong, and it didn't — the room can't believe what it just saw. Gain 4 Laughter and the party gains Momentum. No Suspicion, despite the Jeers — this overrides it completely.",
};

// Full roll: pool + House Die + resolved outcome, in one call.
// difficulty is the number of successes needed — omit it for a freeform
// roll (defaults to 1, the old "any success" behavior).
export function performRoll(poolSize, houseDifficulty = 0, difficulty = 1) {
  const pool = rollPool(poolSize);
  const houseDie = rollHouseDie(houseDifficulty);
  const outcome = resolveRollOutcome(pool, houseDie.outcome, difficulty);
  return { pool, houseDie, outcome, difficulty };
}
