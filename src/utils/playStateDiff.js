const FIELD_LABELS = { laughter: 'Laughter', face: 'Face', health: 'Health' };
const PATH_RESOURCE_LABELS = {
  comfort: 'Comfort',
  debt: 'Debt',
  conviction: 'Conviction',
  cardsInHand: 'Cards in Hand',
};

// Compares two play-state snapshots (the shape at character.play: laughter,
// face, health, pathResource) and returns a list of what actually changed.
// Used both live during solo Play Mode (start = character.play as loaded,
// current = the live Zustand store) and at room-leave time (start = the
// locally saved character before rejoining, current = the room's live copy).
export function diffPlayState(start, current) {
  if (!start || !current) return [];
  const changes = [];

  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const delta = (current[key] ?? 0) - (start[key] ?? 0);
    if (delta !== 0) changes.push({ label, delta });
  }

  const startPR = start.pathResource || {};
  const currentPR = current.pathResource || {};
  const prKeys = new Set([...Object.keys(startPR), ...Object.keys(currentPR)]);

  for (const key of prKeys) {
    if (key === 'stance') {
      const before = startPR.stance || null;
      const after = currentPR.stance || null;
      if (before !== after) {
        changes.push({ label: 'Stance', text: `${before || '—'} → ${after || '—'}` });
      }
      continue;
    }
    const label = PATH_RESOURCE_LABELS[key] || key;
    const delta = (currentPR[key] ?? 0) - (startPR[key] ?? 0);
    if (delta !== 0) changes.push({ label, delta });
  }

  return changes;
}

export function formatDelta(delta) {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

// Plain-text rendering for contexts that can't show rich JSX — e.g. a
// native window.confirm() dialog, which only supports a plain string
// (newlines work fine in it, HTML doesn't).
export function formatDiffText(changes) {
  if (changes.length === 0) return 'No changes since your last save.';
  return changes.map((c) => `${c.label}: ${c.text || formatDelta(c.delta)}`).join('\n');
}
