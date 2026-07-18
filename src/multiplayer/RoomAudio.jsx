import { useEffect, useRef, useState } from 'react';
import { subscribeRollLog } from '../utils/roomsApi';
import {
  unlockAudio, isUnlocked, setMood,
  getMusicMuted, setMusicMuted, getMusicVolume, setMusicVolume,
  getDrumrollMuted, setDrumrollMuted, getDrumrollVolume, setDrumrollVolume,
  playDrumrollLocally,
} from '../utils/soundController';

export default function RoomAudio({ code, uid, room }) {
  const [unlockedState, setUnlockedState] = useState(isUnlocked());
  const [musicMuted, setMusicMutedState] = useState(getMusicMuted());
  const [drumrollMuted, setDrumrollMutedState] = useState(getDrumrollMuted());
  const [musicVolume, setMusicVolumeState] = useState(getMusicVolume());
  const [drumrollVolume, setDrumrollVolumeState] = useState(getDrumrollVolume());
  const seenRevealingRef = useRef(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!unlockedState) return;
    setMood(room?.currentMood || null);
  }, [room?.currentMood, unlockedState]);

  // Watches the whole room's rolls for a NEW revealingAt appearing on
  // someone else's roll, and plays the drumroll locally in response —
  // this is the "broadcast" half of the cue. The revealer's own copy is
  // triggered directly from RollPanel instead (their reveal is gated on
  // it finishing), so it's skipped here to avoid a double-play.
  useEffect(() => {
    const unsubscribe = subscribeRollLog(code, (rolls) => {
      for (const r of rolls) {
        if (!r.revealingAt) continue;
        if (seenRevealingRef.current.has(r.id)) continue;
        seenRevealingRef.current.add(r.id);
        // The first snapshot delivered is historical data from before this
        // component mounted — not a live cue. Only react to ones that show
        // up in a LATER snapshot.
        if (!initializedRef.current) continue;
        if (r.rollerUid === uid) continue;
        playDrumrollLocally();
      }
      initializedRef.current = true;
    });
    return unsubscribe;
  }, [code, uid]);

  const handleEnable = () => {
    unlockAudio();
    setUnlockedState(true);
  };

  const toggleMusicMuted = () => {
    const next = !musicMuted;
    setMusicMuted(next);
    setMusicMutedState(next);
  };

  const toggleDrumrollMuted = () => {
    const next = !drumrollMuted;
    setDrumrollMuted(next);
    setDrumrollMutedState(next);
  };

  const handleMusicVolumeChange = (e) => {
    const next = Number(e.target.value) / 100;
    setMusicVolume(next);
    setMusicVolumeState(next);
  };

  const handleDrumrollVolumeChange = (e) => {
    const next = Number(e.target.value) / 100;
    setDrumrollVolume(next);
    setDrumrollVolumeState(next);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, marginBottom: 10, flexWrap: 'wrap', color: 'var(--muted)' }}>
      {!unlockedState ? (
        <button type="button" className="small-btn" onClick={handleEnable}>🔊 Enable Sound</button>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <input type="checkbox" checked={!musicMuted} onChange={toggleMusicMuted} />
              Music
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(musicVolume * 100)}
              onChange={handleMusicVolumeChange}
              disabled={musicMuted}
              style={{ width: 80 }}
              aria-label="Music volume"
            />
            <span style={{ minWidth: 28, textAlign: 'right' }}>{Math.round(musicVolume * 100)}%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              <input type="checkbox" checked={!drumrollMuted} onChange={toggleDrumrollMuted} />
              Drumroll
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(drumrollVolume * 100)}
              onChange={handleDrumrollVolumeChange}
              disabled={drumrollMuted}
              style={{ width: 80 }}
              aria-label="Drumroll volume"
            />
            <span style={{ minWidth: 28, textAlign: 'right' }}>{Math.round(drumrollVolume * 100)}%</span>
          </div>
        </>
      )}
    </div>
  );
}
