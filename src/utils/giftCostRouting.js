// cost.parts uses 'cards' (matching formatCost.js's RESOURCE_LABELS and
// the rulebook's own terminology), but the actual field in
// character.play.pathResource is 'cardsInHand' (see playState.js's
// defaultPathResourceState). Every other resource key matches its
// pathResource field name directly.
const PATH_RESOURCE_KEY_MAP = {
  cards: 'cardsInHand',
};

const UNIVERSAL_RESOURCES = new Set(['laughter', 'face', 'health']);

// Pure routing decision: given a cost part's resource key, where does the
// deduction actually need to be written? No Firebase dependency, so this
// is testable without touching Firestore at all.
export function resolveResourceTarget(resourceKey) {
  if (UNIVERSAL_RESOURCES.has(resourceKey)) {
    return { kind: 'universal', field: resourceKey };
  }
  return { kind: 'pathResource', field: PATH_RESOURCE_KEY_MAP[resourceKey] || resourceKey };
}
