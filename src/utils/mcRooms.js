const KEY = 'clown-mc-rooms-index';

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
    // Storage unavailable (private browsing, quota, etc.) — the room still
    // works via Firestore, this browser just won't remember it next time.
  }
}

// Newest first.
export function listMcRooms() {
  return readAll().sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

// Adds a room, or updates it in place if the code's already known (so
// calling this again with a rename doesn't create a duplicate entry).
export function saveMcRoom({ code, name }) {
  const rooms = readAll();
  const idx = rooms.findIndex((r) => r.code === code);
  if (idx >= 0) {
    rooms[idx] = { ...rooms[idx], name };
  } else {
    rooms.push({ code, name: name || '', createdAt: new Date().toISOString() });
  }
  writeAll(rooms);
}

export function renameMcRoom(code, name) {
  const rooms = readAll();
  const idx = rooms.findIndex((r) => r.code === code);
  if (idx >= 0) {
    rooms[idx] = { ...rooms[idx], name };
    writeAll(rooms);
  }
}

export function removeMcRoom(code) {
  writeAll(readAll().filter((r) => r.code !== code));
}
