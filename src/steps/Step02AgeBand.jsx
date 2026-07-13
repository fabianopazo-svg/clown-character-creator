import { useCharacter } from '../context/CharacterContext';
import core from '../data/core.json';
import troupes from '../data/troupes.json';

export default function Step02AgeBand() {
  const { character, dispatch } = useCharacter();

  const setAgeBand = (id) => dispatch({ type: 'SET_FIELD', field: 'ageBandId', value: id });
  const setTentBorn = (field, value) =>
    dispatch({ type: 'SET_NESTED', group: 'tentBorn', field, value });

  return (
    <div>
      <div className="section-title">Step 2 — Age band</div>
      <div className="pill-group">
        {core.ageBands.map(band => (
          <label
            key={band.id}
            className={`pill${character.ageBandId === band.id ? ' selected' : ''}`}
            style={{ flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <span>
              <input
                type="radio"
                name="ageBand"
                checked={character.ageBandId === band.id}
                onChange={() => setAgeBand(band.id)}
                style={{ marginRight: 6 }}
              />
              <strong>{band.name}</strong> ({band.ageRange})
            </span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>
              +1 {band.bonus} / -1 {band.penalty} &middot; Purse {band.startingPurse} Coin
            </span>
          </label>
        ))}
      </div>

      <div className="section-title">Tent-Born</div>
      <label style={{ fontSize: 13 }}>
        <input
          type="checkbox"
          checked={character.tentBorn.isTentBorn}
          onChange={e => setTentBorn('isTentBorn', e.target.checked)}
        />
        {' '}Raised by two Clown parents of different Troupes
      </label>

      {character.tentBorn.isTentBorn && (
        <div style={{ marginTop: 12 }}>
          <p className="helper-text">
            Choose the <em>second</em> parent's Troupe — your primary (full-membership) Troupe is
            chosen in Step 6. This second one only grants a Heritage Trait.
          </p>
          <select
            value={character.tentBorn.secondTroupeId}
            onChange={e => setTentBorn('secondTroupeId', e.target.value)}
          >
            <option value="">Select second Troupe...</option>
            {troupes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {character.tentBorn.secondTroupeId && (
            <div className="accent-block" style={{ fontSize: 13 }}>
              <strong>Heritage Trait:</strong>{' '}
              {core.tentBorn.heritageTraitsByTroupe[character.tentBorn.secondTroupeId]?.name} —{' '}
              {core.tentBorn.heritageTraitsByTroupe[character.tentBorn.secondTroupeId]?.effect}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
