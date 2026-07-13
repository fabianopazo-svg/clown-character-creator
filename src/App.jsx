import { useState } from 'react';
import { CharacterProvider } from './context/CharacterContext';
import Step01Concept from './steps/Step01Concept';
import Step02AgeBand from './steps/Step02AgeBand';
import Step03Attributes from './steps/Step03Attributes';
import Step04Skills from './steps/Step04Skills';
import Step05Traits from './steps/Step05Traits';
import Step06TroupePath from './steps/Step06TroupePath';
import Step07Gifts from './steps/Step07Gifts';
import Step08Clown from './steps/Step08Clown';
import Step09Resources from './steps/Step09Resources';
import Summary from './steps/Summary';

const steps = [
  { id: 1, label: 'Concept', Component: Step01Concept },
  { id: 2, label: 'Age band', Component: Step02AgeBand },
  { id: 3, label: 'Attributes', Component: Step03Attributes },
  { id: 4, label: 'Skills', Component: Step04Skills },
  { id: 5, label: 'Traits', Component: Step05Traits },
  { id: 6, label: 'Troupe & Path', Component: Step06TroupePath },
  { id: 7, label: 'Gifts', Component: Step07Gifts },
  { id: 8, label: 'The Clown', Component: Step08Clown },
  { id: 9, label: 'Resources', Component: Step09Resources },
  { id: 10, label: 'Summary', Component: Summary },
];

function Wizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const { Component } = steps[stepIndex];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'sans-serif' }}>
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
        {steps.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStepIndex(i)}
            style={{
              fontSize: 12,
              padding: '4px 8px',
              background: i === stepIndex ? '#333' : '#eee',
              color: i === stepIndex ? '#fff' : '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {s.id}. {s.label}
          </button>
        ))}
      </nav>

      <Component />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <button
          disabled={stepIndex === 0}
          onClick={() => setStepIndex(i => Math.max(0, i - 1))}
        >
          Back
        </button>
        <button
          disabled={stepIndex === steps.length - 1}
          onClick={() => setStepIndex(i => Math.min(steps.length - 1, i + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CharacterProvider>
      <Wizard />
    </CharacterProvider>
  );
}
