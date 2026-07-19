import { useEffect, useState } from 'react';
import bestiaryData from '../data/bestiary.json';
import { listCustomMonsters } from '../utils/customBestiary';
import { subscribeNpcs, addNpc, updateNpc, removeNpc } from '../utils/roomsApi';
import DotTracker from '../components/DotTracker';
import BoxTracker from '../components/BoxTracker';
import GiftListEditor from '../components/GiftListEditor';
import GiftListDisplay from '../components/GiftListDisplay';

// Normalizes a gift entry that might be the OLD flat-string format or the
// new {name, effect} shape, so NPCs created before this feature existed
// don't break or need a manual migration step.
function normalizeGifts(gifts) {
  return (gifts || []).map((g) => (typeof g === 'string' ? { name: g, effect: '' } : { name: g?.name || '', effect: g?.effect || '' }));
}

function emptyForm() {
  return { sourceId: '', name: '', healthMax: '', laughterMax: '', faceMax: '', toughness: '', dodge: '', gifts: [] };
}

// One live NPC's card — its own component so collapse and gift-edit state
// stay cleanly per-NPC without threading a bunch of keyed state through
// the parent.
function NpcCard({ code, npc, onRemove }) {
  const [collapsed, setCollapsed] = useState(false);
  const [editingGifts, setEditingGifts] = useState(false);
  const [giftsDraft, setGiftsDraft] = useState(() => normalizeGifts(npc.gifts));
  const [error, setError] = useState(null);

  const handleFieldChange = (field, value) => {
    updateNpc(code, npc.id, { [field]: value }).catch((err) => setError(err.message || String(err)));
  };

  const startEditingGifts = () => {
    setGiftsDraft(normalizeGifts(npc.gifts));
    setEditingGifts(true);
  };

  const saveGifts = () => {
    const cleaned = giftsDraft.filter((g) => g.name.trim()).map((g) => ({ name: g.name.trim(), effect: g.effect.trim() }));
    handleFieldChange('gifts', cleaned);
    setEditingGifts(false);
  };

  if (collapsed) {
    return (
      <div style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="gift-name">{npc.name}</span>
        <button type="button" className="small-btn" onClick={() => setCollapsed(false)}>Show</button>
      </div>
    );
  }

  return (
    <div style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 8, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span className="gift-name">{npc.name}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button type="button" className="small-btn" onClick={() => setCollapsed(true)}>Hide</button>
          <button type="button" className="small-btn" onClick={() => onRemove(npc.id)}>Remove</button>
        </div>
      </div>

      {npc.healthMax != null && (
        <div className="stat-row" style={{ maxWidth: 360 }}>
          <span style={{ fontSize: 12 }}>Health</span>
          <BoxTracker value={npc.health || 0} max={npc.healthMax} onChange={(v) => handleFieldChange('health', v)} />
        </div>
      )}
      {npc.laughterMax != null && (
        <div className="stat-row" style={{ maxWidth: 360 }}>
          <span style={{ fontSize: 12 }}>Laughter</span>
          <DotTracker value={npc.laughter || 0} max={npc.laughterMax} onChange={(v) => handleFieldChange('laughter', v)} />
        </div>
      )}
      {npc.faceMax != null && (
        <div className="stat-row" style={{ maxWidth: 360 }}>
          <span style={{ fontSize: 12 }}>Face</span>
          <DotTracker value={npc.face || 0} max={npc.faceMax} onChange={(v) => handleFieldChange('face', v)} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <label style={{ fontSize: 12 }}>
          Toughness:{' '}
          <input
            type="number"
            min={0}
            value={npc.toughness ?? ''}
            onChange={(e) => handleFieldChange('toughness', e.target.value === '' ? null : Number(e.target.value))}
            style={{ width: 55 }}
          />
        </label>
        <label style={{ fontSize: 12 }}>
          Dodge:{' '}
          <input
            type="number"
            min={0}
            value={npc.dodge ?? ''}
            onChange={(e) => handleFieldChange('dodge', e.target.value === '' ? null : Number(e.target.value))}
            style={{ width: 55 }}
          />
        </label>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Gifts / Special Skills</span>
          {!editingGifts && (
            <button type="button" className="small-btn" onClick={startEditingGifts}>Edit skills</button>
          )}
        </div>

        {editingGifts ? (
          <>
            <GiftListEditor gifts={giftsDraft} onChange={setGiftsDraft} />
            <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
              <button type="button" className="small-btn" onClick={saveGifts}>Save</button>
              <button type="button" className="small-btn" onClick={() => setEditingGifts(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            {normalizeGifts(npc.gifts).length === 0 ? (
              <p className="helper-text" style={{ margin: 0 }}>No skills listed yet.</p>
            ) : (
              <GiftListDisplay gifts={npc.gifts} />
            )}
          </>
        )}
      </div>

      {error && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>{error}</p>
      )}
    </div>
  );
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
      toughness: entry.toughness ?? '',
      dodge: entry.dodge ?? '',
      gifts: normalizeGifts(entry.gifts),
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
        toughness: form.toughness === '' ? null : Number(form.toughness),
        dodge: form.dodge === '' ? null : Number(form.dodge),
        gifts: form.gifts.filter((g) => g.name.trim()).map((g) => ({ name: g.name.trim(), effect: g.effect.trim() })),
        notes: '',
      });
      setForm(emptyForm());
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setAdding(false);
    }
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
        <input
          type="number"
          placeholder="Toughness"
          value={form.toughness}
          onChange={(e) => setForm({ ...form, toughness: e.target.value })}
          style={{ width: 75 }}
        />
        <input
          type="number"
          placeholder="Dodge"
          value={form.dodge}
          onChange={(e) => setForm({ ...form, dodge: e.target.value })}
          style={{ width: 70 }}
        />
      </div>

      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 2 }}>Gifts / Special Skills</div>
        <GiftListEditor gifts={form.gifts} onChange={(gifts) => setForm({ ...form, gifts })} />
      </div>

      <div style={{ marginBottom: 10 }}>
        <button type="button" className="small-btn" onClick={handleAdd} disabled={adding || !form.name.trim()}>
          {adding ? 'Adding…' : '+ Add'}
        </button>
      </div>

      {npcs.length === 0 && (
        <p className="helper-text" style={{ margin: 0 }}>No NPCs being tracked right now.</p>
      )}

      {npcs.map((npc) => (
        <NpcCard key={npc.id} code={code} npc={npc} onRemove={handleRemove} />
      ))}

      {error && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>{error}</p>
      )}
    </div>
  );
}
