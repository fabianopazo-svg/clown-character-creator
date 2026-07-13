import { useCharacter } from '../context/CharacterContext';
import paths from '../data/paths.json';

export default function Step07Gifts() {
  const { character, dispatch } = useCharacter();
  const path = paths.find(p => p.id === character.pathId);

  if (!path) {
    return (
      <div>
        <div className="section-title">Step 7 — Starting Gifts</div>
        <p className="helper-text">Select a Path in Step 6 first.</p>
      </div>
    );
  }

  const gradeOne = path.gifts.find(g => g.grade === 1);
  const chooseCount = gradeOne.chooseCount;

  const available = gradeOne.list.filter(
    g => !g.subtype || g.subtype === 'open' || g.subtype === character.subtypeId
  );

  const toggleGift = (name) =>
    dispatch({ type: 'TOGGLE_LIST_ITEM', field: 'gifts', value: name, max: chooseCount });

  return (
    <div>
      <div className="section-title">Step 7 — Starting Gifts</div>
      <p className="helper-text">
        Choose {chooseCount} Grade I Gifts for {path.name}.
      </p>
      <span className="remaining-badge">{character.gifts.length} / {chooseCount} selected</span>

      {available.map(gift => (
        <label
          key={gift.name}
          className={`gift-card${character.gifts.includes(gift.name) ? ' selected' : ''}`}
          style={{ display: 'block' }}
        >
          <input
            type="checkbox"
            checked={character.gifts.includes(gift.name)}
            onChange={() => toggleGift(gift.name)}
          />
          {' '}<span className="gift-name">{gift.name}</span>
          {gift.subtype && gift.subtype !== 'open' && (
            <span style={{ fontSize: 11, color: 'var(--hint)' }}> [{gift.subtype}]</span>
          )}
          <div className="gift-cost">Cost: {gift.cost}</div>
          <div className="gift-effect">{gift.effect || gift.domain}</div>
          {gift.limit && <div style={{ fontSize: 11, color: 'var(--hint)' }}>Limit: {gift.limit}</div>}
        </label>
      ))}
    </div>
  );
}
