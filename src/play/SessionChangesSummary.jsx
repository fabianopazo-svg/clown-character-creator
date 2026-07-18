import { diffPlayState, formatDelta } from '../utils/playStateDiff';

export default function SessionChangesSummary({ start, current }) {
  const changes = diffPlayState(start, current);

  if (changes.length === 0) {
    return <p className="helper-text" style={{ margin: '4px 0 0' }}>No changes since your last save.</p>;
  }

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Since your last save:</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
        {changes.map((c, i) => (
          <li key={i}>
            {c.label}:{' '}
            {c.text ? (
              c.text
            ) : (
              <strong style={{ color: c.delta > 0 ? '#2f7a3d' : '#c0392b' }}>{formatDelta(c.delta)}</strong>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
