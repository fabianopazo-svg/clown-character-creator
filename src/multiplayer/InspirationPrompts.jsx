import { useState } from 'react';

// Original content, not from the rulebook — the book establishes what a
// Flop and a Bit ARE (a glorious failure; a mortal cover story) with a
// couple of scattered examples, but has no actual prompt table. These are
// quick sparks for when a player's drawing a blank, not canon material.
const FLOP_PROMPTS = [
  "The trick works perfectly — on the wrong target entirely.",
  "You nail the setup and completely botch the punchline, in the most physical way possible.",
  "It works exactly as planned, three seconds too late to matter.",
  "The prop malfunctions in a way that's somehow funnier than if it had worked.",
  "You commit so hard to the bit that you genuinely hurt yourself, and the crowd loves it.",
  "The stunt succeeds, but you trip over your own success on the way out.",
  "You outsmart yourself — the trap you set catches you instead.",
  "It's technically a disaster, but it looks so intentional that people applaud anyway.",
  "You get the exact reaction you wanted, from entirely the wrong person.",
  "The whole thing falls apart, but the way it falls apart tells its own perfect joke.",
  "You overcorrect wildly and somehow land the wrong trick better than the one you meant to do.",
  "Your confidence outpaces your actual skill by exactly one embarrassing beat.",
  "The bit works on everyone except the one person it needed to work on.",
  "You accidentally reveal the trick — and the reveal itself becomes the show.",
  "Something (or someone) interrupts at the worst possible moment, and you have to roll with it live.",
  "You aim for subtle and land on maximum, with no way to walk it back.",
  "The gag depends on timing, and your timing is catastrophically, hilariously wrong.",
];

const BIT_PROMPTS = [
  "An elaborate magic trick you'd clearly been rehearsing for weeks.",
  "A costume malfunction that conveniently explains everything.",
  "A \"lucky\" prop gag — the kind that only works because everyone assumes it was planned.",
  "A pratfall so committed nobody questions what actually caused it.",
  "A busker's stunt that just happens to be happening right now, right here.",
  "An overly complicated practical joke on a specific person in the crowd.",
  "A \"professional accident\" — the kind of mishap that only looks staged in hindsight.",
  "A ventriloquism bit that explains the voice, the movement, or both.",
  "A children's party trick performed completely out of context.",
  "A viral-video-style stunt, framed like someone's filming it for clout.",
  "A magician's assistant gag — you blame someone else in the act.",
  "An improv game that \"just happened\" to involve the mortal directly.",
  "A street-performer dare — someone bet you couldn't do it.",
  "A malfunctioning gadget you're visibly annoyed about, in character.",
  "A dance move taken way too far, sold as intentional choreography.",
  "A balloon-animal gone wrong, blamed loudly on cheap materials.",
  "A \"test run\" for a show that isn't real, apologized for immediately.",
];

function pickRandom(list, exclude) {
  const options = exclude ? list.filter((x) => x !== exclude) : list;
  return options[Math.floor(Math.random() * options.length)];
}

// Available to everyone at the table, not MC-exclusive — narrating a Flop
// or selling a Bit is usually the roller's job, not the MC's.
export default function InspirationPrompts() {
  const [open, setOpen] = useState(false);
  const [flopIdea, setFlopIdea] = useState(null);
  const [bitIdea, setBitIdea] = useState(null);

  return (
    <div className="gift-card" style={{ marginBottom: 16, cursor: 'default' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="section-title" style={{ margin: 0 }}>🎨 Need Inspiration?</span>
        <span className="small-btn">{open ? 'Hide' : 'Show'}</span>
      </div>

      {open && (
        <div style={{ marginTop: 8 }}>
          <p className="helper-text" style={{ marginTop: 0 }}>
            Quick sparks for narrating a Flop or selling a Bit — not from the rulebook, just extra
            ideas if you're stuck. Skip them entirely if your own idea's already better.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <button type="button" className="small-btn" onClick={() => setFlopIdea(pickRandom(FLOP_PROMPTS, flopIdea))}>
              🎪 {flopIdea ? 'Another Flop idea' : 'Flop idea'}
            </button>
            <button type="button" className="small-btn" onClick={() => setBitIdea(pickRandom(BIT_PROMPTS, bitIdea))}>
              🎩 {bitIdea ? 'Another Bit idea' : 'Bit idea'}
            </button>
          </div>

          {flopIdea && (
            <div className="gift-effect" style={{ marginBottom: 4 }}>
              <strong>Flop:</strong> {flopIdea}
            </div>
          )}
          {bitIdea && (
            <div className="gift-effect">
              <strong>Bit:</strong> {bitIdea}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
