import { useCharacter } from '../context/CharacterContext';
import gear from '../data/gear.json';
import { allGearItems } from '../utils/gearLookup';

export default function Step10Gear() {
  const { character, dispatch } = useCharacter();

  const toggleGear = (name) =>
    dispatch({ type: 'TOGGLE_LIST_ITEM', field: 'gear', value: name });

  const items = allGearItems().filter(
    item => item.category !== 'Troupe gear' || item.troupe === character.troupeId
  );

  const byCategory = items.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="section-title">Step 10 — Gear</div>
      <p className="helper-text">
        Pick any gear your Clown starts with. Troupe gear is filtered to your own Troupe
        (others can still be added later through play). Cost is tracked against your Purse
        manually — nothing here auto-deducts Coin.
      </p>
      <p className="helper-text">
        {character.gear.length} item{character.gear.length !== 1 ? 's' : ''} selected
      </p>

      {Object.entries(byCategory).map(([category, categoryItems]) => (
        <div key={category}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-text)', marginTop: 14, marginBottom: 6 }}>
            {category}
          </div>
          {categoryItems.map(item => (
            <label
              key={item.name}
              className={`gift-card${character.gear.includes(item.name) ? ' selected' : ''}`}
              style={{ display: 'block' }}
            >
              <input
                type="checkbox"
                checked={character.gear.includes(item.name)}
                onChange={() => toggleGear(item.name)}
              />
              {' '}<span className="gift-name">{item.name}</span>
              <span style={{ fontSize: 11, color: 'var(--hint)' }}>
                {' '}[{item.type} · {item.rarity} · {item.size} · {item.cost} Coin]
              </span>
              <div className="gift-effect">{item.effect}</div>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}
