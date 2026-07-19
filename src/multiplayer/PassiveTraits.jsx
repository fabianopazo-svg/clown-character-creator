import { useState } from 'react';
import { getPassiveTraits } from '../utils/passiveTraits';
import ExpandableRow from '../components/ExpandableRow';

export default function PassiveTraits({ character, renown }) {
  const [expandedKey, setExpandedKey] = useState(null);
  const { troupe, troupePassives, pathPassives, trueToTheCraft } = getPassiveTraits(character, renown);

  const hasAny = troupePassives.length > 0 || pathPassives.length > 0;
  if (!hasAny) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
        Passive Traits
        {trueToTheCraft && (
          <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--accent-text)', marginLeft: 6 }}>
            ✓ True to the Craft ({troupe?.name})
          </span>
        )}
      </div>
      <p className="helper-text" style={{ marginTop: 0, marginBottom: 6 }}>
        Reference only — these are narrative/conditional bonuses you apply yourself when they come up, not
        something the app calculates automatically.
      </p>

      {troupePassives.map((p) => {
        const key = `troupe-${p.tier}`;
        const expanded = expandedKey === key;
        return (
          <ExpandableRow
            key={key}
            expanded={expanded}
            onToggle={() => setExpandedKey(expanded ? null : key)}
            header={
              <>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Renown {p.renown}+ {expanded ? '▲' : '▼'}</span>
              </>
            }
          >
            <p className="helper-text" style={{ marginTop: 4, marginBottom: 0 }}>{p.text}</p>
          </ExpandableRow>
        );
      })}

      {pathPassives.map((g) => {
        const key = `path-${g.key}`;
        const expanded = expandedKey === key;
        return (
          <ExpandableRow
            key={key}
            expanded={expanded}
            onToggle={() => setExpandedKey(expanded ? null : key)}
            header={
              <>
                <span style={{ fontWeight: 600 }}>{g.name}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Passive {expanded ? '▲' : '▼'}</span>
              </>
            }
          >
            <p className="helper-text" style={{ marginTop: 4, marginBottom: 0 }}>{g.effect}</p>
          </ExpandableRow>
        );
      })}
    </div>
  );
}
