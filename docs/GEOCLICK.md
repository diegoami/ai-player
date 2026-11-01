# GeoClick: learned controls and recording notes

## YouTube publishing ownership

ai-player now owns the operational entrypoint: see
[YOUTUBE_PUBLISHING.md](YOUTUBE_PUBLISHING.md) and
`config/geoclick-youtube.json`. Use `bin/geoclick-youtube.ps1` with installed
youtube3 2.10.0. Keep the original US/Europe queues, child jobs,
`public-release.json`, known video IDs and shared upload ledger in place;
the three legacy Europe scripts delegate to the repository workflow, with
their originals backed up under `rendered/youtube-publishing/migration-backup/`.

The owner authorized final Europe caption/membership recovery, adding the
playlist link to eleven existing descriptions, and public visibility for those
eleven videos and the existing playlist. The 1 November 2026, 22:08 UTC attempt
again returned `403 quotaExceeded` during caption recovery. No account changes
were accepted and no account calls followed the refusal. Last full remote state
remains ten unlisted playlist videos, final Europe video `XjTQCS8WNEc` private
with captions/membership pending, and an unlisted playlist. Do not describe this
old verification as a fresh remote check. Resume manually when quota permits;
do not schedule retries or replace youtube3's recovery logic.

The seven canonical Asia masters/captions and screenshot thumbnails are prepared
offline in `rendered/asia-seven-20261101/youtube-publishing/`. Each description
links to the playlist, game and both repositories. No Asia uploads are authorized
by the existing-eleven public release. Preserve the current screenshot-based
playlist cover and all other metadata.

## Completed Africa edition: eight country lessons

The owner approved eight lessons: North Africa; Atlantic West Africa; Sahel
and Gulf of Guinea; Central Africa; Nile and Horn; East Africa and Great Lakes;
Southern Africa; Indian Ocean Islands. Follow `src/lessons/africa-coverage.json`.
Coverage is 54 countries once each and Western Sahara as a separate disputed
territory, 55 main teaching stops. Somaliland is a related native selection
within Somalia. The 52 native GeoClick targets include those two disputed
targets; São Tomé and Príncipe, Comoros, Mauritius and Seychelles need labelled
supplemental Natural Earth views. Teaching groups are not an official regional
classification. Mayotte and Réunion are not additional country stops.

John gives a location cue, researched fact and memory hook at each stop. Source
references are in `src/lessons/africa-content.mjs` and each generated lesson.
Research uses UNESCO heritage/biosphere records, the British Museum's Laas Geel
project, the Smithsonian volcano catalogue and UN/Ramsar sources. The current
manual is opened through About/info and User manual by the recorder before
every browser run. Close the Known notice, use Clear for chosen names, and
hide controls with the actual eye button. No earned progress is reset.

Build supplemental geography with `node bin/prepare-africa-map.mjs` using the
retained Natural Earth source in `rendered/europe-natural-earth-10m.geojson`.
Then `node bin/prepare-africa-series.mjs` creates the lessons/initial ledger;
`--refresh-lessons` updates lessons while retaining production history.
`node bin/render-africa-series.mjs --prepare-only` prepares narration;
`--inspect` checks UI selections/layouts, and the plain command records and
verifies media using up to three isolated headless sessions (`--workers=1`
through `3`). Outputs/logs: `rendered/africa-eight-20261102/`.
`node bin/package-africa-series.mjs` requires every visual review to pass and
checks all coverage before marking the series complete and creating the ZIP.
The existing US, Europe and Asia outputs/checkpoints remain untouched.

Preflight found the original Western Sahara point inside GeoClick's Morocco
polygon. The corrected `[-14,23]` point selects its actual Western Sahara
target. Native geometry reflects a control-line split; narration explicitly
distinguishes the unresolved territory from countries and avoids interpreting
the map as a political settlement. The four supplemental maps retain actual
positions and relative scale; tiny islands/reefs may be omitted. Source hash
and public-domain attribution accompany `src/lessons/data/africa-islands.geojson`.

All exports require clean masters and separate optional English SRT/WebVTT,
with top-positioned WebVTT. Keep generated media in ignored `rendered/`; copy
approved caption bytes into tracked `subtitles/` only after final approval.
No Africa YouTube uploads are authorized by production of these lessons.

All eight lessons are complete and packaged in
`rendered/africa-eight-20261102/all-eight-africa-videos.zip`. Durations in
episode order are 5:26, 6:27, 6:17, 6:51, 5:37, 4:27, 8:02 and 4:32.
All 54 countries occur once, with 55 main stops and the related Somaliland
selection. Every native map target and all four supplemental countries were
selected successfully. All Known-notice, Clear, eye-control, card-fit and
sidebar non-overlap checks passed.

