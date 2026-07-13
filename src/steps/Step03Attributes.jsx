import { useCharacter } from '../context/CharacterContext';
import core from '../data/core.json';
import DotTracker from '../components/DotTracker';
import { sumDots } from '../utils/calculations';

export default function Step03Attributes() {
  const { character, dispatch } = useCharacter();
  const spent = sumDots(character.attributes);
  const max = core.attributeCreation.maxPoints;
  const remaining = max - spent;

  const setAttr = (id, value) => dispatch({ type: 'SET_ATTRIBUTE', id, value });

  return (
    <div>
      <div className="section-title">Step 3 — Attributes</div>
      <p className="helper-text">
        Spend up to {max} points across the six Attributes (max {core.attributeCreation.maxDotsPerAttribute} each). You may spend fewer if you choose.
      </p>
      <span className="remaining-badge">Remaining: {remaining} / {max}</span>

      {core.attributes.map(attr => {
        const value = character.attributes[attr.id];
        return (
          <div className="stat-row" key={attr.id} style={{ maxWidth: 320 }}>
            <span title={attr.governs}>{attr.name}</span>
            <DotTracker
              value={value}
              max={core.attributeCreation.maxDotsPerAttribute}
              onChange={(n) => {
                const delta = n - value;
                if (delta > 0 && delta > remaining) return;
                setAttr(attr.id, n);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
