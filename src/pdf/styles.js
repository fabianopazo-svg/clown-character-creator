import { StyleSheet } from '@react-pdf/renderer';

// Base palette as given, plus WCAG-AA-safe darkened "text" variants (>=4.6:1 against white)
// and light background tints, computed from the base hues.
export const palette = {
  red:    { base: '#D21608', text: '#D21608', tint: '#FAE3E1' },
  orange: { base: '#FF8427', text: '#B25C1B', tint: '#FFF0E5' },
  gold:   { base: '#FFC800', text: '#8F7000', tint: '#FFF8E0' },
  green:  { base: '#4D8B31', text: '#48832E', tint: '#EAF1E6' },
  purple: { base: '#591AD7', text: '#591AD7', tint: '#EBE4FA' },
};

export const colors = {
  ink: '#1a1a1a',
  muted: '#6b6b66',
  hint: '#9a9a94',
  border: '#dddddd',
  borderStrong: '#bbbbbb',
  surface: '#ffffff',
  surface1: '#f7f6f2',

  // Section color-coding, so categories are visually distinct rather than uniform gray/blue:
  attributes: palette.red,     // higher-order category — boldest, most saturated
  skills: palette.orange,      // subordinate to Attributes — same warm family, one step down
  resources: palette.gold,     // frequently touched during play
  troupe: palette.green,
  path: palette.purple,
  specialties: palette.red,
  insecurities: palette.purple,
  personality: { base: '#9a9a94', text: '#6b6b66', tint: '#f2f1ee' }, // deliberately demoted/muted
};

export const fonts = {
  display: 'Alfa Slab One',
  stageName: 'Fredericka the Great',
  body: 'PT Sans',
};

export const styles = StyleSheet.create({
  page: {
    padding: 26,
    fontSize: 8.5,
    fontFamily: fonts.body,
    color: colors.ink,
  },

  // Section headers now use the display face + a per-section accent color, passed in per use.
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 11,
    letterSpacing: 0.3,
    marginTop: 12,
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1.5,
  },
  subSectionTitle: {
    fontFamily: fonts.display,
    fontSize: 8.5,
    letterSpacing: 0.2,
    marginBottom: 3,
  },

  fieldLabel: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  helperText: {
    fontSize: 7.5,
    color: colors.muted,
    lineHeight: 1.3,
  },

  twoCol: { flexDirection: 'row', gap: 10 },
  threeCol: { flexDirection: 'row', gap: 8 },

  fieldBox: {
    borderWidth: 0.75,
    borderColor: colors.border,
    borderRadius: 4,
    padding: 5,
    fontSize: 8,
  },

  checkbox: {
    width: 8,
    height: 8,
    borderWidth: 1,
    borderColor: colors.muted,
    borderRadius: 1.5,
    marginRight: 5,
  },
  checkboxChecked: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },

  table: { width: '100%' },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    paddingBottom: 2,
    marginBottom: 3,
  },
  tableHeaderCell: {
    fontSize: 7,
    color: colors.muted,
    textTransform: 'uppercase',
    fontFamily: fonts.body,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingVertical: 2.5,
  },
  tableCell: { fontSize: 7.8 },

  footerNote: {
    position: 'absolute',
    bottom: 14,
    left: 26,
    right: 26,
    fontSize: 6.5,
    color: colors.hint,
    textAlign: 'center',
  },
});

// Helper: a full accent block (colored background tint, colored left rule, colored title text)
// built from one of the palette/section entries above — used to color-code sections consistently.
export function accentBlockStyle(section, extra = {}) {
  return {
    backgroundColor: section.tint,
    borderLeftWidth: 2.5,
    borderLeftColor: section.text,
    borderRadius: 3,
    padding: 6,
    ...extra,
  };
}

export function accentTitleStyle(section, extra = {}) {
  return {
    ...styles.sectionTitle,
    color: section.text,
    borderBottomColor: section.text,
    ...extra,
  };
}
