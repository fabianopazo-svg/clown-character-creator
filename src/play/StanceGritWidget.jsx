const STANCES = [
  { id: 'attack', name: 'Attack', effect: '+2 dice to hit, -2 dice to Dodge' },
  { id: 'guard', name: 'Guard', effect: 'Redirect a hit meant for an adjacent ally, +2 to soak, -2 dice to hit' },
  { id: 'grit', name: 'Grit', effect: 'Halve all incoming damage after soak (minor action only this turn)' },
];

export default function StanceGritWidget({ health, healthMax, stance, onChangeStance, disabled = false }) {
  let gritBonus = 0;
  if (health <= 1) gritBonus = 2;
  else if (health <= Math.ceil(healthMax / 2)) gritBonus = 1;

  return (
    <div className="gift-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span className="gift-name">Stance</span>
        <span style={{ fontSize: 12, background: 'var(--accent-bg)', color: 'var(--accent-text)', borderRadius: 'var(--radius)', padding: '3px 8px' }}>
          Grit bonus: +{gritBonus} {gritBonus > 0 && '(auto, from current Health)'}
        </span>
      </div>
      <div className="pill-group">
        {STANCES.map(s => (
          <label key={s.id} className={`pill${stance === s.id ? ' selected' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <span>
              <input type="radio" name="stance" checked={stance === s.id} onChange={() => onChangeStance(s.id)} disabled={disabled} style={{ marginRight: 6 }} />
              <strong>{s.name}</strong>
            </span>
            <span style={{ fontSize: 11, opacity: 0.8 }}>{s.effect}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