Visual review inspected each export's first/middle/final/recap contact sheet
and caption on/off previews, plus extracted frames for all four supplements
and the Somaliland selection. Clean-master streams, audio decoding and peaks,
caption loading, top positioning and toggling all passed. Peaks range from
-3.8 to -3.4 dB. These checks do not constitute a full listening review.
The eight offline publishing entries include approved masters, English SRT,
screenshot thumbnails and all four links. No account calls or uploads occurred.
Exact approved SRT/WebVTT bytes are backed up under `subtitles/africa/`, with
source paths and hashes in the shared subtitle manifest. Existing US/Europe/
Asia caption records remain intact.

## Completed Asia edition: seven country lessons

The user approved seven Asia episodes. Use `src/lessons/asia-coverage.json`;
preserve the completed Europe and US editions. There are 49 teaching stops,
exactly once: 46 primary native targets plus Bahrain, Maldives and Singapore
in labelled Natural Earth supplemental views. Northern Cyprus is a related
selection during the Cyprus stop, with division/recognition explained, not
counted as a second country. Thus all 47 native Asia targets are visited.
Türkiye is labelled Turkey in GeoClick. Asian Russia is briefly oriented;
its full country lesson was in Europe. Palestine and Taiwan include short
context notes. Map outlines do not settle sovereignty, disputed boundaries
or current territorial control.

Groups: Türkiye/Cyprus/Caucasus (5), Levant/Mesopotamia (7), Arabian Peninsula
(7), Central Asia/Afghanistan (6), South Asia (7), East Asia (6), Southeast
Asia (11). John narrates location cues, interesting facts and memory hooks.
Primary sources are in `src/lessons/asia-content.mjs` and generated lessons.
Supplemental maps use generalized Natural Earth 1:10m land polygons at actual
positions and relative scale. The Maldives click is an island interior near
Baa Atoll, not a lagoon or enlarged territory. Tiny islands, reefs, reclamation
and causeways may be omitted. Source metadata/checksum and public-domain
notice are beside `src/lessons/data/asia-small-countries.geojson`.

`bin/prepare-asia-map.mjs` builds geography;
`bin/prepare-asia-series.mjs` builds lessons and the initial ledger. Use
`--refresh-lessons` to preserve production history. The shared recorder
supports related native selections at specific narration lines, checked
separately from primary stops. It opens About/info then User manual before
map operation, closes the Known notice and presses the real eye control.
Clean masters have no burned-in narration captions; optional English SRT
and top-positioned WebVTT are separate.

`node bin/render-asia-series.mjs --inspect` checks all targets and layouts;
`--prepare-only` prepares John audio. The plain command records three
independent headless web sessions. Outputs/logs belong in
`rendered/asia-seven-20261101/`. Media verification and individual visual
review must pass before `node bin/package-asia-series.mjs` marks completion.

Preflight caught a Maldives point too small to hit at the original camera
scale. The current script uses a larger real island interior near Baa Atoll
and a tighter camera; the country geometry is never enlarged. Its wide
locator/recap labels India and Sri Lanka. The first episode's initial export
showed an outdated native extra fact about Varosha. Its related Northern
Cyprus selection now uses `hideExtra:true`: only that optional paragraph is
hidden, while the actual map target, pinned status/origin and map label remain.
The recorded narration never repeats the outdated claim. Episode 1's reviewed
export is `01-turkiye-cyprus-caucasus-refined/geoclick/`; the initial export is
archived and is not delivered. Silent inspections now retain
screenshots/trace without recording redundant video; actual exports still record.

All seven are complete and packaged in
`rendered/asia-seven-20261101/all-seven-asia-videos.zip`. All 49 teaching stops
appear exactly once. Every one of the native map's 47 targets was selected,
including the related Northern Cyprus selection within Cyprus; the three
supplemental countries were selected on their labelled polygons.
The final Brunei point is `[114.67,4.54]` in its western territory; the original
point fell in the Malaysian corridor between Brunei's two parts.

Representative first/middle/final/recap frames and optional-caption previews
were visually inspected for every export, plus all three supplemental views
and the refined Northern Cyprus frame. Caption loading/positioning/toggling,
stream checks, audio decoding and peaks all passed. Peaks range from -3.6 to
-3.1 dB; these checks do not constitute a listening review. All masters are
1600×900 H.264/AAC with separate optional English SRT/WebVTT. Transcripts,
fact references, verification reports and supplemental map sources are included.
The six existing offline narration/path tests pass; syntax/diff checks pass.

