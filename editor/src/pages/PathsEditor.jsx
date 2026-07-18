import { useEffect, useState } from 'react';
import { fetchFile, saveFile } from '../api';
import CostEditor from '../components/CostEditor';

const GRADE_LABELS = {
  1: 'Grade 1 (Renown 1)',
  2: 'Grade 2 (Renown 3+)',
  3: 'Grade 3 (Renown 5+)',
  4: 'Grade 4 (Renown 8+)',
  5: 'Grade 5 — Capstone (Renown 10)',
};

function emptyGift(usesDomain) {
  const cost = { type: 'fixed', parts: [{ resource: 'laughter', amount: 1 }], frequency: null, note: null };
  return usesDomain
    ? { name: 'New School', subtype: 'open', domain: '', limit: '', cost }
    : { name: 'New Gift', subtype: 'open', cost, effect: '' };
}

export default function PathsEditor() {
  const [paths, setPaths] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetchFile('paths.json').then(data => {
      setPaths(data);
      setSelectedId(data[0]?.id ?? null);
    });
  }, []);

  if (!paths) return <p className="helper-text">Loading…</p>;

  const selected = paths.find(p => p.id === selectedId);
  const usesDomain = selected?.id === 'illusionist'; // Illusionist Gifts use domain/limit instead of effect

  const updatePath = (updater) => {
    setPaths(prev => prev.map(p => (p.id === selectedId ? updater({ ...p }) : p)));
    setDirty(true);
  };

  const updateGradeBlock = (grade, updater) => {
    updatePath(p => ({
      ...p,
      gifts: p.gifts.map(g => (g.grade === grade ? updater({ ...g }) : g)),
    }));
  };

  const addGiftToGrade = (grade) => {
    updateGradeBlock(grade, g => ({ ...g, list: [...g.list, emptyGift(usesDomain)] }));
  };

  const updateGift = (grade, index, key, value) => {
    updateGradeBlock(grade, g => ({
      ...g,
      list: g.list.map((gift, i) => (i === index ? { ...gift, [key]: value } : gift)),
    }));
  };

  const removeGift = (grade, index) => {
    if (!confirm('Delete this Gift?')) return;
    updateGradeBlock(grade, g => ({ ...g, list: g.list.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveFile('paths.json', paths);
      setDirty(false);
      alert('Saved to src/data/paths.json');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ width: 200, flexShrink: 0 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Paths</div>
        {paths.map(p => (
          <div
            key={p.id}
            className={`gift-card${p.id === selectedId ? ' selected' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setSelectedId(p.id)}
          >
            <span className="gift-name">{p.name}</span>
          </div>
        ))}
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty} style={{ width: '100%', marginTop: 12 }}>
          {saving ? 'Saving…' : dirty ? 'Save Paths to disk' : 'No changes'}
        </button>
      </div>

      <div style={{ flex: 1, paddingBottom: 100 }}>
        {selected && (
          <>
            <div className="field-row">
              <label className="field-label">Name</label>
              <input type="text" value={selected.name} onChange={e => updatePath(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="field-row">
              <label className="field-label">Flavor text</label>
              <textarea rows={2} value={selected.flavor || ''} onChange={e => updatePath(p => ({ ...p, flavor: e.target.value }))} />
            </div>
            <div className="field-row">
              <label className="field-label">Primary Attributes (comma-separated)</label>
              <input
                type="text"
                value={(selected.primaryAttributes || []).join(', ')}
                onChange={e => updatePath(p => ({ ...p, primaryAttributes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
              />
            </div>

            <div className="section-title">Path resource</div>
            <div className="field-row">
              <label className="field-label">Name</label>
              <input
                type="text"
                value={selected.pathResource?.name || ''}
                onChange={e => updatePath(p => ({ ...p, pathResource: { ...p.pathResource, name: e.target.value } }))}
              />
            </div>
            <div className="field-row">
              <label className="field-label">Description</label>
              <textarea
                rows={3}
                value={selected.pathResource?.description || ''}
                onChange={e => updatePath(p => ({ ...p, pathResource: { ...p.pathResource, description: e.target.value } }))}
              />
            </div>

            <div className="section-title">Subtypes</div>
            <p className="helper-text">
              These ids are what Gifts below reference in their "Subtype" field — renaming an id here
              will not automatically update Gifts that already reference the old one.
            </p>
            {(selected.subtypes || []).map((st, i) => (
              <div key={i} className="gift-card">
                <div className="two-col">
                  <div className="field-row">
                    <label className="field-label">id</label>
                    <input
                      type="text"
                      value={st.id}
                      onChange={e => updatePath(p => ({
                        ...p, subtypes: p.subtypes.map((s, j) => (j === i ? { ...s, id: e.target.value } : s)),
                      }))}
                    />
                  </div>
                  <div className="field-row">
                    <label className="field-label">Name</label>
                    <input
                      type="text"
                      value={st.name}
                      onChange={e => updatePath(p => ({
                        ...p, subtypes: p.subtypes.map((s, j) => (j === i ? { ...s, name: e.target.value } : s)),
                      }))}
                    />
                  </div>
                </div>
                <div className="field-row">
                  <label className="field-label">Focus</label>
                  <input
                    type="text"
                    value={st.focus || ''}
                    onChange={e => updatePath(p => ({
                      ...p, subtypes: p.subtypes.map((s, j) => (j === i ? { ...s, focus: e.target.value } : s)),
                    }))}
                  />
                </div>
                <button
                  className="small-btn"
                  onClick={() => {
                    if (!confirm('Delete this subtype?')) return;
                    updatePath(p => ({ ...p, subtypes: p.subtypes.filter((_, j) => j !== i) }));
                  }}
                >
                  Delete subtype
                </button>
              </div>
            ))}
            <button
              className="small-btn"
              onClick={() => updatePath(p => ({ ...p, subtypes: [...(p.subtypes || []), { id: '', name: 'New subtype', focus: '' }] }))}
            >
              + Add subtype
            </button>

            <div className="section-title">Gifts by Grade</div>
            {selected.gifts.map(gradeBlock => (
              <div key={gradeBlock.grade} style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-text)', marginBottom: 6 }}>
                  {GRADE_LABELS[gradeBlock.grade]}
                  {gradeBlock.chooseCount ? ` — choose ${gradeBlock.chooseCount} of ${gradeBlock.poolSize}` : ''}
                </div>

                {gradeBlock.list.map((gift, i) => (
                  <div key={i} className="gift-card">
                    <div className="two-col">
                      <div className="field-row">
                        <label className="field-label">Name</label>
                        <input type="text" value={gift.name} onChange={e => updateGift(gradeBlock.grade, i, 'name', e.target.value)} />
                      </div>
                      <div className="field-row">
                        <label className="field-label">Subtype</label>
                        <select value={gift.subtype || 'open'} onChange={e => updateGift(gradeBlock.grade, i, 'subtype', e.target.value)}>
                          <option value="open">Open (any subtype)</option>
                          {(selected.subtypes || []).map(st => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="field-row">
                      <label className="field-label">Cost</label>
                      <CostEditor
                        cost={gift.cost}
                        onChange={(next) => updateGift(gradeBlock.grade, i, 'cost', next)}
                      />
                    </div>

                    {usesDomain ? (
                      <>
                        <div className="field-row">
                          <label className="field-label">Domain</label>
                          <textarea rows={2} value={gift.domain || ''} onChange={e => updateGift(gradeBlock.grade, i, 'domain', e.target.value)} />
                        </div>
                        <div className="field-row">
                          <label className="field-label">Limit</label>
                          <textarea rows={2} value={gift.limit || ''} onChange={e => updateGift(gradeBlock.grade, i, 'limit', e.target.value)} />
                        </div>
                      </>
                    ) : (
                      <div className="field-row">
                        <label className="field-label">Effect</label>
                        <textarea rows={2} value={gift.effect || ''} onChange={e => updateGift(gradeBlock.grade, i, 'effect', e.target.value)} />
                      </div>
                    )}

                    <button className="small-btn" onClick={() => removeGift(gradeBlock.grade, i)}>Delete Gift</button>
                  </div>
                ))}

                <button className="small-btn" onClick={() => addGiftToGrade(gradeBlock.grade)}>
                  + Add Gift to {GRADE_LABELS[gradeBlock.grade]}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
