import { useState } from 'react';
import { searchGlossary } from '../utils/glossaryIndex';

export default function Glossary() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = searchGlossary(query);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <>
      <button className="small-btn" onClick={() => setOpen(true)}>Glossary</button>

      {open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '8vh', zIndex: 100,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', borderRadius: 12, width: 'min(640px, 92vw)',
              maxHeight: '78vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 16 }}>Glossary</span>
                <button className="small-btn" onClick={close}>Close</button>
              </div>
              <input
                type="text"
                autoFocus
                placeholder="Search Gifts, Troupes, resources, rules terms..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ overflowY: 'auto', padding: '8px 20px 16px' }}>
              {query.trim() === '' && (
                <p className="helper-text" style={{ marginTop: 12 }}>
                  Start typing — searches every Gift, Troupe passive, piece of Gear, Attribute,
                  Skill, and core rule in the game at once.
                </p>
              )}
              {query.trim() !== '' && results.length === 0 && (
                <p className="helper-text" style={{ marginTop: 12 }}>No matches for "{query}".</p>
              )}
              {results.map((r, i) => (
                <div key={i} className="gift-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span className="gift-name">{r.title}</span>
                    <span style={{ fontSize: 10, color: 'var(--hint)', whiteSpace: 'nowrap' }}>{r.category}</span>
                  </div>
                  {r.meta && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{r.meta}</div>}
                  <div className="gift-effect">{r.body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