| Episode | Teaching stops | Duration |
|---|---:|---:|
| Türkiye, Cyprus and the Caucasus | 5 | 5:18 |
| Levant and Mesopotamia | 7 | 6:30 |
| Arabian Peninsula | 7 | 6:45 |
| Central Asia and Afghanistan | 6 | 5:21 |
| South Asia | 7 | 6:35 |
| East Asia | 6 | 5:40 |
| Southeast Asia | 11 | 10:04 |

## Completed Europe edition: six country lessons

The user accepted the proposed six-video Europe route and requested producing
the full series. Native inspection of GeoClick v1.2.1 found 39 Europe targets,
including Kosovo, and no microstates. The accepted plan explicitly includes
the microstates: Monaco, Liechtenstein, Andorra, San Marino, Vatican City and
Malta are added as labelled Natural Earth supplemental views, not presented
as native game targets. The series covers 45 places, each exactly once.
Türkiye, Cyprus and the Caucasus are absent from the map and outside this
edition's scope; the final recap explains that this is not a universal
definition of Europe. Kosovo's disputed status is explained at its stop;
Russia's European map view is distinguished from its Siberian fact.

Groups: North Atlantic/Nordics (7), Western Europe (5), Central Europe (8),
Iberia/Mediterranean (7), Balkans/Greece (9), Baltic/Eastern Europe (9).
John narrates location cues, one researched fact and a geographic memory hook
per place. Primary sources are recorded in `src/lessons/europe-content.mjs`
and the six `europe-0*.json` lessons. `src/lessons/europe-coverage.json` is the
independent ledger. Do not modify either completed US ledger.

`bin/prepare-europe-map.mjs` extracts target polygons and neighbouring
context from Natural Earth 1:10m country data. Vatican City uses the detailed
geoBoundaries VAT-ADM0-52476719 polygon (Wikimedia Commons, public domain).
Monaco uses geoBoundaries MCO-ADM0-9783051 (OpenStreetMap, ODbL 1.0); the French
Riviera context uses IGN-F ADMIN EXPRESS 2022 via geoBoundaries FRA ADM1,
clipped to the local geographic rectangle under Etalab Open License 2.0.
Preflight/visual review caught both the coarse Vatican locator and the much
too broad Natural Earth Monaco outline. A detailed Monaco polygon cannot be
combined with the old coarse French cutout: it appears offshore. The IGN-F
coastal context fixes the joins without moving or rescaling anything.
France's coarse country lines are suppressed on supplemental views so they
do not draw false internal seams. Beside Andorra, clipped Natural Earth
French context preserves the join with the Natural Earth Spain/Andorra
boundaries; mixing the French ADM0 edge with them left a false water gap.
The initial Mediterranean export is archived; use the reviewed refined export.
Metadata/checksum and attribution/license
notices are beside `src/lessons/data/europe-microstates.geojson`. The combined
database is offered under ODbL and included in the collection ZIP.
Sources are visibly credited on supplemental views. It is a generalized
geographic map, not street/survey data. All polygons retain their actual
positions and relative scale. `bin/prepare-europe-series.mjs` builds lessons;
`--refresh-lessons` preserves production history. Do not change recorded
narration without invalidating affected media/cache checks deliberately.

The shared recorder now accepts lesson mapId/area/unit/initialBounds and
per-restore camera bounds; USA defaults remain intact. It opens About → User
manual, closes the empty Known notice, clicks Clear, then presses the eye.
Native state/country reveals are real map clicks. Supplemental view switches
and real polygon clicks are distinguished in the trace. Supplemental recaps
locate all six small states without implying earned quiz progress.

Run `node bin/render-europe-series.mjs --inspect` for all preflights, and
`--prepare-only` for John audio without a browser. The plain command records
two episodes at a time after all preflights pass. Outputs/logs live under
`rendered/europe-six-20261101/`. The shared verifier exports optional English
SRT/top-positioned WebVTT and tests parsing/toggling, streams and audio levels;
it extracts first/middle/final/recap frames and each supplemental target.
Visual inspection is required before marking the new edition complete.
The initial Western and Mediterranean exports are archived. The ledger delivers
`02-western-europe-refined/geoclick/` and
`04-iberia-mediterranean-refined/geoclick/`. The other episode paths keep
their original names. John audio is reused only when both text and narrator
configuration match. `--workers=3` was used to finish independent recordings;
the renderer defaults to two.

All six are complete and packaged as
`rendered/europe-six-20261101/all-six-europe-videos.zip`. Coverage is 45 distinct
places exactly once: 39 native targets and six supplemental microstates.
Representative first/middle/final/recap frames, all six supplemental close
views, and caption-on previews were visually inspected. Optional captions
parse and toggle correctly; all audio decodes with peaks from -3.9 to -3.4 dB.
These technical checks are not a listening review. No narration captions are
burned into the masters. Transcripts, sources, map data and license notices
are included in the collection.

