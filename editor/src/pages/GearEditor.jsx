import { useEffect, useState } from 'react';
import { fetchFile, saveFile } from '../api';

const CATEGORIES = [
  { key: 'mundaneGear', label: 'Mundane gear', hasTroupe: false },
  { key: 'classicClownProps', label: 'Classic clown props', hasTroupe: false },
  { key: 'troupeGear', label: 'Troupe gear', hasTroupe: true },
];

const emptyItem = (hasTroupe) => ({
  name: 'New item', type: 'Passive', size: 'Small', rarity: 'Common', cost: 10, effect: '',
  ...(hasTroupe ? { troupe: '' } : {}),
});

export default function GearEditor() {
  const [gear, setGear] = useState(null);
  const [category, setCategory] = useState('mundaneGear');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchFile('gear.json').then(setGear);
  }, []);

  if (!gear) return <p className="helper-text">Loading…</p>;

  const items = gear[category];
  const hasTroupe = CATEGORIES.find(c => c.key === category).hasTroupe;

  const updateItem = (index, key, value) => {
    setGear(prev => ({
      ...prev,
      [category]: prev[category].map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
    setDirty(true);
  };

  const addItem = () => {
    setGear(prev => ({ ...prev, [category]: [...prev[category], emptyItem(hasTroupe)] }));
    setDirty(true);
  };

  const removeItem = (index) => {
    if (!confirm('Delete this item?')) return;
    setGear(prev => ({ ...prev, [category]: prev[category].filter((_, i) => i !== index) }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFile('gear.json', gear);
      setDirty(false);
      alert('Saved to src/data/gear.json');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: 100 }}>
      <div className="pill-group" style={{ marginBottom: 16 }}>
        {CATEGORIES.map(c => (
          <div
            key={c.key}
            className={`pill${category === c.key ? ' selected' : ''}`}
            style={{ cursor: 'pointer', justifyContent: 'center' }}
            onClick={() => setCategory(c.key)}
          >
            {c.label} ({gear[c.key].length})
          </div>
        ))}
      </div>

      {items.map((item, i) => (
        <div key={i} className="gift-card">
          <div className="two-col">
            <div className="field-row">
              <label className="field-label">Name</label>
              <input type="text" value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} />
            </div>
            {hasTroupe && (
              <div className="field-row">
                <label className="field-label">Troupe id</label>
                <input type="text" value={item.troupe || ''} onChange={e => updateItem(i, 'troupe', e.target.value)} />
              </div>
            )}
          </div>
          <div className="three-col">
            <div className="field-row">
              <label className="field-label">Type</label>
              <select value={item.type} onChange={e => updateItem(i, 'type', e.target.value)}>
                <option>Passive</option>
                <option>Active</option>
                <option>Consumable</option>
              </select>
            </div>
            <div className="field-row">
              <label className="field-label">Rarity</label>
              <select value={item.rarity} onChange={e => updateItem(i, 'rarity', e.target.value)}>
                <option>Common</option>
                <option>Uncommon</option>
                <option>Rare</option>
                <option>Legendary</option>
              </select>
            </div>
            <div className="field-row">
              <label className="field-label">Size</label>
              <select value={item.size} onChange={e => updateItem(i, 'size', e.target.value)}>
                <option>Tiny</option>
                <option>Small</option>
                <option>Bulky</option>
                <option>Large</option>
              </select>
            </div>
          </div>
          <div className="field-row">
            <label className="field-label">Cost (Coin)</label>
            <input type="number" value={item.cost} style={{ width: 100 }} onChange={e => updateItem(i, 'cost', Number(e.target.value))} />
          </div>
          <div className="field-row">
            <label className="field-label">Effect</label>
            <textarea rows={2} value={item.effect} onChange={e => updateItem(i, 'effect', e.target.value)} />
          </div>
          <button className="small-btn" onClick={() => removeItem(i)}>Delete item</button>
        </div>
      ))}

      <button className="small-btn" onClick={addItem}>+ Add item to {CATEGORIES.find(c => c.key === category).label}</button>
      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>
          {saving ? 'Saving…' : dirty ? 'Save Gear to disk' : 'No changes'}
        </button>
      </div>
    </div>
  );
}
