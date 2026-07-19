// Server-side only. GITHUB_TOKEN and the Firebase service account
// credentials live here as Netlify environment variables and are NEVER
// sent to the browser — the client only ever sends its own Firebase ID
// token, which this function verifies before touching GitHub at all.
//
// ESM syntax (import/export), matching this project's package.json
// "type": "module" — Netlify interprets .js files the same way Node
// does, based on that field, so this has to match or the export is
// silently a no-op (exports.handler in an ESM file just creates a dead
// local binding instead of actually exporting anything).
// firebase-admin v9+ restructured around modular entry points, matching
// the client SDK's modular style — `import admin from 'firebase-admin'`
// and the old admin.initializeApp()/admin.auth()/admin.apps pattern is
// legacy and, as it turns out, not reliable to import this way at all
// (admin.apps came back undefined, not an empty array). Importing from
// the specific submodules is the actually-supported path.
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const REPO_OWNER = 'fabianopazo-svg';
const REPO_NAME = 'clown-character-creator';
const RULEBOOK_PATH = 'rulebook/CLOWN-Core.md';
const BRANCH = 'main';

function initFirebaseAdmin() {
  if (getApps().length) return;
  // Netlify's env var UI sometimes stores the PEM key's real newlines as
  // literal "\n" text depending on how it was pasted — this normalizes
  // either case rather than requiring the value be pasted exactly right.
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const { markdown, idToken } = payload;
  if (typeof markdown !== 'string' || !markdown.trim()) {
    return jsonResponse(400, { error: 'Missing or empty markdown content' });
  }
  if (!idToken) {
    return jsonResponse(400, { error: 'Missing idToken' });
  }

  const ownerUid = process.env.OWNER_UID;
  if (!ownerUid) {
    return jsonResponse(500, { error: 'Server misconfigured: OWNER_UID is not set' });
  }
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return jsonResponse(500, { error: 'Server misconfigured: GITHUB_TOKEN is not set' });
  }
  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const firebasePrivateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  for (const [name, value] of [
    ['FIREBASE_PROJECT_ID', firebaseProjectId],
    ['FIREBASE_CLIENT_EMAIL', firebaseClientEmail],
    ['FIREBASE_PRIVATE_KEY', firebasePrivateKeyRaw],
  ]) {
    if (!value || !value.trim()) {
      return jsonResponse(500, { error: `Server misconfigured: ${name} is not set (or is empty)` });
    }
  }
  // A private key that's missing its PEM header/footer is a strong sign
  // something got truncated or mangled during copy-paste into the env var
  // UI — catching that specific shape of mistake here, with a message
  // that says so, instead of letting it fail deep inside the Admin SDK
  // with an unhelpful generic error.
  if (!firebasePrivateKeyRaw.includes('BEGIN PRIVATE KEY')) {
    return jsonResponse(500, {
      error: "Server misconfigured: FIREBASE_PRIVATE_KEY doesn't look like a full PEM key (missing the BEGIN PRIVATE KEY header) — it may have been truncated when pasted.",
    });
  }

  // Verify the caller is REALLY the owner. This is the actual security
  // boundary — everything on the client (isOwner, the UI gating) is
  // convenience, not enforcement. A forged or expired token, or a token
  // belonging to anyone else, is rejected here regardless of what the
  // client believed about itself.
  try {
    initFirebaseAdmin();
  } catch (err) {
    console.error('Firebase Admin initialization failed:', err);
    return jsonResponse(500, { error: `Server misconfigured: couldn't initialize with the given Firebase credentials (${err.message})` });
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(idToken);
  } catch (err) {
    // Full detail goes to the server log (your netlify dev terminal, or
    // Netlify's function logs once deployed) — never to the client. The
    // client only ever sees the generic message below.
    console.error('verifyIdToken failed:', err);
    return jsonResponse(401, { error: `Sign-in could not be verified (${err.message}) — please sign in again.` });
  }
  if (decoded.uid !== ownerUid) {
    return jsonResponse(403, { error: 'This account is not authorized to edit the rulebook.' });
  }

  // GitHub's Contents API requires the current file's sha to perform an
  // update — this is also what prevents silently clobbering a change made
  // some other way (e.g. directly on GitHub) since the last load.
  let currentSha;
  try {
    const getResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${RULEBOOK_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );
    if (!getResponse.ok) {
      const detail = await getResponse.text();
      return jsonResponse(502, { error: `Couldn't read the current file from GitHub (${getResponse.status}): ${detail}` });
    }
    currentSha = (await getResponse.json()).sha;
  } catch (err) {
    return jsonResponse(502, { error: `Network error reading from GitHub: ${err.message}` });
  }

  try {
    const putResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${RULEBOOK_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update rulebook via in-app editor',
          content: Buffer.from(markdown, 'utf-8').toString('base64'),
          sha: currentSha,
          branch: BRANCH,
        }),
      }
    );
    if (!putResponse.ok) {
      const detail = await putResponse.text();
      // A 409 here specifically means the file changed since we read its
      // sha (e.g. someone edited it directly on GitHub in between) —
      // surfaced as-is rather than silently overwritten.
      return jsonResponse(502, { error: `GitHub rejected the update (${putResponse.status}): ${detail}` });
    }
    const result = await putResponse.json();
    return jsonResponse(200, { success: true, commitSha: result.commit?.sha });
  } catch (err) {
    return jsonResponse(500, { error: `Network error pushing to GitHub: ${err.message}` });
  }
};
