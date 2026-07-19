import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import OwnerSignIn from './OwnerSignIn';
import RulebookViewer from './RulebookViewer';
import RulebookEditor from './RulebookEditor';

export default function RulebookView() {
  const { isOwner } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="sheet-page" style={{ maxWidth: 1040 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div className="section-title" style={{ margin: 0 }}>📖 Rulebook</div>
        <button type="button" className="small-btn" onClick={() => setRefreshKey((k) => k + 1)}>
          🔄 Refresh
        </button>
      </div>

      <OwnerSignIn />

      {isOwner && (
        <RulebookEditor onSaved={() => setRefreshKey((k) => k + 1)} />
      )}

      <div style={{ marginTop: 20 }}>
        <RulebookViewer refreshKey={refreshKey} />
      </div>
    </div>
  );
}
