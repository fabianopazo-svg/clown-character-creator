import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createRoom, getRoom, deleteRoomCompletely, updateRoomState } from '../utils/roomsApi';
import { listMcRooms, saveMcRoom, renameMcRoom, removeMcRoom } from '../utils/mcRooms';
import Compendium from './Compendium';

export default function MCCorner({ onEnterRoom }) {
  const { uid, ready } = useAuth();
  const [tab, setTab] = useState('rooms'); // 'rooms' | 'compendium'
  const [rooms, setRooms] = useState(listMcRooms());
  const [busyCode, setBusyCode] = useState(null);
  const [renamingCode, setRenamingCode] = useState(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const refresh = () => setRooms(listMcRooms());

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      const code = await createRoom(uid, newRoomName.trim());
      saveMcRoom({ code, name: newRoomName.trim() });
      onEnterRoom({ code, role: 'mc' });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRejoin = async (code) => {
    setBusyCode(code);
    setError(null);
    try {
      const room = await getRoom(code);
      if (!room) {
        setError(`Room ${code} no longer exists in Firestore — removing it from your list.`);
        removeMcRoom(code);
        refresh();
        return;
      }
      if (room.mcUid !== uid) {
        setError(`Room ${code} was created by a different browser/session — you can't rejoin it as MC from here.`);
        return;
      }
      onEnterRoom({ code, role: 'mc' });
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusyCode(null);
    }
  };

  const startRename = (room) => {
    setRenamingCode(room.code);
    setRenameDraft(room.name || '');
  };

  const confirmRename = async (code) => {
    renameMcRoom(code, renameDraft.trim());
    refresh();
    setRenamingCode(null);
    // Best-effort — if the room's already gone from Firestore, the local
    // rename above still sticks, which is the part that matters most here.
    try {
      const room = await getRoom(code);
      if (room && room.mcUid === uid) {
        await updateRoomState(code, { name: renameDraft.trim() });
      }
    } catch {
      // ignore — local label is still updated
    }
  };

  const handleDelete = async (code) => {
    const confirmed = window.confirm(
      `Permanently delete room ${code}? This removes every roll, prompt, player, and note in it from Firestore — there's no undo.`
    );
    if (!confirmed) return;
    setBusyCode(code);
    setError(null);
    try {
      await deleteRoomCompletely(code, uid);
      removeMcRoom(code);
      refresh();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setBusyCode(null);
    }
  };

  if (!ready) {
    return <div className="sheet-page"><p className="helper-text">Connecting...</p></div>;
  }

  return (
    <div className="sheet-page">
      <div className="section-title" style={{ marginTop: 0 }}>🎪 The MC Corner</div>

      <div className="pill-group" style={{ marginBottom: 16 }}>
        <label className={`pill${tab === 'rooms' ? ' selected' : ''}`}>
          <input type="radio" checked={tab === 'rooms'} onChange={() => setTab('rooms')} style={{ marginRight: 4 }} />
          Your Rooms
        </label>
        <label className={`pill${tab === 'compendium' ? ' selected' : ''}`}>
          <input type="radio" checked={tab === 'compendium'} onChange={() => setTab('compendium')} style={{ marginRight: 4 }} />
          NPC &amp; Monster Compendium
        </label>
      </div>

      {tab === 'compendium' && <Compendium />}

      {tab === 'rooms' && (
        <>
          <p className="helper-text">
            Rooms you've created from this browser. Rejoining doesn't need a code — it uses this
            browser's saved identity, the same way it always has for the MC.
          </p>

          <div className="gift-card" style={{ marginBottom: 16, cursor: 'default' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Create a new room</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Room name (optional)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                style={{ flex: 1, minWidth: 160 }}
              />
              <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create room'}
              </button>
            </div>
          </div>

          {rooms.length === 0 && (
            <p className="helper-text">No rooms yet — create one above, or it'll show up here once you do.</p>
          )}

          {rooms.map((room) => (
            <div key={room.code} className="gift-card" style={{ marginBottom: 10, cursor: 'default' }}>
              {renamingCode === room.code ? (
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                  <input
                    type="text"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    style={{ flex: 1 }}
                    autoFocus
                  />
                  <button type="button" className="small-btn" onClick={() => confirmRename(room.code)}>Save</button>
                  <button type="button" className="small-btn" onClick={() => setRenamingCode(null)}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="gift-name">{room.name || '(untitled room)'}</span>
                  <button type="button" className="small-btn" onClick={() => startRename(room)}>Rename</button>
                </div>
              )}

              <div className="gift-effect" style={{ marginBottom: 8 }}>
                Code: <strong>{room.code}</strong>
                {room.createdAt && ` · Created ${new Date(room.createdAt).toLocaleDateString()}`}
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" onClick={() => handleRejoin(room.code)} disabled={busyCode === room.code}>
                  {busyCode === room.code ? 'Working...' : 'Rejoin as MC'}
                </button>
                <button type="button" className="small-btn" onClick={() => handleDelete(room.code)} disabled={busyCode === room.code} style={{ color: '#c0392b' }}>
                  Delete permanently
                </button>
              </div>
            </div>
          ))}

          {error && (
            <p className="helper-text" style={{ marginTop: 8, color: '#c0392b' }}>{error}</p>
          )}
        </>
      )}
    </div>
  );
}
