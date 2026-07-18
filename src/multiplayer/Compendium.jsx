import { useState } from 'react';
import bestiaryData from '../data/bestiary.json';
import { listCustomMonsters, saveCustomMonster, removeCustomMonster } from '../utils/customBestiary';

const CATEGORY_LABELS = {
  mundane: 'Mundane Threats',
  echo: 'Backstage Echoes',
  rival_clown: 'Rival Clowns',
  construct: 'Constructs',
  usher: 'The Ushers',
  custom: 'My Custom Monsters',
};

const CATEGORY_ORDER = ['mundane', 'echo', 'rival_clown', 'construct', 'usher', 'custom'];

function emptyDraft() {
  return {
    id: null,
    name: '',
    tier: '',
    pool: '',
    health: '',
    laughter: '',
    laughterMax: '',
    face: '',
    faceMax: '',
    description: '',
    hook: '',
    giftsText: '',
  };
}

function StatLine({ entry }) {
  const parts = [];
  if (entry.pool != null && entry.pool !== '') parts.push(`Pool ${entry.pool}${entry.poolNote ? ` (${entry.poolNote})` : ''}`);
  if (entry.health != null && entry.health !== '') parts.push(`Health ${entry.health}`);
  if (entry.laughter != null && entry.laughter !== '') {
    parts.push(`Laughter ${entry.laughter}${entry.laughterMax ? `/${entry.laughterMax}` : ''}`);
  } else if (entry.laughterMax) {
    parts.push(`Laughter max ${entry.laughterMax}`);
  }
  if (entry.face != null && entry.face !== '') {
    parts.push(`Face ${entry.face}${entry.faceMax ? `/${entry.faceMax}` : ''}`);
  } else if (entry.faceMax) {
    parts.push(`Face max ${entry.faceMax}`);
  }
  if (entry.renownEquivalent != null) parts.push(`Renown-equiv ${entry.renownEquivalent}`);
  if (parts.length === 0) return null;
  return <div className="gift-effect">{parts.join(' \u00b7 ')}</div>;
}

