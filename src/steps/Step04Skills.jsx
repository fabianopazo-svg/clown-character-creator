import { useCharacter } from '../context/CharacterContext';
import core from '../data/core.json';
import DotTracker from '../components/DotTracker';
import { sumDots } from '../utils/calculations';

export default function Step04Skills() {
  const { character, dispatch } = useCharacter();

  const skillSpent = sumDots(character.skills);
  const performanceSpent = character.performanceDots;
  const totalSpent = skillSpent + performanceSpent;
  const max = core.skillCreation.maxPoints;
  const remaining = max - totalSpent;

  const setSkill = (id, n) => {
    const value = character.skills[id];
    const delta = n - value;
    if (delta > 0 && delta > remaining) return;
    dispatch({ type: 'SET_SKILL', id, value: n });
  };

  const setPerformance = (n) => {
    const delta = n - performanceSpent;
    if (delta > 0 && delta > remaining) return;
    if (n > core.performance.maxBoughtAtCreation) return;
    dispatch({ type: 'SET_FIELD', field: 'performanceDots', value: n });
  };

  const specialtyMax = core.specialtyCreation.max;
  const specialties = character.specialties;

  const addSpecialty = () => {
    if (specialties.length >= specialtyMax) return;
    dispatch({ type: 'ADD_LIST_TEXT', field: 'specialties' });
  };
  const setSpecialty = (i, value) =>
    dispatch({ type: 'SET_LIST_TEXT', field: 'specialties', index: i, value });
  const removeSpecialty = (i) =>
    dispatch({ type: 'REMOVE_LIST_INDEX', field: 'specialties', index: i });

  return (
    <div>
      <h2>Step 4 — Skills, Performance & Specialties</h2>
      <p>
        Spend up to <strong>{max}</strong> points across the nine Skills and Performance
        (1 point = 1 dot, max {core.skillCreation.maxDotsAtCreation} per Skill). Performance is
        capped at {core.performance.maxBoughtAtCreation} bought dots at creation — it rises
        further on its own as Renown increases.
      </p>
      <p style={{ fontWeight: 'bold' }}>Remaining: {remaining} / {max}</p>

      {core.skills.map(skill => (
        <div key={skill.id} style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 320, padding: '4px 0' }}>
          <span title={skill.covers}>
            {skill.name}
            {skill.flatSoak && ' (flat soak, not rolled)'}
          </span>
          <DotTracker
            value={character.skills[skill.id]}
            max={core.skillCreation.maxDotsAtCreation}
            onChange={(n) => setSkill(skill.id, n)}
          />
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 320, padding: '8px 0', background: '#f5f5f5' }}>
        <span>Performance (bought, max {core.performance.maxBoughtAtCreation})</span>
        <DotTracker
          value={performanceSpent}
          max={core.performance.maxBoughtAtCreation}
          onChange={setPerformance}
        />
      </div>

      <h3 style={{ marginTop: 24 }}>Specialties ({core.specialtyCreation.min}–{specialtyMax})</h3>
      {specialties.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input
            value={s}
            placeholder='e.g. "Pediatric ICU nurse"'
            onChange={e => setSpecialty(i, e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="button" onClick={() => removeSpecialty(i)}>Remove</button>
        </div>
      ))}
      {specialties.length < specialtyMax && (
        <button type="button" onClick={addSpecialty}>+ Add specialty</button>
      )}
    </div>
  );
}
