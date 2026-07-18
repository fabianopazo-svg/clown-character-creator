import { create } from 'zustand';
import { getDefaultPlayState } from '../utils/playState';

// Owns exactly the live/session resource state that used to live at
// character.play inside CharacterContext's reducer (laughter, face, health,
// pathResource). Everything about the character's *identity* — troupeId,
// pathId, renown, gifts, etc. — stays in CharacterContext; this store only
// ever holds the play-time numbers for whichever character is currently
// open in Play Mode.
//
// Firestore sync is intentionally NOT wired in here — this is a scoped
// swap of the state-management mechanism only. A later step will handle
// syncing back to a room's private/sheet doc as an explicit end-of-session
// save-back (not live), matching the project's existing two-snapshot
// pattern — not a concern this store needs to know about yet.
export const usePlayStore = create((set, get) => ({
  // Which character this play state belongs to. Used to detect "a
  // different character was opened" so the store knows to reseed instead
  // of silently carrying over the previous character's numbers.
  characterId: null,
  play: null,

  // Seeds the store for the given character, but only if it isn't already
  // holding state for that same character — mirrors the old INIT_PLAY
  // reducer case exactly: re-entering Play Mode for the same character
  // never resets in-session progress, but opening a *different* character
  // always reseeds from that character's saved play data (or computes
  // fresh defaults if it has none).
  initForCharacter(character) {
    if (get().characterId === character.id && get().play) return;
    set({
      characterId: character.id,
      play: character.play || getDefaultPlayState(character),
    });
  },

  setValue(field, value) {
    set(state => ({ play: { ...state.play, [field]: value } }));
  },

  setPathResourceValue(key, value) {
    set(state => ({
      play: { ...state.play, pathResource: { ...state.play.pathResource, [key]: value } },
    }));
  },

  // Clears the store — call when leaving Play Mode entirely, so a stray
  // mount elsewhere doesn't see stale resource numbers before its own
  // initForCharacter() call runs.
  reset() {
    set({ characterId: null, play: null });
  },
}));
