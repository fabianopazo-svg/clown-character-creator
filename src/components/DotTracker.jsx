export default function DotTracker({ value, max = 5, onChange, disabled = false, starsFrom = null }) {
  const dots = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <span style={{ display: 'inline-flex', gap: 4, verticalAlign: 'middle' }}>
      {dots.map(n => {
        const filled = n <= value;
        const isStar = starsFrom !== null && n > starsFrom && filled;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === n ? n - 1 : n)}
            aria-label={`Set to ${n}`}
            title={isStar ? 'Granted automatically by Rank' : undefined}
            style={{
              width: 16,
              height: 16,
              lineHeight: '16px',
              textAlign: 'center',
              fontSize: isStar ? 13 : 0,
              borderRadius: isStar ? 3 : '50%',
              border: '1.5px solid #555',
              background: filled && !isStar ? '#1a1a1a' : 'transparent',
              color: isStar ? '#0c447c' : 'transparent',
              cursor: disabled ? 'default' : 'pointer',
              padding: 0,
            }}
          >
            {isStar ? '★' : ''}
          </button>
        );
      })}
    </span>
  );
}
