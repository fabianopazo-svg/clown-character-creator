const RULEBOOK_RAW_URL =
  'https://raw.githubusercontent.com/fabianopazo-svg/clown-character-creator/main/rulebook/CLOWN-Core.md';

// Saves rulebook content via the Netlify Function — the function itself
// verifies (server-side, via Firebase Admin) that the caller is really the
// owner before touching GitHub at all; this client-side call carries no
// special privilege of its own, just an ID token proving who's asking.
export async function saveRulebookMarkdown(markdown, idToken) {
  const response = await fetch('/.netlify/functions/save-rulebook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown, idToken }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        "The save function isn't deployed yet (404) — this is expected until that piece is built."
      );
    }
    let detail = '';
    try {
      const body = await response.json();
      detail = body.error || '';
    } catch {
      // response wasn't JSON — fall through with no extra detail
    }
    throw new Error(`Couldn't save (${response.status}). ${detail}`);
  }

  return response.json();
}

// raw.githubusercontent.com caches aggressively (several minutes) — a
// cache-busting query param forces a fresh fetch each time this is called,
// so an edit that just got pushed doesn't sit invisible for a while.
export async function fetchRulebookMarkdown() {
  const response = await fetch(`${RULEBOOK_RAW_URL}?t=${Date.now()}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("The rulebook file isn't on GitHub yet at the expected path (rulebook/CLOWN-Core.md).");
    }
    throw new Error(`GitHub returned an error (${response.status}) fetching the rulebook.`);
  }
  return response.text();
}
