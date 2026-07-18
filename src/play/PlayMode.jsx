import { useEffect } from 'react';
import { useCharacter } from '../context/CharacterContext';
import { usePlayStore } from '../stores/playStore';
import { getRankForRenown } from '../utils/calculations';
import { saveCharacter } from '../utils/storage';
import Glossary from '../components/Glossary';
import troupes from '../data/troupes.json';
import paths from '../data/paths.json';
import UniversalResources from './UniversalResources';
import PathResourcePanel from './PathResourcePanel';
import SessionChangesSummary from './SessionChangesSummary';

export default function PlayMode({ onBack }) {
  const { character, dispatch } = useCharacter();
  const play = usePlayStore(state => state.play);
  const initForCharacter = usePlayStore(state => state.initForCharacter);
  const setValue = usePlayStore(state => state.setValue);
  const setPathResourceValue = usePlayStore(state => state.setPathResourceValue);
  const resetPlayStore = usePlayStore(state => state.reset);

  useEffect(() => {
    initForCharacter(character);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]);

  // Leaving Play Mode entirely (not just switching characters within it)
  // clears the store, so a later mount never briefly shows stale numbers
  // from whichever character was played last before its own init runs.
  useEffect(() => () => resetPlayStore(), [resetPlayStore]);

  const troupe = troupes.find(t => t.id === character.troupeId);
  const path = paths.find(p => p.id === character.pathId);
  const subtype = path?.subtypes?.find(s => s.id === character.subtypeId);
  const rank = getRankForRenown(character.renown);

  const handleResourceChange = (field, value) => setValue(field, value);

  const handlePathResourceChange = (key, value) => setPathResourceValue(key, value);

  const handleSave = () => {
    // The live numbers live in the Zustand store now, not on `character` —
    // merge them back in before persisting, so Save writes the current
    // in-session resources, not whatever character.play was when Play
    // Mode was first opened.
    const merged = { ...character, play };
    const saved = saveCharacter(merged);
    dispatch({ type: 'LOAD_CHARACTER', character: saved });
  };

  if (!play) {
    return <div className="sheet-page"><p className="helper-text">Loading...</p></div>;
  }

  return (
    <>
      <div style={{ maxWidth: 680, margin: '16px auto 0', padding: '0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="small-btn" onClick={onBack}>&larr; Your Clowns</button>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="accent-block" style={{ margin: 0 }}>Play Mode</span>
          <Glossary />
          <button className="small-btn" onClick={handleSave}>Save</button>
        </div>
      </div>

      <div className="sheet-page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid var(--ink)', paddingBottom: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 600 }}>{character.ringName || '(unnamed Clown)'}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>
              {troupe?.name} &middot; {path?.name}
              {subtype && <> ({subtype.name})</>} &middot; Renown {character.renown} &middot; {rank.name}
            </div>
          </div>
        </div>

        <SessionChangesSummary start={character.play} current={play} />

        <UniversalResources play={play} onChange={handleResourceChange} />

        <div className="section-title">Path Resource</div>
        <PathResourcePanel
          path={path}
          renown={character.renown}
          play={play}
          onUpdateResource={handlePathResourceChange}
        />
      </div>
    </>
  );
}
