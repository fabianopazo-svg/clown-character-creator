import { useCharacter } from '../context/CharacterContext';
import troupes from '../data/troupes.json';
import paths from '../data/paths.json';

export default function Step06TroupePath() {
  const { character, dispatch } = useCharacter();

  const set = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  const selectedPath = paths.find(p => p.id === character.pathId);

  const handlePathChange = (pathId) => {
    set('pathId', pathId);
    set('subtypeId', '');
  };

  return (
    <div>
      <div className="section-title">Step 6 — Troupe & Path</div>

      <p className="helper-text">Troupe (primary, full membership)</p>
      <div className="two-col">
        {troupes.map(t => (
          <label
            key={t.id}
            className={`gift-card${character.troupeId === t.id ? ' selected' : ''}`}
          >
            <input
              type="radio"
              name="troupe"
              checked={character.troupeId === t.id}
              onChange={() => set('troupeId', t.id)}
            />
            {' '}<span className="gift-name">{t.name}</span>
            <div className="gift-effect">{t.values}</div>
          </label>
        ))}
      </div>

      <div className="section-title">Path</div>
      <select value={character.pathId} onChange={e => handlePathChange(e.target.value)}>
        <option value="">Select a Path...</option>
        {paths.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      {selectedPath && selectedPath.subtypes && (
        <div style={{ marginTop: 16 }}>
          <p className="helper-text">Subtype</p>
          {selectedPath.subtypes.map(st => (
            <label
              key={st.id}
              className={`gift-card${character.subtypeId === st.id ? ' selected' : ''}`}
              style={{ display: 'block' }}
            >
              <input
                type="radio"
                name="subtype"
                checked={character.subtypeId === st.id}
                onChange={() => set('subtypeId', st.id)}
              />
              {' '}<span className="gift-name">{st.name}</span>
              {st.focus && <div className="gift-effect">{st.focus}</div>}
              {st.aura && <div className="gift-effect">Aura: {st.aura}</div>}
              {st.patron && <div className="gift-effect">Patron: {st.patron}</div>}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
