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
      <h2>Summary</h2>

      <h3>{character.ringName || '(unnamed Clown)'}</h3>
      <p>{character.humanName} &middot; {character.occupation} &middot; Age {character.age} ({band?.name})</p>
      <p>{troupe?.name} &middot; {path?.name}{subtype ? ` (${subtype.name})` : ''} &middot; Renown {character.renown} &middot; {rank.name}</p>

      {character.tentBorn.isTentBorn && character.tentBorn.secondTroupeId && (
        <p>
          Tent-born — Heritage from {troupes.find(t => t.id === character.tentBorn.secondTroupeId)?.name}:{' '}
          {core.tentBorn.heritageTraitsByTroupe[character.tentBorn.secondTroupeId]?.name}
        </p>
      )}

      <h4>Attributes (final, after age modifiers)</h4>
      <ul>
        {core.attributes.map(a => (
          <li key={a.id}>{a.name}: {finalAttributes[a.id]}</li>
        ))}
      </ul>

      <h4>Skills</h4>
      <ul>
        {core.skills.map(s => (
          <li key={s.id}>{s.name}: {character.skills[s.id]}</li>
        ))}
        <li>Performance: {character.performanceDots} bought + {perfRankBonus} rank = {perfTotal}</li>
      </ul>

      <h4>Specialties</h4>
      <p>{character.specialties.filter(Boolean).join(', ') || '—'}</p>

      <h4>Personality traits</h4>
      <p>
        {character.personalityTraits
          .map(id => core.personalityTraits.find(t => t.id === id)?.name)
          .join(', ') || '—'}
      </p>

      <h4>Starting Gifts</h4>
      <ul>
        {character.gifts.map(g => <li key={g}>{g}</li>)}
      </ul>

      <h4>Resources</h4>
      <ul>
        <li>Laughter: {calcStartingLaughter(finalAttributes)}</li>
        <li>Face: 7</li>
        <li>Health boxes: {calcHealthBoxes(character.skills)}</li>
        <li>Purse: {character.purseCurrent ?? band?.startingPurse ?? '—'} Coin</li>
      </ul>

      <h4>Backstory</h4>
      <p><strong>Cryptic sign:</strong> {character.backstory.crypticSign || '—'}</p>
      <p><strong>Keeping the truth from:</strong> {character.backstory.keepingTruthFrom || '—'}</p>
      <p><strong>Motley worn:</strong> {character.backstory.motleyWorn || '—'}</p>

      <p style={{ marginTop: 24, fontStyle: 'italic' }}>
        PDF export button goes here — next build step.
      </p>
    </div>
  );
}
