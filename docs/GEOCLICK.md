# GeoClick: learned controls and recording notes

Read and exercised on 30 October 2026, local v1.1.0 build d3f2399.
Manual: <http://localhost:5173/manual>. The full rendered manual was read through
the browser; the authored source is `../Geoclick2027/docs/USER_MANUAL.md`.
The local server can change between projects: verify that it is GeoClick.

## The four modes

- **Known**, `/map/usa-states`: the user's requested teaching view. Click a state
  to show its name and fact card. Click it again to hide it. Names accumulate;
  clicking another state does not remove the earlier choices. The last selected
  state is highlighted. Choices are **Chosen**, not earned quiz knowledge.
- **Overview**, `/map/usa-states/overview`: all names, subject to collision
  avoidance. Zoom if a name is missing. Clicking a state also opens its facts.
- **Quiz**, `/map/usa-states/quiz`: two directions, sharing earned progress.
  **Place names**: drag a tray name onto its region, or click the name and then
  click the region. Cancel with Escape, another click on the name, or empty tray
  space. **Name places**: identify the blue highlighted region from numbered
  choices; click a choice or press 1–6. Switching direction starts a new round.
- **Tour**, `/map/usa-states/tour`: automatically flies between places, with
  names and facts. Previous, pause/play and next controls, plus speed. Unscored.

## Movement and learning rules

- Wheel or +/− zooms; drag pans; compass resets north. Labels do not block drags.
  On touch: pinch zoom, finger drag pan, double-tap zoom.
- The right-hand eye hides/restores controls. Terrain toggles rivers, peaks,
  ranges and other background geography; terrain labels do not block clicks.
- Correct first quiz answer: one level up, unknown → Seen once → Nearly → Known.
  Wrong answer: one level down, and the correct location is revealed in brown.
  Each name gets one attempt per round. A correct quiz answer opens no fact card;
  a wrong one does. Do not deliberately fail just to obtain facts: use Known.
- Name places offers four choices initially, five from 60% known and six from
  85%. Place names starts with ten tray names, then six at 25%, three at 60%, one
  at 85%. New names refill the tray as answers are resolved.
- A regular round covers every name. Practice can ask only names not yet known;
  it still affects levels. Finish the round before claiming a finished quiz.
- Progress survives mode switches. Returning from Overview preserves an active
  quiz, but reloading starts a fresh round. Progress is local to this browser or
  app; there is no account or cross-device sync. Time does not decay levels.
- **Clear** removes chosen names only. Use the bottom **Clear** button at the
  start of a new regional lesson, as requested by the user. **Reset progress**
  is destructive and requires confirmation in the app; do not use it to clear
  a lesson's names.
- Facts: pinned name origin, one rotating extra, and derived biggest-city
  information. Preserve uncertainty in disputed origins. City populations in
  this dataset can describe urban areas and are not current census counts;
  avoid presenting them as current municipal populations.

## User's eight-state teaching pilot

The user requested a pilot covering exactly eight states, explaining the US
states and reading interesting facts in Known mode. The authored route is
Washington → Oregon → California → Nevada → Arizona → Utah → Colorado →
New Mexico. Give a location cue, a fact/name story, and a brief memory hook.
Finish with a recap of the coast chain and the inland pairs. This is a prepared
teaching lesson, not a scored quiz or evidence of an autonomous model score.

`src/lessons/usa-states-pilot.json` contains narration, inspected click points
and research links. Fact cards were opened and their state names checked in the
actual UI. The pilot runner reads the live manual again and validates every
state card during recording. It stops on a mismatch rather than narrating the
wrong place. Do not reuse the click coordinates at a different viewport, zoom,
pan, or app layout without inspecting and validating them again.

Run from the ai-player repository:

```powershell
node bin/geoclick-pilot.mjs --game=geoclick --base=http://localhost:5173 --out=rendered/usa-states-pilot-20261030
```

