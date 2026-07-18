import DotTracker from '../components/DotTracker';

export default function ResourcePool({ label, description, value, onChange, thresholds, disabled = false }) {
  const activeThreshold = thresholds?.find(
    t => value >= t.range[0] && value <= t.range[1]
  );

  return (
    <div className="gift-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span className="gift-name">{label}</span>
        <DotTracker value={value} max={10} onChange={onChange} disabled={disabled} />
      </div>
      {description && <div className="gift-effect">{description}</div>}
      {activeThreshold && (
        <div style={{ marginTop: 6, fontSize: 12, background: 'var(--accent-bg)', color: 'var(--accent-text)', borderRadius: 'var(--radius)', padding: '4px 8px' }}>
          {activeThreshold.effect}
        </div>
      )}
    </div>
  );
}
