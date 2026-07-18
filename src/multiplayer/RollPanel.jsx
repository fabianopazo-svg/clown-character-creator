import { useState } from 'react';
import core from '../data/core.json';
import { computePoolSize, performRoll, derivePoolResult, resolveRollOutcome, rollDie, OUTCOME_LABELS, OUTCOME_DESCRIPTIONS } from '../utils/rollEngine';
import { createRoll, updatePlayResource, updateRoomState, revealRoll, startDrumrollReveal } from '../utils/roomsApi';
import { playDrumrollLocally } from '../utils/soundController';

// Toughness is flatSoak — it's never rolled, so it doesn't belong in this list.
const rollableSkills = core.skills.filter(s => !s.flatSoak);

function attributeOptionsForSkill(skill) {
  if (!skill?.attribute) return [];
  if (skill.attribute.includes('_or_')) return skill.attribute.split('_or_');
  return [skill.attribute];
}

// Laughter is private per-player (only the roller and the MC can ever see
// it), so it's always safe to apply immediately, drumroll or not — it
// can't spoil anything for the rest of the table.
const PLAYER_LAUGHTER_EFFECTS = {
  clean_success: 1, critical_cheers: 2, critical_jeers: 4, complication: 0, corpsing: 0, flop: 0,
};

// Suspicion and Momentum are PUBLIC (the whole table watches them in Party
// State), so for a Drumroll these are the only things that actually need
// to wait for the reveal — applying them early would let anyone infer the
// outcome just by watching the counters move.
const ROOM_EFFECTS = {
  clean_success: { suspicion: 0, momentum: 0 },
  critical_cheers: { suspicion: 0, momentum: 1 },
  critical_jeers: { suspicion: 0, momentum: 1 },
  complication: { suspicion: 1, momentum: 0 },
  corpsing: { suspicion: 2, momentum: 0 },
  flop: { suspicion: 0, momentum: 0 },
};

async function applyPlayerDelta(code, uid, oldOutcome, newOutcome, character) {
  const delta = (PLAYER_LAUGHTER_EFFECTS[newOutcome] || 0) - (PLAYER_LAUGHTER_EFFECTS[oldOutcome] || 0);
  if (delta !== 0) {
    const newLaughter = Math.max(0, Math.min(character.play.laughterMax, character.play.laughter + delta));
    await updatePlayResource(code, uid, 'laughter', newLaughter);
  }
}

async function applyRoomDelta(code, oldOutcome, newOutcome, room) {
  const oldEff = ROOM_EFFECTS[oldOutcome] || ROOM_EFFECTS.flop;
  const newEff = ROOM_EFFECTS[newOutcome] || ROOM_EFFECTS.flop;
  const suspicionDelta = newEff.suspicion - oldEff.suspicion;
  const momentumDelta = newEff.momentum - oldEff.momentum;
  if (suspicionDelta !== 0) {
    const newSuspicion = Math.max(0, (room.suspicion || 0) + suspicionDelta);
    await updateRoomState(code, { suspicion: newSuspicion });
  }
  if (momentumDelta !== 0) {
    const newMomentum = Math.max(0, Math.min(5, (room.momentum || 0) + momentumDelta));
    await updateRoomState(code, { momentum: newMomentum });
  }
}

