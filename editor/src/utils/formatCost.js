// NOTE: this is a duplicate of src/utils/formatCost.js, copied here because
// the content editor is a fully separate Vite app with no shared imports
// from the main app. If the cost schema changes, update both copies.
//
// Renders a gift's structured `cost` object as human-readable text.
// This is the single source of truth for cost display — the wizard's
// Gift step, the glossary index, and the PDF gift matrix should all
// call this instead of reading gift.cost as a string.
//
// cost shape: { type, parts: [{resource, amount, min?, default?, special?}], frequency, note }
// type: 'fixed' | 'compound' | 'variable' | 'free' | 'passive'

const RESOURCE_LABELS = {
  laughter: 'Laughter',
  debt: 'Debt',
  comfort: 'Comfort',
  cards: 'Cards',
  conviction: 'Conviction',
  face: 'Face',
};

const FREQUENCY_LABELS = {
  once_per_scene: 'Once per scene',
  once_per_campaign: 'Once per campaign',
  reaction: 'Reaction',
  prep_action: 'Prep action',
  permanent: 'Permanent',
};

function resourceLabel(key) {
  return RESOURCE_LABELS[key] || key;
}

function formatPart(part) {
  const label = resourceLabel(part.resource);
  if (part.special === 'full_hand') return `Full hand of ${label}`;
  if (part.amount == null) {
    return part.default != null ? `~${part.default} ${label}` : `Variable ${label}`;
  }
  if (part.min) return `${part.amount}+ ${label}`;
  return `${part.amount} ${label}`;
}

/**
 * Full display string, including frequency prefix and any note.
 * Use for the wizard's Gift detail view, glossary entries, etc.
 */
export function formatCost(cost) {
  if (!cost) return '';
  const { type, parts = [], frequency, note } = cost;
  const freqLabel = frequency ? FREQUENCY_LABELS[frequency] : null;

  let body;
  if (type === 'passive') {
    body = 'Passive';
  } else if (type === 'free') {
    if (frequency === 'permanent') body = 'Permanent, no cost';
    else if (frequency === 'prep_action') body = 'Free (prep action)';
    else body = freqLabel ? `${freqLabel}, free` : 'Free';
  } else {
    // fixed, compound, variable — render parts, dropping any that are
    // literally zero-cost (e.g. Advance on Account's "0 Laughter" half)
    const visible = parts.filter((p) => p.amount !== 0);
    const rendered = (visible.length ? visible : parts).map(formatPart).join(' / ');
    body = freqLabel ? `${freqLabel}, ${rendered}` : rendered;
  }

  if (note) body += ` (${note})`;
  return body;
}

/**
 * Compact display string for space-constrained contexts like the PDF gift
 * matrix table cell. Drops long explanatory notes (e.g. Illusionist's MC
 * guidance text) but keeps short ones that are really part of the cost
 * itself (e.g. "+1 automatic Debt" on Possess the Scene) — those were part
 * of the original displayed cost string, not just flavor commentary.
 */
const SHORT_NOTE_MAX_LENGTH = 24;

export function formatCostShort(cost) {
  if (!cost) return '';
  const keepNote = cost.note && cost.note.length <= SHORT_NOTE_MAX_LENGTH;
  return formatCost({ ...cost, note: keepNote ? cost.note : null });
}
