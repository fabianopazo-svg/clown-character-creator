import { useCharacter } from '../context/CharacterContext';
import paths from '../data/paths.json';
import { giftCountForRenown } from '../utils/calculations';

export default function Step07Gifts() {
  const { character, dispatch } = useCharacter();
  const path = paths.find(p => p.id === character.pathId);

  if (!path) {
    return (
      <div>
        <div className="section-title">Step 7 — Gifts</div>
        <p className="helper-text">Select a Path in Step 6 first.</p>
      </div>
    );
  }

  const allowed = giftCountForRenown(character.renown);

  // Every non-capstone Grade whose Renown requirement is already met is available as a flat pool.
  const unlockedGrades = path.gifts.filter(g => !g.capstone && g.renownReq <= character.renown);
  const capstoneGrade = path.gifts.find(g => g.capstone);

  const toggleGift = (name) =>
    dispatch({ type: 'TOGGLE_LIST_ITEM', field: 'gifts', value: name, max: allowed });

  const setCapstone = (name) =>
    dispatch({ type: 'SET_FIELD', field: 'capstoneGift', value: name });

  const isAvailable = (gift) =>
    !gift.subtype || gift.subtype === 'open' || gift.subtype === character.subtypeId;

  return (
    <div>
      <div className="section-title">Step 7 — Gifts</div>
      <p className="helper-text">
        At Renown {character.renown}, {path.name} knows {allowed} regular Gift{allowed !== 1 ? 's' : ''} total,
        drawn from any Grade already unlocked at this Renown.
      </p>
      <span className="remaining-badge">{character.gifts.length} / {allowed} selected</span>

      {unlockedGrades.map(gradeBlock => (
        <div key={gradeBlock.grade} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-text)', marginBottom: 6 }}>
            Grade {gradeBlock.grade} &middot; Renown {gradeBlock.renownReq}+
          </div>
          {gradeBlock.list.filter(isAvailable).map(gift => (
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
      ))}

      {character.renown >= 10 && capstoneGrade && (
        <div style={{ marginTop: 20 }}>
          <div className="section-title">Capstone (choose 1 of 2)</div>
          {capstoneGrade.list.map(gift => (
            <label
              key={gift.name}
              className={`gift-card${character.capstoneGift === gift.name ? ' selected' : ''}`}
              style={{ display: 'block' }}
            >
              <input
                type="radio"
                name="capstone"
                checked={character.capstoneGift === gift.name}
                onChange={() => setCapstone(gift.name)}
              />
              {' '}<span className="gift-name">{gift.name}</span>
              <div className="gift-effect">{gift.effect}</div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
