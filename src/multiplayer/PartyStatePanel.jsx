import { useState } from 'react';
import { updateRoomState } from '../utils/roomsApi';
import { getSuspicionTier } from '../utils/suspicionTiers';
import DotTracker from '../components/DotTracker';

// House Die result is a plain record, not a live roll — the actual dice
// engine is Phase 4. For now this is just a shared "what did the last
// House Die say" flag the MC sets by hand after a physical/manual roll.
const HOUSE_DIE_OPTIONS = [
  { id: null, label: 'No roll yet' },
  { id: 'cheers', label: 'Cheers' },
  { id: 'jeers', label: 'Jeers' },
];

const MOOD_OPTIONS = [
  { id: null, label: 'Off' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'tense', label: 'Tense' },
  { id: 'high_energy', label: 'High Energy' },
];

export default function PartyStatePanel({ code, room, players, isMc }) {
  const [error, setError] = useState(null);

  // Older rooms created before these fields existed won't have them at
  // all — treat missing the same as their proper "unset" value rather
  // than showing undefined or crashing.
  const momentum = room.momentum ?? 0;
  const suspicion = room.suspicion ?? 0;
  const suspicionTier = getSuspicionTier(suspicion);
  const houseDieResult = room.houseDieResult ?? null;
  const houseDifficulty = room.houseDifficulty ?? 0;
  const spotlightHolder = room.spotlightHolder ?? null;
  const currentMood = room.currentMood ?? null;

  const update = (patch) => {
    setError(null);
    updateRoomState(code, patch).catch((err) => setError(err));
  };

  const spotlightLabel = (() => {
    if (!spotlightHolder) return 'Nobody yet';
    if (spotlightHolder === 'mc') return 'The MC / an enemy';
    const holder = players.find((p) => p.uid === spotlightHolder);
    return holder ? holder.displayName : 'Unknown';
  })();

  const houseDieColor = houseDieResult === 'cheers' ? '#2f7a3d' : houseDieResult === 'jeers' ? '#c0392b' : 'var(--muted)';
  const houseDieLabel = HOUSE_DIE_OPTIONS.find((o) => o.id === houseDieResult)?.label;

  return (
    <div className="gift-card" style={{ marginBottom: 16, cursor: 'default' }}>
      <div className="section-title" style={{ marginTop: 0 }}>Party State</div>

      <div className="stat-row" style={{ maxWidth: 420 }}>
        <span>House Difficulty (applied to every House Die roll this scene)</span>
        {isMc ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="small-btn"
              onClick={() => update({ houseDifficulty: houseDifficulty - 1 })}
            >
              −
            </button>
            <span style={{ fontWeight: 600, minWidth: 28, textAlign: 'center' }}>
              {houseDifficulty > 0 ? `+${houseDifficulty}` : houseDifficulty}
            </span>
            <button
              type="button"
              className="small-btn"
              onClick={() => update({ houseDifficulty: houseDifficulty + 1 })}
            >
              +
            </button>
          </div>
        ) : (
          <strong>{houseDifficulty > 0 ? `+${houseDifficulty}` : houseDifficulty}</strong>
        )}
      </div>

      <div className="stat-row" style={{ maxWidth: 420 }}>
        <span>Momentum (caps at 5, resets each Act)</span>
        {isMc ? (
          <DotTracker value={momentum} max={5} onChange={(v) => update({ momentum: v })} />
        ) : (
          <strong>{momentum} / 5</strong>
        )}
      </div>

      <div className="stat-row" style={{ maxWidth: 420 }}>
        <span>Suspicion</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: suspicionTier.color,
              border: `1.5px solid ${suspicionTier.color}`,
              borderRadius: 'var(--radius)',
              padding: '2px 7px',
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}
          >
            {suspicionTier.label}
          </span>
          {isMc ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                className="small-btn"
                onClick={() => update({ suspicion: Math.max(0, suspicion - 1) })}
                disabled={suspicion <= 0}
              >
                −
              </button>
              <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{suspicion}</span>
              <button type="button" className="small-btn" onClick={() => update({ suspicion: suspicion + 1 })}>
                +
              </button>
            </div>
          ) : (
            <strong>{suspicion}</strong>
          )}
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 13, marginBottom: 4 }}>House Die — last recorded result</div>
        {isMc ? (
          <div className="pill-group">
            {HOUSE_DIE_OPTIONS.map((opt) => (
              <label key={opt.id ?? 'none'} className={`pill${houseDieResult === opt.id ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="houseDieResult"
                  checked={houseDieResult === opt.id}
                  onChange={() => update({ houseDieResult: opt.id })}
                  style={{ marginRight: 4 }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        ) : (
          <strong style={{ color: houseDieColor }}>{houseDieLabel}</strong>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 13, marginBottom: 4 }}>Spotlight</div>
        {isMc ? (
          <select value={spotlightHolder ?? ''} onChange={(e) => update({ spotlightHolder: e.target.value || null })}>
            <option value="">Nobody yet</option>
            <option value="mc">The MC / an enemy</option>
            {players.map((p) => (
              <option key={p.uid} value={p.uid}>{p.displayName}</option>
            ))}
          </select>
        ) : (
          <strong>{spotlightLabel}</strong>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 13, marginBottom: 4 }}>Mood Music</div>
        {isMc ? (
          <div className="pill-group">
            {MOOD_OPTIONS.map((opt) => (
              <label key={opt.id ?? 'off'} className={`pill${currentMood === opt.id ? ' selected' : ''}`}>
                <input
                  type="radio"
                  name="currentMood"
                  checked={currentMood === opt.id}
                  onChange={() => update({ currentMood: opt.id })}
                  style={{ marginRight: 4 }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        ) : (
          <strong>{MOOD_OPTIONS.find((o) => o.id === currentMood)?.label || 'Off'}</strong>
        )}
      </div>

      {error && (
        <p className="helper-text" style={{ marginTop: 8, color: '#c0392b' }}>
          Couldn't save that change ({error.code || error.message}).
        </p>
      )}
    </div>
  );
}
