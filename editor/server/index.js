import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { gitStatus, gitCommitAndPush } from './git.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// This tool lives at <repoRoot>/editor/server/index.js, so the repo root is two levels up.
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DATA_DIR = path.join(REPO_ROOT, 'src', 'data');

// Whitelist of editable files — prevents any request from reading/writing arbitrary paths.
const ALLOWED_FILES = ['core.json', 'troupes.json', 'paths.json', 'gear.json'];

const PORT = process.env.EDITOR_PORT || 5175;

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

function assertAllowed(name) {
  if (!ALLOWED_FILES.includes(name)) {
    const err = new Error(`"${name}" is not an editable file.`);
    err.status = 400;
    throw err;
  }
}

app.get('/api/files', (req, res) => {
  res.json({ files: ALLOWED_FILES, dataDir: DATA_DIR, repoRoot: REPO_ROOT });
});

app.get('/api/files/:name', async (req, res) => {
  try {
    assertAllowed(req.params.name);
    const filePath = path.join(DATA_DIR, req.params.name);
    const raw = await fs.readFile(filePath, 'utf-8');
    res.json({ content: JSON.parse(raw) });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.put('/api/files/:name', async (req, res) => {
  try {
    assertAllowed(req.params.name);
    const { content } = req.body;
    if (content === undefined) {
      return res.status(400).json({ error: 'Request body must include "content".' });
    }
    // Round-trip through JSON.stringify/parse implicitly validates it's serializable.
    const serialized = JSON.stringify(content, null, 2) + '\n';
    const filePath = path.join(DATA_DIR, req.params.name);

    // Keep a timestamped backup before every overwrite, so a bad save is never unrecoverable
    // even before you've committed anything to git.
    const backupDir = path.join(DATA_DIR, '.editor-backups');
    await fs.mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      await fs.writeFile(path.join(backupDir, `${req.params.name}.${stamp}.bak`), existing);
    } catch {
      // No existing file to back up — fine, this is a first write.
    }

    await fs.writeFile(filePath, serialized, 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.get('/api/git/status', async (req, res) => {
  const result = await gitStatus(REPO_ROOT);
  res.json(result);
});

app.post('/api/git/commit-and-push', async (req, res) => {
  const message = (req.body?.message || '').trim();
  if (!message) {
    return res.status(400).json({ error: 'Commit message is required.' });
  }
  const result = await gitCommitAndPush(REPO_ROOT, message);
  res.json(result);
});

// Serve the built frontend (npm run build produces ./dist) for everything else.
const distDir = path.join(__dirname, '..', 'dist');
app.use(express.static(distDir));
app.use((req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`\nCLOWN content editor running at http://localhost:${PORT}\n`);
  console.log(`Editing files in: ${DATA_DIR}`);
  console.log(`Repo root: ${REPO_ROOT}\n`);
});
