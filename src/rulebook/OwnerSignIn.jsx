import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function OwnerSignIn() {
  const { isOwner, signInOwner, signOutOwner, ownerSignInError, ownerSigningIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (isOwner) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 12 }}>
        <span className="accent-block" style={{ margin: 0 }}>Signed in as owner — edit tools unlocked</span>
        <button type="button" className="small-btn" onClick={signOutOwner}>Sign out</button>
      </div>
    );
  }

  return (
    <div className="gift-card" style={{ marginBottom: 16, cursor: 'default' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Admin sign-in</div>
      <p className="helper-text" style={{ marginTop: 0 }}>
        Only needed to edit the rulebook. Signing in here replaces your current session — don't
        do this from inside an active room.
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: 200 }} />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: 160 }} />
        <button
          type="button"
          className="small-btn"
          onClick={() => signInOwner(email, password)}
          disabled={ownerSigningIn || !email || !password}
        >
          {ownerSigningIn ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
      {ownerSignInError && (
        <p className="helper-text" style={{ marginTop: 6, color: '#c0392b' }}>{ownerSignInError}</p>
      )}
    </div>
  );
}
