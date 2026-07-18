import { useEffect, useState } from 'react';
import bestiaryData from '../data/bestiary.json';
import { listCustomMonsters } from '../utils/customBestiary';
import { subscribeNpcs, addNpc, updateNpc, removeNpc } from '../utils/roomsApi';
import DotTracker from '../components/DotTracker';
import BoxTracker from '../components/BoxTracker';

function NpcGiftsEditor({ gifts, onSave }) {
  const [text, setText] = useState(gifts.join('\n'));
  const dirty = text !== gifts.join('\n');

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Gifts / Special Skills</div>
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="One per line — fill in later if you don't have them yet"
        style={{ width: '100%', boxSizing: 'border-box', fontSize: 12 }}
      />
      <button
        type="button"
        className="small-btn"
        style={{ marginTop: 2 }}
        disabled={!dirty}
        onClick={() => onSave(text.split('\n').map((s) => s.trim()).filter(Boolean))}
      >
        Save
      </button>
    </div>
  );
}

function emptyForm() {
  return { sourceId: '', name: '', healthMax: '', laughterMax: '', faceMax: '', giftsText: '' };
}

export default function NpcTrackers({ code }) {
  const [npcs, setNpcs] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeNpcs(code, setNpcs);
    return unsubscribe;
  }, [code]);

  const compendiumOptions = [
    ...bestiaryData.entries,
    ...listCustomMonsters(),
  ];

  const handlePick = (sourceId) => {
    if (!sourceId) {
      setForm(emptyForm());
      return;
    }
    const entry = compendiumOptions.find((e) => (e.id === sourceId));
    if (!entry) return;
    setForm({
      sourceId,
      name: entry.name || '',
      healthMax: entry.health ?? '',
      laughterMax: entry.laughterMax ?? entry.laughter ?? '',
      faceMax: entry.faceMax ?? entry.face ?? '',
      giftsText: (entry.gifts || []).join('\n'),
    });
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const healthMax = form.healthMax === '' ? null : Number(form.healthMax);
      const laughterMax = form.laughterMax === '' ? null : Number(form.laughterMax);
      const faceMax = form.faceMax === '' ? null : Number(form.faceMax);
      await addNpc(code, {
        name: form.name.trim(),
        sourceId: form.sourceId || null,
        health: healthMax,
        healthMax,
        laughter: laughterMax,
        laughterMax,
        face: faceMax,
        faceMax,
        gifts: form.giftsText.split('\n').map((s) => s.trim()).filter(Boolean),
        notes: '',
      });
      setForm(emptyForm());
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setAdding(false);
    }
  };

  const handleFieldChange = (npc, field, value) => {
    updateNpc(code, npc.id, { [field]: value }).catch((err) => setError(err.message || String(err)));
  };

  const handleRemove = (npcId) => {
    if (!confirm('Remove this NPC from the tracker?')) return;
    removeNpc(code, npcId).catch((err) => setError(err.message || String(err)));
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>NPC Trackers</div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <select value={form.sourceId} onChange={(e) => handlePick(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">Custom (blank)</option>
          {compendiumOptions.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={{ width: 140 }}
        />
        <input
          type="number"
          placeholder="Health"
          value={form.healthMax}
          onChange={(e) => setForm({ ...form, healthMax: e.target.value })}
          style={{ width: 70 }}
        />
        <input
          type="number"
          placeholder="Laughter"
          value={form.laughterMax}
          onChange={(e) => setForm({ ...form, laughterMax: e.target.value })}
          style={{ width: 70 }}
        />
        <input
          type="number"
          placeholder="Face"
          value={form.faceMax}
          onChange={(e) => setForm({ ...form, faceMax: e.target.value })}
          style={{ width: 70 }}
        />
      </div>
      <textarea
        rows={2}
        placeholder={'Gifts / Special Skills, one per line'}
        value={form.giftsText}
        onChange={(e) => setForm({ ...form, giftsText: e.target.value })}
        style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, marginBottom: 6 }}
      />
      <div style={{ marginBottom: 6 }}>
        <button type="button" className="small-btn" onClick={handleAdd} disabled={adding || !form.name.trim()}>
          {adding ? 'Adding…' : '+ Add'}
        </button>
      </div>

      {npcs.length === 0 && (
        <p className="helper-text" style={{ margin: 0 }}>No NPCs being tracked right now.</p>
      )}

      {npcs.map((npc) => (
        <div key={npc.id} style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 8, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="gift-name">{npc.name}</span>
            <button type="button" className="small-btn" onClick={() => handleRemove(npc.id)}>Remove</button>
          </div>

          {npc.healthMax != null && (
            <div className="stat-row" style={{ maxWidth: 360 }}>
              <span style={{ fontSize: 12 }}>Health</span>
              <BoxTracker value={npc.health || 0} max={npc.healthMax} onChange={(v) => handleFieldChange(npc, 'health', v)} />
            </div>
          )}
          {npc.laughterMax != null && (
            <div className="stat-row" style={{ maxWidth: 360 }}>
              <span style={{ fontSize: 12 }}>Laughter</span>
              <DotTracker value={npc.laughter || 0} max={npc.laughterMax} onChange={(v) => handleFieldChange(npc, 'laughter', v)} />
            </div>
          )}
          {npc.faceMax != null && (
            <div className="stat-row" style={{ maxWidth: 360 }}>
              <span style={{ fontSize: 12 }}>Face</span>
              <DotTracker value={npc.face || 0} max={npc.faceMax} onChange={(v) => handleFieldChange(npc, 'face', v)} />
            </div>
          )}

          <NpcGiftsEditor
            key={npc.id}
            gifts={npc.gifts || []}
            onSave={(gifts) => handleFieldChange(npc, 'gifts', gifts)}
          />
        </div>
      ))}

      {error && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>{error}</p>
      )}
    </div>
  );
}
