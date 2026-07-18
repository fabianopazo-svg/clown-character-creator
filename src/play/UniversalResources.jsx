import DotTracker from '../components/DotTracker';
import BoxTracker from '../components/BoxTracker';

export default function UniversalResources({ play, onChange = () => {}, readOnly = false }) {
  return (
    <div>
      <div className="section-title" style={{ marginTop: 0 }}>Universal Resources</div>
      <div className="stat-row" style={{ maxWidth: 400 }}>
        <span>Laughter</span>
        <DotTracker value={play.laughter} max={10} onChange={v => onChange('laughter', v)} disabled={readOnly} />
      </div>
      <div className="stat-row" style={{ maxWidth: 400 }}>
        <span>Face</span>
        <DotTracker value={play.face} max={10} onChange={v => onChange('face', v)} disabled={readOnly} />
      </div>
      <div className="stat-row" style={{ maxWidth: 400, alignItems: 'flex-start' }}>
        <span style={{ paddingTop: 2 }}>Health</span>
        <BoxTracker value={play.health} max={20} onChange={v => onChange('health', v)} disabled={readOnly} />
      </div>
      {play.face <= 0 && (
        <div style={{ marginTop: 8, background: '#fae3e1', color: '#c0392b', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>
          Face has hit 0 — stuck in the mask. This is the one true death condition in this game.
        </div>
      )}
    </div>
  );
}
