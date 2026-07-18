import { useEffect, useState } from 'react';
import { subscribeReactions, setReaction, removeReaction } from '../utils/roomsApi';

const EMOJI_PALETTE = ['😂', '😮', '🎉', '😬', '👏'];

// Purely optional flavor — nobody's required to react to anything. One
// player can only have one reaction per roll at a time; clicking a
// different emoji swaps it, clicking your current one removes it.
export default function RollReactions({ code, rollId, uid }) {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeReactions(code, rollId, setReactions);
    return unsubscribe;
  }, [code, rollId]);

  const myReaction = reactions.find((r) => r.uid === uid)?.emoji;
  const counts = {};
  for (const r of reactions) {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
  }

  const handleClick = (emoji) => {
    if (myReaction === emoji) {
      removeReaction(code, rollId, uid).catch(() => {});
    } else {
      setReaction(code, rollId, uid, emoji).catch(() => {});
    }
  };

  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
      {EMOJI_PALETTE.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleClick(emoji)}
          title={myReaction === emoji ? 'Remove your reaction' : `React with ${emoji}`}
          style={{
            border: myReaction === emoji ? '1.5px solid var(--accent-text)' : '0.5px solid var(--border)',
            background: myReaction === emoji ? 'var(--accent-bg)' : 'transparent',
            borderRadius: 'var(--radius)',
            padding: '1px 5px',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {emoji}{counts[emoji] ? ` ${counts[emoji]}` : ''}
        </button>
      ))}
    </div>
  );
}
