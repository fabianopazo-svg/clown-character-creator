import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles, colors, fonts, accentBlockStyle, accentTitleStyle } from './styles';
import { StageName, Dots, Boxes, Checkbox, FieldBox, ColBox, PurseCells } from './components';
import { registerFonts } from './fonts';
import GlossaryPage from './GlossaryPage';
import core from '../data/core.json';
import troupes from '../data/troupes.json';
import paths from '../data/paths.json';
import { findGearItem } from '../utils/gearLookup';
import {
  applyAgeModifiers,
  calcStartingLaughter,
  calcHealthBoxes,
  getAgeBand,
  getRankForRenown,
  getPerformanceRankBonus,
} from '../utils/calculations';

registerFonts();

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

  const bonusAttrId = band?.bonus;
  const penaltyAttrId = band?.penalty;

  const usesDomain = path?.id === 'illusionist';

  return (
    <Document>
      {/* PAGE 1 — Identity, Attributes, Skills, Resources, Gear */}
      <Page size="LETTER" style={styles.page}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2.5, borderBottomColor: colors.ink, paddingBottom: 6, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Stage Name</Text>
            <StageName name={character.ringName || '—'} />
            <Text style={{ fontSize: 8.5, color: colors.ink, fontFamily: fonts.body, marginTop: 2 }}>
              {character.humanName || '—'} · {character.occupation || '—'} · Age {character.age || '—'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 }}>
              <Text style={{ fontSize: 6.5, color: colors.muted, textTransform: 'uppercase' }}>Age band</Text>
              {core.ageBands.map(b => (
                <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.checkbox, character.ageBandId === b.id ? styles.checkboxChecked : null, { width: 7, height: 7, marginRight: 3 }]} />
                  <Text style={{ fontSize: 7 }}>{b.name}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={{ backgroundColor: colors.ink, borderRadius: 4, padding: '5 9' }}>
            <Text style={{ color: 'white', fontFamily: fonts.display, fontSize: 10 }}>
              Renown {character.renown} · {rank.name}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <ColBox label="Troupe" value={troupe?.name || '—'} section={colors.troupe} />
          <View style={{ flex: 1, backgroundColor: colors.path.tint, borderRadius: 4, padding: 6, borderLeftWidth: 2.5, borderLeftColor: colors.path.text }}>
            <Text style={[styles.fieldLabel, { color: colors.path.text }]}>Path</Text>
            <Text style={{ fontSize: 10, fontFamily: fonts.display, marginTop: 1 }}>{path?.name || '—'}</Text>
            {subtype && (
              <View style={{ marginTop: 3, alignSelf: 'flex-start', backgroundColor: 'white', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2 }}>
                <Text style={{ fontSize: 6.5, color: colors.path.text }}>Subtype: {subtype.name}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5 }}>
          <Text style={styles.fieldLabel}>Tent-born</Text>
          <View style={[styles.checkbox, character.tentBorn.isTentBorn ? styles.checkboxChecked : null, { marginLeft: 6, marginRight: 5 }]} />
          {heritage ? (
            <Text style={{ fontSize: 6.8, color: colors.muted, lineHeight: 1.3, flex: 1 }}>
              <Text style={{ fontFamily: fonts.body, color: colors.ink }}>Secondary faction: </Text>
              {secondTroupe?.name} — {heritage.name}: {heritage.effect}
            </Text>
          ) : (
            <Text style={{ fontSize: 7, color: colors.muted }}>No</Text>
          )}
        </View>

        <Text style={accentTitleStyle(colors.attributes, { marginTop: 8, marginBottom: 3 })}>Attributes</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {core.attributes.map(a => {
            const isBonus = a.id === bonusAttrId;
            const isPenalty = a.id === penaltyAttrId;
            return (
              <View key={a.id} style={{ width: '33.3%', flexDirection: 'row', alignItems: 'center', paddingVertical: 0.5, marginBottom: 1 }}>
                <Text style={{ fontSize: 8.5, fontFamily: fonts.body, width: 52 }}>{a.name}</Text>
                <Dots
                  filled={finalAttributes[a.id]}
                  total={5}
                  color={colors.ink}
                  bonusAt={isBonus ? finalAttributes[a.id] : null}
                  penaltyAt={isPenalty ? finalAttributes[a.id] + 1 : null}
                />
              </View>
            );
          })}
        </View>
        <Text style={{ fontSize: 5.8, color: colors.hint, marginTop: 1 }}>
          Green dot = Age Band bonus. Red-outlined dot = Age Band penalty.
        </Text>

        <Text style={accentTitleStyle(colors.skills, { fontSize: 9.5, marginTop: 6, marginBottom: 3 })}>Skills</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {core.skills.map(s => (
            <View key={s.id} style={{ width: '33.3%', flexDirection: 'row', alignItems: 'center', paddingVertical: 0.5, marginBottom: 1 }}>
              <Text style={{ fontSize: 8, width: 62 }}>{s.name}</Text>
              <Dots filled={character.skills[s.id]} total={5} color={colors.ink} />
            </View>
          ))}
        </View>
        <View style={[accentBlockStyle(colors.resources), { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4, gap: 8 }]}>
          <Text style={{ fontSize: 8.5, fontFamily: fonts.display, color: colors.resources.text }}>Performance</Text>
          <Dots filled={character.performanceDots} lockedCount={perfBase} starCount={perfRankBonus} total={perfBase + core.performance.maxExtraBoughtAtCreation + 4} color={colors.ink} />
        </View>

        <Text style={accentTitleStyle(colors.resources)}>Universal Resources</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 230 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
              <Text style={{ fontSize: 8.5, fontFamily: fonts.body, width: 55 }}>Laughter</Text>
              <Boxes filled={laughter} total={10} color={colors.ink} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 8.5, fontFamily: fonts.body, width: 55 }}>Face</Text>
              <Boxes filled={7} total={10} color={colors.ink} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 62 }}>
              <Text style={{ fontSize: 8.5, fontFamily: fonts.body }}>Health</Text>
              <Text style={{ fontSize: 5.5, color: colors.hint }}>3 + Toughness</Text>
            </View>
            <Boxes filled={health} total={15} color={colors.ink} />
          </View>
        </View>

        <Text style={accentTitleStyle(colors.specialties, { marginTop: 6 })}>Specialties &amp; Insecurities</Text>
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            {character.specialties.filter(s => s.text).map((s, i) => (
              <View key={`sp-${i}`} style={[accentBlockStyle(colors.specialties), { marginBottom: 3, paddingVertical: 3, flexDirection: 'row', justifyContent: 'space-between' }]}>
                <Text style={{ fontSize: 8 }}>{s.text}</Text>
                <Text style={{ fontSize: 8, fontFamily: fonts.display, color: colors.specialties.text }}>+{s.value}</Text>
              </View>
            ))}
            {character.insecurities.filter(s => s.text).map((s, i) => (
              <View key={`in-${i}`} style={[accentBlockStyle(colors.insecurities), { marginBottom: 3, paddingVertical: 3, flexDirection: 'row', justifyContent: 'space-between' }]}>
                <Text style={{ fontSize: 8 }}>{s.text}</Text>
                <Text style={{ fontSize: 8, fontFamily: fonts.display, color: colors.insecurities.text }}>{s.value}</Text>
              </View>
            ))}
            {character.specialties.filter(s => s.text).length === 0 && character.insecurities.filter(s => s.text).length === 0 && (
              <Text style={styles.helperText}>None.</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.subSectionTitle, { color: colors.personality.text, marginTop: 0 }]}>Personality traits</Text>
            {character.personalityTraits.map(id => {
              const trait = core.personalityTraits.find(t => t.id === id);
              if (!trait) return null;
              return (
                <View key={id} style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={{ fontSize: 7, color: colors.hint, marginRight: 3 }}>—</Text>
                  <Text style={{ fontSize: 7, color: colors.muted, lineHeight: 1.25, flex: 1 }}>
                    <Text style={{ fontFamily: fonts.body, color: colors.ink }}>{trait.name}: </Text>
                    {trait.effect}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Text style={accentTitleStyle(colors.resources, { marginTop: 0, marginBottom: 0, borderBottomWidth: 0 })}>Gear</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 8.5, fontFamily: fonts.display, marginRight: 5 }}>Purse</Text>
            <PurseCells value={purse} />
          </View>
        </View>
        <View style={{ borderBottomWidth: 1.5, borderBottomColor: colors.resources.text, marginBottom: 4 }} />
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Item</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Rarity</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Effect</Text>
        </View>
        {(character.gear && character.gear.length > 0
          ? character.gear.map(findGearItem).filter(Boolean)
          : [{}, {}]
        ).map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{item.name || ' '}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.type || ' '}</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>{item.rarity || ' '}</Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>{item.effect || ' '}</Text>
          </View>
        ))}

        <Text style={styles.footerNote}>CLOWN: Lights in the Backstage — character sheet</Text>
      </Page>

      {/* PAGE 2 — Troupe, Path resource, and the full Gift matrix */}
      <Page size="LETTER" style={styles.page}>
        <Text style={accentTitleStyle(colors.troupe)}>Troupe — {troupe?.name}</Text>
        <Text style={{ fontSize: 7.5, color: colors.muted, marginBottom: 5, lineHeight: 1.3 }}>
          {troupe?.values} {troupe?.look}
        </Text>
        {['founding', 'affinity', 'recognition', 'legend'].map(key => {
          const p = troupe?.passives?.[key];
          if (!p) return null;
          const renownReq = { founding: 1, affinity: 3, recognition: 6, legend: 9 }[key];
          const unlocked = character.renown >= renownReq;
          return (
            <View key={key} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <View style={[styles.checkbox, unlocked ? styles.checkboxChecked : null, { marginTop: 1 }]} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 8, fontFamily: fonts.body, fontWeight: 'bold' }}>
                  {p.name} <Text style={{ fontWeight: 'normal', color: colors.muted }}>— Renown {renownReq}</Text>
                </Text>
                <Text style={{ fontSize: 7.3, lineHeight: 1.25 }}>{p.text}</Text>
              </View>
            </View>
          );
        })}

        <Text style={accentTitleStyle(colors.path, { marginTop: 10 })}>Path — {path?.name}</Text>
        {path?.flavor && <Text style={{ fontSize: 7.5, fontStyle: 'italic', color: colors.muted, marginBottom: 3, lineHeight: 1.3 }}>{path.flavor}</Text>}
        {path?.pathResource && (
          <View style={[accentBlockStyle(colors.path), { marginBottom: 6 }]}>
            <Text style={{ fontSize: 8, fontFamily: fonts.body, fontWeight: 'bold', color: colors.path.text }}>
              {path.pathResource.name}{path.pathResource.abbrev ? ` (${path.pathResource.abbrev})` : ''}
            </Text>
            <Text style={{ fontSize: 7.3, lineHeight: 1.3, marginTop: 1 }}>{path.pathResource.description}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4, marginBottom: 3 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 9.5 }}>Gifts</Text>
          <Text style={{ fontFamily: fonts.body, fontStyle: 'italic', fontSize: 7.5, color: colors.muted, marginLeft: 6 }}>
            (check the ones you know)
          </Text>
        </View>
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, { width: 14 }]}></Text>
          <Text style={[styles.tableHeaderCell, { width: 22 }]}>Grd</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6 }]}>Gift</Text>
          <Text style={[styles.tableHeaderCell, { flex: 0.7 }]}>Cost</Text>
          <Text style={[styles.tableHeaderCell, { flex: 3.4 }]}>{usesDomain ? 'Domain / Limit' : 'Effect'}</Text>
        </View>
        {path?.gifts.map(gradeBlock => gradeBlock.list.map((gift, i) => {
          const known = gradeBlock.capstone
            ? character.capstoneGift === gift.name
            : character.gifts.includes(gift.name);
          let costDisplay = gift.cost || gradeBlock.costEach || '';
          if (path?.pathResource?.abbrev) {
            costDisplay = costDisplay.replace(new RegExp(path.pathResource.name, 'g'), path.pathResource.abbrev);
          }
          const subtypeTag = gift.subtype && gift.subtype !== 'open'
            ? ` (${gift.subtype.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')})`
            : '';
          return (
            <View key={`${gradeBlock.grade}-${i}`} style={[styles.tableRow, { paddingVertical: 2 }]} wrap={false}>
              <View style={{ width: 14 }}>
                <View style={[styles.checkbox, known ? styles.checkboxChecked : null]} />
              </View>
              <Text style={[styles.tableCell, { width: 22, fontSize: 7.3 }]}>{gradeBlock.capstone ? 'Cap' : gradeBlock.grade}</Text>
              <Text style={[styles.tableCell, { flex: 1.6, fontFamily: fonts.body, fontWeight: 'bold', fontSize: 7.5, lineHeight: 1.15 }]}>
                {gift.name}<Text style={{ fontWeight: 'normal', color: colors.muted }}>{subtypeTag}</Text>
              </Text>
              <Text style={[styles.tableCell, { flex: 0.7, fontSize: 7.3 }]}>{costDisplay}</Text>
              <Text style={[styles.tableCell, { flex: 3.4, fontSize: 7.3, lineHeight: 1.15 }]}>
                {usesDomain ? `${gift.domain || ''} ${gift.limit ? `(Limit: ${gift.limit})` : ''}` : (gift.effect || '')}
              </Text>
            </View>
          );
        }))}

        <Text style={styles.footerNote}>CLOWN: Lights in the Backstage — character sheet</Text>
      </Page>

      {/* PAGE 3 — Pure flavor: persona, description, backstory */}
      <Page size="LETTER" style={styles.page}>
        <Text style={accentTitleStyle(colors.path)}>The Clown</Text>
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <FieldBox label="Makeup & costume" value={character.clown.makeup} minHeight={110} />
          </View>
          <View style={{ flex: 1 }}>
            <FieldBox label="Human description" value={character.clown.humanDescription} minHeight={110} />
          </View>
        </View>
        <View style={styles.twoCol}>
          <View style={{ flex: 1.4 }}>
            <FieldBox label="Relationship to taking the face" value={character.clown.relationshipToFace} minHeight={60} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Getting-ready time</Text>
            {core.gettingIntoCharacter.map(mode => (
              <Checkbox key={mode.id} checked={character.clown.gettingReadyId === mode.id} label={`${mode.name} (${mode.time})`} />
            ))}
          </View>
        </View>

        <Text style={accentTitleStyle(colors.attributes, { marginTop: 14 })}>Backstory</Text>
        <FieldBox label="Who left your first cryptic sign, and do you still have it?" value={character.backstory.crypticSign} minHeight={55} />
        <FieldBox label="Who are you keeping the truth from?" value={character.backstory.keepingTruthFrom} minHeight={55} />
        <FieldBox label="What Motley besides your own have you worn, and what did it cost?" value={character.backstory.motleyWorn} minHeight={55} />

        <Text style={styles.footerNote}>CLOWN: Lights in the Backstage — character sheet</Text>
      </Page>

      <GlossaryPage />
    </Document>
  );
}
