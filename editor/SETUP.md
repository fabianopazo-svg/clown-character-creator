# CLOWN content editor

A local-only tool for editing Paths/Gifts, Troupes, Gear, and core rules constants
through a UI instead of hand-editing JSON — with a one-click Commit & Push at the end.

This is **not** part of the deployed character-creator site. It never gets built or
shipped by Netlify. It only ever runs on your own machine, reading and writing the
same `src/data/*.json` files your live app uses.

## One-time setup

1. Copy this whole `editor` folder into the **root of your repo**, alongside your
   existing `src` folder — so the layout looks like:

   ```
   your-repo/
     src/
       data/
         core.json
         troupes.json
         paths.json
         gear.json
       (rest of your app)
     editor/          <- this folder goes here
       server/
       src/
       package.json
   ```

2. Install its dependencies (separate from your main app's):

   ```bash
   cd editor
   npm install
   ```

3. Add this to your repo's root `.gitignore` (create the file if it doesn't exist):

   ```
   editor/node_modules
   editor/dist
   src/data/.editor-backups
   ```

   (`.editor-backups` is a safety net the tool writes automatically before every
   save — a timestamped copy of the previous version of whatever file you just
   changed, kept purely as a local undo net. No need to commit those.)

## Running it

From inside the `editor` folder:

```bash
npm run build
npm start
```

Then open **http://localhost:5175** in your browser.

- `npm run build` bundles the editor's UI (only needs re-running if I hand you an
  updated version of the editor itself — not needed between normal content edits).
- `npm start` runs the local server that actually reads/writes your files and talks
  to git. Leave this running while you work; close the terminal window to stop it.

## What each tab does

- **Paths & Gifts** — add/edit/delete Gifts per Path per Grade, manage Subtypes,
  edit the Path's flavor text and resource description. Subtype dropdowns on each
  Gift are pulled live from that Path's own declared Subtypes, so you can't
  accidentally reference one that doesn't exist.
- **Troupes** — name, flavor text, the four Renown-gated passives, Affinity Paths.
- **Gear** — Mundane gear, Classic clown props, and Troupe-specific gear, each with
  type/rarity/size/cost/effect.
- **Core rules (raw)** — Attributes, Skills, age bands, ranks, personality traits,
  and the Glossary page content. Edited as raw JSON rather than a custom form,
  since this file is mostly fixed game constants rather than repeatable entries.

Each tab's **Save** button writes straight to the corresponding file in
`src/data/`. Nothing touches git until you use the panel at the bottom of the
screen.

## The Git panel

Pinned to the bottom of every screen. Shows which files have uncommitted changes,
and a single **Commit & Push** button — type a message, click it, and it runs
`git add -A`, `git commit`, and `git push` against your real repo, using whatever
git credentials are already set up on your machine (the same ones that let you
`git push` manually today).

If push fails (no internet, merge conflict, etc.), the commit itself still
succeeds locally — you'll see the exact git error in the log, and can resolve it
and push manually afterward.

## Safety notes

- The server only ever binds to `127.0.0.1` (your machine only) — nothing here is
  reachable from the network, even accidentally.
- Only the four known data files can be read or written — the server rejects any
  other filename.
- Every save keeps a timestamped backup in `src/data/.editor-backups/` before
  overwriting, independent of git.