Use a new output folder for changed scripts: existing speech clips are reused
by filename. Narration is synthesized before recording to avoid dead time.
Chromium records the real UI at 1280×720; the opening manual/loading footage is
trimmed in the export. Upper captions keep the lower fact card visible.
Outputs include `play.mp4`, subtitles, lesson, raw video, manual snapshot,
per-state screenshots, progress and final trace, and browser local-storage state.
Chosen names are session choices and may not survive reopening even though the
storage snapshot preserves earned progress/settings.

Completed artifact: `rendered/usa-states-pilot-20261030/geoclick/play.mp4`,
4 minutes 21 seconds, H.264/AAC at 1280×720. All eight state cards were verified;
the final recap displays all eight chosen names. Exported frames and audio
levels were checked. The neighbouring `lesson.md` is the readable transcript
with research links, and `trace.json` preserves the actual card text and timing.

The older `src/games/geoclick.mjs` remains a separate **Name places quiz** adapter.
It defaults to Denmark and an intentionally hesitant persona, so it is not the
eight-state teaching workflow. Do not run it expecting this pilot.

## Fact-checking lessons from the pilot

Narration uses paraphrases of the visible cards with supporting links in the
lesson JSON. Oregon's uncertain name origin stays uncertain. Avoid an exact
Crater Lake depth: official pages use differing measurements. Nevada federal
land figures also vary by measure; say "most" rather than a supposedly exact
current percentage. Utah's name is connected with the Ute people without
asserting a disputed literal translation. Do not repeat all card claims
uncritically; research an unfamiliar fact before teaching it.

For future full-game recordings, do not equate an arbitrary move budget with
completion. This pilot has an explicit eight-state scope and an ending recap;
a requested full match or quiz must reach its actual end screen.

## Regional series: user's revised direction

The user wants roughly five videos of about ten states. Next is the Northeast
Atlantic coast: Maine, New Hampshire, Massachusetts, Rhode Island, Connecticut,
New York, New Jersey, Delaware, Maryland, Virginia. This was the prototype
scope; the user subsequently added Vermont and restarted the series below.

At each lesson's opening: show the previous chosen names, press the real bottom
**Clear** button, make an introduction, then visibly zoom and pan into the study
area. Use close views for small eastern states. Both captions and fact cards
must sit outside the map rectangle. Do not merely avoid covering the current
state while still covering other parts of the map.

The recording-only sidebar layout is in `src/core/geoclick-lesson-ui.mjs`:
1600×900 output, a 1144×622 map canvas at (20,258), real GeoClick fact cards
at x=1192, and subtitles in the blank top band. It does not edit GeoClick source.
Every revealed state's card is checked for its actual name and a non-overlap
with the map. The derived city/population row is hidden in this layout because
the dataset contains unreliable largest-city entries (e.g. Trenton for New
Jersey), as well as urban-area population definitions. Name origins and authored
extra facts remain visible. Check unfamiliar claims before narrating them.

`bin/geoclick-lesson.mjs` operates these prepared regional lessons. In its fresh
browser it restores the earlier western chosen names using public map clicks,
then records clearing them; it does not fake earned quiz progress. `--inspect`
runs the full UI sequence without speech for preflight. The Northeast lesson
uses separate views for northern and southern New England, New York, New
Jersey/Delaware, Maryland and Virginia, then pulls back for the recap. Its sources
and narration are in `src/lessons/usa-northeast-coast.json`.

For reproducibility, the regional runner uses MapLibre's public `fitBounds`
and `project` methods on the existing game map. It captures the map instance on
a real zoom event and immediately restores the instrumented prototype. All
state reveals, fact changes and Clear are actual UI clicks; no quiz answers or
earned progress are injected. Smooth camera moves are recorded visibly. Wheel
gestures proved inconsistent between unrecorded and recorded browser contexts,
so do not reuse those exploratory wheel coordinates. Public map target
centroids work for most clicks, but Maryland's centroid lands in Virginia: use
the verified inland point at longitude -76.8, latitude 39.35 instead.

