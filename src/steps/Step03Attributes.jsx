import { useCharacter } from '../context/CharacterContext';
import core from '../data/core.json';
import DotTracker from '../components/DotTracker';
import { sumDots } from '../utils/calculations';

export default function Step03Attributes() {
  const { character, dispatch } = useCharacter();
  const spent = sumDots(character.attributes);
  const max = core.attributeCreation.maxPoints;
  const remaining = max - spent;

  const setAttr = (id, value) => {
    if (value > spent + remaining) return; // safety
    dispatch({ type: 'SET_ATTRIBUTE', id, value });
  };

  return (
    <div>
      <h2>Step 3 — Attributes</h2>
      <p>
        Spend up to <strong>{max}</strong> points across the six Attributes (1 dot = 1 point,
        max {core.attributeCreation.maxDotsPerAttribute} per Attribute). You may spend fewer than
        the max if you choose.
      </p>
      <p style={{ fontWeight: 'bold' }}>
        Remaining: {remaining} / {max}
      </p>

      {core.attributes.map(attr => {
        const value = character.attributes[attr.id];
        const wouldExceed = remaining <= 0 && value < core.attributeCreation.maxDotsPerAttribute;
        return (
          <div key={attr.id} style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 320, padding: '4px 0' }}>
            <span title={attr.governs}>{attr.name}</span>
            <DotTracker
              value={value}
              max={core.attributeCreation.maxDotsPerAttribute}
              disabled={false}
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