// activePrompt: the MC's posted "Roll for X, Difficulty N" the player has
// clicked to roll against (or null for a freeform roll, Difficulty 1).
// A prompt flagged drumroll:true holds back the public (room-level) part
// of the result until the roller explicitly reveals it.
// onClearPrompt: called after a roll completes, or if the player backs out.
export default function RollPanel({ code, uid, displayName, character, room, activePrompt, onClearPrompt }) {
  const [skillId, setSkillId] = useState(rollableSkills[0]?.id || '');
  const skill = core.skills.find(s => s.id === skillId);
  const [attributeId, setAttributeId] = useState(attributeOptionsForSkill(skill)[0] || '');
  const [selectedSpecialtyIdxs, setSelectedSpecialtyIdxs] = useState([]);
  const [gambitActive, setGambitActive] = useState(false);
  const [result, setResult] = useState(null);
  const [rollId, setRollId] = useState(null);
  const [revealed, setRevealed] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState(null);
  const [encoreSelection, setEncoreSelection] = useState([]);
  const [encoreUsed, setEncoreUsed] = useState(false);
  const [encoring, setEncoring] = useState(false);

  const attrOptions = attributeOptionsForSkill(skill);
  const difficulty = activePrompt?.difficulty ?? 1;
  const isDrumroll = !!activePrompt?.drumroll;

  const handleSkillChange = (nextSkillId) => {
    setSkillId(nextSkillId);
    const nextSkill = core.skills.find(s => s.id === nextSkillId);
    setAttributeId(attributeOptionsForSkill(nextSkill)[0] || '');
  };

  const toggleSpecialty = (i) => {
    setSelectedSpecialtyIdxs(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));
  };

  const specialtyBonus = selectedSpecialtyIdxs.reduce(
    (sum, i) => sum + (character.specialties?.[i]?.value || 0), 0,
  );
  const attributeValue = character.attributes?.[attributeId] || 0;
  const skillValue = character.skills?.[skillId] || 0;
  const basePool = computePoolSize(attributeValue, skillValue, specialtyBonus);
  const gambitBonus = gambitActive ? 2 : 0;
  const effectivePoolSize = basePool.total + gambitBonus;

  const handleRoll = async () => {
    setRolling(true);
    setError(null);
    setEncoreSelection([]);
    setEncoreUsed(false);
    try {
      const rolled = performRoll(effectivePoolSize, room.houseDifficulty || 0, difficulty);
      const usedGambit = gambitActive;
      const willBeRevealed = !isDrumroll;
      setResult({ ...rolled, gambitUsed: usedGambit });
      setRevealed(willBeRevealed);

      const docId = await createRoll(code, {
        rollerUid: uid,
        rollerName: displayName,
        attribute: attributeId,
        skill: skillId,
        poolSize: effectivePoolSize,
        gambitUsed: usedGambit,
        drumroll: isDrumroll,
        dice: rolled.pool.dice,
        successCount: rolled.pool.successCount,
        hasCritTens: rolled.pool.hasCritTens,
        houseDieRaw: rolled.houseDie.raw,
        houseDifficulty: rolled.houseDie.modifier,
        houseDieOutcome: rolled.houseDie.outcome,
        difficulty: rolled.difficulty,
        promptId: activePrompt?.id || null,
        outcome: rolled.outcome,
        revealed: willBeRevealed,
        flopAwarded: null, // set later by the MC in Table Chat, only relevant if outcome === 'flop'
      });
      setRollId(docId);

      // Laughter/Face are private — safe to apply right away regardless of Drumroll.
      await applyPlayerDelta(code, uid, 'flop', rolled.outcome, character);
      if (usedGambit && (rolled.outcome === 'flop' || rolled.outcome === 'corpsing')) {
        const newFace = Math.max(0, character.play.face - 1);
        await updatePlayResource(code, uid, 'face', newFace);
      }

      // Suspicion/Momentum are public — only apply now if this ISN'T a
      // held-back Drumroll. Otherwise they wait for handleReveal.
      if (willBeRevealed) {
        await applyRoomDelta(code, 'flop', rolled.outcome, room);
      }

      setGambitActive(false);
      onClearPrompt?.();
    } catch (err) {
      setError(err);
    } finally {
      setRolling(false);
    }
  };

  const handleReveal = async () => {
    if (!result || !rollId) return;
    setRevealing(true);
    setError(null);
    try {
      // Broadcast first — this is what makes everyone else's client start
      // playing the drumroll too (see RoomAudio). Then play our own local
      // copy and wait for it to actually finish before the result becomes
      // real — the whole point of a drumroll is that it comes BEFORE the
      // reveal, not alongside it.
      await startDrumrollReveal(code, rollId);
      await playDrumrollLocally();
      await revealRoll(code, rollId);
      await applyRoomDelta(code, 'flop', result.outcome, room);
      setRevealed(true);
    } catch (err) {
      setError(err);
    } finally {
      setRevealing(false);
    }
  };

  // Clears the current result entirely — this is what actually unblocks
  // the Roll button again, and doubles as "skip Encore, I'm done with
  // this roll" when clicked before Encore's ever used. For a Drumroll
  // roll, this stays disabled until revealed — starting a new roll on
  // top of an un-revealed one would leave it dangling and forgotten.
  const handleFinishRoll = () => {
    setResult(null);
    setRollId(null);
    setRevealed(true);
    setEncoreUsed(false);
    setEncoreSelection([]);
  };

  const encoreableIndices = result ? result.pool.dice.map((d, i) => i) : [];
  const maxEncoreDice = Math.min(3, encoreableIndices.length, Math.floor(character.play?.laughter || 0));

  const toggleEncoreDie = (i) => {
    setEncoreSelection(prev => {
      if (prev.includes(i)) return prev.filter(x => x !== i);
      if (prev.length >= maxEncoreDice) return prev;
      return [...prev, i];
    });
  };

  const handleEncore = async () => {
    if (encoreSelection.length === 0 || !result) return;
    setEncoring(true);
    setError(null);
    try {
      const newDice = [...result.pool.dice];
      const rerolledOld = [];
      const rerolledNew = [];
      for (const i of encoreSelection) {
        rerolledOld.push(newDice[i]);
        const fresh = rollDie(10);
        newDice[i] = fresh;
        rerolledNew.push(fresh);
      }

      const newPool = derivePoolResult(newDice);
      const newOutcome = resolveRollOutcome(newPool, result.houseDie.outcome, result.difficulty);

      await createRoll(code, {
        type: 'encore',
        parentRollId: rollId,
        rollerUid: uid,
        rollerName: displayName,
        rerolledIndices: encoreSelection,
        rerolledOldValues: rerolledOld,
        rerolledNewValues: rerolledNew,
        laughterSpent: encoreSelection.length,
        newDice,
        newSuccessCount: newPool.successCount,
        newHasCritTens: newPool.hasCritTens,
        newOutcome,
        outcome: newOutcome, // duplicated so ChatLog's generic outcome coloring works unchanged
      });

      // Pay the Laughter cost first (1 per die), then apply whatever the
      // outcome itself changed on top of that. Both are private, safe now.
      const afterCost = Math.max(0, character.play.laughter - encoreSelection.length);
      await updatePlayResource(code, uid, 'laughter', afterCost);
      const characterAfterCost = { ...character, play: { ...character.play, laughter: afterCost } };
      await applyPlayerDelta(code, uid, result.outcome, newOutcome, characterAfterCost);

      // Room-level effects only apply now if this roll is already
      // revealed (normal roll, or a Drumroll that's already been shown).
      // Otherwise they stay deferred — handleReveal will apply the full
      // flop->finalOutcome delta in one shot later.
      if (revealed) {
        await applyRoomDelta(code, result.outcome, newOutcome, room);
      }

      setResult({ ...result, pool: newPool, outcome: newOutcome });
      setEncoreUsed(true);
      setEncoreSelection([]);
    } catch (err) {
      setError(err);
    } finally {
      setEncoring(false);
    }
  };

  return (
    <div id="roll-panel-self" style={{ marginTop: 10, border: '0.5px solid var(--border)', borderRadius: 'var(--radius)', padding: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Make a Roll</div>

      {activePrompt && (
        <div
          style={{
            fontSize: 12, marginBottom: 8, padding: '6px 8px',
            background: 'var(--accent-bg)', color: 'var(--accent-text)', borderRadius: 'var(--radius)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6,
          }}
        >
          <span>
            Rolling against: "{activePrompt.text}" (Difficulty {activePrompt.difficulty})
            {isDrumroll ? ' 🥁 Drumroll — held from the table until you reveal it' : ''}
          </span>
          <button type="button" className="small-btn" onClick={() => onClearPrompt?.()}>Roll freely instead</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        <select value={skillId} onChange={(e) => handleSkillChange(e.target.value)}>
          {rollableSkills.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({character.skills?.[s.id] || 0})</option>
          ))}
        </select>

        {attrOptions.length > 1 ? (
          <select value={attributeId} onChange={(e) => setAttributeId(e.target.value)}>
            {attrOptions.map((aid) => {
              const attr = core.attributes.find((a) => a.id === aid);
              return <option key={aid} value={aid}>{attr?.name} ({character.attributes?.[aid] || 0})</option>;
            })}
          </select>
        ) : (
          <span style={{ fontSize: 13 }}>
            {core.attributes.find((a) => a.id === attributeId)?.name} ({attributeValue})
          </span>
        )}
      </div>

      {character.specialties?.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          {character.specialties.map((s, i) => (
            <label key={i} style={{ fontSize: 12, marginRight: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedSpecialtyIdxs.includes(i)}
                onChange={() => toggleSpecialty(i)}
                style={{ marginRight: 3 }}
              />
              {s.text} (+{s.value})
            </label>
          ))}
        </div>
      )}

      <label style={{ fontSize: 12, display: 'block', marginBottom: 6, cursor: result ? 'default' : 'pointer' }}>
        <input
          type="checkbox"
          checked={gambitActive}
          disabled={!!result}
          onChange={(e) => setGambitActive(e.target.checked)}
          style={{ marginRight: 4 }}
        />
        Creative Gambit — the table's agreed this earns +2 dice (any Failure costs 1 extra Face)
      </label>

      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
        Pool: {attributeValue} + {skillValue}{specialtyBonus ? ` + ${specialtyBonus}` : ''}{gambitActive ? ' + 2 (Gambit)' : ''} = <strong>{effectivePoolSize} dice</strong>
        {' · '}Difficulty {difficulty}
        {' · '}House Difficulty: {room.houseDifficulty > 0 ? '+' : ''}{room.houseDifficulty || 0}
      </div>

      <button type="button" className="small-btn" onClick={handleRoll} disabled={rolling || !!result || effectivePoolSize <= 0}>
        {rolling ? 'Rolling…' : 'Roll'}
      </button>

      {result && (
        <div style={{ marginTop: 8, fontSize: 13 }}>
          {!revealed && (
            <p className="helper-text" style={{ marginTop: 0, fontWeight: 600, color: 'var(--accent-text)' }}>
              🥁 This result is only visible to you and the MC until you reveal it.
            </p>
          )}
          <div>
            Dice: {result.pool.dice.join(', ')} — {result.pool.successCount} success{result.pool.successCount === 1 ? '' : 'es'}
            {result.pool.hasCritTens ? ' (2+ natural 10s!)' : ''}
          </div>
          <div>
            House Die: {result.houseDie.raw}{result.houseDie.modifier ? ` ${result.houseDie.modifier > 0 ? '+' : ''}${result.houseDie.modifier}` : ''} = {result.houseDie.total}
            {' '}({result.houseDie.outcome === 'cheers' ? 'Cheers' : 'Jeers'})
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>{OUTCOME_LABELS[result.outcome]}</div>
          {result.outcome !== 'flop' && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{OUTCOME_DESCRIPTIONS[result.outcome]}</div>
          )}
          {result.outcome === 'flop' && (
            <p className="helper-text" style={{ marginTop: 4, marginBottom: 0 }}>
              The MC will decide the Laughter award in Table Chat.
            </p>
          )}

          {!encoreUsed && encoreableIndices.length > 0 && (
            <div style={{ marginTop: 8, borderTop: '0.5px solid var(--border)', paddingTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Encore — reroll up to {maxEncoreDice > 0 ? maxEncoreDice : 3} dice (any result, even a good one), 1 Laughter each
              </div>
              {maxEncoreDice === 0 && (
                <p className="helper-text" style={{ margin: 0 }}>Not enough Laughter to Encore right now.</p>
              )}
              {maxEncoreDice > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                    {encoreableIndices.map((i) => {
                      const value = result.pool.dice[i];
                      const tag = value === 10 ? ' (10!)' : value >= 8 ? ' (success)' : '';
                      return (
                        <label key={i} style={{ fontSize: 12, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={encoreSelection.includes(i)}
                            onChange={() => toggleEncoreDie(i)}
                            disabled={!encoreSelection.includes(i) && encoreSelection.length >= maxEncoreDice}
                            style={{ marginRight: 3 }}
                          />
                          die: {value}{tag}
                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="small-btn"
                    onClick={handleEncore}
                    disabled={encoring || encoreSelection.length === 0}
                  >
                    {encoring ? 'Rerolling…' : `Encore (${encoreSelection.length} Laughter)`}
                  </button>
                </>
              )}
            </div>
          )}
          {encoreUsed && (
            <p className="helper-text" style={{ marginTop: 8, marginBottom: 0 }}>Encore used on this roll.</p>
          )}

          {!revealed && (
            <button
              type="button"
              className="small-btn"
              onClick={handleReveal}
              disabled={revealing}
              style={{ marginTop: 8, fontWeight: 700 }}
            >
              {revealing ? 'Revealing…' : '🥁 Reveal to the table'}
            </button>
          )}

          <button
            type="button"
            className="small-btn"
            onClick={handleFinishRoll}
            disabled={!revealed}
            title={!revealed ? 'Reveal this roll before starting a new one' : undefined}
            style={{ marginTop: 8, marginLeft: !revealed ? 8 : 0 }}
          >
            {encoreUsed || encoreableIndices.length === 0 ? 'Roll again' : 'Skip Encore, roll again'}
          </button>
        </div>
      )}

      {error && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>
          Couldn't save that roll ({error.code || error.message}).
        </p>
      )}
    </div>
  );
}
