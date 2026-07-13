const BASE = ''; // same-origin, since Express serves the built frontend itself

export async function fetchFile(name) {
  const res = await fetch(`${BASE}/api/files/${name}`);
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to load file');
  const data = await res.json();
  return data.content;
}

export async function saveFile(name, content) {
  const res = await fetch(`${BASE}/api/files/${name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to save file');
  return res.json();
}

export async function fetchGitStatus() {
  const res = await fetch(`${BASE}/api/git/status`);
  return res.json();
}

export async function commitAndPush(message) {
  const res = await fetch(`${BASE}/api/git/commit-and-push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  return res.json();
}
