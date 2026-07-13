const INDEX_KEY = 'clown-characters-index';
const CHAR_KEY_PREFIX = 'clown-character-';

function genId() {
  return 'char_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function listCharacters() {
  try {
    const index = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    return index
      .map(id => {
        const raw = localStorage.getItem(CHAR_KEY_PREFIX + id);
        if (!raw) return null;
        try {
          const c = JSON.parse(raw);
          return { id, ringName: c.ringName, humanName: c.humanName, renown: c.renown, updatedAt: c.updatedAt };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  } catch {
    return [];
  }
}

export function loadCharacter(id) {
  const raw = localStorage.getItem(CHAR_KEY_PREFIX + id);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCharacter(character) {
  const id = character.id || genId();
  const toSave = { ...character, id, updatedAt: new Date().toISOString() };
  localStorage.setItem(CHAR_KEY_PREFIX + id, JSON.stringify(toSave));

  const index = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
  if (!index.includes(id)) {
    index.push(id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }
  return toSave;
}

export function deleteCharacter(id) {
  localStorage.removeItem(CHAR_KEY_PREFIX + id);
  const index = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
  localStorage.setItem(INDEX_KEY, JSON.stringify(index.filter(x => x !== id)));
}

export function exportCharacterFile(character) {
  const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const filename = (character.ringName || character.humanName || 'clown-character')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  a.href = url;
  a.download = `${filename || 'clown-character'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importCharacterFile(fileText) {
  const parsed = JSON.parse(fileText);
  // Strip id so importing always creates a fresh local save rather than colliding with an existing one.
  const { id, ...rest } = parsed;
  return rest;
}
