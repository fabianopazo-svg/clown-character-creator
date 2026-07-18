// Square boxes instead of dots — used for Health, which is thematically "damage taken"
// rather than "points spent." Clicking a box sets the filled count up to that box.
// Explicitly chunked into rows (default 10 per row) rather than relying on CSS flex-wrap,
// so a 20-box track always reads as two clean rows of 10, never an orphaned box on its own line.
export default function BoxTracker({ value, max, onChange, disabled = false, perRow = 10 }) {
  const slots = Array.from({ length: max }, (_, i) => i + 1);
  const rows = [];
  for (let i = 0; i < slots.length; i += perRow) {
    rows.push(slots.slice(i, i + perRow));
  }

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 3, verticalAlign: 'middle' }}>
      {rows.map((row, rowIndex) => (
        <span key={rowIndex} style={{ display: 'flex', gap: 3 }}>
          {row.map(n => {
            const filled = n <= value;
            return (
              <button
                key={n}
                type="button"
                disabled={disabled}
                onClick={() => onChange(value === n ? n - 1 : n)}
                aria-label={`Set to ${n}`}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 3,
                  border: '1.5px solid #555',
                  background: filled ? '#1a1a1a' : 'transparent',
                  cursor: disabled ? 'default' : 'pointer',
                  padding: 0,
                  flexShrink: 0,
                }}
              />
            );
          })}
        </span>
      ))}
    </span>
  );
}
