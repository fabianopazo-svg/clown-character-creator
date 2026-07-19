import GithubSlugger from 'github-slugger';

// Walks the raw markdown for H1-H3 headings and slugs them with the exact
// same library rehype-slug uses internally, so a click here reliably lands
// on the matching heading id in the rendered output — a mismatch here would
// make the whole table of contents silently non-functional.
export function extractToc(markdown) {
  const slugger = new GithubSlugger();
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const slug = slugger.slug(text);
    toc.push({ level, text, slug });
  }
  return toc;
}