| Episode | Places | Duration |
|---|---:|---:|
| North Atlantic and Nordics | 7 | 6:16 |
| Western Europe | 5 | 4:32 |
| Central Europe | 8 | 6:56 |
| Iberia and Mediterranean | 7 | 6:55 |
| Balkans and Greece | 9 | 7:41 |
| Baltic and Eastern Europe | 9 | 7:34 |

## Completed US edition: five videos, 48 contiguous states

The user explicitly requested all five videos in one task, with unequal but
coherent groups. The new edition supersedes the four-video edition for new
delivery; preserve the historical ledger and media. John remains the English
narrator. Scope is exactly 48 contiguous states, excluding DC, Alaska and Hawaii.
The final episode briefly explains the deliberate omission of Alaska/Hawaii:
their distinctive locations already make them easy to remember.

Groups follow Census definitions: Northeast (9), South Atlantic (8), the
combined East/West South Central divisions (8), Midwest (12), and contiguous
West (11). Region definitions and reviewed fact sources are in the lesson JSON.
`src/lessons/usa-five-video-coverage.json` tracks this edition independently.
`bin/prepare-five-video-series.mjs` builds its five `usa-five-*.json` lessons
from the historical reviewed material and checks all 48 states exactly once.
It replaces old episode references and transitions to match the new groups.
Do not rerun the builder over a finished ledger without intending to reset its
production status.

`node bin/render-five-video-series.mjs` preflights all five lessons and renders
two independent browser recordings at a time. It reuses matching John clips
from the new New England pilot, never old narrator audio. Outputs and logs are
in `rendered/usa-five-20261101/`; each episode has a `geoclick/` subfolder.
The runner opens About → User manual, dismisses the empty Known notice, clears
chosen names and presses the eye button. No earned progress is fabricated.
`bin/verify-lesson-video.mjs --dir=<episode-output>` exports wrapped optional
English SRT/WebVTT, checks native caption parsing and switching off, probes
media/audio, and extracts a contact sheet for human visual inspection.
Do not mark an episode complete until that inspection passes.

**All five videos are complete and visually checked.** The new edition covers
48 distinct states exactly once, with Alaska/Hawaii deliberately excluded and
the requested brief explanation in episode 5. Clean 1600×900 H.264/AAC masters:

| Episode | States | Duration | Output folder under `rendered/usa-five-20261101/` |
| --- | ---: | --- | --- |
| Northeast | 9 | 6m46 | `01-northeast/geoclick/` |
| South Atlantic | 8 | 6m31 | `02-south-atlantic/geoclick/` |
| South Central | 8 | 6m03 | `03-south-central/geoclick/` |
| Midwest | 12 | 9m15 | `04-midwest/geoclick/` |
| West | 11 | 8m08 | `05-west/geoclick/` |

Each folder contains `play-no-subtitles.mp4`, optional English SRT and
top-positioned WebVTT, transcript/sources, trace, screenshots and verification.
Caption cue counts are 36, 34, 32, 47 and 42. Browser playback verified loading,
top positioning and switching captions off; caption-on previews and extracted
first/state/final/recap frames were visually checked for each episode. Every
state selection and fact-card non-overlap passed. Audio peaks range from -3.1
to -3.5 dB; these are decoding/level checks, not a listening review.
`all-five-videos.zip` contains all five masters, captions, transcripts/sources,
verification reports and an index. `series-manifest.json` records exact lengths.
The five-video ledger is complete; preserve the historical fifty-state ledger.

## New John pilot (1 November 2026)

The user requested a new Northeast pilot with John, explicitly permitting the
local web application as an alternative to the desktop application. This is a
new six-state New England pilot, not additional canonical series coverage.
Preparation and media are under `rendered/john-northeast-pilot-20261101/`.
The current v1.2.1 manual was opened through the home About/info link and its
User manual link before operating the map. The lesson runner now follows that
route, closes the bottom-left Nothing known yet notice with its real close
button, and presses the right-hand eye button after Clear to hide the toolbar.
Its `--review` flag permits explicitly requested pilots/revisions of previously
covered states; ordinary new lessons retain the duplicate-coverage guard.
The local web server for this run is `http://127.0.0.1:5188`.
Use John's accepted voice ID and a clean master with separate optional captions.

Completed pilot: `rendered/john-northeast-pilot-20261101/geoclick/play-no-subtitles.mp4`,
273.44 seconds, 1600×900 H.264/AAC. Six real state selections, outside-map fact
cards, notice dismissal and eye action passed. English SRT and top-positioned
WebVTT each contain 23 cues; browser loading and switching captions off passed.
An extracted Rhode Island frame verified export timing independently of browser
seeking. Audio peak is -3.2 dB; this is a level/decoding check, not a listening review.

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
