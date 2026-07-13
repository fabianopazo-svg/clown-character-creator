import { useEffect, useRef, useState } from 'react';
import { listCharacters, loadCharacter, deleteCharacter, importCharacterFile } from '../utils/storage';

export default function CharacterList({ onNew, onOpen }) {
  const [characters, setCharacters] = useState([]);
  const fileInputRef = useRef(null);

  const refresh = () => setCharacters(listCharacters());

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = (id) => {
    if (!confirm('Delete this character? This cannot be undone.')) return;
    deleteCharacter(id);
    refresh();
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const character = importCharacterFile(text);
      onOpen(null, character); // pass loaded character directly, no saved id yet
    } catch (err) {
      alert('Could not read that file as a character — is it a valid exported JSON?');
    }
    e.target.value = '';
  };

  return (
    <div className="sheet-page">
      <div className="section-title">Your Clowns</div>

      {characters.length === 0 && (
        <p className="helper-text">No saved characters yet on this browser.</p>
      )}

      {characters.map(c => (
        <div key={c.id} className="gift-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className="gift-name">{c.ringName || '(unnamed Clown)'}</span>
            <div className="gift-effect">
              {c.humanName} &middot; Renown {c.renown} &middot; saved {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="small-btn" onClick={() => loadCharacter(c.id) && onOpen(c.id, loadCharacter(c.id))}>
              Open
            </button>
            <button className="small-btn" onClick={() => handleDelete(c.id)}>Delete</button>
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
        <button className="btn btn-primary" onClick={onNew}>+ New character</button>
        <button className="btn" onClick={handleImportClick}>Import from JSON file</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </div>
    </div>
  );
}
