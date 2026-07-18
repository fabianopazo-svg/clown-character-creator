import { useState } from 'react';
import { updateNotebook } from '../utils/roomsApi';
import { segmentText, isWordStruck, toggleStruckRange } from '../utils/notebookText';

function renderSegments(text, struckRanges, onToggleWord) {
  return segmentText(text).map((seg, i) => {
    if (seg.type === 'gap') return seg.text;
    const struck = isWordStruck(struckRanges, seg.start, seg.end);
    return (
      <span
        key={i}
        onClick={onToggleWord ? () => onToggleWord(seg.start, seg.end) : undefined}
        title={onToggleWord ? (struck ? 'Click to unstrike' : 'Click to strike') : undefined}
        style={{
          textDecoration: struck ? 'line-through' : 'none',
          opacity: struck ? 0.5 : 1,
          cursor: onToggleWord ? 'pointer' : 'default',
        }}
      >
        {seg.text}
      </span>
    );
  });
}

// A fresh instance per page (via `key={pageIndex}` at the call site) so
// switching pages resets the draft text naturally, without a manual sync
// effect that could interrupt active typing on a live self-write echo.
function EditablePage({ initialText, onSave, saving }) {
  const [text, setText] = useState(initialText);
  const dirty = text !== initialText;

  return (
    <div>
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: '100%', fontFamily: 'inherit', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
        placeholder="What happened this session..."
      />
      <button
        type="button"
        className="small-btn"
        style={{ marginTop: 4 }}
        onClick={() => onSave(text)}
        disabled={!dirty || saving}
      >
        {saving ? 'Saving…' : 'Save page'}
      </button>
    </div>
  );
}

// notebook: array of { sessionNumber, date, entries, struckRanges }.
// Read by anyone in the room; only isSelf can write. The last page is
// always the freely-editable "current" one; every earlier page is
// read-only text that the owner can still click-toggle words on to
// strike them out — nobody else can edit or strike anything, ever,
// including their own view of somebody else's notebook.
export default function NotebookSection({ code, uid, notebook, isSelf }) {
  const pages = notebook || [];
  const [pageIndex, setPageIndex] = useState(Math.max(0, pages.length - 1));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const clampedIndex = Math.min(pageIndex, Math.max(0, pages.length - 1));
  const currentPage = pages[clampedIndex];
  const isLastPage = clampedIndex === pages.length - 1;
  const isEditable = isSelf && isLastPage;

  const write = (newNotebook) => {
    setError(null);
    return updateNotebook(code, uid, newNotebook).catch((err) => {
      setError(err);
      throw err;
    });
  };

  const handleAddPage = () => {
    const newPage = {
      sessionNumber: pages.length + 1,
      date: new Date().toISOString().slice(0, 10),
      entries: '',
      struckRanges: [],
    };
    const newNotebook = [...pages, newPage];
    write(newNotebook).then(() => setPageIndex(newNotebook.length - 1)).catch(() => {});
  };

  const handleToggleWord = (start, end) => {
    const newNotebook = pages.map((p, i) =>
      i === clampedIndex ? { ...p, struckRanges: toggleStruckRange(p.struckRanges, start, end) } : p
    );
    write(newNotebook).catch(() => {});
  };

  if (pages.length === 0) {
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 13, marginBottom: 4 }}>Notebook</div>
        <p className="helper-text" style={{ margin: 0 }}>No entries yet.</p>
        {isSelf && (
          <button type="button" className="small-btn" style={{ marginTop: 4 }} onClick={handleAddPage}>
            + Start notebook
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, marginBottom: 4 }}>Notebook</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <button
          type="button"
          className="small-btn"
          onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          disabled={clampedIndex <= 0}
        >
          &larr;
        </button>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          Page {clampedIndex + 1} of {pages.length} — Session {currentPage.sessionNumber} · {currentPage.date}
          {isLastPage ? ' (current)' : ' (past — read-only, can be struck)'}
        </span>
        <button
          type="button"
          className="small-btn"
          onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
          disabled={clampedIndex >= pages.length - 1}
        >
          &rarr;
        </button>
      </div>

      {isEditable ? (
        <EditablePage
          key={clampedIndex}
          initialText={currentPage.entries}
          saving={saving}
          onSave={(text) => {
            setSaving(true);
            const newNotebook = pages.map((p, i) => (i === clampedIndex ? { ...p, entries: text } : p));
            write(newNotebook).finally(() => setSaving(false));
          }}
        />
      ) : (
        <div
          style={{
            whiteSpace: 'pre-wrap',
            fontSize: 13,
            lineHeight: 1.5,
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '8px 10px',
            minHeight: 40,
          }}
        >
          {currentPage.entries
            ? renderSegments(currentPage.entries, currentPage.struckRanges, isSelf ? handleToggleWord : undefined)
            : <span style={{ color: 'var(--hint)' }}>(empty page)</span>}
        </div>
      )}

      {isSelf && isLastPage && (
        <button type="button" className="small-btn" style={{ marginTop: 6 }} onClick={handleAddPage}>
          + New page (start next session)
        </button>
      )}

      {error && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>
          Couldn't save that change ({error.code || error.message}).
        </p>
      )}
    </div>
  );
}
