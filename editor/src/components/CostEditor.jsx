import { formatCost } from '../utils/formatCost';

const RESOURCE_OPTIONS = ['laughter', 'debt', 'comfort', 'cards', 'conviction', 'face'];
const TYPE_OPTIONS = ['fixed', 'compound', 'variable', 'free', 'passive'];
const FREQUENCY_OPTIONS = [
  { value: '', label: '(none)' },
  { value: 'once_per_scene', label: 'Once per scene' },
  { value: 'once_per_campaign', label: 'Once per campaign' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'prep_action', label: 'Prep action' },
  { value: 'permanent', label: 'Permanent' },
];

function emptyPart() {
  return { resource: 'laughter', amount: 1 };
}

function emptyCost() {
  return { type: 'fixed', parts: [emptyPart()], frequency: null, note: null };
}

// Gifts still holding the pre-migration plain-string cost (or nothing at
// all) get treated as empty rather than crashing the editor.
function normalize(cost) {
  if (cost && typeof cost === 'object' && Array.isArray(cost.parts)) return cost;
  return emptyCost();
}

/**
 * Editor for a gift's structured cost object. Renders a type/frequency
 * pair, an editable list of resource+amount parts (for fixed/compound/
 * variable costs), and a note field — with a live formatCost() preview
 * so it's obvious what the wizard/PDF will actually show.
 */
export default function CostEditor({ cost, onChange }) {
  const safeCost = normalize(cost);
  const { type, parts, frequency, note } = safeCost;

  const update = (patch) => onChange({ ...safeCost, ...patch });

  const setType = (nextType) => {
    const needsParts = nextType === 'fixed' || nextType === 'compound' || nextType === 'variable';
    update({
      type: nextType,
      parts: needsParts ? (parts.length ? parts : [emptyPart()]) : [],
    });
  };

  const updatePart = (i, patch) => {
    update({ parts: parts.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) });
  };

  const addPart = () => update({ parts: [...parts, emptyPart()] });
  const removePart = (i) => update({ parts: parts.filter((_, idx) => idx !== i) });

  const showParts = type === 'fixed' || type === 'compound' || type === 'variable';
  const isVariable = type === 'variable';

  return (
    <div style={{ border: '1px solid var(--border, #3a3a3a)', borderRadius: 6, padding: 10, marginTop: 4, marginBottom: 8 }}>
      <div className="two-col">
        <div className="field-row">
          <label className="field-label">Cost type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label className="field-label">Frequency</label>
          <select value={frequency || ''} onChange={(e) => update({ frequency: e.target.value || null })}>
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showParts && (
        <div style={{ marginTop: 6 }}>
          {parts.map((part, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
              <select value={part.resource} onChange={(e) => updatePart(i, { resource: e.target.value })}>
                {RESOURCE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              <input
                type="number"
                placeholder="amount"
                title="Fixed amount. Leave blank for a variable/player-chosen amount."
                style={{ width: 70 }}
                value={part.amount ?? ''}
                onChange={(e) => updatePart(i, { amount: e.target.value === '' ? null : Number(e.target.value) })}
              />

              {isVariable && (
                <>
                  <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }} title="Amount is a minimum — player may spend more (e.g. '3+ Cards').">
                    <input
                      type="checkbox"
                      checked={!!part.min}
                      onChange={(e) => updatePart(i, { min: e.target.checked || undefined })}
                    />
                    min (N+)
                  </label>

                  <input
                    type="number"
                    placeholder="default"
                    title="Suggested starting value when amount is left blank (e.g. MC-adjudicated costs)."
                    style={{ width: 70 }}
                    value={part.default ?? ''}
                    onChange={(e) => updatePart(i, { default: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />

                  <select
                    value={part.special || ''}
                    onChange={(e) => updatePart(i, { special: e.target.value || undefined })}
                    title="Special non-numeric cost, e.g. 'spend your entire hand'."
                  >
                    <option value="">(no special)</option>
                    <option value="full_hand">full hand</option>
                  </select>
                </>
              )}

              {parts.length > 1 && (
                <button type="button" className="small-btn" onClick={() => removePart(i)}>Remove</button>
              )}
            </div>
          ))}
          <button type="button" className="small-btn" onClick={addPart}>+ Add resource</button>
        </div>
      )}

      <div className="field-row" style={{ marginTop: 6 }}>
        <label className="field-label">Note (optional)</label>
        <input
          type="text"
          placeholder="e.g. +1 automatic Debt"
          value={note || ''}
          onChange={(e) => update({ note: e.target.value || null })}
        />
      </div>

      <div style={{ fontSize: 11, color: 'var(--hint)', marginTop: 4 }}>
        Preview: <strong>{formatCost(safeCost) || '(empty)'}</strong>
      </div>
    </div>
  );
}
