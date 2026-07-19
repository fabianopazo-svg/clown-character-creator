import { useEffect, useMemo, useRef, useState } from 'react';
import { subscribePrompts, subscribeRollLog, subscribeSuspicionSpends, subscribeGiftIntents, createPrompt, awardFlopLaughter } from '../utils/roomsApi';
import { OUTCOME_LABELS } from '../utils/rollEngine';
import RollReactions from './RollReactions';
import core from '../data/core.json';

const OUTCOME_COLORS = {
  clean_success: '#2f7a3d',
  complication: '#a67c00',
  flop: '#0c447c',
  corpsing: '#c0392b',
  critical_cheers: '#591ad7',
  critical_jeers: '#591ad7',
};

const SPEND_REASON_LABELS = {
  boss_activation: 'Boss extra activation',
  complication: 'Introduce a complication',
  summon_ushers: 'Summon the Ushers',
  force_face_roll: 'Force a Face roll',
  seize_spotlight: 'Seize the Spotlight',
  let_enemy_act: 'Let an enemy act',
  other: 'Other',
};

// A pending local write (before the server acks serverTimestamp()) has a
// null createdAt momentarily — treat that as "now" so it still sorts to
// the bottom instead of crashing or jumping to the top. A second render
// fires once the real timestamp lands, settling it into place.
function toMillis(ts) {
  if (!ts) return Date.now();
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  return Date.now();
}

// A roll is visible in full if it's not a held-back Drumroll (revealed
// !== false covers old data with no field at all, and normal non-drumroll
// rolls), or if the viewer is the roller themself, or the MC (who gets to
// peek early to help pace the reveal). NOTE: this is client-side masking,
// not a real security boundary — the underlying Firestore doc is readable
// by the whole room the same as any other roll (see firestore.rules).
// That's a deliberate trade-off: Drumroll is a social/pacing device for a
// trusted table, not a defense against someone opening devtools.
function canSeeRoll(roll, uid, isMc) {
  return roll.revealed !== false || isMc || roll.rollerUid === uid;
}

