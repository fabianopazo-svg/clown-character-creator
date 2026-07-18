import { useEffect, useState } from 'react';
import { subscribePlayerSheet, updatePlayResource, updatePlayPathResource } from '../utils/roomsApi';
import paths from '../data/paths.json';
import troupes from '../data/troupes.json';
import { getRankForRenown } from '../utils/calculations';
import UniversalResources from '../play/UniversalResources';
import PathResourcePanel from '../play/PathResourcePanel';
import NotebookSection from './NotebookSection';
import RollPanel from './RollPanel';

// Renders one player's row in the room lobby. Roster info (name, Troupe,
// Path, Renown) is always shown — it comes from the public roster doc that
// everyone in the room can read. Live resources only render when
// canSeeResources is true (this is the viewer's own card, or the viewer is
// the MC) — that subscription hits the private/sheet doc, which Firestore
// rules block for anyone else. Only the player themself (isSelf) can edit —
// the MC's view of another player's card is always read-only, and Firestore
// rules enforce that server-side too, so this is UI convenience, not the
// actual security boundary.
export default function PlayerCard({ code, player, canSeeResources, isSelf, room, activePrompt, onClearPrompt }) {
  const [sheet, setSheet] = useState(undefined);
  const [sheetError, setSheetError] = useState(null);
  const [writeError, setWriteError] = useState(null);

  useEffect(() => {
    if (!canSeeResources) {
      setSheet(undefined);
      setSheetError(null);
      return undefined;
    }
    setSheet(undefined);
    setSheetError(null);
    const unsubscribe = subscribePlayerSheet(
      code,
      player.uid,
      (data) => setSheet(data),
      (err) => { setSheetError(err); setSheet(null); },
    );
    return unsubscribe;
  }, [code, player.uid, canSeeResources]);

  const handleResourceChange = (field, value) => {
    setWriteError(null);
    updatePlayResource(code, player.uid, field, value).catch((err) => setWriteError(err));
  };

  const handlePathResourceChange = (key, value) => {
    setWriteError(null);
    updatePlayPathResource(code, player.uid, key, value).catch((err) => setWriteError(err));
  };

  const troupe = troupes.find(t => t.id === player.troupeId);
  const path = paths.find(p => p.id === player.pathId);
  const subtype = path?.subtypes?.find(s => s.id === player.subtypeId);
  const rank = getRankForRenown(player.renown);
  const character = sheet?.character;

  return (
    <div className="gift-card">
      <span className="gift-name">{player.displayName}</span>
      <div className="gift-effect">
        {player.ringName || '(unnamed Clown)'}
        {troupe ? ` · ${troupe.name}` : ''}
        {path ? ` · ${path.name}` : ''}
        {subtype ? ` (${subtype.name})` : ''}
        {' · '}Renown {player.renown} · {rank.name}
      </div>

      {canSeeResources && character?.play && (
        <div style={{ marginTop: 10 }}>
          <UniversalResources
            play={character.play}
            onChange={handleResourceChange}
            readOnly={!isSelf}
          />
          {path && (
            <div style={{ marginTop: 8 }}>
              <PathResourcePanel
                path={path}
                renown={player.renown}
                play={character.play}
                onUpdateResource={handlePathResourceChange}
                readOnly={!isSelf}
              />
            </div>
          )}
          {isSelf && (
            <p className="helper-text" style={{ marginTop: 6, fontSize: 11 }}>
              Changes here save to this room live, but not to your local character file —
              use Play Mode's Save for that.
            </p>
          )}
          {isSelf && room && (
            <RollPanel
              code={code}
              uid={player.uid}
              displayName={player.displayName}
              character={character}
              room={room}
              activePrompt={activePrompt}
              onClearPrompt={onClearPrompt}
            />
          )}
        </div>
      )}
      {canSeeResources && writeError && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>
          Couldn't save that change ({writeError.code || writeError.message}). Check your connection and try again.
        </p>
      )}
      {canSeeResources && sheetError && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>
          Can't load resources ({sheetError.code || sheetError.message}). If you just deployed the
          updated Firestore rules, this player needs to leave and rejoin the room to create their
          private sheet under the new structure.
        </p>
      )}
      {canSeeResources && !sheetError && sheet === undefined && (
        <p className="helper-text" style={{ marginTop: 6 }}>Loading resources…</p>
      )}
      {canSeeResources && !sheetError && sheet === null && (
        <p className="helper-text" style={{ marginTop: 6 }}>
          No resource data on file for this player yet — ask them to leave and rejoin the room.
        </p>
      )}

      <NotebookSection code={code} uid={player.uid} notebook={player.notebook} isSelf={isSelf} />
    </div>
  );
}
