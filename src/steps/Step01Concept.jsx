import { useCharacter } from '../context/CharacterContext';

export default function Step01Concept() {
  const { character, dispatch } = useCharacter();
  const set = (field, value) => dispatch({ type: 'SET_FIELD', field, value });

  return (
    <div>
      <h2>Step 1 — Human concept</h2>
      <p>Who is the person before/beneath the Clown?</p>

      <label>
        Human name
        <input value={character.humanName} onChange={e => set('humanName', e.target.value)} />
      </label>

      <label>
        Occupation
        <input value={character.occupation} onChange={e => set('occupation', e.target.value)} />
      </label>

      <label>
        Age (exact number)
        <input
          type="number"
          value={character.age}
          onChange={e => set('age', e.target.value)}
        />
      </label>

      <h3>The Calling</h3>
      <p>
        A single defining act, or a thousand small ones? What Troupe(s) answered? Describe it —
        this is flavor text, not a mechanical field.
      </p>
      <textarea
        rows={4}
        value={character.callingText}
        onChange={e => set('callingText', e.target.value)}
        style={{ width: '100%' }}
      />
    </div>
  );
}
