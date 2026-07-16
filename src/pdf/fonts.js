import { Font } from '@react-pdf/renderer';

let registered = false;

export function registerFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: 'Alfa Slab One',
    src: new URL('./fonts/AlfaSlabOne-Regular.ttf', import.meta.url).href,
  });

  Font.register({
    family: 'PT Sans',
    fonts: [
      { src: new URL('./fonts/PTSans-Regular.ttf', import.meta.url).href, fontWeight: 'normal' },
      { src: new URL('./fonts/PTSans-Bold.ttf', import.meta.url).href, fontWeight: 'bold' },
      { src: new URL('./fonts/PTSans-Italic.ttf', import.meta.url).href, fontWeight: 'normal', fontStyle: 'italic' },
    ],
  });

  Font.register({
    family: 'Fredericka the Great',
    src: new URL('./fonts/FrederickaTheGreat-Regular.ttf', import.meta.url).href,
  });

  // PT Sans's built-in hyphenation via react-pdf's default word-splitter can break
  // mid-word oddly at small sizes; disabling hyphenation keeps body text cleaner.
  Font.registerHyphenationCallback(word => [word]);
}
