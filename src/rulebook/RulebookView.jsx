import { useAuth } from '../context/AuthContext';
import OwnerSignIn from './OwnerSignIn';

export default function RulebookView() {
  const { isOwner } = useAuth();

  return (
    <div className="sheet-page">
      <div className="section-title" style={{ marginTop: 0 }}>📖 Rulebook</div>

      <OwnerSignIn />

      <p className="helper-text">
        {isOwner
          ? 'Owner access confirmed — the actual viewer and editor land in the next pass.'
          : 'The full rulebook viewer (with search) lands here in the next pass.'}
      </p>
    </div>
  );
}
