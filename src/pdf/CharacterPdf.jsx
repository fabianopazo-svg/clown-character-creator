import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, colors } from './styles';
import { Dots, Checkbox, FieldBox, ColBox } from './components';
import core from '../data/core.json';
import troupes from '../data/troupes.json';
import paths from '../data/paths.json';
import {
  applyAgeModifiers,
  calcStartingLaughter,
  calcHealthBoxes,
  getAgeBand,
  getRankForRenown,
  getPerformanceRankBonus,
} from '../utils/calculations';

export default function CharacterPdf({ character }) {
  const troupe = troupes.find(t => t.id === character.troupeId);
  const path = paths.find(p => p.id === character.pathId);
  const subtype = path?.subtypes?.find(s => s.id === character.subtypeId);
  const band = getAgeBand(character.ageBandId);
  const finalAttributes = applyAgeModifiers(character.attributes, character.ageBandId);
  const rank = getRankForRenown(character.renown);
  const perfRankBonus = getPerformanceRankBonus(character.renown);
  const perfBase = character.tentBorn.isTentBorn
    ? core.performance.baseFreeDotsTentBorn
    : core.performance.baseFreeDots;
  const laughter = calcStartingLaughter(finalAttributes);
  const health = calcHealthBoxes(character.skills);
  const purse = character.purseCurrent ?? band?.startingPurse ?? 0;

  const heritage = character.tentBorn.isTentBorn && character.tentBorn.secondTroupeId
    ? core.tentBorn.heritageTraitsByTroupe[character.tentBorn.secondTroupeId]
    : null;
  const secondTroupe = character.tentBorn.isTentBorn
    ? troupes.find(t => t.id === character.tentBorn.secondTroupeId)
    : null;

  // Collect full Gift data (with effect text) for every chosen Gift + capstone, grouped by grade.
  const chosenGiftDetails = [];
  if (path) {
    path.gifts.forEach(gradeBlock => {
      gradeBlock.list.forEach(gift => {
        if (character.gifts.includes(gift.name)) {
          chosenGiftDetails.push({ ...gift, grade: gradeBlock.grade, capstone: false });
        }
        if (gradeBlock.capstone && gift.name === character.capstoneGift) {
          chosenGiftDetails.push({ ...gift, grade: gradeBlock.grade, capstone: true });
        }
      });
    });
  }

  const passiveOrder = ['founding', 'affinity', 'recognition', 'legend'];
  const passiveRenownReq = { founding: 1, affinity: 3, recognition: 6, legend: 9 };

  return (
    <Document>
      {/* PAGE 1 — Identity & Core Stats */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.subLabel}>Ring name</Text>
            <Text style={styles.ringName}>{character.ringName || '—'}</Text>
            <Text style={styles.subText}>
              {character.humanName || '—'} · {character.occupation || '—'} · Age {character.age || '—'}
            </Text>
          </View>
          <Text style={styles.accentBadge}>
            Renown {character.renown} · {rank.name}
          </Text>
        </View>

        <View style={styles.threeCol}>
          <ColBox label="Troupe" value={troupe?.name || '—'} />
          <ColBox label="Path" value={path?.name || '—'} />
          <ColBox label="Subtype" value={subtype?.name || '—'} />
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1.2 }}>
            <Text style={styles.fieldLabel}>Age band</Text>
            {core.ageBands.map(b => (
              <Checkbox key={b.id} checked={character.ageBandId === b.id} label={`${b.name} (${b.ageRange})`} />
            ))}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Purse</Text>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>{purse} Coin</Text>
            <Text style={styles.fieldLabel}>Tent-born</Text>
            <Checkbox checked={character.tentBorn.isTentBorn} label="Yes" />
            {heritage && (
              <Text style={{ fontSize: 7.5, marginTop: 3, color: colors.muted }}>
                {secondTroupe?.name}: {heritage.name} — {heritage.effect}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Attributes</Text>
        <View style={styles.statGrid}>
          {core.attributes.map(a => (
            <View style={styles.statItem} key={a.id}>
              <Text>{a.name}</Text>
              <Dots filled={finalAttributes[a.id]} total={5} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Skills</Text>
        <View style={styles.statGrid}>
          {core.skills.map(s => (
            <View style={styles.statItemHalf} key={s.id}>
              <Text>{s.name}{s.flatSoak ? ' (soak)' : ''}</Text>
              <Dots filled={character.skills[s.id]} total={5} />
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: colors.accentBg, borderRadius: 4, padding: 6, marginTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.accentText, fontFamily: 'Helvetica-Bold', fontSize: 9 }}>Performance</Text>
          <Dots
            filled={character.performanceDots}
            lockedCount={perfBase}
            starCount={perfRankBonus}
            total={perfBase + core.performance.maxExtraBoughtAtCreation + 4}
          />
        </View>
        <Text style={{ fontSize: 7, color: colors.muted, marginTop: 2 }}>
          Gray = free base, dark = bought, blue star = granted automatically by Rank {character.renown}
        </Text>

        <View style={styles.threeCol}>
          <FieldBox label="Specialties" value={character.specialties.filter(Boolean).join(', ')} minHeight={40} />
        </View>
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <FieldBox
              label="Insecurities"
              value={character.insecurities.filter(Boolean).join(', ')}
              minHeight={30}
            />
          </View>
          <View style={{ flex: 1 }}>
            <FieldBox
              label="Personality traits"
              value={character.personalityTraits
                .map(id => core.personalityTraits.find(t => t.id === id)?.name)
                .filter(Boolean)
                .join(', ')}
              minHeight={30}
            />
          </View>
        </View>

        <Text style={styles.footerNote}>CLOWN: Lights in the Backstage — character sheet</Text>
      </Page>

      {/* PAGE 2 — Resources & Troupe */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Universal resources</Text>
        <View style={styles.threeCol}>
          <ColBox label="Laughter (0-10)" value={laughter} />
          <ColBox label="Face (1-10)" value="7" />
          <ColBox label="Health boxes" value={health} />
        </View>

        {path && (
          <>
            <Text style={styles.sectionTitle}>Path resource — {path.pathResource?.name}</Text>
            <Text style={{ fontSize: 8, color: colors.muted, marginBottom: 6 }}>
              {path.pathResource?.description}
            </Text>
            <View style={styles.fieldBox}>
              <Text> </Text>
            </View>
          </>
        )}

        {troupe && (
          <>
            <Text style={styles.sectionTitle}>Troupe passives — {troupe.name}</Text>
            {passiveOrder.map(key => {
              const p = troupe.passives[key];
              const unlocked = character.renown >= passiveRenownReq[key];
              return (
                <View key={key} style={{ marginBottom: 6, flexDirection: 'row' }}>
                  <View style={[styles.checkbox, unlocked ? styles.checkboxChecked : null, { marginTop: 1 }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold' }}>
                      {p.name} <Text style={{ fontFamily: 'Helvetica', color: colors.muted }}>— Renown {passiveRenownReq[key]}</Text>
                    </Text>
                    <Text style={{ fontSize: 8, marginTop: 1, lineHeight: 1.3 }}>{p.text}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <Text style={styles.footerNote}>CLOWN: Lights in the Backstage — character sheet</Text>
      </Page>

      {/* PAGE 3 — Gifts */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Gifts — {path?.name}</Text>
        {chosenGiftDetails.length === 0 && (
          <Text style={{ fontSize: 9, color: colors.muted }}>No Gifts selected.</Text>
        )}
        {chosenGiftDetails.map((gift, i) => (
          <View key={i} style={styles.giftCard} wrap={false}>
            <Text style={styles.gradeLabel}>
              {gift.capstone ? 'Capstone' : `Grade ${gift.grade}`}
            </Text>
            <Text style={styles.giftName}>{gift.name}</Text>
            {gift.cost && <Text style={styles.giftMeta}>Cost: {gift.cost}</Text>}
            {gift.domain ? (
              <>
                <Text style={styles.giftEffect}>Domain: {gift.domain}</Text>
                <Text style={styles.giftEffect}>Limit: {gift.limit}</Text>
              </>
            ) : (
              <Text style={styles.giftEffect}>{gift.effect}</Text>
            )}
          </View>
        ))}

        <Text style={styles.footerNote}>CLOWN: Lights in the Backstage — character sheet</Text>
      </Page>

      {/* PAGE 4 — Gear, Persona, Backstory */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.sectionTitle}>Gear of the trade</Text>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Item</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Rarity</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Effect</Text>
        </View>
        {(character.gear && character.gear.length > 0 ? character.gear : [{}, {}, {}]).map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.name || ' '}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.type || ' '}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.rarity || ' '}</Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>{item.effect || ' '}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>The Clown</Text>
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <FieldBox label="Makeup & costume" value={character.clown.makeup} minHeight={55} />
          </View>
          <View style={{ flex: 1 }}>
            <FieldBox label="Human description" value={character.clown.humanDescription} minHeight={55} />
          </View>
        </View>
        <View style={styles.twoCol}>
          <View style={{ flex: 1.4 }}>
            <FieldBox label="Relationship to taking the face" value={character.clown.relationshipToFace} minHeight={30} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Getting-ready time</Text>
            {core.gettingIntoCharacter.map(mode => (
              <Checkbox
                key={mode.id}
                checked={character.clown.gettingReadyId === mode.id}
                label={`${mode.name} (${mode.time})`}
              />
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Backstory</Text>
        <FieldBox label="Who left your first cryptic sign, and do you still have it?" value={character.backstory.crypticSign} minHeight={24} />
        <FieldBox label="Who are you keeping the truth from?" value={character.backstory.keepingTruthFrom} minHeight={24} />
        <FieldBox label="What Motley besides your own have you worn, and what did it cost?" value={character.backstory.motleyWorn} minHeight={24} />

        <Text style={styles.footerNote}>CLOWN: Lights in the Backstage — character sheet</Text>
      </Page>
    </Document>
  );
}
