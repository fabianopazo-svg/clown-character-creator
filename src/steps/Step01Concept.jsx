import { useCharacter } from '../context/CharacterContext';

export default function Step01Concept() {
  const { character, dispatch } = useCharacter();
  const set = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  return (
    <div>
      <div className="section-title">Step 1 — Human concept</div>
      <p className="helper-text">Who is the person before/beneath the Clown?</p>

      <div className="field-row">
        <label className="field-label">Human name</label>
        <input type="text" value={character.humanName} onChange={e => set('humanName', e.target.value)} />
      </div>

      <div className="two-col">
        <div className="field-row">
          <label className="field-label">Occupation</label>
          <input type="text" value={character.occupation} onChange={e => set('occupation', e.target.value)} />
        </div>
        <div className="field-row">
          <label className="field-label">Age (exact number)</label>
          <input type="number" value={character.age} onChange={e => set('age', e.target.value)} />
        </div>
      </div>

      <div className="section-title">The Calling</div>
      <p className="helper-text">
        A single defining act, or a thousand small ones? What Troupe(s) answered? Flavor text, not a mechanical field.
      </p>
      <textarea rows={4} value={character.callingText} onChange={e => set('callingText', e.target.value)} />
    </div>
  );
}
