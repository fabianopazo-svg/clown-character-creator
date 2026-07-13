import { useCharacter } from '../context/CharacterContext';
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

export default function Summary() {
  const { character } = useCharacter();

  const troupe = troupes.find(t => t.id === character.troupeId);
  const path = paths.find(p => p.id === character.pathId);
  const subtype = path?.subtypes?.find(s => s.id === character.subtypeId);
  const band = getAgeBand(character.ageBandId);
  const finalAttributes = applyAgeModifiers(character.attributes, character.ageBandId);
  const rank = getRankForRenown(character.renown);
  const perfRankBonus = getPerformanceRankBonus(character.renown);
  const perfTotal = character.performanceDots + perfRankBonus;

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
        <span>{character.performanceDots} bought + {perfRankBonus} rank = {perfTotal}</span>
      </div>

      <div className="section-title">Specialties</div>
      <p>{character.specialties.filter(Boolean).join(', ') || '—'}</p>

      <div className="section-title">Personality traits</div>
      <p>
        {character.personalityTraits
          .map(id => core.personalityTraits.find(t => t.id === id)?.name)
          .join(', ') || '—'}
      </p>

      <div className="section-title">Starting Gifts</div>
      {character.gifts.map(g => (
        <div key={g} className="gift-card"><span className="gift-name">{g}</span></div>
      ))}

      <div className="section-title">Resources</div>
      <div className="three-col">
        <div className="accent-block"><strong>Laughter</strong><div>{calcStartingLaughter(finalAttributes)}</div></div>
        <div className="accent-block"><strong>Face</strong><div>7</div></div>
        <div className="accent-block"><strong>Purse</strong><div>{character.purseCurrent ?? band?.startingPurse ?? '—'} Coin</div></div>
      </div>

      <div className="section-title">Backstory</div>
      <p><strong>Cryptic sign:</strong> {character.backstory.crypticSign || '—'}</p>
      <p><strong>Keeping the truth from:</strong> {character.backstory.keepingTruthFrom || '—'}</p>
      <p><strong>Motley worn:</strong> {character.backstory.motleyWorn || '—'}</p>

      <p style={{ marginTop: 24, fontStyle: 'italic', color: 'var(--muted)' }}>
        PDF export button goes here — next build step.
      </p>
    </div>
  );
}