Run:

```powershell
node bin/geoclick-lesson.mjs --game=geoclick --out=rendered/usa-northeast-coast-20261030
```

**Coverage memory:** `src/lessons/usa-coverage.json` is the durable ledger.
It separates completed states from planned episodes. The western pilot covered
eight states; it did not cover Alaska or Hawaii. The working five-part plan
reserves those two for a completed western edition, subject to inspecting map
support. Do not silently count them as taught or count any proposed episodes
as completed.

The Northeast lesson is complete:
`rendered/usa-northeast-coast-20261030/geoclick/play.mp4`, 6 minutes 23 seconds,
1600×900 H.264/AAC. All ten names and the actual Clear opening were verified.
The recorded card rectangles were outside the map for every state. Exported
Rhode Island and Delaware frames confirm that the small states are large enough
to study, with both captions and facts outside the map. Audio has headroom
(peak -3.4 dB). **18 distinct states have now been taught:** the western eight
plus the ten Northeast coastal states listed above. Do not repeat these as new
coverage unless the user requests a review or revised edition.

## Optional subtitles

The original `play.mp4` exports have captions burned into the pixels. Their
`subtitles.srt` files are separate timed text, but toggling those files cannot
remove the captions from the original MP4. Keep the raw WebM, speech clips and
trace so a clean narrated video can be exported without another browser run.

```powershell
node bin/export-clean-video.mjs --dir=rendered/usa-northeast-coast-20261030/geoclick
```

This writes `play-no-subtitles.mp4` and preserves the existing captioned copy.
Translated subtitle files should preserve the English cue numbering and timing.
Subtitle language is separate from narration language and the game's UI language.
Ask which subtitle languages are wanted before preparing translations.

The user clarified that the delivery target is **YouTube with optional
subtitles**. Use a clean narrated MP4 as the upload master and a separate timed
SRT track, uploaded in YouTube Studio using **With timing**. Future YouTube
deliveries should follow this pattern. Never offer the burned-in `play.mp4`
as a switchable-caption upload. Additional subtitle languages are separate
tracks; none have yet been requested by name. The Northeast clean master is
`play-no-subtitles.mp4`, and its English track is `subtitles.en.srt`.
The `youtube-upload.zip` bundle contains clearly named copies and upload steps.
Verified clean export: 382.84 seconds, H.264/AAC, 1600×900, no subtitle stream
or burned-in narration captions. A raw frame was visually checked. The game's
own state labels and fact text remain visible, as intended.

## Current edition: restart with Northeast as episode 1

The user's latest instruction supersedes the prototype order and counts:
**redo the video as the first episode**, clear the map first, and include the
same ten states **plus Vermont**. Keep the same methodical introductions,
geographical cues, interesting facts, close views, sidebar and recap. Use all
six New England states in the opening group, with Vermont immediately after
New Hampshire. Do not refer to a western lesson, eighteen already taught
states, or Vermont being reserved for another episode.

Current lesson: `src/lessons/usa-episode-01-northeast.json`. It is the regional
runner's default. Output: `rendered/usa-episode-01-northeast-20261030/geoclick/`.
The runner now exports `play-no-subtitles.mp4` directly and a separate
`subtitles.en.srt`. The English narration remains; additional languages apply
only to optional subtitle files, not dubbed audio.

The opening prepares chosen names through real clicks, then records pressing
the real bottom Clear button. It does not represent quiz mastery or an earlier
episode. Preparing two visits per state leaves the two-extra fact rotation at
its starting point, so the recorded facts still match the narration. `--inspect`
checks the actual state names, selected facts and outside-map card geometry.
`--audio-cache=<earlier-output-dir>` reuses exact-text speech clips from the
same narrator configuration; changed introduction, Vermont and recap lines
are synthesized again in the new output folder.

The coverage ledger separates these earlier prototypes from the restarted
series. Count only verified current-edition episodes as completed coverage.

