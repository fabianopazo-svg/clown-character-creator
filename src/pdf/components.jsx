import { View, Text, Svg, Circle, Rect, Polygon, G } from '@react-pdf/renderer';
import { styles, colors, palette, fonts } from './styles';

const STAR_POINTS = '0,-4 0.94,-1.29 3.8,-1.24 1.52,0.49 2.35,3.24 0,1.6 -2.35,3.24 -1.52,0.49 -3.8,-1.24 -0.94,-1.29';

const PALETTE_TEXT_COLORS = Object.values(palette).map(p => p.text);

// Each letter of the Stage Name gets a randomly chosen, contrast-safe darkened color from the
// campaign palette — a bit of marquee flourish without sacrificing legibility. Spaces render
// as plain gaps rather than colored glyphs.
export function StageName({ name, fontSize = 34 }) {
  const chars = (name || '').split('');
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {chars.map((ch, i) => {
        if (ch === ' ') {
          return <Text key={i} style={{ fontFamily: fonts.stageName, fontSize, width: fontSize * 0.28 }}> </Text>;
        }
        const color = PALETTE_TEXT_COLORS[Math.floor(Math.random() * PALETTE_TEXT_COLORS.length)];
        return (
          <Text key={i} style={{ fontFamily: fonts.stageName, fontSize, color }}>
            {ch}
          </Text>
        );
      })}
    </View>
  );
}

export function Dots({ filled = 0, total = 5, lockedCount = 0, starCount = 0, bonusAt = null, penaltyAt = null, color = colors.ink }) {
  const slotCount = Math.max(total, lockedCount + filled + starCount, penaltyAt || 0);
  const spacing = 10;
  const width = slotCount * spacing;

  return (
    <Svg width={width} height={10}>
      {Array.from({ length: slotCount }, (_, i) => {
        const n = i + 1;
        const cx = i * spacing + 5;

        if (n === penaltyAt) {
          return <Circle key={n} cx={cx} cy={5} r={3.5} fill="white" stroke="#c0392b" strokeWidth={1.4} />;
        }
        if (n <= lockedCount) {
          return <Circle key={n} cx={cx} cy={5} r={3.5} fill="#999999" />;
        }
        if (n <= lockedCount + filled) {
          const fill = n === bonusAt ? '#2e7d32' : color;
          return <Circle key={n} cx={cx} cy={5} r={3.5} fill={fill} />;
        }
        if (n <= lockedCount + filled + starCount) {
          return (
            <G key={n} transform={`translate(${cx}, 5)`}>
              <Polygon points={STAR_POINTS} fill={colors.ink} />
            </G>
          );
        }
        return <Circle key={n} cx={cx} cy={5} r={3.5} fill="white" stroke={colors.borderStrong} strokeWidth={1} />;
      })}
    </Svg>
  );
}

export function Boxes({ filled = 0, total = 10, color = colors.ink }) {
  const spacing = 11;
  return (
    <Svg width={total * spacing} height={10}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const x = i * spacing;
        return n <= filled
          ? <Rect key={n} x={x} y={0.5} width={9} height={9} rx={1.5} fill={color} />
          : <Rect key={n} x={x} y={0.5} width={9} height={9} rx={1.5} fill="white" stroke={colors.borderStrong} strokeWidth={1} />;
      })}
    </Svg>
  );
}

export function Checkbox({ checked, label, size = 8 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
      <View style={[styles.checkbox, checked ? styles.checkboxChecked : null, { width: size, height: size }]} />
      <Text style={{ fontSize: 8 }}>{label}</Text>
    </View>
  );
}

export function FieldBox({ label, value, minHeight }) {
  return (
    <View style={{ marginBottom: 7 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, minHeight ? { minHeight } : null]}>
        <Text>{value || ' '}</Text>
      </View>
    </View>
  );
}

export function PurseCells({ value, cellCount = 6, cellSize = 13 }) {
  const digits = String(value ?? '').slice(0, cellCount).padStart(cellCount, ' ').split('');
  return (
    <View style={{ flexDirection: 'row' }}>
      {digits.map((d, i) => (
        <View
          key={i}
          style={{
            width: cellSize,
            height: cellSize,
            borderWidth: 1,
            borderColor: colors.ink,
            marginLeft: i === 0 ? 0 : -1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 8.5, fontFamily: fonts.display }}>{d.trim()}</Text>
        </View>
      ))}
    </View>
  );
}

export function ColBox({ label, value, section }) {
  return (
    <View style={{
      flex: 1, backgroundColor: section ? section.tint : colors.surface1, borderRadius: 4, padding: 6,
      borderLeftWidth: section ? 2.5 : 0, borderLeftColor: section ? section.text : 'transparent',
    }}>
      <Text style={[styles.fieldLabel, section ? { color: section.text } : null]}>{label}</Text>
      <Text style={{ fontSize: 10, fontFamily: fonts.display, marginTop: 1 }}>{value}</Text>
    </View>
  );
}
