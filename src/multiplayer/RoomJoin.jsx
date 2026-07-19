import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRoom, joinRoomAsPlayer } from '../utils/roomsApi';
import { listCharacters, loadCharacter } from '../utils/storage';
import { listPlayerRooms, savePlayerRoom, removePlayerRoom } from '../utils/playerRooms';

export default function RoomJoin({ onEnterRoom }) {
  const { uid, ready, error: authError } = useAuth();
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedCharId, setSelectedCharId] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyCode, setBusyCode] = useState(null);
  const [error, setError] = useState(null);

  const characters = listCharacters();
  const joinedRooms = listPlayerRooms();

  const doJoin = async (code, character, name) => {
    const room = await getRoom(code);
    if (!room) {
      throw new Error(`No room found with code ${code}.`);
    }
    await joinRoomAsPlayer(code, uid, {
      displayName: name || character.humanName || character.ringName || 'A Clown',
      character,
    });
    savePlayerRoom({
      code: room.code,
      name: room.name || '',
      characterId: character.id,
      characterName: character.ringName || character.humanName || '',
      displayName: name || character.humanName || character.ringName || 'A Clown',
    });
    onEnterRoom({ code: room.code, role: 'player' });
  };

  const handleReopen = async (entry) => {
    setBusyCode(entry.code);
    setError(null);
    try {
      const character = loadCharacter(entry.characterId);
      if (!character) {
        setError(`Couldn't find "${entry.characterName || 'that character'}" in this browser anymore — pick a Clown below to rejoin with instead.`);
        return;
      }
      await doJoin(entry.code, character, entry.displayName);
    } catch (err) {
      if (err.message?.includes('No room found')) {
        setError(`Room ${entry.code} no longer exists — removing it from your list.`);
        removePlayerRoom(entry.code);
      } else {
        setError(err.message);
      }
    } finally {
      setBusyCode(null);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError('Enter a room code.');
      return;
    }
    if (!selectedCharId) {
      setError('Pick a Clown to bring in.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const character = loadCharacter(selectedCharId);
      await doJoin(joinCode.trim(), character, displayName.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <div className="sheet-page"><p className="helper-text">Connecting...</p></div>;
  }

  if (authError) {
    return (
      <div className="sheet-page">
        <p className="helper-text" style={{ color: '#c0392b' }}>
          Couldn't connect: {authError}. Check that your Firebase config in .env is filled in correctly.
        </p>
      </div>
    );
  }

  return (
    <div className="sheet-page">
      <div className="section-title" style={{ marginTop: 0 }}>Join a Room</div>

      {joinedRooms.length > 0 && (
        <>
          <p className="helper-text">Rooms you've joined before — just reopen, no code needed.</p>
          {joinedRooms.map((entry) => (
            <div key={entry.code} className="gift-card" style={{ marginBottom: 10, cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span className="gift-name">{entry.name || `Room ${entry.code}`}</span>
                  <div className="gift-effect">
                    Code: <strong>{entry.code}</strong>
                    {entry.characterName && ` · as ${entry.characterName}`}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleReopen(entry)}
                  disabled={busyCode === entry.code}
                >
                  {busyCode === entry.code ? 'Opening...' : 'Open'}
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      {joinedRooms.length > 0 && (
        <div className="section-title">Join a different room</div>
      )}

      <div className="field-row">
        <label className="field-label">Room code</label>
        <input
          type="text"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value.toUpperCase())}
          placeholder="e.g. F7K2M"
          style={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}
        />
      </div>

      <div className="field-row">
        <label className="field-label">Your name at the table (optional)</label>
        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} />
      </div>

      <div className="field-row">
        <label className="field-label">Which Clown are you bringing?</label>
        {characters.length === 0 && (
          <p className="helper-text">No saved characters on this browser yet — build one first.</p>
        )}
        {characters.map(c => (
          <label key={c.id} className={`pill${selectedCharId === c.id ? ' selected' : ''}`} style={{ display: 'block', marginBottom: 6 }}>
            <input
              type="radio"
              name="joinChar"
              checked={selectedCharId === c.id}
              onChange={() => setSelectedCharId(c.id)}
              style={{ marginRight: 6 }}
            />
            {c.ringName || '(unnamed Clown)'} — Renown {c.renown}
          </label>
        ))}
      </div>

      <button className="btn btn-primary" onClick={handleJoin} disabled={busy}>
        {busy ? 'Joining...' : 'Join room'}
      </button>

      {error && <p style={{ color: '#c0392b', fontSize: 13, marginTop: 12 }}>{error}</p>}
    </div>
  );
}
