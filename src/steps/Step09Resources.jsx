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
      <div className="section-title">Step 9 — Starting resources</div>
      <div className="three-col">
        <div className="accent-block"><strong>Laughter</strong><div>{laughter}</div></div>
        <div className="accent-block"><strong>Face</strong><div>7</div></div>
        <div className="accent-block"><strong>Health</strong><div>{health} boxes</div></div>
      </div>

      <div className="field-row" style={{ marginTop: 16 }}>
        <label className="field-label">
          Purse (Coin) — default for {band?.name || 'your age band'}: {band?.startingPurse ?? '—'}
        </label>
        <input type="number" value={purseValue} onChange={e => setPurse(Number(e.target.value))} style={{ width: 120 }} />
      </div>

      <div className="section-title">Backstory</div>
      <div className="field-row">
        <label className="field-label">Who left your first cryptic sign, and do you still have it?</label>
        <textarea rows={2} value={character.backstory.crypticSign} onChange={e => setBackstory('crypticSign', e.target.value)} />
      </div>
      <div className="field-row">
        <label className="field-label">Who are you keeping the truth from?</label>
        <textarea rows={2} value={character.backstory.keepingTruthFrom} onChange={e => setBackstory('keepingTruthFrom', e.target.value)} />
      </div>
      <div className="field-row">
        <label className="field-label">What Motley besides your own have you worn, and what did it cost?</label>
        <textarea rows={2} value={character.backstory.motleyWorn} onChange={e => setBackstory('motleyWorn', e.target.value)} />
      </div>
    </div>
  );
}
