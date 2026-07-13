import { useCharacter } from '../context/CharacterContext';
import core from '../data/core.json';

export default function Step08Clown() {
  const { character, dispatch } = useCharacter();

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });
  const setClown = (field, value) => dispatch({ type: 'SET_NESTED', group: 'clown', field, value });

  return (
    <div>
      <div className="section-title">Step 8 — The Clown</div>

      <div className="field-row">
        <label className="field-label">Ring name</label>
        <input type="text" value={character.ringName} onChange={e => setField('ringName', e.target.value)} />
      </div>

      <div className="field-row">
        <label className="field-label">Makeup & costume</label>
        <textarea rows={3} value={character.clown.makeup} onChange={e => setClown('makeup', e.target.value)} />
      </div>

      <div className="field-row">
        <label className="field-label">Human description</label>
        <textarea rows={3} value={character.clown.humanDescription} onChange={e => setClown('humanDescription', e.target.value)} />
      </div>

      <div className="field-row">
        <label className="field-label">Relationship to taking the face</label>
        <textarea rows={2} value={character.clown.relationshipToFace} onChange={e => setClown('relationshipToFace', e.target.value)} />
      </div>

      <div className="section-title">Getting-ready time</div>
      {core.gettingIntoCharacter.map(mode => {
        const locked = mode.requiresTrait && !character.personalityTraits.includes(mode.requiresTrait);
        return (
          <label
            key={mode.id}
            className={`pill${character.clown.gettingReadyId === mode.id ? ' selected' : ''}`}
            style={{ display: 'block', marginBottom: 6, opacity: locked ? 0.5 : 1 }}
          >
            <input
              type="radio"
              name="gettingReady"
              checked={character.clown.gettingReadyId === mode.id}
              disabled={locked}
              onChange={() => setClown('gettingReadyId', mode.id)}
            />
            {' '}{mode.name} ({mode.time})
            {locked && ' — requires Messy/Hyperactive trait'}
          </label>
        );
      })}
    </div>
  );
}
