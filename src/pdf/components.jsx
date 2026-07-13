import { View, Text, Svg, Circle, Rect, Polygon, G } from '@react-pdf/renderer';
import { styles, colors } from './styles';

// 5-point star polygon, centered at (0,0), sized to match the ~7pt-diameter circles below.
const STAR_POINTS = '0,-4 0.94,-1.29 3.8,-1.24 1.52,0.49 2.35,3.24 0,1.6 -2.35,3.24 -1.52,0.49 -3.8,-1.24 -0.94,-1.29';

// bonusAt / penaltyAt are 1-based dot positions used only for the Attributes row affected by
// the character's Age Band: bonusAt highlights the dot gained (green), penaltyAt outlines in red
// the dot slot that age took away.
export function Dots({ filled = 0, total = 5, lockedCount = 0, starCount = 0, bonusAt = null, penaltyAt = null }) {
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
          const fill = n === bonusAt ? '#2e7d32' : colors.ink;
          return <Circle key={n} cx={cx} cy={5} r={3.5} fill={fill} />;
        }
        if (n <= lockedCount + filled + starCount) {
          return (
            <G key={n} transform={`translate(${cx}, 5)`}>
              <Polygon points={STAR_POINTS} fill={colors.accentText} />
            </G>
          );
        }
        return (
          <Circle key={n} cx={cx} cy={5} r={3.5} fill="white" stroke={colors.borderStrong} strokeWidth={1} />
        );
      })}
    </Svg>
  );
}

// Square checkbox-style track, used for resources that are already computed at creation
// (Laughter, Face, Health) so the sheet shows them pre-filled rather than as a bare number.
export function Boxes({ filled = 0, total = 10 }) {
  const spacing = 11;
  const width = total * spacing;
  return (
    <Svg width={width} height={10}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const x = i * spacing;
        return n <= filled
          ? <Rect key={n} x={x} y={0.5} width={9} height={9} rx={1.5} fill={colors.ink} />
          : <Rect key={n} x={x} y={0.5} width={9} height={9} rx={1.5} fill="white" stroke={colors.borderStrong} strokeWidth={1} />;
      })}
    </Svg>
  );
}

export function Checkbox({ checked, label }) {
  return (
    <View style={styles.checkboxRow}>
      <View style={[styles.checkbox, checked ? styles.checkboxChecked : null]} />
      <Text style={{ fontSize: 8.5 }}>{label}</Text>
    </View>
  );
}

export function FieldBox({ label, value, minHeight }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.fieldBox, minHeight ? { minHeight } : null]}>
        <Text>{value || ' '}</Text>
      </View>
    </View>
  );
}

export function StatRow({ label, dotsFilled, dotsTotal, lockedCount, starsFrom, plainValue }) {
  return (
    <View style={plainValue !== undefined ? styles.statItemHalf : styles.statItem}>
      <Text>{label}</Text>
      {plainValue !== undefined ? (
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>{plainValue}</Text>
      ) : (
        <Dots filled={dotsFilled} total={dotsTotal} lockedCount={lockedCount} starsFrom={starsFrom} />
      )}
    </View>
  );
}

export function ColBox({ label, value }) {
  return (
    <View style={styles.colBox}>
      <Text style={styles.colBoxLabel}>{label}</Text>
      <Text style={styles.colBoxValue}>{value}</Text>
    </View>
  );
}
