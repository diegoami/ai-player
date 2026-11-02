# Missing local setup and assets

## Runtime setup completed on Leopard

The owner selected GeoClick and Malpaco, runtime setup only. Existing generated
media and the original Bandicam recording were deliberately left on IT13.
Those two unchecked restoration items below are deferred, not runtime blockers.

- Native Node 24.22.2; locked npm dependencies installed, lockfile unchanged.
- Playwright Chromium launches and records video; FFmpeg/FFprobe 9.0.2 work.
- MiniMax is configured privately at `~/.config/ai-keys.env`. The model accepted
  both text and an actual game screenshot. OpenRouter/ElevenLabs remain optional
  and are not configured for this app.
- Both accepted custom voice IDs are visible on the account and generated short
  decodable samples. This verifies access/decoding, not a new listening review.
- GeoClick: `http://127.0.0.1:5187`, physical checkout `H:/projects/Geoclick2027`.
  Use the physical path when starting Vite; the C: projects junction otherwise
  gives generated-module 403 errors. The adapter now resolves it automatically.
- Malpaco: `http://127.0.0.1:5173/`, checkout `H:/projects/malpaco`.
- Six offline narrator/path regressions pass. Both game adapters return legal
  actions. Silent episode-1 and episode-4 preflights pass, including the
  Alaska/Hawaii supplemental views and outside-map fact-card checks.
- A one-decision Malpaco run completed the real model/narration/action/export
  pipeline with John and wrote an MP4 under `rendered/leopard-e2e/malpaco/`.
  This is a setup smoke test, not a finished match or a new teaching episode.
- Speech caches now distinguish text, provider, voice, language and model;
  old clips cannot silently override the accepted narrator defaults.
- Absolute `--out` paths now resolve correctly on Windows. The preferred
  state-hook replay accepts `--out` for a new output folder.

Code changes are on `setup/leopard-runtime`. New setup proofs remain ignored
under `rendered/leopard-runtime-checks/`; no old media was restored or regenerated.
This file preserves the earlier missing-setup audit below as historical context.

- The GeoClick checkout at `H:/projects/Geoclick2027` is read-only for this
  pipeline: every recording script reads its map catalogue and writes only into
  `ai-player`. The Claude Code permission for that directory is therefore
  optional. If a task ever needs to *edit* the GeoClick app, run
  `claude --add-dir H:/projects/Geoclick2027` first — the permission cannot be
  added from inside a session, and the harness refuses writes to its own
  settings file.
- The dev server must be started with the physical path
  (`Set-Location H:\projects\Geoclick2027`), not the `C:` junction, or Vite
  answers generated-module requests with 403. It binds on IPv6, so
  `http://localhost:5187` works while `127.0.0.1:5187` does not answer.
- Windows `tar.exe` is bsdtar and rejects `--force-local`; run the packaging
  scripts from Git Bash, where `tar` is GNU tar 1.35.


Checked on 2026-11-01. The source code and documented project context are
available, but this checkout is not yet ready to record or rebuild videos.

## Setup checklist

- [x] **Install Node dependencies.** `npm ci` completed using the committed
  lockfile, which remains unchanged.
- [x] **Install Playwright Chromium.** The matching browser cache is installed;
  native Chromium launch, screenshots and WebM recording passed.
- [x] **Provide FFmpeg and FFprobe.** FFmpeg and FFprobe 9.0.2 are on PATH.
  Audio probing and an H.264/AAC export passed.
- [x] **Configure API credentials.** The loader resolves `MINIMAX_API_KEY`
  from the private external key file; MiniMax text, image input and both custom
  voices passed. OpenRouter and ElevenLabs are intentionally not configured.
  MiniMax is the current default for narration and model decisions;
  OpenRouter and ElevenLabs are alternatives, not mandatory additions.
  Store credentials outside this repository in `~/.config/ai-keys.env`,
  or point `AI_KEYS_FILE` at an external credential file. Do not commit keys.
- [x] **Make GeoClick available.** The sibling checkout
  `../Geoclick2027` is installed and serves GeoClick at
  `http://127.0.0.1:5187`. Both the quiz adapter and silent teaching preflights
  passed. Read `docs/GEOCLICK.md` for the required workflow.
- [x] **Make Malpaco available if working on that adapter.** The sibling
  checkout `../malpaco` is installed and serves `http://127.0.0.1:5173/`.
  Adapter setup, one model-selected decision and video export passed.
- [ ] **Transfer existing generated media if needed.** `rendered/` is absent.
  The four completed episode masters, optional subtitle exports, upload ZIPs,
  speech clips, raw recordings, and previews do not travel through Git.
  Restore them separately from the original computer or backup if they are
  needed for review, delivery, or reuse.
- [ ] **Transfer the original human replay recording to rebuild that replay.**
  The referenced file is absent:
  `C:/bandicam/bandicam 2026-10-30 14-50-20-120.mp4`.
  Restore it there, or update the source path deliberately if stored elsewhere.
  The committed placement timings are available; do not regenerate them from
  coarse analysis.

## Follow-up consistency work

- [x] **Apply accepted narrator choices when preparing new narration.**
  `src/lessons/narrator-voices.json` records John for English and the
  Italian-recorded clone for Italian, German, French, and Mandarin.
  New lesson/replay narration uses these choices, with explicit voice overrides
  retained. Both voices were verified on the MiniMax account and generated audio.
- [x] **Update the README's human replay instructions.** It now points to
  `bin/narrate-state-hooks.mjs` and `src/lessons/human-state-hooks.json`,
  and explains the original source recording, separate captions and a new output
  folder for narrator changes.

## Already available

- Node v24.22.2 and npm 11.19.1.
- Source code, package manifest, and dependency lockfile.
- All 25 JavaScript modules passed syntax checks; all 21 source/package
  JSON/GeoJSON files parsed successfully.
- Four canonical episode lessons, translations, and a coverage ledger with
  50 unique states and no duplicates. No states remain uncovered.
- Natural Earth supplemental map data for Alaska and Hawaii.
- Preferred human replay hooks, translations, and verified 49-target timings
  in `src/lessons/data/human-placement-events.json`.
- Narrator preference metadata and detailed recording notes in
  `docs/GEOCLICK.md`.

The ledger documents previously completed media. Those exports have not been
independently reverified on this computer because the media files are absent.
Browser launch, API access, both adapters and a one-decision end-to-end run
are verified as detailed above. Existing media exports remain unverified here,
because their restoration was explicitly deferred. YouTube masters must retain separate optional captions
with no burned-in narration subtitles.
