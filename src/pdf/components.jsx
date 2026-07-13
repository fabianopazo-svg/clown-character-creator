import { View, Text, Svg, Circle, Polygon, G } from '@react-pdf/renderer';
import { styles, colors } from './styles';

// 5-point star polygon, centered at (0,0), sized to match the ~7pt-diameter circles below.
const STAR_POINTS = '0,-4 0.94,-1.29 3.8,-1.24 1.52,0.49 2.35,3.24 0,1.6 -2.35,3.24 -1.52,0.49 -3.8,-1.24 -0.94,-1.29';

export function Dots({ filled = 0, total = 5, lockedCount = 0, starCount = 0 }) {
  const slotCount = Math.max(total, lockedCount + filled + starCount);
  const spacing = 10;
  const width = slotCount * spacing;

  return (
    <Svg width={width} height={10}>
      {Array.from({ length: slotCount }, (_, i) => {
        const n = i + 1;
        const cx = i * spacing + 5;

        if (n <= lockedCount) {
          // Base/free dot: always filled, slightly muted to distinguish from bought dots.
          return <Circle key={n} cx={cx} cy={5} r={3.5} fill="#999999" />;
        }
        if (n <= lockedCount + filled) {
          return <Circle key={n} cx={cx} cy={5} r={3.5} fill={colors.ink} />;
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
