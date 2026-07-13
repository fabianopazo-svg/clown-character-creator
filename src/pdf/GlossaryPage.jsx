import { Page, View, Text } from '@react-pdf/renderer';
import { styles, colors } from './styles';
import core from '../data/core.json';

const g = core.glossary;

export default function GlossaryPage() {
  return (
    <Page size="LETTER" style={styles.page}>
      <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>
        Reference & Glossary
      </Text>
      <Text style={{ fontSize: 8, color: colors.muted, marginBottom: 10 }}>
        Core mechanics, common to every Clown at the table. This page is identical across all character sheets.
      </Text>

      <Text style={styles.sectionTitle}>{g.roll.title}</Text>
      <Text style={{ fontSize: 8.5, lineHeight: 1.4 }}>{g.roll.text}</Text>

      <Text style={styles.sectionTitle}>{g.houseDie.title}</Text>
      <Text style={{ fontSize: 8.5, lineHeight: 1.4 }}>{g.houseDie.text}</Text>

      <Text style={styles.sectionTitle}>{g.resultMatrix.title}</Text>
      <Text style={{ fontSize: 8.5, lineHeight: 1.4, marginBottom: 6 }}>{g.resultMatrix.text}</Text>
      <View style={styles.table}>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { flex: 1.4 }]}> </Text>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Cheers</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Jeers</Text>
        </View>
        {g.resultMatrix.rows.map((row, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 1.4, fontFamily: 'Helvetica-Bold' }]}>{row.poolResult}</Text>
            <Text style={[styles.tableCell, { flex: 3, lineHeight: 1.3 }]}>{row.cheers}</Text>
            <Text style={[styles.tableCell, { flex: 3, lineHeight: 1.3 }]}>{row.jeers}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{g.pushingRolls.title}</Text>
      <View style={styles.giftCard}>
        <Text style={styles.giftName}>{g.pushingRolls.creativeGambit.name}</Text>
        <Text style={styles.giftEffect}>{g.pushingRolls.creativeGambit.text}</Text>
      </View>
      <View style={styles.giftCard}>
        <Text style={styles.giftName}>{g.pushingRolls.encore.name}</Text>
        <Text style={styles.giftEffect}>{g.pushingRolls.encore.text}</Text>
      </View>

      <Text style={styles.sectionTitle}>{g.turnAndBit.title}</Text>
      <Text style={{ fontSize: 8.5, lineHeight: 1.4 }}>{g.turnAndBit.text}</Text>

      <Text style={styles.sectionTitle}>Resources</Text>
      {g.resourceGlossary.map((r, i) => (
        <View key={i} style={{ marginBottom: 5 }}>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{r.name}</Text>
          <Text style={{ fontSize: 8.5, lineHeight: 1.35 }}>{r.text}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Play structure</Text>
      {g.playStructure.map((p, i) => (
        <View key={i} style={{ marginBottom: 5 }}>
          <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>{p.name}</Text>
          <Text style={{ fontSize: 8.5, lineHeight: 1.35 }}>{p.text}</Text>
        </View>
      ))}

      <Text style={styles.footerNote}>CLOWN: Lights in the Backstage — reference sheet</Text>
    </Page>
  );
}
