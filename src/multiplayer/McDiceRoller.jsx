import { useState } from 'react';
import { createRoll } from '../utils/roomsApi';
import { performRoll } from '../utils/rollEngine';

const COMMON_ACTIONS = ['Attack', 'Move', 'Search', 'Dialogue', 'Think', 'Unique'];
const REACTIONS = ['Defend', 'Dodge', 'Unique'];

// A free-text label rather than a dropdown tied to a specific tracked NPC
// — this is meant for quick, improvised rolls ("the guard notices, or
// doesn't"), not formal bookkeeping. No resource effects are auto-applied
// (no Suspicion/Momentum changes, nothing written back to any NPC) — this
// tool just rolls the dice and posts the result to Table Chat; what it
// means is entirely the MC's call, matching how NPC damage/soak isn't
// mechanized yet either.
export default function McDiceRoller({ code, room }) {
  const [rollerName, setRollerName] = useState('');
  const [poolSize, setPoolSize] = useState(3);
  const [difficulty, setDifficulty] = useState(1);
  const [category, setCategory] = useState(''); // '' | 'common' | 'reaction'
  const [selectedAction, setSelectedAction] = useState('');
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRoll = async () => {
    if (poolSize <= 0) return;
    setRolling(true);
    setError(null);
    try {
      const rolled = performRoll(poolSize, room.houseDifficulty || 0, difficulty);
      await createRoll(code, {
        isNpcRoll: true,
        rollerUid: null,
        rollerName: rollerName.trim() || 'NPC',
        attribute: null,
        skill: null,
        poolSize,
        gambitUsed: false,
        drumroll: false,
        actionCategory: category || null,
        commonAction: category === 'common' ? selectedAction : null,
        reaction: category === 'reaction' ? selectedAction : null,
        dice: rolled.pool.dice,
        successCount: rolled.pool.successCount,
        hasCritTens: rolled.pool.hasCritTens,
        houseDieRaw: rolled.houseDie.raw,
        houseDifficulty: rolled.houseDie.modifier,
        houseDieOutcome: rolled.houseDie.outcome,
        difficulty: rolled.difficulty,
        promptId: null,
        outcome: rolled.outcome,
        revealed: true,
        flopAwarded: null,
      });
      setLastResult(rolled);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setRolling(false);
    }
  };

  return (
    <div style={{ marginTop: 10, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🎲 MC Dice Roller</div>
      <p className="helper-text" style={{ marginTop: 0, marginBottom: 6 }}>
        For anything you narrate that doesn't have a set difficulty — roll however many dice feels right and
        let the House Die decide if it goes great or badly.
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        <input
          type="text"
          placeholder="Who's rolling? (optional)"
          value={rollerName}
          onChange={(e) => setRollerName(e.target.value)}
          style={{ width: 160 }}
        />
        <label style={{ fontSize: 12 }}>
          Dice:{' '}
          <input
            type="number"
            min={1}
            value={poolSize}
            onChange={(e) => setPoolSize(Math.max(1, Number(e.target.value) || 0))}
            style={{ width: 55 }}
          />
        </label>
        <label style={{ fontSize: 12 }}>
          Difficulty:{' '}
          <input
            type="number"
            min={1}
            value={difficulty}
            onChange={(e) => setDifficulty(Math.max(1, Number(e.target.value) || 0))}
            style={{ width: 55 }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
        <label style={{ fontSize: 12, cursor: 'pointer' }}>
          <input type="radio" name="mcRollCategory" checked={category === ''} onChange={() => { setCategory(''); setSelectedAction(''); }} style={{ marginRight: 4 }} />
          Freeform
        </label>
        <label style={{ fontSize: 12, cursor: 'pointer' }}>
          <input type="radio" name="mcRollCategory" checked={category === 'common'} onChange={() => { setCategory('common'); setSelectedAction(''); }} style={{ marginRight: 4 }} />
          Common Action
        </label>
        <label style={{ fontSize: 12, cursor: 'pointer' }}>
          <input type="radio" name="mcRollCategory" checked={category === 'reaction'} onChange={() => { setCategory('reaction'); setSelectedAction(''); }} style={{ marginRight: 4 }} />
          Reaction
        </label>
      </div>

      {category === 'common' && (
        <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} style={{ width: '100%', marginBottom: 6 }}>
          <option value="">Choose an action…</option>
          {COMMON_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      )}
      {category === 'reaction' && (
        <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)} style={{ width: '100%', marginBottom: 6 }}>
          <option value="">Choose a reaction…</option>
          {REACTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      )}

      <button
        type="button"
        className="small-btn"
        onClick={handleRoll}
        disabled={rolling || poolSize <= 0 || ((category === 'common' || category === 'reaction') && !selectedAction)}
      >
        {rolling ? 'Rolling…' : 'Roll'}
      </button>

      {lastResult && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
          Last roll: {lastResult.pool.dice.join(', ')} — {lastResult.pool.successCount} success{lastResult.pool.successCount === 1 ? '' : 'es'},
          {' '}House Die {lastResult.houseDie.outcome === 'cheers' ? 'Cheers' : 'Jeers'}. Posted to Table Chat.
        </div>
      )}

      {error && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>Couldn't post that roll ({error}).</p>
      )}
    </div>
  );
}
