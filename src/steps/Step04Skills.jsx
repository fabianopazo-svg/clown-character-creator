import { useCharacter } from '../context/CharacterContext';
import core from '../data/core.json';
import DotTracker from '../components/DotTracker';
import { sumDots } from '../utils/calculations';

export default function Step04Skills() {
  const { character, dispatch } = useCharacter();

  const skillSpent = sumDots(character.skills);
  const performanceCost = character.performanceDots * core.performance.costPerExtraDot;
  const totalSpent = skillSpent + performanceCost;
  const max = core.skillCreation.maxPoints;
  const remaining = max - totalSpent;

  const setSkill = (id, n) => {
    const value = character.skills[id];
    const delta = n - value;
    if (delta > 0 && delta > remaining) return;
    dispatch({ type: 'SET_SKILL', id, value: n });
  };

  const setPerformance = (n) => {
    const clamped = Math.max(0, Math.min(n, core.performance.maxExtraBoughtAtCreation));
    const delta = (clamped - character.performanceDots) * core.performance.costPerExtraDot;
    if (delta > 0 && delta > remaining) return;
    dispatch({ type: 'SET_FIELD', field: 'performanceDots', value: clamped });
  };

  const specialtyMax = core.specialtyCreation.max;
  const specialties = character.specialties;

  const addSpecialty = () => {
    if (specialties.length >= specialtyMax) return;
    dispatch({ type: 'ADD_LIST_TEXT', field: 'specialties', defaultValue: 1 });
  };
  const setSpecialtyText = (i, value) =>
    dispatch({ type: 'SET_LIST_ITEM_FIELD', field: 'specialties', index: i, key: 'text', value });
  const setSpecialtyValue = (i, value) =>
    dispatch({ type: 'SET_LIST_ITEM_FIELD', field: 'specialties', index: i, key: 'value', value });
  const removeSpecialty = (i) =>
    dispatch({ type: 'REMOVE_LIST_INDEX', field: 'specialties', index: i });

  return (
    <div>
      <div className="section-title">Step 4 — Skills, Performance & Specialties</div>
      <p className="helper-text">
        Spend up to {max} points across the nine Skills and Performance (max {core.skillCreation.maxDotsAtCreation} per Skill). Performance starts with {core.performance.baseFreeDots} free dot (never below 1) and can have up to {core.performance.maxExtraBoughtAtCreation} more bought at creation — it also rises further on its own with Rank.
      </p>
      <span className="remaining-badge">Remaining: {remaining} / {max}</span>

      {core.skills.map(skill => (
        <div className="stat-row" key={skill.id} style={{ maxWidth: 320 }}>
          <span title={skill.covers}>
            {skill.name}{skill.flatSoak && <span style={{ color: 'var(--hint)', fontSize: 11 }}> (soak)</span>}
          </span>
          <DotTracker
            value={character.skills[skill.id]}
            max={core.skillCreation.maxDotsAtCreation}
            onChange={(n) => setSkill(skill.id, n)}
          />
        </div>
      ))}

      <div className="accent-block" style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 360 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          Performance <span style={{ fontWeight: 400, fontSize: 11 }}>
            ({character.tentBorn.isTentBorn ? core.performance.baseFreeDotsTentBorn : core.performance.baseFreeDots} free base, {core.performance.costPerExtraDot} pts/extra dot)
          </span>
        </span>
        <DotTracker
          value={character.performanceDots}
          max={core.performance.maxExtraBoughtAtCreation}
          lockedCount={character.tentBorn.isTentBorn ? core.performance.baseFreeDotsTentBorn : core.performance.baseFreeDots}
          onChange={setPerformance}
        />
      </div>

      <div className="section-title">Specialties ({core.specialtyCreation.min}–{specialtyMax})</div>
      <p className="helper-text">
        Each grants +1 die when it genuinely applies — or +2 if it's exceptionally deep (but that counts double against your limit of {specialtyMax}).
      </p>
      {specialties.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={s.text}
            placeholder='e.g. "Pediatric ICU nurse"'
            onChange={e => setSpecialtyText(i, e.target.value)}
            style={{ flex: 1 }}
          />
          <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
            <input type="radio" name={`spec-val-${i}`} checked={s.value === 1} onChange={() => setSpecialtyValue(i, 1)} /> +1
          </label>
          <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
            <input type="radio" name={`spec-val-${i}`} checked={s.value === 2} onChange={() => setSpecialtyValue(i, 2)} /> +2
          </label>
          <button type="button" className="small-btn" onClick={() => removeSpecialty(i)}>Remove</button>
        </div>
      ))}
      {specialties.length < specialtyMax && (
        <button type="button" className="small-btn" onClick={addSpecialty}>+ Add specialty</button>
      )}
    </div>
  );
}
