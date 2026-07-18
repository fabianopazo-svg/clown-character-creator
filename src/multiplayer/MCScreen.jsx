import { useEffect, useState } from 'react';
import { subscribeMcNotes, saveMcNotes } from '../utils/roomsApi';
import NpcTrackers from './NpcTrackers';
import SuspicionSpend from './SuspicionSpend';

// Only ever rendered when isMc is true (see RoomLobby), and Firestore
// rules independently enforce the same boundary server-side — so even a
// UI bug here couldn't leak this to a player. This is the one place in
// the whole app that's genuinely MC-exclusive, not "owner + MC" like
// everything else private.
export default function MCScreen({ code, uid, room }) {
  const [notes, setNotes] = useState(undefined);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeMcNotes(code, (data) => {
      setNotes(data);
      if (data) setDraft(data.notes || '');
    });
    return unsubscribe;
  }, [code]);

  const dirty = notes && draft !== (notes.notes || '');

  const handleSave = () => {
    setSaving(true);
    setError(null);
    saveMcNotes(code, draft)
      .catch((err) => setError(err))
      .finally(() => setSaving(false));
  };

  return (
    <div className="gift-card" style={{ marginBottom: 16, cursor: 'default', borderColor: 'var(--accent-border)' }}>
      <div className="section-title" style={{ marginTop: 0 }}>🎭 Hidden MC Screen</div>
      <p className="helper-text" style={{ marginTop: -6 }}>
        Only you can see this — not even the other players, not just "hidden by scrolling."
      </p>

      <div style={{ fontSize: 13, marginBottom: 4 }}>Private notes</div>
      <textarea
        rows={4}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="NPC ideas, secrets, what's actually going on behind the scenes..."
        style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
      />
      <button type="button" className="small-btn" style={{ marginTop: 4 }} onClick={handleSave} disabled={!dirty || saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>

      <NpcTrackers code={code} />

      <SuspicionSpend code={code} uid={uid} room={room} />

      {error && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>
          Couldn't save that ({error.code || error.message}).
        </p>
      )}
    </div>
  );
}
