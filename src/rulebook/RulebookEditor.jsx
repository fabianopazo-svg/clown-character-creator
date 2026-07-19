import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { fetchRulebookMarkdown, saveRulebookMarkdown } from '../utils/rulebookApi';
import { wrapSelection, prefixLines, insertAtCursor, TABLE_TEMPLATE, HR_TEMPLATE } from '../utils/markdownToolbar';
import MarkdownRenderer from './MarkdownRenderer';

const TOOLBAR_ACTIONS = [
  { label: 'H1', title: 'Heading 1', action: (ta) => prefixLines(ta, '# ') },
  { label: 'H2', title: 'Heading 2', action: (ta) => prefixLines(ta, '## ') },
  { label: 'H3', title: 'Heading 3', action: (ta) => prefixLines(ta, '### ') },
  { label: 'B', title: 'Bold', action: (ta) => wrapSelection(ta, '**') },
  { label: 'I', title: 'Italic', action: (ta) => wrapSelection(ta, '*') },
  { label: '• List', title: 'Bullet list', action: (ta) => prefixLines(ta, '- ') },
  { label: '1. List', title: 'Numbered list', action: (ta) => prefixLines(ta, '1. ') },
  { label: 'Quote', title: 'Blockquote', action: (ta) => prefixLines(ta, '> ') },
  { label: 'Link', title: 'Link', action: (ta) => wrapSelection(ta, '[', '](url)') },
  { label: 'Table', title: 'Insert table', action: (ta) => insertAtCursor(ta, TABLE_TEMPLATE) },
  { label: 'Rule', title: 'Horizontal rule', action: (ta) => insertAtCursor(ta, HR_TEMPLATE) },
];

export default function RulebookEditor({ onSaved }) {
  const { isOwner } = useAuth();
  const textareaRef = useRef(null);
  const [original, setOriginal] = useState(null);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState('edit');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  useEffect(() => {
    if (!isOwner) return;
    setLoading(true);
    fetchRulebookMarkdown()
      .then((text) => {
        setOriginal(text);
        setDraft(text);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOwner]);

  if (!isOwner) return null;
  if (loading) return <p className="helper-text">Loading editor…</p>;

  const dirty = draft !== original;

  const applyAction = (action) => {
    const ta = textareaRef.current;
    if (!ta) return;
    setDraft(action(ta));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveMessage(null);
    try {
      const idToken = await auth.currentUser.getIdToken();
      await saveRulebookMarkdown(draft, idToken);
      setOriginal(draft);
      setSaveMessage("Saved and pushed to GitHub — the public viewer may take a minute to catch up, since GitHub's raw content CDN caches for a bit.");
      onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!confirm('Discard your changes and reload from GitHub?')) return;
    setDraft(original);
    setSaveMessage(null);
    setError(null);
  };

  return (
    <div className="gift-card" style={{ marginTop: 16, cursor: 'default' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>✏️ Edit Rulebook</div>
        <div className="pill-group">
          <label className={`pill${mode === 'edit' ? ' selected' : ''}`}>
            <input type="radio" checked={mode === 'edit'} onChange={() => setMode('edit')} style={{ marginRight: 4 }} />
            Edit
          </label>
          <label className={`pill${mode === 'preview' ? ' selected' : ''}`}>
            <input type="radio" checked={mode === 'preview'} onChange={() => setMode('preview')} style={{ marginRight: 4 }} />
            Preview
          </label>
        </div>
      </div>

      {mode === 'edit' && (
        <>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
            {TOOLBAR_ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                className="small-btn"
                title={a.title}
                onClick={() => applyAction(a.action)}
              >
                {a.label}
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={24}
            style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: 13, resize: 'vertical' }}
          />
        </>
      )}

      {mode === 'preview' && (
        <div style={{ border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, maxHeight: 600, overflowY: 'auto' }}>
          <MarkdownRenderer markdown={draft} />
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save to GitHub'}
        </button>
        <button type="button" className="small-btn" onClick={handleDiscard} disabled={!dirty || saving}>
          Discard changes
        </button>
        {dirty && !saving && <span className="helper-text" style={{ margin: 0 }}>Unsaved changes</span>}
      </div>

      {saveMessage && <p className="helper-text" style={{ marginTop: 6, color: '#2f7a3d' }}>{saveMessage}</p>}
      {error && <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>{error}</p>}
    </div>
  );
}