export default function Compendium() {
  const [customMonsters, setCustomMonsters] = useState(listCustomMonsters());
  const [activeCategory, setActiveCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  const refreshCustom = () => setCustomMonsters(listCustomMonsters());

  const allEntries = [
    ...bestiaryData.entries,
    ...customMonsters.map((m) => ({ ...m, category: 'custom' })),
  ];

  const visibleEntries = activeCategory === 'all'
    ? allEntries
    : allEntries.filter((e) => e.category === activeCategory);

  const grouped = CATEGORY_ORDER
    .map((cat) => ({ cat, entries: visibleEntries.filter((e) => e.category === cat) }))
    .filter((g) => g.entries.length > 0);

  const handleEdit = (entry) => {
    setDraft({
      id: entry.id,
      name: entry.name || '',
      tier: entry.tier || '',
      pool: entry.pool ?? '',
      health: entry.health ?? '',
      laughter: entry.laughter ?? '',
      laughterMax: entry.laughterMax ?? '',
      face: entry.face ?? '',
      faceMax: entry.faceMax ?? '',
      description: entry.description || '',
      hook: entry.hook || '',
      giftsText: (entry.gifts || []).join('\n'),
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!draft.name.trim()) return;
    const { giftsText, ...rest } = draft;
    saveCustomMonster({
      ...rest,
      name: draft.name.trim(),
      pool: draft.pool === '' ? null : Number(draft.pool),
      health: draft.health === '' ? null : Number(draft.health),
      laughter: draft.laughter === '' ? null : Number(draft.laughter),
      laughterMax: draft.laughterMax === '' ? null : Number(draft.laughterMax),
      face: draft.face === '' ? null : Number(draft.face),
      faceMax: draft.faceMax === '' ? null : Number(draft.faceMax),
      gifts: giftsText.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    refreshCustom();
    setDraft(emptyDraft());
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this custom monster? This cannot be undone.')) return;
    removeCustomMonster(id);
    refreshCustom();
  };

  return (
    <div>
      <p className="helper-text">
        Ready-to-run threats from the rulebook, plus any custom ones you've built \u2014 reusable
        across any room, not tied to a specific session.
      </p>

      <div className="pill-group" style={{ marginBottom: 12 }}>
        <label className={`pill${activeCategory === 'all' ? ' selected' : ''}`}>
          <input type="radio" checked={activeCategory === 'all'} onChange={() => setActiveCategory('all')} style={{ marginRight: 4 }} />
          All
        </label>
        {CATEGORY_ORDER.map((cat) => (
          <label key={cat} className={`pill${activeCategory === cat ? ' selected' : ''}`}>
            <input type="radio" checked={activeCategory === cat} onChange={() => setActiveCategory(cat)} style={{ marginRight: 4 }} />
            {CATEGORY_LABELS[cat]}
          </label>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-primary"
        style={{ marginBottom: 16 }}
        onClick={() => { setDraft(emptyDraft()); setShowForm((v) => !v); }}
      >
        {showForm ? 'Cancel' : '+ Create custom monster'}
      </button>

      {showForm && (
        <div className="gift-card" style={{ marginBottom: 16, cursor: 'default' }}>
          <div className="two-col">
            <div className="field-row">
              <label className="field-label">Name</label>
              <input type="text" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="field-row">
              <label className="field-label">Tier / notes</label>
              <input type="text" value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value })} placeholder="e.g. standard, mini-boss" />
            </div>
          </div>
          <div className="three-col">
            <div className="field-row">
              <label className="field-label">Pool</label>
              <input type="number" value={draft.pool} onChange={(e) => setDraft({ ...draft, pool: e.target.value })} />
            </div>
            <div className="field-row">
              <label className="field-label">Health</label>
              <input type="number" value={draft.health} onChange={(e) => setDraft({ ...draft, health: e.target.value })} />
            </div>
            <div />
            <div className="field-row">
              <label className="field-label">Laughter</label>
              <input type="number" value={draft.laughter} onChange={(e) => setDraft({ ...draft, laughter: e.target.value })} />
            </div>
            <div className="field-row">
              <label className="field-label">Laughter max</label>
              <input type="number" value={draft.laughterMax} onChange={(e) => setDraft({ ...draft, laughterMax: e.target.value })} />
            </div>
            <div />
            <div className="field-row">
              <label className="field-label">Face</label>
              <input type="number" value={draft.face} onChange={(e) => setDraft({ ...draft, face: e.target.value })} />
            </div>
            <div className="field-row">
              <label className="field-label">Face max</label>
              <input type="number" value={draft.faceMax} onChange={(e) => setDraft({ ...draft, faceMax: e.target.value })} />
            </div>
          </div>
          <div className="field-row">
            <label className="field-label">Description</label>
            <textarea rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div className="field-row">
            <label className="field-label">Tactical hook</label>
            <textarea rows={2} value={draft.hook} onChange={(e) => setDraft({ ...draft, hook: e.target.value })} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div className="field-row">
            <label className="field-label">Gifts / Special Skills (one per line)</label>
            <textarea
              rows={3}
              value={draft.giftsText}
              onChange={(e) => setDraft({ ...draft, giftsText: e.target.value })}
              placeholder={'e.g.\nWeighted Pie\nSet the Trick'}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!draft.name.trim()}>
            {draft.id ? 'Save changes' : 'Add to compendium'}
          </button>
        </div>
      )}

      {grouped.map(({ cat, entries }) => (
        <div key={cat} style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginTop: 0 }}>{CATEGORY_LABELS[cat]}</div>
          {entries.map((entry) => (
            <div key={entry.id} className="gift-card" style={{ marginBottom: 8, cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <span className="gift-name">{entry.name}</span>
                  {entry.tier && <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>({entry.tier})</span>}
                  <StatLine entry={entry} />
                  {entry.pathInfo && <div className="gift-effect">{entry.pathInfo}</div>}
                  {entry.gifts && entry.gifts.length > 0 && (
                    <div className="gift-effect" style={{ marginTop: 4 }}>
                      Gifts:
                      <ul style={{ margin: '2px 0 0 0', paddingLeft: 18 }}>
                        {entry.gifts.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}
                  {entry.description && <div className="gift-effect" style={{ marginTop: 4 }}>{entry.description}</div>}
                  {entry.special && <div className="gift-effect" style={{ marginTop: 4, fontStyle: 'italic' }}>{entry.special}</div>}
                  {entry.hook && <div className="gift-effect" style={{ marginTop: 4 }}><strong>Hook:</strong> {entry.hook}</div>}
                  {entry.summonCost && <div className="gift-effect" style={{ marginTop: 4 }}>Summon cost: {entry.summonCost}</div>}
                </div>
                {cat === 'custom' && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                    <button type="button" className="small-btn" onClick={() => handleEdit(entry)}>Edit</button>
                    <button type="button" className="small-btn" onClick={() => handleDelete(entry.id)}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
