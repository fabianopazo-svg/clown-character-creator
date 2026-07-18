import { currentGradeForRenown } from '../utils/playState';

export default function CardsWidget({ renown, value, onChange, disabled = false }) {
  const grade = currentGradeForRenown(renown);
  const cap = 2 + grade;

  return (
    <div className="gift-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="gift-name">Cards in hand</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="small-btn"
            onClick={() => onChange(Math.max(0, value - 1))}
            disabled={disabled || value <= 0}
          >
            −
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, minWidth: 40, textAlign: 'center' }}>
            {value} / {cap}
          </span>
          <button
            type="button"
            className="small-btn"
            onClick={() => onChange(Math.min(cap, value + 1))}
            disabled={disabled || value >= cap}
          >
            +
          </button>
        </div>
      </div>
      <div className="gift-effect">
        Hand size cap = 2 + Grade. At Renown {renown}, current Grade is {grade}.
      </div>
    </div>
  );
}
