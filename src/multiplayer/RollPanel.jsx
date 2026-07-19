import { useState } from 'react';
import core from '../data/core.json';
import { computePoolSize, performRoll, derivePoolResult, resolveRollOutcome, rollDie, OUTCOME_LABELS, OUTCOME_DESCRIPTIONS } from '../utils/rollEngine';
import { createRoll, updatePlayResource, updateRoomState, revealRoll, startDrumrollReveal } from '../utils/roomsApi';
import { playDrumrollLocally } from '../utils/soundController';
import { getKnownGifts } from '../utils/knownGifts';
import { applyGiftCost } from '../utils/applyGiftCost';
import { applyGiftMechanicalEffect } from '../utils/applyGiftMechanicalEffect';
import { formatCostShort } from '../utils/formatCost';

import { getPerformanceRankBonus } from '../utils/calculations';

// Toughness is flatSoak — it's never rolled. Performance lives outside
// core.skills entirely (it's a tenth, separate stat — see core.json's
// top-level `performance` field), so it's added in here as a pseudo-skill
// rather than being silently unrollable.
const rollableSkills = [
  ...core.skills,
  { id: 'performance', name: 'Performance' },
];

// character.performanceDots stores only the PURCHASED (extra) dots — the
// wizard and PDF both separately add the guaranteed base free dot(s)
// (1 normally, 2 if Tent-Born, per core.json's performance.baseFreeDots)
// plus any Rank-granted bonus on top. Reading performanceDots alone here
// was exactly the bug: a character who never bought extra dots showed as
// Performance 0 in the room, when the true minimum is always at least 1.
function skillValueFor(character, skillId, renown) {
  if (skillId === 'performance') {
    const base = character.tentBorn?.isTentBorn ? core.performance.baseFreeDotsTentBorn : core.performance.baseFreeDots;
    const rankBonus = getPerformanceRankBonus(renown);
    return base + (character.performanceDots || 0) + rankBonus;
  }
  return character.skills?.[skillId] || 0;
}

const COMMON_ACTIONS = ['Attack', 'Move', 'Search', 'Dialogue', 'Think', 'Unique'];
const REACTIONS = ['Defend', 'Dodge', 'Unique'];

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

// Resolves a (possibly type:'choice') mechanicalEffect down to the single
// concrete effect that's actually being applied, given which variant (if
// any) the player picked.
function resolveEffectVariant(mechanicalEffect, variantIndex) {
  if (!mechanicalEffect) return null;
  if (mechanicalEffect.type === 'choice') {
    return mechanicalEffect.variants[variantIndex] ?? null;
  }
  return mechanicalEffect;
}

