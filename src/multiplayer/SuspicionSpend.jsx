import { useState } from 'react';
import { spendSuspicion } from '../utils/roomsApi';

const REASONS = [
  { id: 'boss_activation', label: 'Boss extra activation' },
  { id: 'complication', label: 'Introduce a complication' },
  { id: 'summon_ushers', label: 'Summon the Ushers' },
  { id: 'force_face_roll', label: 'Force a Face roll' },
  { id: 'seize_spotlight', label: 'Seize the Spotlight' },
  { id: 'let_enemy_act', label: "Let an enemy act (after a Corpsing)" },
  { id: 'other', label: 'Other' },
];

export default function SuspicionSpend({ code, uid, room }) {
  const [reason, setReason] = useState(REASONS[0].id);
  const [amount, setAmount] = useState(1);
  const [note, setNote] = useState('');
  const [spending, setSpending] = useState(false);
  const [error, setError] = useState(null);

  const currentSuspicion = room?.suspicion ?? 0;

  const handleSpend = async () => {
    setSpending(true);
    setError(null);
    try {
      await spendSuspicion(code, uid, { reason, amount: Number(amount) || 0, note }, currentSuspicion);
      setNote('');
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setSpending(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Spend Suspicion</div>
      <p className="helper-text" style={{ marginTop: 0 }}>
        The rulebook doesn't fix a price for any of these — that's your call each time. Current
        Suspicion: <strong>{currentSuspicion}</strong>.
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
        <label style={{ fontSize: 12 }}>
          Amount{' '}
          <input
            type="number"
            min={0}
            max={currentSuspicion}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: 50 }}
          />
        </label>
      </div>

      {reason === 'other' && (
        <input
          type="text"
          placeholder="What's this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', marginBottom: 6 }}
        />
      )}

      <button
        type="button"
        className="small-btn"
        onClick={handleSpend}
        disabled={spending || Number(amount) <= 0 || Number(amount) > currentSuspicion}
      >
        {spending ? 'Spending…' : `Spend ${amount || 0} Suspicion`}
      </button>

      {(reason === 'seize_spotlight' || reason === 'let_enemy_act') && (
        <p className="helper-text" style={{ marginTop: 4, marginBottom: 0 }}>
          This will also set the Spotlight to "The MC / an enemy."
        </p>
      )}

      {error && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>{error}</p>
      )}
    </div>
  );
}