// Visible to everyone in the room. Shows every roll prompt the MC has
// posted and every roll anyone's made, merged into one chronological
// feed. Players click a prompt's "Roll against this" to pre-fill their
// own RollPanel with that Difficulty (see RoomLobby's activePrompt
// state). The MC posts new prompts here, and resolves Flop awards here
// too — that judgment call belongs to the MC, not the roller.
export default function ChatLog({ code, uid, isMc, onSelectPrompt, activePromptId }) {
  const [prompts, setPrompts] = useState([]);
  const [rolls, setRolls] = useState([]);
  const [spends, setSpends] = useState([]);
  const [giftIntents, setGiftIntents] = useState([]);
  const [promptText, setPromptText] = useState('');
  const [promptDifficulty, setPromptDifficulty] = useState(1);
  const [promptDrumroll, setPromptDrumroll] = useState(false);
  const [posting, setPosting] = useState(false);
  const [awardingId, setAwardingId] = useState(null);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubPrompts = subscribePrompts(code, setPrompts);
    const unsubRolls = subscribeRollLog(code, setRolls);
    const unsubSpends = subscribeSuspicionSpends(code, setSpends);
    const unsubGiftIntents = subscribeGiftIntents(code, setGiftIntents);
    return () => {
      unsubPrompts();
      unsubRolls();
      unsubSpends();
      unsubGiftIntents();
    };
  }, [code]);

  const rollsById = useMemo(() => {
    const map = new Map();
    for (const r of rolls) map.set(r.id, r);
    return map;
  }, [rolls]);

  const entries = useMemo(() => {
    const promptEntries = prompts.map((p) => ({ ...p, entryType: 'prompt', _ts: toMillis(p.createdAt) }));
    const rollEntries = rolls.map((r) => ({ ...r, entryType: 'roll', _ts: toMillis(r.createdAt) }));
    const spendEntries = spends.map((s) => ({ ...s, entryType: 'spend', _ts: toMillis(s.createdAt) }));
    const intentEntries = giftIntents.map((g) => ({ ...g, entryType: 'giftIntent', _ts: toMillis(g.createdAt) }));
    return [...promptEntries, ...rollEntries, ...spendEntries, ...intentEntries].sort((a, b) => a._ts - b._ts);
  }, [prompts, rolls, spends, giftIntents]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  const handlePostPrompt = async () => {
    if (!promptText.trim()) return;
    setPosting(true);
    setError(null);
    try {
      await createPrompt(code, {
        text: promptText.trim(),
        difficulty: Math.max(1, Number(promptDifficulty) || 1),
        postedByUid: uid,
        drumroll: promptDrumroll,
      });
      setPromptText('');
      setPromptDifficulty(1);
      setPromptDrumroll(false);
    } catch (err) {
      setError(err);
    } finally {
      setPosting(false);
    }
  };

  const handleAward = async (roll, amount) => {
    setAwardingId(roll.id);
    setError(null);
    try {
      await awardFlopLaughter(code, roll.id, roll.rollerUid, amount);
    } catch (err) {
      setError(err);
    } finally {
      setAwardingId(null);
    }
  };

  return (
    <>
      <div className="section-title" style={{ marginTop: 0 }}>Table Chat</div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', minHeight: 200, marginBottom: 10 }}>
        {entries.length === 0 && (
          <p className="helper-text">Nothing yet — rolls and MC prompts will show up here for the whole table.</p>
        )}
        {entries.map((entry) => {
          if (entry.entryType === 'prompt') {
            const isActive = entry.id === activePromptId;
            return (
              <div
                key={entry.id}
                style={{
                  fontSize: 13,
                  marginBottom: 8,
                  padding: '6px 8px',
                  background: isActive ? 'var(--accent-bg)' : 'var(--surface-1)',
                  borderRadius: 'var(--radius)',
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 2 }}>
                  MC: {entry.text}{entry.drumroll ? ' 🥁' : ''}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Difficulty {entry.difficulty}</div>
                {!isMc && (
                  <button type="button" className="small-btn" onClick={() => onSelectPrompt(entry)}>
                    {isActive ? 'Rolling against this…' : 'Roll against this'}
                  </button>
                )}
              </div>
            );
          }

          if (entry.entryType === 'giftIntent') {
            return (
              <div
                key={entry.id}
                style={{ fontSize: 12, marginBottom: 8, paddingBottom: 8, borderBottom: '0.5px solid var(--border)', fontStyle: 'italic' }}
              >
                🎁 <strong>{entry.playerName}</strong> wants to use <strong>{entry.giftName}</strong>
              </div>
            );
          }

          if (entry.entryType === 'spend') {
            return (
              <div
                key={entry.id}
                style={{ fontSize: 12, marginBottom: 8, paddingBottom: 8, borderBottom: '0.5px solid var(--border)', color: '#a67c00' }}
              >
                🎭 MC spent <strong>{entry.amount}</strong> Suspicion — {SPEND_REASON_LABELS[entry.reason] || entry.reason}
                {entry.note ? `: ${entry.note}` : ''}
              </div>
            );
          }

          if (entry.type === 'encore') {
            const parent = rollsById.get(entry.parentRollId);
            const visible = parent ? canSeeRoll(parent, uid, isMc) : true;
            if (!visible) return null; // parent's still a held-back Drumroll — say nothing yet

            return (
              <div
                key={entry.id}
                style={{ fontSize: 12, marginBottom: 8, paddingBottom: 8, borderBottom: '0.5px solid var(--border)', color: 'var(--muted)' }}
              >
                ↻ <strong>{entry.rollerName}</strong> used Encore — rerolled {entry.rerolledOldValues?.join(', ')} → {entry.rerolledNewValues?.join(', ')}
                {' '}({entry.laughterSpent} Laughter).
                <div>All dice now: {entry.newDice?.join(', ')}</div>
                New result: {entry.newSuccessCount} success{entry.newSuccessCount === 1 ? '' : 'es'}
                {' → '}
                <span style={{ color: OUTCOME_COLORS[entry.newOutcome], fontWeight: 700 }}>{OUTCOME_LABELS[entry.newOutcome]}</span>
              </div>
            );
          }

          const visible = canSeeRoll(entry, uid, isMc);
          if (!visible) {
            const prompt = prompts.find((p) => p.id === entry.promptId);
            return (
              <div
                key={entry.id}
                style={{ fontSize: 13, marginBottom: 8, paddingBottom: 8, borderBottom: '0.5px solid var(--border)', color: 'var(--muted)', fontStyle: 'italic' }}
              >
                🥁 <strong>{entry.rollerName}</strong> is rolling against "{prompt?.text || 'a prompt'}"… reveal pending.
              </div>
            );
          }

          const skill = core.skills.find((s) => s.id === entry.skill);
          const attr = core.attributes.find((a) => a.id === entry.attribute);
          const isUnresolvedFlop = entry.outcome === 'flop' && entry.flopAwarded == null;

          return (
            <div
              key={entry.id}
              style={{ fontSize: 13, marginBottom: 8, paddingBottom: 8, borderBottom: '0.5px solid var(--border)' }}
            >
              {entry.drumroll && entry.revealed === false && (
                <div style={{ fontSize: 11, color: 'var(--accent-text)', fontWeight: 700 }}>🥁 Drumroll — only you and the MC can see this so far</div>
              )}
              {entry.isNpcRoll ? (
                <>🎭 <strong>{entry.rollerName}</strong> rolls ({entry.poolSize} dice, Diff {entry.difficulty ?? 1}): {entry.successCount} success{entry.successCount === 1 ? '' : 'es'}</>
              ) : (
                <><strong>{entry.rollerName}</strong> — {attr?.name}+{skill?.name} ({entry.poolSize} dice{entry.gambitUsed ? ', Gambit' : ''}, Diff {entry.difficulty ?? 1}): {entry.successCount} success{entry.successCount === 1 ? '' : 'es'}</>
              )}
              {entry.giftName && <span style={{ color: 'var(--accent-text)' }}> · Gift: {entry.giftName}</span>}
              {entry.commonAction && <span style={{ color: 'var(--muted)' }}> · {entry.commonAction}</span>}
              {entry.reaction && <span style={{ color: 'var(--muted)' }}> · Reaction: {entry.reaction}</span>}
              {' · '}House Die {entry.houseDieOutcome === 'cheers' ? 'Cheers' : 'Jeers'}
              {' → '}
              <span style={{ color: OUTCOME_COLORS[entry.outcome], fontWeight: 700 }}>{OUTCOME_LABELS[entry.outcome]}</span>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Dice: {entry.dice?.join(', ')}</div>

              {isMc && isUnresolvedFlop && (
                <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button type="button" className="small-btn" disabled={awardingId === entry.id} onClick={() => handleAward(entry, 0)}>
                    No bonus
                  </button>
                  <button type="button" className="small-btn" disabled={awardingId === entry.id} onClick={() => handleAward(entry, 1)}>
                    +1 Laughter
                  </button>
                  <button type="button" className="small-btn" disabled={awardingId === entry.id} onClick={() => handleAward(entry, 2)}>
                    +2 Laughter
                  </button>
                </div>
              )}
              {entry.outcome === 'flop' && entry.flopAwarded != null && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {entry.flopAwarded > 0 ? `Awarded ${entry.flopAwarded} Laughter` : 'No bonus given'}
                </div>
              )}
              <RollReactions code={code} rollId={entry.id} uid={uid} />
            </div>
          );
        })}
      </div>

      {isMc && (
        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
          <div style={{ fontSize: 12, marginBottom: 4 }}>Post a roll prompt</div>
          <input
            type="text"
            placeholder="Roll for climbing the wall…"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            style={{ width: '100%', marginBottom: 4, boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12 }}>
              Difficulty{' '}
              <input
                type="number"
                min={1}
                value={promptDifficulty}
                onChange={(e) => setPromptDifficulty(e.target.value)}
                style={{ width: 50 }}
              />
            </label>
            <label style={{ fontSize: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={promptDrumroll}
                onChange={(e) => setPromptDrumroll(e.target.checked)}
                style={{ marginRight: 3 }}
              />
              🥁 Drumroll
            </label>
            <button type="button" className="small-btn" onClick={handlePostPrompt} disabled={posting || !promptText.trim()}>
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>
          Something didn't save ({error.code || error.message}).
        </p>
      )}
    </>
  );
}
