export default function DotTracker({ value, max = 5, onChange, disabled = false }) {
  const dots = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {dots.map(n => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(value === n ? n - 1 : n)}
          aria-label={`Set to ${n}`}
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '1.5px solid #555',
            background: n <= value ? '#333' : 'transparent',
            cursor: disabled ? 'default' : 'pointer',
            padding: 0,
          }}
        />
      ))}
    </span>
  );
}