The new episode includes English, German and Italian subtitle translations
(German/Italian were stated defaults while no language preference was given).
They are independent optional tracks. `bin/export-subtitle-tracks.mjs` writes
SRT and positioned WebVTT using the exact English cue times. It checks a SHA-256
hash of the recorded narration against the translation source, so changed
narration cannot silently reuse the wrong translations. Translations are in
`src/lessons/usa-episode-01-northeast.subtitles.json`.

Prefer the `.vtt` files for YouTube: their cues request `line:2%` in the blank
top band, away from the map and fact panel. The `.srt` alternatives have no
position information. YouTube documents support for WebVTT positioning:
<https://support.google.com/youtube/answer/2734698?hl=en>.
Preview placement after YouTube processes the tracks; player settings may
affect rendering. Never burn translated captions into the upload master.

**Current episode 1 is complete:** `play-no-subtitles.mp4` in the output folder
above, 6 minutes 55 seconds (415.24 s), 1600×900 H.264/AAC. Its real Clear
opening removes eleven chosen names; the lesson then covers all eleven states.
Every fact panel was verified outside the map. The English, German and Italian
tracks each contain 44 cues with matching timestamps, in SRT and WebVTT formats.
Browser playback verified the top positioning and that captions can be disabled;
German long-line wrapping and clean frames were visually checked. Audio peaks
at -3.4 dB. The `youtube-upload.zip` contains the clean master, all six subtitle
files and upload instructions. The restarted series now has **11 states covered**.

## Episode 2: complete the remaining Census South

The user requested another coherent, preferably complete region, with 10–15
states and no repetition. Episode 2 covers **13 new states**: West Virginia,
Kentucky, Tennessee, North Carolina, South Carolina, Georgia, Florida, Alabama,
Mississippi, Louisiana, Arkansas, Oklahoma and Texas. The official Census South
has 16 states; Delaware, Maryland and Virginia were already covered in episode
1. Washington, DC, is not counted as a state. Thus episode 2 completes this
region across the series without reteaching the three earlier states.

Region source: <https://www.census.gov/programs-surveys/economic-census/guidance-geographies/levels.html>.
The definition is explained in the intro because cultural regional definitions
vary, especially for Oklahoma and Texas. The route groups Appalachia, the
Atlantic coast, the Gulf coast and the western South. This replaces the older
ten-state Southeast proposal and moves Arkansas, Oklahoma and Texas out of a
future Plains episode.

Lesson: `src/lessons/usa-episode-02-south.json`. Output:
`rendered/usa-episode-02-south-20261030/geoclick/`. Run with
`--lesson=src/lessons/usa-episode-02-south.json`. All thirteen UI selections and
fact choices passed preflight, and the fact card remained outside the map.
West Virginia uses (-81.63,38.35), Florida (-81.7,28.5), and Louisiana
(-92.3,31.2) as verified inland click points; Louisiana's catalog centroid
falls near the wrong side of the river, so do not use it.

Episode 2 keeps English audio and optional English, German and Italian
subtitles. Translations are in `usa-episode-02-south.subtitles.json` next to
the lesson. The subtitle exporter accepts `--translations=<file>`; the
browser playback checker is now `bin/check-subtitle-playback.mjs --dir=<out>
--state=<name>`. The lesson runner checks prior completed state coverage and
duplicates before running. Speech filenames include a text hash to prevent
stale narration after edits; `--prepare-only` synthesizes speech before a
subsequent recording run without opening a browser.

The future episode groups in the ledger remain proposals. Their membership
was adjusted to keep all 50 states unique after moving the three western
Southern states into episode 2. Do not mark episode 2 complete until its
export and optional captions have been verified.

