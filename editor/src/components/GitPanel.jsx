import { useEffect, useState } from 'react';
import { fetchGitStatus, commitAndPush } from '../api';

export default function GitPanel() {
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState(null);
  const [open, setOpen] = useState(false);

  const refreshStatus = async () => {
    const result = await fetchGitStatus();
    setStatus(result);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handlePush = async () => {
    if (!message.trim()) {
      alert('Write a short commit message first.');
      return;
    }
    setBusy(true);
    setLog(null);
    try {
      const result = await commitAndPush(message.trim());
      setLog(result);
      if (result.push?.ok) {
        setMessage('');
      }
    } finally {
      setBusy(false);
      refreshStatus();
    }
  };

  const changedCount = status?.files?.length ?? 0;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--surface)', borderTop: '1px solid var(--border-strong)',
      padding: '10px 20px', zIndex: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <button className="small-btn" onClick={() => setOpen(o => !o)}>
          {open ? 'Hide' : 'Show'} Git panel {changedCount > 0 && `(${changedCount} changed)`}
        </button>
        <button className="small-btn" onClick={refreshStatus}>Refresh status</button>
      </div>

      {open && (
        <div style={{ marginTop: 10 }}>
          {status?.files?.length > 0 ? (
            <ul style={{ fontSize: 12, margin: '4px 0 10px', paddingLeft: 18 }}>
              {status.files.map(f => (
                <li key={f.path}><code>{f.code}</code> {f.path}</li>
              ))}
            </ul>
          ) : (
            <p className="helper-text">No uncommitted changes.</p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Commit message, e.g. 'Add Illusionist Grade 2 Gift'"
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={handlePush} disabled={busy}>
              {busy ? 'Working...' : 'Commit & Push'}
            </button>
          </div>

          {log && (
            <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 160, overflowY: 'auto', background: 'var(--surface-1)', padding: 8, borderRadius: 6 }}>
              {log.commit && (
                <div>
                  <strong>commit:</strong> {log.commit.ok ? 'ok' : 'FAILED'}{'\n'}
                  {log.commit.stdout}{'\n'}{log.commit.stderr}
                </div>
              )}
              {log.push && (
                <div style={{ marginTop: 6 }}>
                  <strong>push:</strong> {log.push.ok ? 'ok' : 'FAILED'}{'\n'}
                  {log.push.stdout}{'\n'}{log.push.stderr}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
