const KEY = 'clown-player-rooms-index';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function writeAll(rooms) {
  try {
    localStorage.setItem(KEY, JSON.stringify(rooms));
  } catch {
    // Storage unavailable — joining still works, this browser just won't
    // remember it for next time.
  }
}

// Most recently joined first.
export function listPlayerRooms() {
  return readAll().sort((a, b) => (b.joinedAt || '').localeCompare(a.joinedAt || ''));
}

// Adds a room, or updates it in place if already known (rejoining
// refreshes the remembered name/character/timestamp rather than
// duplicating the entry).
export function savePlayerRoom({ code, name, characterId, characterName, displayName }) {
  const rooms = readAll();
  const idx = rooms.findIndex((r) => r.code === code);
  const entry = { code, name: name || '', characterId, characterName, displayName, joinedAt: new Date().toISOString() };
  if (idx >= 0) rooms[idx] = entry;
  else rooms.push(entry);
  writeAll(rooms);
}

export function removePlayerRoom(code) {
  writeAll(readAll().filter((r) => r.code !== code));
}
