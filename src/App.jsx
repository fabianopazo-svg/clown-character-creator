import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { CharacterProvider, useCharacter, initialCharacter } from './context/CharacterContext';
import { saveCharacter, exportCharacterFile } from './utils/storage';
import CharacterPdf from './pdf/CharacterPdf';
import CharacterList from './steps/CharacterList';
import Step01Concept from './steps/Step01Concept';
import Step02AgeBand from './steps/Step02AgeBand';
import Step03Attributes from './steps/Step03Attributes';
import Step04Skills from './steps/Step04Skills';
import Step05Traits from './steps/Step05Traits';
import Step06TroupePath from './steps/Step06TroupePath';
import Step07Gifts from './steps/Step07Gifts';
import Step08Clown from './steps/Step08Clown';
import Step09Resources from './steps/Step09Resources';
import Step10Gear from './steps/Step10Gear';
import Summary from './steps/Summary';
import PlayMode from './play/PlayMode';
import Glossary from './components/Glossary';
import { AuthProvider } from './context/AuthContext';
import RoomJoin from './multiplayer/RoomJoin';
import RoomLobby from './multiplayer/RoomLobby';
import MCCorner from './multiplayer/MCCorner';
import RulebookView from './rulebook/RulebookView';

const steps = [
  { id: 1, label: 'Concept', Component: Step01Concept },
  { id: 2, label: 'Age band', Component: Step02AgeBand },
  { id: 3, label: 'Attributes', Component: Step03Attributes },
  { id: 4, label: 'Skills', Component: Step04Skills },
  { id: 5, label: 'Traits', Component: Step05Traits },
  { id: 6, label: 'Troupe, Path & Renown', Component: Step06TroupePath },
  { id: 7, label: 'Gifts', Component: Step07Gifts },
  { id: 8, label: 'The Clown', Component: Step08Clown },
  { id: 9, label: 'Resources', Component: Step09Resources },
  { id: 10, label: 'Gear', Component: Step10Gear },
  { id: 11, label: 'Summary', Component: Summary },
];

function Wizard({ onBackToList }) {
  const [stepIndex, setStepIndex] = useState(0);
  const { character, dispatch } = useCharacter();
  const { Component } = steps[stepIndex];

  const handleSave = () => {
    const saved = saveCharacter(character);
    dispatch({ type: 'LOAD_CHARACTER', character: saved });
    alert('Saved to this browser.');
  };

  const handleExport = () => exportCharacterFile(character);

  const [pdfBusy, setPdfBusy] = useState(false);
  const handlePdfExport = async () => {
    setPdfBusy(true);
    try {
      const blob = await pdf(<CharacterPdf character={character} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = (character.ringName || character.humanName || 'clown-character')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      a.href = url;
      a.download = `${filename || 'clown-character'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <>
      <div style={{ maxWidth: 680, margin: '16px auto 0', padding: '0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="small-btn" onClick={onBackToList}>&larr; Your Clowns</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <Glossary />
          <button className="small-btn" onClick={handleSave}>Save</button>
          <button className="small-btn" onClick={handleExport}>Export JSON</button>
          <button className="small-btn" onClick={handlePdfExport} disabled={pdfBusy}>
            {pdfBusy ? 'Building PDF...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <nav className="sheet-nav">
        {steps.map((s, i) => (
          <button
            key={s.id}
            className={i === stepIndex ? 'active' : ''}
            onClick={() => setStepIndex(i)}
          >
            {s.id}. {s.label}
          </button>
        ))}
      </nav>

      <div className="sheet-page">
        <Component />
      </div>

      <div className="wizard-footer">
        <button
          className="btn"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex(i => Math.max(0, i - 1))}
        >
          Back
        </button>
        <button
          className="btn btn-primary"
          disabled={stepIndex === steps.length - 1}
          onClick={() => setStepIndex(i => Math.min(steps.length - 1, i + 1))}
        >
          Next
        </button>
      </div>
    </>
  );
}

function Root() {
  const [view, setView] = useState('list'); // 'list' | 'wizard' | 'play' | 'room-join' | 'room-lobby' | 'mc-corner' | 'rulebook'
  const [roomInfo, setRoomInfo] = useState(null); // { code, role }
  const { dispatch } = useCharacter();

  const openNew = () => {
    dispatch({ type: 'LOAD_CHARACTER', character: initialCharacter });
    setView('wizard');
  };

  const openExisting = (id, character) => {
    dispatch({ type: 'LOAD_CHARACTER', character: character || initialCharacter });
    setView('wizard');
  };

  const openPlay = (id, character) => {
    dispatch({ type: 'LOAD_CHARACTER', character: character || initialCharacter });
    setView('play');
  };

  const openMultiplayer = () => setView('room-join');
  const openMcCorner = () => setView('mc-corner');
  const openRulebook = () => setView('rulebook');

  const handleEnterRoom = ({ code, role }) => {
    setRoomInfo({ code, role });
    setView('room-lobby');
  };

  const handleLeaveRoom = () => {
    setRoomInfo(null);
    setView('list');
  };

  if (view === 'list') {
    return <CharacterList onNew={openNew} onOpen={openExisting} onMultiplayer={openMultiplayer} onMcCorner={openMcCorner} onRulebook={openRulebook} />;
  }
  if (view === 'play') {
    return <PlayMode onBack={() => setView('list')} />;
  }
  if (view === 'rulebook') {
    return (
      <>
        <div style={{ maxWidth: 680, margin: '16px auto 0', padding: '0 4px' }}>
          <button className="small-btn" onClick={() => setView('list')}>&larr; Your Clowns</button>
        </div>
        <RulebookView />
      </>
    );
  }
  if (view === 'mc-corner') {
    return (
      <>
        <div style={{ maxWidth: 680, margin: '16px auto 0', padding: '0 4px' }}>
          <button className="small-btn" onClick={() => setView('list')}>&larr; Your Clowns</button>
        </div>
        <MCCorner onEnterRoom={handleEnterRoom} />
      </>
    );
  }
  if (view === 'room-join') {
    return (
      <>
        <div style={{ maxWidth: 680, margin: '16px auto 0', padding: '0 4px' }}>
          <button className="small-btn" onClick={() => setView('list')}>&larr; Your Clowns</button>
        </div>
        <RoomJoin onEnterRoom={handleEnterRoom} />
      </>
    );
  }
  if (view === 'room-lobby') {
    return <RoomLobby code={roomInfo.code} role={roomInfo.role} onLeave={handleLeaveRoom} />;
  }
  return <Wizard onBackToList={() => setView('list')} />;
}

export default function App() {
  return (
    <AuthProvider>
      <CharacterProvider>
        <Root />
      </CharacterProvider>
    </AuthProvider>
  );
}
