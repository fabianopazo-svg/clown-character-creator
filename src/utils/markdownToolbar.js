// Wraps the current selection in before/after markers (bold, italic, etc).
// If nothing is selected, the markers are inserted at the cursor with the
// cursor left between them, ready to type.
export function wrapSelection(textarea, before, after = before) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  textarea.setRangeText(`${before}${selected}${after}`, selectionStart, selectionEnd, 'end');
  if (selected) {
    // Re-highlight just the original text, now inside its new wrapper.
    textarea.selectionStart = selectionStart + before.length;
    textarea.selectionEnd = selectionStart + before.length + selected.length;
  } else {
    // Nothing was selected — park the cursor between the markers.
    const pos = selectionStart + before.length;
    textarea.selectionStart = pos;
    textarea.selectionEnd = pos;
  }
  textarea.focus();
  return textarea.value;
}

// Prefixes every line touched by the current selection (heading markers,
// bullet/numbered lists, blockquotes) — a multi-line selection gets the
// prefix applied to each of its lines, not just the first.
export function prefixLines(textarea, prefix) {
  const { selectionStart, selectionEnd, value } = textarea;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  let lineEnd = value.indexOf('\n', selectionEnd);
  if (lineEnd === -1) lineEnd = value.length;

  const block = value.slice(lineStart, lineEnd);
  const newBlock = block.split('\n').map((line) => prefix + line).join('\n');
  textarea.setRangeText(newBlock, lineStart, lineEnd, 'end');
  textarea.focus();
  return textarea.value;
}

// Plain insertion at the cursor (tables, horizontal rules) — replaces any
// current selection rather than wrapping it, since these don't make sense
// wrapped around arbitrary selected text.
export function insertAtCursor(textarea, text) {
  const { selectionStart, selectionEnd } = textarea;
  textarea.setRangeText(text, selectionStart, selectionEnd, 'end');
  textarea.focus();
  return textarea.value;
}

export const TABLE_TEMPLATE =
  '\n| Column 1 | Column 2 |\n|---|---|\n| Cell | Cell |\n';

export const HR_TEMPLATE = '\n\n---\n\n';