// activePrompt: the MC's posted "Roll for X, Difficulty N" the player has
// clicked to roll against (or null for a freeform roll, Difficulty 1).
// A prompt flagged drumroll:true holds back the public (room-level) part
// of the result until the roller explicitly reveals it.
// players: the room's full roster, needed for Gift effects that target
// another player (heal an ally, etc).
// onClearPrompt: called after a roll completes, or if the player backs out.
export default function RollPanel({ code, uid, displayName, character, room, players, renown, activePrompt, onClearPrompt }) {
  const [skillId, setSkillId] = useState(rollableSkills[0]?.id || '');
  const [attributeId, setAttributeId] = useState(core.attributes[0]?.id || '');
  const [selectedSpecialtyIdxs, setSelectedSpecialtyIdxs] = useState([]);
  const [gambitActive, setGambitActive] = useState(false);
  const [actionCategory, setActionCategory] = useState(''); // '' | 'gift' | 'common'
  const [selectedGiftKey, setSelectedGiftKey] = useState('');
  const [selectedCommonAction, setSelectedCommonAction] = useState('');
  const [selectedReaction, setSelectedReaction] = useState('');
  const [variableCostAmount, setVariableCostAmount] = useState(1);
  const [effectVariantIndex, setEffectVariantIndex] = useState(0);
  const [effectTargetUids, setEffectTargetUids] = useState([]);
  const [effectAmount, setEffectAmount] = useState(1);
  const [result, setResult] = useState(null);
  const [rollId, setRollId] = useState(null);
  const [revealed, setRevealed] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [error, setError] = useState(null);
  const [encoreSelection, setEncoreSelection] = useState([]);
  const [encoreUsed, setEncoreUsed] = useState(false);
  const [encoring, setEncoring] = useState(false);

  const difficulty = activePrompt?.difficulty ?? 1;
  const isDrumroll = !!activePrompt?.drumroll;
  const { knownGifts } = getKnownGifts(character);
  const selectedGift = knownGifts.find((g) => g.key === selectedGiftKey) || null;

  const variableCostPart = selectedGift?.cost?.parts?.find((p) => p.min);
  const mechanicalEffect = selectedGift?.mechanicalEffect || null;
  const effectVariant = resolveEffectVariant(mechanicalEffect, effectVariantIndex);
  const otherPlayers = (players || []).filter((p) => p.uid !== uid);

  // What still needs to be picked before this counts as "ready to roll"?
  const needsVariableCostAmount = !!variableCostPart;
  const needsVariantChoice = mechanicalEffect?.type === 'choice';
  const needsTargetChoice = effectVariant && (effectVariant.targetMode === 'choose_one' || effectVariant.targetMode === 'choose_up_to_n');
  const needsEffectAmount = effectVariant?.amountMode === 'player_choice';

  const effectSetupComplete =
    (!needsVariableCostAmount || variableCostAmount >= (variableCostPart?.amount || 1))
    && (!needsVariantChoice || effectVariantIndex != null)
    && (!needsTargetChoice || effectTargetUids.length > 0)
    && (!needsEffectAmount || effectAmount > 0);

  const actionChosen =
    (actionCategory === 'gift' && selectedGiftKey && effectSetupComplete)
    || (actionCategory === 'common' && selectedCommonAction)
    || (actionCategory === 'reaction' && selectedReaction);

  const toggleSpecialty = (i) => {
    setSelectedSpecialtyIdxs(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]));
  };

  const handleSelectGift = (key) => {
    setSelectedGiftKey(key);
    setVariableCostAmount(1);
    setEffectVariantIndex(0);
    setEffectTargetUids([]);
    setEffectAmount(1);
  };

  const toggleEffectTarget = (targetUid, maxTargets) => {
    setEffectTargetUids((prev) => {
      if (prev.includes(targetUid)) return prev.filter((u) => u !== targetUid);
      if (maxTargets && prev.length >= maxTargets) return prev;
      return [...prev, targetUid];
    });
  };

  const specialtyBonus = selectedSpecialtyIdxs.reduce(
    (sum, i) => sum + (character.specialties?.[i]?.value || 0), 0,
  );
  const attributeValue = character.attributes?.[attributeId] || 0;
  const skillValue = skillValueFor(character, skillId, renown);
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
        actionCategory,
        giftName: actionCategory === 'gift' ? selectedGift?.name || null : null,
        commonAction: actionCategory === 'common' ? selectedCommonAction : null,
        reaction: actionCategory === 'reaction' ? selectedReaction : null,
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

      if (actionCategory === 'gift' && selectedGift) {
        // A variable ("N+") cost uses whatever amount the player chose,
        // not the gift's listed minimum — everything else about the cost
        // (other fixed parts, if any) applies as normal.
        const costToApply = variableCostPart
          ? {
              ...selectedGift.cost,
              parts: selectedGift.cost.parts.map((p) => (p === variableCostPart ? { ...p, amount: variableCostAmount } : p)),
            }
          : selectedGift.cost;
        await applyGiftCost(code, uid, character, costToApply);

        // The Gift's mechanical effect (heal an ally, transfer Face, etc)
        // — paid for and applied once, right when the action is
        // finalized, same as the cost above. Independent of the roll's
        // outcome (using the Gift is the action; success/failure is a
        // separate question the outcome already handles).
        if (mechanicalEffect && effectVariant) {
          let resolvedTargetUids = [];
          if (effectVariant.targetMode === 'self') resolvedTargetUids = [uid];
          else if (effectVariant.targetMode === 'choose_one' || effectVariant.targetMode === 'choose_up_to_n') resolvedTargetUids = effectTargetUids;
          else if (effectVariant.targetMode === 'all_players') resolvedTargetUids = otherPlayers.map((p) => p.uid);

          await applyGiftMechanicalEffect(code, uid, effectVariant, {
            resolvedTargetUids,
            chosenAmount: effectAmount,
          });
        }
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
    setActionCategory('');
    setSelectedGiftKey('');
    setSelectedCommonAction('');
    setSelectedReaction('');
    setVariableCostAmount(1);
    setEffectVariantIndex(0);
    setEffectTargetUids([]);
    setEffectAmount(1);
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

      {!result && (
        <div style={{ marginBottom: 8, padding: '6px 8px', border: '0.5px solid var(--border)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>What are you doing?</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
            <label style={{ fontSize: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="actionCategory"
                checked={actionCategory === 'gift'}
                onChange={() => { setActionCategory('gift'); setSelectedCommonAction(''); setSelectedReaction(''); }}
                style={{ marginRight: 4 }}
              />
              Gift
            </label>
            <label style={{ fontSize: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="actionCategory"
                checked={actionCategory === 'common'}
                onChange={() => { setActionCategory('common'); handleSelectGift(''); setSelectedReaction(''); }}
                style={{ marginRight: 4 }}
              />
              Common Action
            </label>
            <label style={{ fontSize: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                name="actionCategory"
                checked={actionCategory === 'reaction'}
                onChange={() => { setActionCategory('reaction'); handleSelectGift(''); setSelectedCommonAction(''); }}
                style={{ marginRight: 4 }}
              />
              Reaction
            </label>
          </div>

          {actionCategory === 'gift' && (
            knownGifts.length === 0 ? (
              <p className="helper-text" style={{ margin: 0 }}>No known Gifts to choose from.</p>
            ) : (
              <>
                <select value={selectedGiftKey} onChange={(e) => handleSelectGift(e.target.value)} style={{ width: '100%', marginBottom: 6 }}>
                  <option value="">Choose a Gift…</option>
                  {knownGifts.map((g) => (
                    <option key={g.key} value={g.key}>{g.name} — {formatCostShort(g.cost)}</option>
                  ))}
                </select>

                {needsVariableCostAmount && (
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    Spend how many {variableCostPart.resource}?{' '}
                    <input
                      type="number"
                      min={variableCostPart.amount || 1}
                      value={variableCostAmount}
                      onChange={(e) => setVariableCostAmount(Math.max(variableCostPart.amount || 1, Number(e.target.value) || 0))}
                      style={{ width: 60 }}
                    />
                  </label>
                )}

                {needsVariantChoice && (
                  <div style={{ marginBottom: 6 }}>
                    {mechanicalEffect.variants.map((v, i) => (
                      <label key={i} style={{ fontSize: 12, display: 'block', cursor: 'pointer', marginBottom: 2 }}>
                        <input
                          type="radio"
                          name="effectVariant"
                          checked={effectVariantIndex === i}
                          onChange={() => { setEffectVariantIndex(i); setEffectTargetUids([]); }}
                          style={{ marginRight: 4 }}
                        />
                        {v.label}
                      </label>
                    ))}
                  </div>
                )}

                {needsTargetChoice && effectVariant.targetMode === 'choose_one' && (
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    Target:{' '}
                    <select
                      value={effectTargetUids[0] || ''}
                      onChange={(e) => setEffectTargetUids(e.target.value ? [e.target.value] : [])}
                    >
                      <option value="">Choose…</option>
                      <option value={uid}>Yourself</option>
                      {otherPlayers.map((p) => (
                        <option key={p.uid} value={p.uid}>{p.displayName}</option>
                      ))}
                    </select>
                  </label>
                )}

                {needsTargetChoice && effectVariant.targetMode === 'choose_up_to_n' && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 12, marginBottom: 2 }}>
                      Targets (up to {effectVariant.maxTargets}):
                    </div>
                    {otherPlayers.length === 0 ? (
                      <p className="helper-text" style={{ margin: 0 }}>No other players in the room to target.</p>
                    ) : (
                      otherPlayers.map((p) => (
                        <label key={p.uid} style={{ fontSize: 12, marginRight: 10, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={effectTargetUids.includes(p.uid)}
                            onChange={() => toggleEffectTarget(p.uid, effectVariant.maxTargets)}
                            disabled={!effectTargetUids.includes(p.uid) && effectTargetUids.length >= effectVariant.maxTargets}
                            style={{ marginRight: 3 }}
                          />
                          {p.displayName}
                        </label>
                      ))
                    )}
                  </div>
                )}

                {effectVariant?.targetMode === 'all_players' && (
                  <p className="helper-text" style={{ margin: '0 0 6px' }}>
                    Applies to all {otherPlayers.length} other player{otherPlayers.length === 1 ? '' : 's'} in the room.
                  </p>
                )}

                {needsEffectAmount && (
                  <label style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                    Amount:{' '}
                    <input
                      type="number"
                      min={1}
                      value={effectAmount}
                      onChange={(e) => setEffectAmount(Math.max(1, Number(e.target.value) || 0))}
                      style={{ width: 60 }}
                    />
                  </label>
                )}
              </>
            )
          )}

          {actionCategory === 'common' && (
            <select value={selectedCommonAction} onChange={(e) => setSelectedCommonAction(e.target.value)} style={{ width: '100%' }}>
              <option value="">Choose an action…</option>
              {COMMON_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          )}

          {actionCategory === 'reaction' && (
            <select value={selectedReaction} onChange={(e) => setSelectedReaction(e.target.value)} style={{ width: '100%' }}>
              <option value="">Choose a reaction…</option>
              {REACTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        <select value={skillId} onChange={(e) => setSkillId(e.target.value)}>
          {rollableSkills.map((s) => (
            <option key={s.id} value={s.id}>{s.name} ({skillValueFor(character, s.id, renown)})</option>
          ))}
        </select>

        <select value={attributeId} onChange={(e) => setAttributeId(e.target.value)}>
          {core.attributes.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({character.attributes?.[a.id] || 0})</option>
          ))}
        </select>
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

      <button type="button" className="small-btn" onClick={handleRoll} disabled={rolling || !!result || effectivePoolSize <= 0 || !actionChosen}>
        {rolling ? 'Rolling…' : 'Roll'}
      </button>
      {!result && !actionChosen && (
        <span className="helper-text" style={{ marginLeft: 8 }}>Choose a Gift or Common Action first.</span>
      )}

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
