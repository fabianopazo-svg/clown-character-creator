// Editable list of {name, effect} skill entries — used anywhere a monster's
// Gifts/Special Skills need to be entered with both fields, not just a
// name. Shared between the compendium's custom-monster form and the NPC
// tracker's add/edit forms so filling these in looks and works the same
// in both places.
export default function GiftListEditor({ gifts, onChange }) {
  const addGift = () => onChange([...gifts, { name: '', effect: '' }]);

  const updateGift = (i, field, value) => {
    const next = gifts.slice();
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  const removeGift = (i) => onChange(gifts.filter((_, idx) => idx !== i));

  return (
    <div>
      {gifts.map((g, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Name"
            value={g.name}
            onChange={(e) => updateGift(i, 'name', e.target.value)}
            style={{ width: 140, flexShrink: 0 }}
          />
          <input
            type="text"
            placeholder="Effect (optional — fill in later if you don't have it yet)"
            value={g.effect}
            onChange={(e) => updateGift(i, 'effect', e.target.value)}
            style={{ flex: 1, minWidth: 0 }}
          />
          <button type="button" className="small-btn" onClick={() => removeGift(i)} title="Remove">×</button>
        </div>
      ))}
      <button type="button" className="small-btn" onClick={addGift}>+ Add skill</button>
    </div>
  );
}
