import GithubSlugger from 'github-slugger';

// Splits rulebook markdown into sections by H1/H2 headings — same level
// cutoff as the TOC, and the same slug algorithm, so a search result can
// jump to the exact right heading anchor via the same scrollToSlug used
// for TOC clicks.
export function splitIntoSections(markdown) {
  const slugger = new GithubSlugger();
  const lines = markdown.split('\n');
  const sections = [];
  let current = null;

  for (const line of lines) {
    const headingMatch = /^(#{1,2})\s+(.+)$/.exec(line);
    if (headingMatch) {
      if (current) sections.push(current);
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      current = { level, heading: text, slug: slugger.slug(text), body: '' };
    } else if (current) {
      current.body += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections;
}

// Rough markdown-to-plain-text for search matching and snippet display —
// doesn't need to be a full parser, just needs to not show raw table
// pipes/asterisks/etc in a search result snippet.
function stripMarkdown(text) {
  return text
    .replace(/\|/g, ' ')
    .replace(/[*_`#>]/g, '')
    .replace(/^-+\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Plain case-insensitive substring search — deliberately not fuzzy. People
// looking things up in a rulebook usually know the term they want
// ("Suspicion", "Encore", "Flop"), so exact substring matching is more
// predictable than fuzzy scoring here, and much simpler to reason about.
export function searchRulebook(sections, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results = [];
  for (const section of sections) {
    const plainBody = stripMarkdown(section.body);
    const headingMatch = section.heading.toLowerCase().includes(q);
    const bodyIndex = plainBody.toLowerCase().indexOf(q);
    if (!headingMatch && bodyIndex === -1) continue;

    let snippet = null;
    if (bodyIndex >= 0) {
      const start = Math.max(0, bodyIndex - 60);
      const end = Math.min(plainBody.length, bodyIndex + q.length + 60);
      snippet = (start > 0 ? '…' : '') + plainBody.slice(start, end) + (end < plainBody.length ? '…' : '');
    }

    results.push({ heading: section.heading, slug: section.slug, snippet, headingMatch });
  }

  return results;
}
