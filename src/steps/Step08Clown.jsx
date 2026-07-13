import { useCharacter } from '../context/CharacterContext';
import core from '../data/core.json';

export default function Step08Clown() {
  const { character, dispatch } = useCharacter();

  const setField = (field, value) => dispatch({ type: 'SET_FIELD', field, value });
  const setClown = (field, value) => dispatch({ type: 'SET_NESTED', group: 'clown', field, value });

  return (
    <div>
      <h2>Step 8 — The Clown</h2>

      <label>
        Ring name
        <input value={character.ringName} onChange={e => setField('ringName', e.target.value)} />
      </label>

      <label style={{ display: 'block', marginTop: 12 }}>
        Makeup & costume
        <textarea
          rows={3}
          style={{ width: '100%' }}
          value={character.clown.makeup}
          onChange={e => setClown('makeup', e.target.value)}
        />
      </label>

      <label style={{ display: 'block', marginTop: 12 }}>
        Human description
        <textarea
          rows={3}
          style={{ width: '100%' }}
          value={character.clown.humanDescription}
          onChange={e => setClown('humanDescription', e.target.value)}
        />
      </label>

      <label style={{ display: 'block', marginTop: 12 }}>
        Relationship to taking the face (does it cost you? is it a shield?)
        <textarea
          rows={2}
          style={{ width: '100%' }}
          value={character.clown.relationshipToFace}
          onChange={e => setClown('relationshipToFace', e.target.value)}
        />
      </label>

      <h3 style={{ marginTop: 16 }}>Getting-ready time</h3>
      {core.gettingIntoCharacter.map(mode => (
        <label key={mode.id} style={{ display: 'block' }}>
          <input
            type="radio"
            name="gettingReady"
            checked={character.clown.gettingReadyId === mode.id}
            disabled={mode.requiresTrait && !character.personalityTraits.includes(mode.requiresTrait)}
            onChange={() => setClown('gettingReadyId', mode.id)}
          />
          {' '}{mode.name} ({mode.time})
          {mode.requiresTrait && ' — requires Messy/Hyperactive trait'}
        </label>
      ))}
    </div>
  );
}
