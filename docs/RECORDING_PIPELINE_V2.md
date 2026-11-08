# Recording pipeline v2: making better videos

This document is the plan for rebuilding the recording pipeline at proper
quality, written on 5 November 2026 when the process was about to move to
another computer. It collects what the current pipeline measurably does
wrong, what the replacement should do, how to prove the replacement works,
and the order in which to re-record. The next session or the new machine
should be able to execute it from this file alone.

## What the current pipeline measurably does wrong

- **The masters are 1600x900.** The viewport comes from the original US
  pilot and every lesson file inherits it. YouTube's quality ladder runs
  480p, 720p, 1080p; a 900-pixel-tall master never reaches the 1080p rung,
  so the player tops out at 720p — and the owner observed playback starting
  at 240p with no better option offered at all.
- **The capture is low-bitrate.** Playwright's `recordVideo` produces a
  VP8 WebM with no bitrate control; the masters probed at roughly
  150-300 kbps total. Fine map labels are exactly what low-bitrate screen
  capture smears first. The H.264 re-encode (libx264, CRF 20, preset
  medium) is not the villain — it cannot add detail the capture lost.
- **The layout was inherited, not designed.** The US-pilot frame put the
  map in a 1160x638 box low-left with a 250px dead strip above it. The
  fitting pass (bin/fit-lesson-layout.mjs) proved 40 of 58 non-US lessons
  fit a taller box better, which roughly doubled the usable map area — but
  that was a retrofit of the old geometry, not a design.

## What v2 does instead

- **Record at 1920x1080 natively.** The browser viewport is 1920x1080 and
  `recordVideo.size` matches it, so the capture is genuinely 1080p and
  YouTube offers the 1080p rendition.
- **Design the layout on the 1080p canvas, not by scaling.** A fresh frame
  composition: the map takes the majority of a 1920x1080 canvas, the fact
  card and title/status column occupy the right side, no dead strips. The
  two-box shapes from the fitting pass carry over as *variants* (a tall box
  for narrow or maritime maps, a wider one for continental shapes), but
  their geometry is designed at 1080p, not scaled from 900p by 1.2.
- **Keep what works.** deviceScaleFactor 2 for the still frames; the
  Known-mode click flow with the restore-list Clear; the eye-button hide;
  the assembled narration track; 160k AAC audio; `+faststart`.
- **Raise the encode headroom.** libx264 at CRF 16-18, preset medium,
  yuv420p — cheap insurance at 1080p so the encode adds no second loss.

## The capture-quality question the pilot must answer

Playwright's `recordVideo` exposes no bitrate control, so v2's first pilot
records one lesson with plain `recordVideo` at 1080p and measures the
result on YouTube: upload unlisted, wait for processing to finish, then
check (1) the quality menu offers 1080p, (2) auto playback starts at or
above 720p, (3) region labels are crisp at full screen next to the 900p
original.

If the capture still smears, fall through in this order:

1. **CDP screencast capture** (`Page.startScreencast`) with explicit
   quality and frame-size control, assembled at the narration's cadence.
2. **Screenshot-frame assembly.** The maps are mostly static between camera
   moves, so a deterministic frame sequence (screenshot per segment,
   x264 with a long GOP) is heavy but exact — and immune to capture
   bitrate entirely.

## What carries over unchanged

- The narration: MiniMax voices per `src/lessons/narrator-voices.json`,
  synthesized per segment before recording, clips cached and reused.
- The fitting-pass *concept*: measure per lesson which box shape fits the
  map, re-run at v2 geometry once the layout exists. The old verdicts do
  not transfer — re-measure.
- The approved-inputs guards: a recording is never redone over changed
  lesson content; new editions get new export paths.
- The publishing chain: prepare, upload, retire, reorder — resolution
  changes nothing in it.

## New-machine setup

Follow the checklist in `MISSING.md` (Node, FFmpeg/FFprobe, Playwright
Chromium, the GeoClick checkout started from its physical path on port
5187 over IPv6, MiniMax key in `~/.config/ai-keys.env`, youtube3 profile
and OAuth). Transfer separately, because Git excludes them: the
`rendered/` media tree (masters, cached narration clips, publishing
batches), the youtube3 shared upload ledger, and any speech caches. The
dev-server quirks that cost time before: start Vite from the physical
checkout path, it binds IPv6 so `http://localhost:5187` works while
`127.0.0.1` does not, and packaging needs GNU tar from Git Bash.

## Proposed re-recording order

1. **The v2 pilot** (one lesson, unlisted test upload, acceptance checks
   above). Suggest a label-dense maritime map — Sweden or New Zealand —
   where the difference against the 900p original is starkest.
2. **Wave three and Oceania countries** (six countries plus one edition,
   content already written and checked) — new content should be born on
   the new pipeline.
3. **The regions editions** (27 lessons), then **the capitals editions**
   (31), then **the continent editions** (27), each fitted per lesson at
   v2 geometry before recording.
4. The 30 lessons already re-recorded at 900p in November 2026 stay on
   disk as interim quality; replace them last, if at all — the owner
   decides whether 720p-class is acceptable for those editions.

The United States videos keep their original recordings by the owner's
standing decision; whether they eventually join a 1080p redo is a separate
call.