**Episode 2 is complete:** `play-no-subtitles.mp4` in the Southern output
folder, 8 minutes 7 seconds (487.08 s), 1600×900 H.264/AAC, no burned-in
narration captions or subtitle stream. The thirteen state cards and Clear
opening were verified; no fact panel overlapped the map. Spoken facts and
geography were reviewed against the live cards and primary references, with
uncertain origins left uncertain and unstable numerical claims omitted.
English, German and Italian each have 50 matching timed cues, supplied in SRT
and top-positioned WebVTT. Native browser playback loaded all three tracks,
verified position and switching off, and the Florida preview was inspected
with German captions on and off. Audio peaks at -3.4 dB. The upload ZIP contains
the clean master, six caption files and instructions.

Coverage is now **24 distinct states**. There are zero repeated taught states
between the two episodes. Together they cover all 16 Census South states;
future lessons should choose from the remaining 26. The ledger's remaining
groups are proposals, not completed videos.

## Episode 3: Midwest plus Pennsylvania

The user requested the next batch with the same established method. Episode 3
contains **13 new states**: Pennsylvania, Ohio, Michigan, Indiana, Illinois,
Wisconsin, Minnesota, Iowa, Missouri, Kansas, Nebraska, South Dakota and North
Dakota. This covers all twelve states of the Census Midwest and Pennsylvania,
the final uncovered Census Northeast state. Pennsylvania connects naturally to
Ohio at the route's start rather than being stranded in a later tiny lesson.

Lesson: `src/lessons/usa-episode-03-midwest.json`. Output:
`rendered/usa-episode-03-midwest-20261030/geoclick/`. Run the regional recorder
with `--lesson=src/lessons/usa-episode-03-midwest.json`. All thirteen selections
and fact choices passed preflight. Michigan uses an inland Lower Peninsula
click at (-84.55,42.73), with a camera showing both peninsulas. The source card's
"only state in two separate pieces" wording is not repeated in narration.
Likewise, Chicago's role in early skyscraper design is described without an
unqualified world-first claim. Brown v. Board of Education is described as
declaring racial segregation unconstitutional, not instantly ending it.

The route groups Pennsylvania/Ohio, Michigan, Indiana/Illinois, Wisconsin/
Minnesota, Iowa/Missouri, Kansas/Nebraska and the Dakotas. Each state has location
cues, a sourced fact and a memory hook. Facts remain in the right sidebar.
Narration is English. German/Italian translations and optional English captions
have 51 cues; their source file is `usa-episode-03-midwest.subtitles.json`.
Use the matching `--translations` argument for export. Keep these tracks
separate from the clean video, as for previous episodes.

Future West planning: direct inspection of the local USA map catalog confirmed
49 targets: 48 contiguous states plus District of Columbia. The game tags DC
as `state`, but it must not count toward the fifty. Alaska and Hawaii are
absent. After episode 3, eleven remaining states can be taught on this map;
the other two Western states need suitable supplemental geographic views.
Do not pretend the existing GeoClick USA map includes those two states.

**Episode 3 is complete:** `play-no-subtitles.mp4` in the Midwest output folder,
8 minutes 30 seconds (509.64 s), 1600×900 H.264/AAC, clean of permanent narration
captions. All thirteen state names, Clear and outside-map fact cards were
verified during the recording. The new states have zero overlap with episodes
1 or 2. The series now has **37 distinct states**, completing the Census
Northeast, South and Midwest. Thirteen Western states remain.

All three optional tracks contain 51 cues. Native browser playback verified
their top position and toggling off, and Michigan caption-on/off previews were
visually checked. Audio peaks at -3.4 dB. The YouTube ZIP contains the clean
video, English/German/Italian WebVTT and SRT files, notes and instructions.

The playback check caught a timestamp rollover bug: rounding fractional
seconds separately could emit an invalid `,1000` millisecond field and drop a
cue. `writeSrt` now rounds total milliseconds before splitting the fields.
Second and hour boundary regressions were checked. The subtitle exporter
regenerates English timing from the trace before writing translations; all
51 cues then parsed successfully. The clean video did not need re-encoding.

