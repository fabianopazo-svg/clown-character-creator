import { useState } from 'react';
import { getKnownGifts } from '../utils/knownGifts';
import { formatCostShort } from '../utils/formatCost';
import ExpandableRow from '../components/ExpandableRow';

function titleCaseSubtype(subtype) {
  return subtype.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
}

// Shows only the Gifts a character actually knows (not the full Path
// catalog — that browsing view belongs in the character builder, not
// live play). Collapsed rows match the PDF export's compact format;
// clicking a row expands it in place to show the full effect text.
// onPerform (optional) adds a "Perform" button per gift — only wired in
// for the viewer's own card, not shown when looking at someone else's.
export default function PlayerGifts({ character, onPerform }) {
  const [expandedKey, setExpandedKey] = useState(null);

  const { path, usesDomain, knownGifts } = getKnownGifts(character);
  if (!path) return null;

  if (knownGifts.length === 0) {
    return <p className="helper-text" style={{ margin: '6px 0 0' }}>No Gifts selected yet.</p>;
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Gifts</div>
      {knownGifts.map((gift) => {
        let costDisplay = formatCostShort(gift.cost);
        if (path.pathResource?.abbrev) {
          costDisplay = costDisplay.replace(new RegExp(path.pathResource.name, 'g'), path.pathResource.abbrev);
        }
        const subtypeTag = gift.subtype && gift.subtype !== 'open' ? ` (${titleCaseSubtype(gift.subtype)})` : '';
        const expanded = expandedKey === gift.key;
        const detailText = usesDomain
          ? `${gift.domain || ''}${gift.limit ? ` (Limit: ${gift.limit})` : ''}`
          : (gift.effect || '');

        return (
          <ExpandableRow
            key={gift.key}
            expanded={expanded}
            onToggle={() => setExpandedKey(expanded ? null : gift.key)}
            header={
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', minWidth: 0 }}>
                  <span style={{ fontSize: 10, color: 'var(--muted)', width: 22, flexShrink: 0 }}>{gift.gradeLabel}</span>
                  <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {gift.name}
                    <span style={{ fontWeight: 400, color: 'var(--muted)' }}>{subtypeTag}</span>
                  </span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>
                  {costDisplay} {expanded ? '▲' : '▼'}
                </span>
              </>
            }
          >
            {detailText && (
              <p className="helper-text" style={{ marginTop: 4, marginBottom: 4, paddingLeft: 30 }}>
                {detailText}
              </p>
            )}
            {onPerform && (
              <div style={{ paddingLeft: 30 }}>
                <button
                  type="button"
                  className="small-btn"
                  onClick={(e) => { e.stopPropagation(); onPerform(gift); }}
                >
                  Perform
                </button>
              </div>
            )}
          </ExpandableRow>
        );
      })}
    </div>
  );
}
