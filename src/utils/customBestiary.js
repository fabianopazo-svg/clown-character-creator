const KEY = 'clown-custom-bestiary';

function genId() {
  return 'custom_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function writeAll(entries) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // ignore — this browser just won't remember it next time
  }
}

export function listCustomMonsters() {
  return readAll().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

// entry has no id yet on first save (a new custom monster); has one when editing.
export function saveCustomMonster(entry) {
  const entries = readAll();
  if (entry.id) {
    const idx = entries.findIndex((e) => e.id === entry.id);
    if (idx >= 0) entries[idx] = entry;
    else entries.push(entry);
  } else {
    entries.push({ ...entry, id: genId() });
  }
  writeAll(entries);
}

export function removeCustomMonster(id) {
  writeAll(readAll().filter((e) => e.id !== id));
}
