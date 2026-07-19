import { useState } from 'react';
import ExpandableRow from './ExpandableRow';

// Normalizes a gift entry that might be the OLD flat-string format
// (before this feature existed) or the new {name, effect} shape, so
// existing saved custom monsters / live NPCs don't break or need a
// manual migration step.
function normalizeGift(gift) {
  if (typeof gift === 'string') return { name: gift, effect: '' };
  return { name: gift?.name || '', effect: gift?.effect || '' };
}

export default function GiftListDisplay({ gifts }) {
  const [expandedIdx, setExpandedIdx] = useState(null);

  const normalized = (gifts || []).map(normalizeGift).filter((g) => g.name);
  if (normalized.length === 0) return null;

  return (
    <div>
      {normalized.map((gift, i) => {
        const expanded = expandedIdx === i;
        return (
          <ExpandableRow
            key={i}
            expanded={expanded}
            onToggle={() => setExpandedIdx(expanded ? null : i)}
            header={
              <>
                <span style={{ fontWeight: 600 }}>{gift.name}</span>
                {gift.effect && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{expanded ? '▲' : '▼'}</span>}
              </>
            }
          >
            {gift.effect && (
              <p className="helper-text" style={{ marginTop: 4, marginBottom: 0 }}>{gift.effect}</p>
            )}
          </ExpandableRow>
        );
      })}
    </div>
  );
}
