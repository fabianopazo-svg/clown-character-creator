import { useEffect, useState } from 'react';
import { fetchFile, saveFile } from '../api';

const PASSIVE_KEYS = ['founding', 'affinity', 'recognition', 'legend'];
const PASSIVE_RENOWN = { founding: 1, affinity: 3, recognition: 6, legend: 9 };

export default function TroupesEditor() {
  const [troupes, setTroupes] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchFile('troupes.json').then(data => {
      setTroupes(data);
      setSelectedId(data[0]?.id ?? null);
    });
  }, []);

  if (!troupes) return <p className="helper-text">Loading…</p>;

  const selected = troupes.find(t => t.id === selectedId);

  const updateSelected = (updater) => {
    setTroupes(prev => prev.map(t => (t.id === selectedId ? updater({ ...t }) : t)));
    setDirty(true);
  };

  const handleAddTroupe = () => {
    const id = prompt('New Troupe id (lowercase_snake_case, must be unique):');
    if (!id) return;
    if (troupes.some(t => t.id === id)) {
      alert('That id already exists.');
      return;
    }
    const fresh = {
      id, name: 'New Troupe', values: '', look: '', affinityPaths: [], relationships: '',
      passives: {
        founding: { name: '', text: '' },
        affinity: { name: '', text: '' },
        recognition: { name: '', text: '' },
        legend: { name: '', text: '' },
      },
    };
    setTroupes(prev => [...prev, fresh]);
    setSelectedId(id);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFile('troupes.json', troupes);
      setDirty(false);
      alert('Saved to src/data/troupes.json');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ width: 200, flexShrink: 0 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Troupes</div>
        {troupes.map(t => (
          <div
            key={t.id}
            className={`gift-card${t.id === selectedId ? ' selected' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedId(t.id)}
          >
            <span className="gift-name">{t.name}</span>
          </div>
        ))}
        <button className="small-btn" onClick={handleAddTroupe}>+ New Troupe</button>
      </div>

      <div style={{ flex: 1, paddingBottom: 100 }}>
        {selected && (
          <>
            <div className="field-row">
              <label className="field-label">Name</label>
              <input type="text" value={selected.name} onChange={e => updateSelected(t => ({ ...t, name: e.target.value }))} />
            </div>
            <div className="field-row">
              <label className="field-label">Values</label>
              <textarea rows={2} value={selected.values} onChange={e => updateSelected(t => ({ ...t, values: e.target.value }))} />
            </div>
            <div className="field-row">
              <label className="field-label">Look</label>
              <textarea rows={2} value={selected.look} onChange={e => updateSelected(t => ({ ...t, look: e.target.value }))} />
            </div>
            <div className="field-row">
              <label className="field-label">Relationships</label>
              <textarea rows={3} value={selected.relationships} onChange={e => updateSelected(t => ({ ...t, relationships: e.target.value }))} />
            </div>
            <div className="field-row">
              <label className="field-label">Affinity Paths (comma-separated Path ids)</label>
              <input
                type="text"
                value={selected.affinityPaths.join(', ')}
                onChange={e => updateSelected(t => ({ ...t, affinityPaths: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              />
            </div>

            <div className="section-title">Passives</div>
            {PASSIVE_KEYS.map(key => (
              <div key={key} className="gift-card">
                <div style={{ fontSize: 11, color: 'var(--hint)', marginBottom: 4 }}>
                  {key} (Renown {PASSIVE_RENOWN[key]})
                </div>
                <div className="field-row">
                  <label className="field-label">Name</label>
                  <input
                    type="text"
                    value={selected.passives[key]?.name || ''}
                    onChange={e => updateSelected(t => ({
                      ...t, passives: { ...t.passives, [key]: { ...t.passives[key], name: e.target.value } },
                    }))}
                  />
                </div>
                <div className="field-row">
                  <label className="field-label">Text</label>
                  <textarea
                    rows={3}
                    value={selected.passives[key]?.text || ''}
                    onChange={e => updateSelected(t => ({
                      ...t, passives: { ...t.passives, [key]: { ...t.passives[key], text: e.target.value } },
                    }))}
                  />
                </div>
              </div>
            ))}

            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty}>
              {saving ? 'Saving…' : dirty ? 'Save Troupes to disk' : 'No changes'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
