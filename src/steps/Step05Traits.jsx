import { useCharacter } from '../context/CharacterContext';
import core from '../data/core.json';

export default function Step05Traits() {
  const { character, dispatch } = useCharacter();
  const traitMax = core.personalityTraitCreation.max;
  const traitMin = core.personalityTraitCreation.min;

  const toggleTrait = (id) =>
    dispatch({ type: 'TOGGLE_LIST_ITEM', field: 'personalityTraits', value: id, max: traitMax });

  const insecurityMax = core.insecurityCreation.max;
  const insecurities = character.insecurities;
  const addInsecurity = () => {
    if (insecurities.length >= insecurityMax) return;
    dispatch({ type: 'ADD_LIST_TEXT', field: 'insecurities' });
  };
  const setInsecurity = (i, value) =>
    dispatch({ type: 'SET_LIST_TEXT', field: 'insecurities', index: i, value });
  const removeInsecurity = (i) =>
    dispatch({ type: 'REMOVE_LIST_INDEX', field: 'insecurities', index: i });

  return (
    <div>
      <div className="section-title">Step 5 — Personality traits</div>
      <p className="helper-text">
        Choose {traitMin}–{traitMax} traits ({character.personalityTraits.length} selected).
      </p>
      {core.personalityTraits.map(trait => (
        <label
          key={trait.id}
          className={`gift-card${character.personalityTraits.includes(trait.id) ? ' selected' : ''}`}
          style={{ display: 'block' }}
        >
          <input
            type="checkbox"
            checked={character.personalityTraits.includes(trait.id)}
            onChange={() => toggleTrait(trait.id)}
          />
          {' '}<span className="gift-name">{trait.name}</span>
          <div className="gift-effect">{trait.effect}</div>
        </label>
      ))}

      <div className="section-title">Insecurities (0–{insecurityMax}, optional at creation)</div>
      {insecurities.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type="text"
            value={s}
            placeholder="Describe the insecurity and its small mechanical hook"
            onChange={e => setInsecurity(i, e.target.value)}
          />
          <button type="button" className="small-btn" onClick={() => removeInsecurity(i)}>Remove</button>
        </div>
      ))}
      {insecurities.length < insecurityMax && (
        <button type="button" className="small-btn" onClick={addInsecurity}>+ Add insecurity</button>
      )}
    </div>
  );
}
