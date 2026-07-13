import { useCharacter } from '../context/CharacterContext';
import troupes from '../data/troupes.json';
import paths from '../data/paths.json';

export default function Step06TroupePath() {
  const { character, dispatch } = useCharacter();

  const set = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  const selectedPath = paths.find(p => p.id === character.pathId);

  const handlePathChange = (pathId) => {
    set('pathId', pathId);
    set('subtypeId', ''); // reset subtype when path changes
  };

  return (
    <div>
      <h2>Step 6 — Troupe & Path</h2>

      <h3>Troupe (primary, full membership)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {troupes.map(t => (
          <label
            key={t.id}
            style={{
              border: '1px solid #999',
              borderRadius: 6,
              padding: 8,
              background: character.troupeId === t.id ? '#eee' : 'transparent',
            }}
          >
            <input
              type="radio"
              name="troupe"
              checked={character.troupeId === t.id}
              onChange={() => set('troupeId', t.id)}
            />
            {' '}<strong>{t.name}</strong>
            <div style={{ fontSize: 12 }}>{t.values}</div>
          </label>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>Path</h3>
      <select value={character.pathId} onChange={e => handlePathChange(e.target.value)}>
        <option value="">Select a Path...</option>
        {paths.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.archetype})</option>
        ))}
      </select>

      {selectedPath && selectedPath.subtypes && (
        <div style={{ marginTop: 12 }}>
          <h4>Subtype</h4>
          {selectedPath.subtypes.map(st => (
            <label key={st.id} style={{ display: 'block', marginBottom: 4 }}>
              <input
                type="radio"
                name="subtype"
                checked={character.subtypeId === st.id}
                onChange={() => set('subtypeId', st.id)}
              />
              {' '}<strong>{st.name}</strong>
              {st.focus && ` — ${st.focus}`}
              {st.aura && ` (Aura: ${st.aura})`}
              {st.patron && ` (Patron: ${st.patron})`}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
