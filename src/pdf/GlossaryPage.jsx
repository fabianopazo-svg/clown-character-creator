import { Page, View, Text } from '@react-pdf/renderer';
import { styles, colors, fonts } from './styles';
import core from '../data/core.json';

const g = core.glossary;

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 5 }} wrap={false}>
      <Text style={{ fontFamily: fonts.display, fontSize: 7.5, color: colors.ink, borderBottomWidth: 1, borderBottomColor: colors.borderStrong, paddingBottom: 1.5, marginBottom: 2 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const bodyStyle = { fontSize: 6.6, lineHeight: 1.2 };
const labelStyle = { fontFamily: fonts.body, fontWeight: 'bold', fontSize: 6.6 };

export default function GlossaryPage() {
  return (
    <Page size="LETTER" style={[styles.page, { fontSize: 6.6, padding: 22 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 12 }}>Reference</Text>
        <Text style={{ fontSize: 6, color: colors.muted }}>Core mechanics — identical on every character's sheet.</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Section title="Play Structure">
            {g.playStructure.map((p, i) => (
              <Text key={i} style={{ ...bodyStyle, marginBottom: 2 }}>
                <Text style={labelStyle}>{p.name}: </Text>{p.text}
              </Text>
            ))}
          </Section>

          <Section title={g.roll.title}>
            <Text style={bodyStyle}>{g.roll.text}</Text>
          </Section>

          <Section title={g.pushingRolls.title}>
            <Text style={{ ...bodyStyle, marginBottom: 2 }}>
              <Text style={labelStyle}>{g.pushingRolls.creativeGambit.name}: </Text>{g.pushingRolls.creativeGambit.text}
            </Text>
            <Text style={bodyStyle}>
              <Text style={labelStyle}>{g.pushingRolls.encore.name}: </Text>{g.pushingRolls.encore.text}
            </Text>
          </Section>
        </View>

        <View style={{ flex: 1 }}>
          <Section title={g.houseDie.title}>
            <Text style={bodyStyle}>{g.houseDie.text}</Text>
          </Section>

          <Section title={g.resultMatrix.title}>
            <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.borderStrong, paddingBottom: 1, marginBottom: 2 }}>
              <Text style={{ flex: 1, fontSize: 6, color: colors.muted }}></Text>
              <Text style={{ flex: 2.2, fontSize: 6, color: colors.muted }}>Cheers</Text>
              <Text style={{ flex: 2.2, fontSize: 6, color: colors.muted }}>Jeers</Text>
            </View>
            {g.resultMatrix.rows.map((row, i) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                <Text style={{ flex: 1, ...labelStyle, fontSize: 6.4 }}>{row.poolResult}</Text>
                <Text style={{ flex: 2.2, fontSize: 6.2, lineHeight: 1.15 }}>{row.cheers}</Text>
                <Text style={{ flex: 2.2, fontSize: 6.2, lineHeight: 1.15 }}>{row.jeers}</Text>
              </View>
            ))}
          </Section>

          <Section title="Resources">
            {g.resourceGlossary.map((r, i) => (
              <Text key={i} style={{ ...bodyStyle, marginBottom: 2 }}>
                <Text style={labelStyle}>{r.name}: </Text>{r.text}
              </Text>
            ))}
          </Section>
        </View>
      </View>

      <Text style={styles.footerNote}>CLOWN: Lights in the Backstage — reference sheet</Text>
    </Page>
  );
}
