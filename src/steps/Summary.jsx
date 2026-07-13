import { useCharacter } from '../context/CharacterContext';
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

export default function Summary() {
  const { character } = useCharacter();

  const troupe = troupes.find(t => t.id === character.troupeId);
  const path = paths.find(p => p.id === character.pathId);
  const subtype = path?.subtypes?.find(s => s.id === character.subtypeId);
  const band = getAgeBand(character.ageBandId);
  const finalAttributes = applyAgeModifiers(character.attributes, character.ageBandId);
  const rank = getRankForRenown(character.renown);
  const perfRankBonus = getPerformanceRankBonus(character.renown);
  const perfBase = character.tentBorn.isTentBorn ? core.performance.baseFreeDotsTentBorn : core.performance.baseFreeDots;
  const perfBought = perfBase + character.performanceDots;
  const perfTotal = perfBought + perfRankBonus;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid var(--ink)', paddingBottom: 12, marginBottom: 16 }}>
        <div>
          <div className="field-label">Ring name</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{character.ringName || '(unnamed Clown)'}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {character.humanName} &middot; {character.occupation} &middot; Age {character.age}
          </div>
        </div>
        <span className="accent-block" style={{ height: 'fit-content', fontWeight: 600 }}>
          Renown {character.renown} &middot; {rank.name}
        </span>
      </div>

      <div className="three-col" style={{ marginBottom: 16 }}>
        <div className="accent-block"><div className="field-label" style={{ color: 'var(--accent-text)' }}>Troupe</div>{troupe?.name || '—'}</div>
        <div className="accent-block"><div className="field-label" style={{ color: 'var(--accent-text)' }}>Path</div>{path?.name || '—'}</div>
        <div className="accent-block"><div className="field-label" style={{ color: 'var(--accent-text)' }}>Subtype</div>{subtype?.name || '—'}</div>
      </div>

      {character.tentBorn.isTentBorn && character.tentBorn.secondTroupeId && (
        <p className="helper-text">
          Tent-born — Heritage from {troupes.find(t => t.id === character.tentBorn.secondTroupeId)?.name}:{' '}
          {core.tentBorn.heritageTraitsByTroupe[character.tentBorn.secondTroupeId]?.name}
        </p>
      )}

      <div className="section-title">Attributes</div>
      <div className="three-col">
        {core.attributes.map(a => (
          <div className="stat-row" key={a.id}><span>{a.name}</span><span>{finalAttributes[a.id]}</span></div>
        ))}
      </div>

      <div className="section-title">Skills</div>
      <div className="two-col">
        {core.skills.map(s => (
          <div className="stat-row" key={s.id}><span>{s.name}</span><span>{character.skills[s.id]}</span></div>
        ))}
      </div>
      <div className="accent-block" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Performance</span>
        <span>{perfBought} bought (incl. {perfBase} free) + {perfRankBonus} rank = {perfTotal}</span>
      </div>

      <div className="section-title">Specialties</div>
      {character.specialties.filter(s => s.text).map((s, i) => (
        <div key={i} className="gift-card">
          <span className="gift-name">{s.text}</span>
          <span style={{ fontSize: 11, color: 'var(--accent-text)' }}> (+{s.value})</span>
        </div>
      ))}

      <div className="section-title">Insecurities</div>
      {character.insecurities.filter(s => s.text).map((s, i) => (
        <div key={i} className="gift-card">
          <span className="gift-name">{s.text}</span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}> ({s.value})</span>
        </div>
      ))}

      <div className="section-title">Personality traits</div>
      {character.personalityTraits.map(id => {
        const trait = core.personalityTraits.find(t => t.id === id);
        if (!trait) return null;
        return (
          <div key={id} className="gift-card">
            <span className="gift-name">{trait.name}</span>
            <div className="gift-effect">{trait.effect}</div>
          </div>
        );
      })}

      <div className="section-title">Gifts</div>
      {character.gifts.map(g => (
        <div key={g} className="gift-card"><span className="gift-name">{g}</span></div>
      ))}
      {character.capstoneGift && (
        <div className="gift-card selected">
          <span className="gift-name">{character.capstoneGift}</span>
          <span style={{ fontSize: 11, color: 'var(--accent-text)' }}> (capstone)</span>
        </div>
      )}

      <div className="section-title">Resources</div>
      <div className="three-col">
        <div className="accent-block"><strong>Laughter</strong><div>{calcStartingLaughter(finalAttributes)}</div></div>
        <div className="accent-block"><strong>Face</strong><div>7</div></div>
        <div className="accent-block"><strong>Purse</strong><div>{character.purseCurrent ?? band?.startingPurse ?? '—'} Coin</div></div>
      </div>

      <div className="section-title">Gear</div>
      {character.gear.length === 0 && <p className="helper-text">None selected.</p>}
      {character.gear.map(name => {
        const item = findGearItem(name);
        if (!item) return null;
        return (
          <div key={name} className="gift-card">
            <span className="gift-name">{item.name}</span>
            <span style={{ fontSize: 11, color: 'var(--hint)' }}> [{item.type} · {item.rarity} · {item.cost} Coin]</span>
            <div className="gift-effect">{item.effect}</div>
          </div>
        );
      })}

      <div className="section-title">Backstory</div>
      <p><strong>Cryptic sign:</strong> {character.backstory.crypticSign || '—'}</p>
      <p><strong>Keeping the truth from:</strong> {character.backstory.keepingTruthFrom || '—'}</p>
      <p><strong>Motley worn:</strong> {character.backstory.motleyWorn || '—'}</p>

      <p className="helper-text" style={{ marginTop: 24 }}>
        Use the <strong>Export PDF</strong> button at the top of the page to download this character sheet.
      </p>
    </div>
  );
}
