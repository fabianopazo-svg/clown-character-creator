import { useCharacter } from '../context/CharacterContext';
import paths from '../data/paths.json';

export default function Step07Gifts() {
  const { character, dispatch } = useCharacter();
  const path = paths.find(p => p.id === character.pathId);

  if (!path) {
    return (
      <div>
        <h2>Step 7 — Starting Gifts</h2>
        <p>Select a Path in Step 6 first.</p>
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
      <h2>Step 7 — Starting Gifts</h2>
      <p>
        Choose {chooseCount} Grade I Gifts for {path.name}
        {character.subtypeId && ` (subtype-restricted Gifts filtered to your chosen subtype)`}.
        {' '}({character.gifts.length} / {chooseCount} selected)
      </p>

      {available.map(gift => (
        <label key={gift.name} style={{ display: 'block', marginBottom: 6, border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
          <input
            type="checkbox"
            checked={character.gifts.includes(gift.name)}
            onChange={() => toggleGift(gift.name)}
          />
          {' '}<strong>{gift.name}</strong>
          {gift.subtype && gift.subtype !== 'open' && (
            <span style={{ fontSize: 11, color: '#666' }}> [{gift.subtype}]</span>
          )}
          <div style={{ fontSize: 13 }}>Cost: {gift.cost}</div>
          <div style={{ fontSize: 13 }}>{gift.effect || gift.domain}</div>
          {gift.limit && <div style={{ fontSize: 12, color: '#666' }}>Limit: {gift.limit}</div>}
        </label>
      ))}
    </div>
  );
}