## Episode 4: the complete West, including Alaska and Hawaii

The user requested the final episode. It covers the remaining thirteen states:
Montana, Idaho, Wyoming, Colorado, New Mexico, Arizona, Utah, Nevada,
California, Oregon, Washington, Alaska and Hawaii. Lesson:
`src/lessons/usa-episode-04-west.json`. Output:
`rendered/usa-episode-04-west-20261030/geoclick/`.

The local USA game has no Alaska or Hawaii targets. For these, the recorder
adds a separate, explicitly labelled **Supplemental geographic view · Natural
Earth** using the same camera renderer and sidebar layout. This is not
presented as game content or quiz progress. Eleven state turns are GeoClick
and two supplemental turns are distinguished in the trace's `view` field.
The real Clear opening removes eleven chosen native-map names.

`src/core/geoclick-supplement.mjs` builds the supplemental view without changing
GeoClick source or persisted earned progress. Country and state polygons come
from public-domain Natural Earth 1:50m data, reduced to US states and geographic
country context in `src/lessons/data/pacific-context.geojson`. Its source JSON
records URLs, attribution, processing and checksum. `bin/prepare-pacific-map.mjs`
rebuilds it from the ignored raw downloads. Longitudes are wrapped to keep the
Aleutians continuous, with no relocation or artificial rescaling. Real map
clicks select Alaska and Hawaii from those polygons and display sourced facts.

Preflight verified all thirteen selections and outside-map cards. Alaska is
shown with Canada, Russia, the Bering Strait, its panhandle and Aleutians;
Hawaii is shown as its main island chain, with the state distinguished from
the island of Hawaiʻi. The view labels and narration explain the supplemental
source. The recap returns to the mainland map, then a true Pacific locator.
Both chosen state labels persist; detailed island labels hide at wide zoom.

The camera helper uses the active view for projection, camera moves and overlap
checks. Lessons may put `view: 'supplemental'` on transitions/states and
per-cue `recapMoves` on the recap. Original lessons retain their original view.
Keep English narration and optional English/German/Italian caption tracks.
Do not mark the final series complete until this episode's exported media,
subtitle playback and coverage have been checked.

**Episode 4 and the full series are complete.** The Western clean master is
`play-no-subtitles.mp4` in the episode-4 folder, 8 minutes 22 seconds
(502.24 s), 1600×900 H.264/AAC, with no permanent narration captions. The
recording verified eleven native GeoClick states and two supplemental map
states, with all fact cards outside the active map. The opening clears eleven
chosen native-map names. Alaska/Hawaii frames and the final Pacific locator
were visually checked. The supplemental source label remains visible.

English, German and Italian optional tracks each have 50 correctly timed cues
in SRT and top-positioned WebVTT. Native playback verified all cues, top
placement and switching captions off; Hawaii previews with German captions on
and off were inspected. Audio peaks at -3.4 dB. The upload ZIP contains the
clean master, six caption files, lesson notes, source metadata and instructions.

The final coverage check compared the 50 taught names against the Natural
Earth US-state set with DC explicitly excluded. All fifty match, exactly once
across the four canonical episodes. No US states remain to teach in this
series. Preserve the earlier prototypes as archives, outside these counts.

## Human-player replay: state-specific memory hooks

The source is `C:/bandicam/bandicam 2026-10-30 14-50-20-120.mp4`,
282.833 seconds, silent, and unchanged. The user supplies the premise that the
human watched and learned from the four regional lessons. Explain the opening
eye controls briefly, then name each state as he selects/places it, adding a
geographic memory cue and recalling a fact from those lessons.

**The user explicitly rejected the first generic commentary as useless.**
`rendered/human-player-20261030/` and its 24-cue script are archived,
superseded attempts. Generic observations about dragging, green confirmations
or zooming do not meet the request. Its claim that Colorado was last was also
wrong: the final placement is Utah.

