// A single clickable row that expands in place to reveal more detail.
// Deliberately just the interaction shell — callers supply their own
// header content and expanded children, so this can back both the
// player's Gift rows (grade/name/cost) and an NPC's skill rows
// (name only) with guaranteed-identical click/expand behavior.
export default function ExpandableRow({ expanded, onToggle, header, children }) {
  return (
    <div style={{ borderBottom: '0.5px solid var(--border)', padding: '4px 0' }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: 13 }}
      >
        {header}
      </div>
      {expanded && children}
    </div>
  );
}
