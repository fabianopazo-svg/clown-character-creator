import { useState } from 'react';
import TroupesEditor from './pages/TroupesEditor';
import PathsEditor from './pages/PathsEditor';
import GearEditor from './pages/GearEditor';
import CoreEditor from './pages/CoreEditor';
import GitPanel from './components/GitPanel';

const TABS = [
  { id: 'paths', label: 'Paths & Gifts', Component: PathsEditor },
  { id: 'troupes', label: 'Troupes', Component: TroupesEditor },
  { id: 'gear', label: 'Gear', Component: GearEditor },
  { id: 'core', label: 'Core rules (raw)', Component: CoreEditor },
];

export default function App() {
  const [tab, setTab] = useState('paths');
  const { Component } = TABS.find(t => t.id === tab);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 80px' }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>CLOWN content editor</h1>
      <p className="helper-text">Local-only tool. Edits write directly to src/data/*.json in this repo.</p>

      <nav className="sheet-nav" style={{ margin: '16px 0 24px', padding: 0 }}>
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <Component />
      <GitPanel />
    </div>
  );
}
