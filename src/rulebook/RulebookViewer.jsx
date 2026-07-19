import { useEffect, useMemo, useState } from 'react';
import { fetchRulebookMarkdown } from '../utils/rulebookApi';
import { extractToc } from '../utils/rulebookToc';
import { splitIntoSections, searchRulebook } from '../utils/rulebookSearch';
import MarkdownRenderer from './MarkdownRenderer';

export default function RulebookViewer({ refreshKey, onMarkdownLoaded, compact = false }) {
  const [markdown, setMarkdown] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchRulebookMarkdown()
      .then((text) => {
        setMarkdown(text);
        onMarkdownLoaded?.(text);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const toc = useMemo(() => (markdown ? extractToc(markdown).filter((h) => h.level <= 2) : []), [markdown]);
  const sections = useMemo(() => (markdown ? splitIntoSections(markdown) : []), [markdown]);
  const searchResults = useMemo(() => searchRulebook(sections, query), [sections, query]);

  const scrollToSlug = (slug) => {
    const el = document.getElementById(slug);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return <p className="helper-text">Loading rulebook…</p>;
  }

  if (error) {
    return (
      <p className="helper-text" style={{ color: '#c0392b' }}>
        Couldn't load the rulebook: {error}
      </p>
    );
  }

  return (
    <div style={compact ? {} : { display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div
        style={
          compact
            ? { marginBottom: 16 }
            : { width: 240, flexShrink: 0, position: 'sticky', top: 16, maxHeight: '85vh', overflowY: 'auto' }
        }
      >
        <input
          type="text"
          placeholder="🔍 Search the rulebook…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10 }}
        />

        {query.trim() ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
              {searchResults.length} result{searchResults.length === 1 ? '' : 's'}
            </div>
            {searchResults.length === 0 && (
              <p className="helper-text" style={{ margin: 0 }}>No matches.</p>
            )}
            {searchResults.map((r, i) => (
              <div
                key={i}
                className="rulebook-toc-item"
                onClick={() => scrollToSlug(r.slug)}
                style={{ marginBottom: 8 }}
              >
                <div style={{ fontWeight: 600 }}>{r.heading}</div>
                {r.snippet && (
                  <div style={{ color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>{r.snippet}</div>
                )}
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Contents</div>
            <div style={compact ? { maxHeight: 240, overflowY: 'auto', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 6 } : {}}>
              {toc.map((h, i) => (
                <div
                  key={i}
                  className="rulebook-toc-item"
                  onClick={() => scrollToSlug(h.slug)}
                  style={{ paddingLeft: h.level === 1 ? 0 : 10 }}
                >
                  {h.text}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <MarkdownRenderer markdown={markdown} />
    </div>
  );
}
