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
      <h2>Step 2 — Age band</h2>
      <div style={{ display: 'flex', gap: 12 }}>
        {core.ageBands.map(band => (
          <label
            key={band.id}
            style={{
              border: '1px solid #999',
              padding: 8,
              borderRadius: 6,
              background: character.ageBandId === band.id ? '#eee' : 'transparent',
            }}
          >
            <input
              type="radio"
              name="ageBand"
              checked={character.ageBandId === band.id}
              onChange={() => setAgeBand(band.id)}
            />
            <strong>{band.name}</strong> ({band.ageRange})
            <div style={{ fontSize: 12 }}>
              +1 {band.bonus} / -1 {band.penalty} &middot; Purse {band.startingPurse} Coin
            </div>
          </label>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>Tent-Born</h3>
      <label>
        <input
          type="checkbox"
          checked={character.tentBorn.isTentBorn}
          onChange={e => setTentBorn('isTentBorn', e.target.checked)}
        />
        {' '}Raised by two Clown parents of different Troupes
      </label>

      {character.tentBorn.isTentBorn && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13 }}>
            Choose the <em>second</em> parent's Troupe — you'll pick your primary (full-membership)
            Troupe in Step 6. This second one only grants a Heritage Trait.
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
            <p style={{ fontSize: 13, marginTop: 8 }}>
              <strong>Heritage Trait:</strong>{' '}
              {core.tentBorn.heritageTraitsByTroupe[character.tentBorn.secondTroupeId]?.name} —{' '}
              {core.tentBorn.heritageTraitsByTroupe[character.tentBorn.secondTroupeId]?.effect}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
