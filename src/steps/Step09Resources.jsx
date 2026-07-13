import { useCharacter } from '../context/CharacterContext';
import {
  applyAgeModifiers,
  calcStartingLaughter,
  calcHealthBoxes,
  getAgeBand,
} from '../utils/calculations';

export default function Step09Resources() {
  const { character, dispatch } = useCharacter();

  const finalAttributes = applyAgeModifiers(character.attributes, character.ageBandId);
  const laughter = calcStartingLaughter(finalAttributes);
  const health = calcHealthBoxes(character.skills);
  const band = getAgeBand(character.ageBandId);

  const setBackstory = (field, value) =>
    dispatch({ type: 'SET_NESTED', group: 'backstory', field, value });
  const setPurse = (value) => dispatch({ type: 'SET_FIELD', field: 'purseCurrent', value });

  const purseValue = character.purseCurrent ?? band?.startingPurse ?? 0;

  return (
    <div>
      <h2>Step 9 — Starting resources & Backstory</h2>

      <ul>
        <li>Laughter (0–10): <strong>{laughter}</strong> (Poise + Charisma, after age modifiers)</li>
        <li>Face (1–10): <strong>7</strong> (default)</li>
        <li>Renown (1–10): <strong>1</strong></li>
        <li>Health boxes: <strong>{health}</strong> (3 + Toughness)</li>
        <li>
          Purse:{' '}
          <input
            type="number"
            value={purseValue}
            onChange={e => setPurse(Number(e.target.value))}
            style={{ width: 80 }}
          />
          {' '}Coin (starting default for {band?.name || 'your age band'}: {band?.startingPurse ?? '—'})
        </li>
      </ul>

      <h3>Backstory</h3>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Who left your first cryptic sign, and do you still have it?
        <textarea
          rows={2}
          style={{ width: '100%' }}
          value={character.backstory.crypticSign}
          onChange={e => setBackstory('crypticSign', e.target.value)}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        Who are you keeping the truth from?
        <textarea
          rows={2}
          style={{ width: '100%' }}
          value={character.backstory.keepingTruthFrom}
          onChange={e => setBackstory('keepingTruthFrom', e.target.value)}
        />
      </label>
      <label style={{ display: 'block' }}>
        What Motley besides your own have you worn, and what did it cost?
        <textarea
          rows={2}
          style={{ width: '100%' }}
          value={character.backstory.motleyWorn}
          onChange={e => setBackstory('motleyWorn', e.target.value)}
        />
      </label>
    </div>
  );
}
