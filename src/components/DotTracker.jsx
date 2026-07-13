// value = number of *extra* (player-controlled) dots filled, on top of any locked base dots.
// lockedCount dots at the start are always filled and cannot be toggled off.
export default function DotTracker({ value, max = 5, onChange, disabled = false, lockedCount = 0, starsFrom = null }) {
  const totalSlots = lockedCount + max;
  const slots = Array.from({ length: totalSlots }, (_, i) => i + 1);

  return (
    <span style={{ display: 'inline-flex', gap: 4, verticalAlign: 'middle' }}>
      {slots.map(n => {
        const isLocked = n <= lockedCount;
        const extraIndex = n - lockedCount; // 1-based index among the extra/purchasable dots
        const filled = isLocked || extraIndex <= value;
        const isStar = starsFrom !== null && n > starsFrom && filled;

        return (
          <button
            key={n}
            type="button"
            disabled={disabled || isLocked}
            onClick={() => {
              if (isLocked) return;
              const newValue = value === extraIndex ? extraIndex - 1 : extraIndex;
              onChange(newValue);
            }}
            aria-label={`Set to ${n}`}
            title={isLocked ? 'Base dot, always filled' : isStar ? 'Granted automatically by Rank' : undefined}
            style={{
              width: 16,
              height: 16,
              lineHeight: '16px',
              textAlign: 'center',
              fontSize: isStar ? 13 : 0,
              borderRadius: isStar ? 3 : '50%',
              border: isLocked ? '1.5px solid #999' : '1.5px solid #555',
              background: filled && !isStar ? (isLocked ? '#999' : '#1a1a1a') : 'transparent',
              color: isStar ? '#0c447c' : 'transparent',
              cursor: disabled || isLocked ? 'default' : 'pointer',
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