The replacement is `rendered/human-state-hooks-20261030/play-no-subtitles.mp4`,
400.533 seconds (6m41), 2560×1440 H.264/AAC, 30 fps, English narration, with
no burned-in captions. `youtube-upload.zip` contains the master, six caption
files, commentary, timeline, provenance trace and upload instructions.

`src/lessons/human-state-hooks.json` contains 49 named hooks plus opening and
closing cues. `bin/narrate-state-hooks.mjs` renders them; the translations are
in `human-state-hooks.subtitles.json`. Each hook is tied to its source lesson
and prior text in `trace.json`. Examples: Florida's Everglades, Indiana's
Indianapolis 500, Kentucky's Mammoth Cave and Vermont's Green Mountains.

Local Windows OCR of the tray at 2 fps, dragged-label checks and visual review
of all 49 targets established the pickup/placement sequence, saved in
`analysis/placement-events.json`. The final ten have refined label timing;
do not regenerate that file with the coarse derivation script. Narration starts
at each name pickup. Short declared holds allow every hook to finish before
the next pickup, with at least 0.3 seconds between voices. This replacement
is an edited educational replay, not the original uninterrupted timing.

The crop removes desktop/recording chrome, retains map and tray and reserves a
caption band: crop 2536×1356 at (8,32), scale 2240×1198, pad to 2560×1440 at
(160,210). Representative hold frames, northeastern timing, final Utah and
result were inspected. Audio mean is -20 dB, peak -3.4 dB. English, German and
Italian optional SRT/WebVTT tracks each have 51 aligned cues. Native playback
verified parsing, top placement and captions off; German caption-on and clean
previews were inspected. The clean master has no narration text on the map.

The visible result is **49/49 correct first try, zero mistakes**, representing
48 contiguous states plus DC. The 0/49 Known metric measures repeated-round
mastery, not this round's mistakes. This replay adds no canonical teaching
episode and does not change the completed fifty-state coverage.

## Accepted narrator voices and continuing on another computer

The user accepted John as decent English narration: imperfect, but not too
artificial. Use the Italian-recorded clone for Italian, German, French and
Mandarin; the user found it good in those languages but excessively accented
in English. IDs and language assignments are in `src/lessons/narrator-voices.json`.
The API lists blank names. John's identity is inferred from the only new ID
appearing after the user created/replaced the Diego2 slot and named it John;
the user then listened to and accepted that ID's generated sample.

New lesson/replay narration defaults to these accepted choices. Explicit
`--voice=ID` still wins. No existing video has been regenerated; earlier Diego2
metadata and stock-voice exports remain historical. Use a new output folder
for a narrator change (`narrate-state-hooks.mjs` now accepts `--out=...`).
Speech filenames and saved traces include the narrator identity; imported
audio caches must match provider, voice, language and speech model. Older
traces without that identity are not reused automatically.

Earlier samples had a user-reported recurring sound like "new" between
sentences, across languages. The exact cause was not established. Scripts
contained no such word or interjection. Do not claim listening verification:
our checks validated file decoding and levels only. A newer-model comparison
was generated, but no fix was confirmed. The user liked the later clone's
multilingual samples and John's English sample.

Generated videos, audio clips, previews and upload ZIPs are ignored in
`rendered/` and do not travel through Git. Transfer them separately if needed,
along with the original Bandicam recording needed to rebuild the human replay.
The verified 49-target source timing is committed in
`src/lessons/data/human-placement-events.json`; the renderer falls back to it
when the local analysis file is absent. Do not rederive coarse timings.

On another computer, install dependencies with `npm ci`, install Playwright
Chromium with `npx playwright install chromium`, and provide `ffmpeg`/`ffprobe`
on PATH. Configure the same MiniMax account's credentials in
`~/.config/ai-keys.env` (or set `AI_KEYS_FILE`); credentials are never committed.
The GeoClick lesson scripts also require a running local GeoClick app. Read
this document and the canonical coverage ledger before creating more lessons.
