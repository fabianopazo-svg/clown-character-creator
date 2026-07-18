// Suspicion threshold flags — narrative severity bands layered over the
// shared Suspicion counter. Purely a display aid; the MC still adjusts
// the raw number directly (see PartyStatePanel) — this just labels what
// that number currently means at the table.
const TIERS = [
  { id: 'none', label: 'Clear', max: 0, color: 'var(--muted)' },
  { id: 'low', label: 'Low', max: 2, color: '#2f7a3d' },
  { id: 'moderate', label: 'Moderate', max: 6, color: '#a67c00' },
  { id: 'high', label: 'High', max: 9, color: '#c2410c' },
  { id: 'mortal', label: 'Mortal-Level', max: Infinity, color: '#c0392b' },
];

export function getSuspicionTier(suspicion) {
  const value = suspicion ?? 0;
  return TIERS.find(t => value <= t.max) || TIERS[TIERS.length - 1];
}
