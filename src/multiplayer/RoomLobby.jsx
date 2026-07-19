import { useEffect, useState } from 'react';
import { subscribeRoom, subscribePlayers, subscribePlayerSheet, leaveRoom } from '../utils/roomsApi';
import { useAuth } from '../context/AuthContext';
import { loadCharacter, saveCharacter } from '../utils/storage';
import { diffPlayState, formatDiffText } from '../utils/playStateDiff';
import PlayerCard from './PlayerCard';
import PartyStatePanel from './PartyStatePanel';
import ChatLog from './ChatLog';
import RoomAudio from './RoomAudio';
import MCScreen from './MCScreen';
import InspirationPrompts from './InspirationPrompts';
import RulebookViewer from '../rulebook/RulebookViewer';

export default function RoomLobby({ code, role, onLeave }) {
  const { uid } = useAuth();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showRulebook, setShowRulebook] = useState(false);
  // Only relevant for role === 'player' — this room's copy of *my own*
  // character, kept live so the leave-flow below can offer to save its
  // current resources back to this device's local copy.
  const [mySheet, setMySheet] = useState(undefined);
  const [leaving, setLeaving] = useState(false);
  // The roll prompt (if any) the player has clicked "Roll against this" on
  // in Table Chat — lifted here since it needs to flow from ChatLog (left
  // column) into this browser's own RollPanel (right column, inside
  // PlayerCard). One piece of state per RoomLobby instance is correct:
  // each person has their own separate mount in their own browser.
  const [activePrompt, setActivePrompt] = useState(null);

  useEffect(() => {
    const unsubRoom = subscribeRoom(code, setRoom);
    // Roster docs now persist after a player leaves (so their notebook
    // survives) — filter to who's actually still in the room. Missing
    // `present` (older data, or players who joined right when this field
    // was introduced) is treated as present, not filtered out.
    const unsubPlayers = subscribePlayers(code, (allPlayers) => {
      setPlayers(allPlayers.filter(p => p.present !== false));
    });
    return () => {
      unsubRoom();
      unsubPlayers();
    };
  }, [code]);

  useEffect(() => {
    if (role !== 'player' || !uid) return undefined;
    const unsubscribe = subscribePlayerSheet(code, uid, setMySheet, () => setMySheet(null));
    return unsubscribe;
  }, [code, role, uid]);

  const isMc = role === 'mc';

  const handleLeaveClick = async () => {
    setLeaving(true);
    try {
      const myCharacter = mySheet?.character;
      if (role === 'player' && myCharacter?.id) {
        const name = myCharacter.ringName || myCharacter.humanName || 'this Clown';
        const localCharacter = loadCharacter(myCharacter.id);
        const changes = diffPlayState(localCharacter?.play, myCharacter.play);
        const wantsSaveBack = window.confirm(
          `Update your saved copy of "${name}" with this session's resources before leaving?\n\n${formatDiffText(changes)}`
        );
        if (wantsSaveBack) {
          if (localCharacter) {
            saveCharacter({ ...localCharacter, play: myCharacter.play });
          } else {
            alert(`Couldn't find "${name}" in this browser's saved characters anymore — nothing to update.`);
          }
        }
      }
      if (role === 'player' && uid) {
        await leaveRoom(code, uid);
      }
    } finally {
      setLeaving(false);
      onLeave();
    }
  };

  return (
    <div className={`room-layout${showRulebook ? ' room-layout-with-rulebook' : ''}`}>
      <div className="room-chat-column">
        <ChatLog
          code={code}
          uid={uid}
          isMc={isMc}
          onSelectPrompt={(prompt) => setActivePrompt(prompt)}
          activePromptId={activePrompt?.id}
        />
      </div>

      <div className="room-main-column">
        <RoomAudio code={code} uid={uid} room={room} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            {room?.name && (
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{room.name}</div>
            )}
            <div className="field-label">Room code</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 3 }}>{code}</div>
          </div>
          <span className="accent-block" style={{ margin: 0 }}>
            You are: {isMc ? 'MC' : 'Player'}
          </span>
        </div>

        <button
          type="button"
          className="small-btn"
          onClick={() => setShowRulebook((v) => !v)}
          style={{ marginBottom: 16 }}
        >
          {showRulebook ? '📖 Hide Rulebook' : '📖 Rulebook'}
        </button>

        {!room && <p className="helper-text">Loading room...</p>}

        {room && (
          <>
            {isMc && <MCScreen code={code} uid={uid} room={room} />}

            <PartyStatePanel code={code} room={room} players={players} isMc={isMc} />

            <InspirationPrompts />

            <div className="section-title" style={{ marginTop: 0 }}>Players in this room</div>
            {players.length === 0 && <p className="helper-text">Nobody's joined yet — share the code above.</p>}
            {players.map(p => (
              <PlayerCard
                key={p.uid}
                code={code}
                player={p}
                players={players}
                canSeeResources={isMc || p.uid === uid}
                isSelf={p.uid === uid}
                room={room}
                activePrompt={p.uid === uid ? activePrompt : null}
                onClearPrompt={() => setActivePrompt(null)}
              />
            ))}
          </>
        )}

        <button className="btn" onClick={handleLeaveClick} disabled={leaving} style={{ marginTop: 12 }}>
          {leaving ? 'Leaving…' : 'Leave room'}
        </button>
      </div>

      {showRulebook && (
        <div className="room-rulebook-column">
          <div className="section-title" style={{ marginTop: 0 }}>📖 Rulebook</div>
          <RulebookViewer refreshKey={0} compact />
        </div>
      )}
    </div>
  );
}
