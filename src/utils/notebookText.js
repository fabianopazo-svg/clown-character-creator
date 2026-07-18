// Splits notebook page text into an ordered sequence of segments: 'gap'
// segments (whitespace/newlines, rendered verbatim) and 'word' segments
// (non-whitespace tokens, each individually clickable to strike). Word
// segments carry their [start, end) character offsets into the original
// string — that's the addressable unit stored in a page's struckRanges,
// so struck words survive re-renders and are the same shape regardless
// of how the text around them changes on other pages.
export function segmentText(text) {
  const segments = [];
  const regex = /\S+/g;
  let match;
  let lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      segments.push({ type: 'gap', text: text.slice(lastIndex, start) });
    }
    segments.push({ type: 'word', text: match[0], start, end });
    lastIndex = end;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'gap', text: text.slice(lastIndex) });
  }
  return segments;
}

export function isWordStruck(struckRanges, start, end) {
  return (struckRanges || []).some(r => r.start === start && r.end === end);
}

// Toggles one word's range in a page's struckRanges list — adds it if not
// present, removes it if already struck. Returns a new array; never
// mutates the one passed in.
export function toggleStruckRange(struckRanges, start, end) {
  const existing = struckRanges || [];
  const alreadyStruck = existing.some(r => r.start === start && r.end === end);
  if (alreadyStruck) {
    return existing.filter(r => !(r.start === start && r.end === end));
  }
  return [...existing, { start, end }];
}
