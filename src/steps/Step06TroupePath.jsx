import { useCharacter } from '../context/CharacterContext';
import troupes from '../data/troupes.json';
import paths from '../data/paths.json';
import { getRankForRenown, giftCountForRenown } from '../utils/calculations';

export default function Step06TroupePath() {
  const { character, dispatch } = useCharacter();

  const set = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  const selectedPath = paths.find(p => p.id === character.pathId);

  const handlePathChange = (pathId) => {
    set('pathId', pathId);
    set('subtypeId', '');
  };

  const rank = getRankForRenown(character.renown);
  const giftCount = giftCountForRenown(character.renown);

  return (
    <div>
      <div className="section-title">Step 6 — Troupe, Path & Renown</div>

      <p className="helper-text">
        Starting Renown — most player Clowns begin at 1, but you can build a more experienced
        character. Higher Renown means more Gifts (and the Grade V capstone at Renown 10), but
        does not change your Attribute or Skill point pools at creation.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <input
          type="range"
          min={1}
          max={10}
          value={character.renown}
          onChange={e => set('renown', Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span className="accent-block" style={{ margin: 0, whiteSpace: 'nowrap' }}>
          Renown {character.renown} &middot; {rank.name} &middot; {giftCount} Gift{giftCount !== 1 ? 's' : ''}
          {character.renown >= 10 ? ' + capstone' : ''}
        </span>
      </div>

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

