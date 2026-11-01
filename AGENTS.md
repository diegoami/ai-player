# ai-player working notes

For GeoClick YouTube publishing, read [docs/YOUTUBE_PUBLISHING.md](docs/YOUTUBE_PUBLISHING.md).
Use `bin/geoclick-youtube.ps1` and installed youtube3 **2.10.0**. OAuth,
uploads, captions and uncertain-write recovery belong to youtube3; do not
reimplement them or modify its repository. The profile/channel/playlist,
eleven known video IDs and original queue locations are pinned in
`config/geoclick-youtube.json`. Preserve all native checkpoints and the shared
upload ledger. Never reupload known videos. The old operational scripts now
delegate here; their originals are backed up. Stop every account call on quota
errors; do not create a scheduled task. The 1 November 2026 resume hit quota
again at the final Europe captions, with no accepted account changes. Seven
canonical Asia videos are prepared offline only; their uploads are not authorized.

For GeoClick work, read [docs/GEOCLICK.md](docs/GEOCLICK.md) before operating or
recording the game. It contains the manual digest, controls, teaching workflow,
and the eight-state pilot procedure requested by the user.

The completed Asia edition has **seven country lessons**, with John, interesting
facts/location hooks and separate optional English captions. Use
`src/lessons/asia-coverage.json`: 49 stops, with Cyprus counted once and its
Northern Cyprus target demonstrated within that stop. All 47 native Asia
targets are visited; Bahrain, Maldives and Singapore are labelled supplements.
Asian Russia is briefly oriented, since its full stop was in Europe. Output:
`rendered/asia-seven-20261101/`. All 49 stops appear exactly once. The collection
ZIP is `rendered/asia-seven-20261101/all-seven-asia-videos.zip`. Episode 1 uses
the reviewed `01-turkiye-cyprus-caucasus-refined/geoclick/` export; its initial
export is archived. Read the latest GeoClick notes before further work.

The completed Europe edition has **six country lessons**, with John and separate
optional English captions. Follow `src/lessons/europe-coverage.json`: all 39
native Europe targets (Kosovo included with a short status note) plus six
microstates in labelled Natural Earth supplemental views, 45 places exactly
once. The six groups are North Atlantic/Nordics, Western, Central,
Iberia/Mediterranean, Balkans/Greece, Baltic/Eastern Europe. Türkiye, Cyprus and
the Caucasus are outside this edition's map-based scope. Outputs belong in
`rendered/europe-six-20261101/`. Do not claim this map-based list is a universal
definition of Europe. All 45 places are covered exactly once. The collection
ZIP is `rendered/europe-six-20261101/all-six-europe-videos.zip`. The ledger
points to the reviewed `02-western-europe-refined` and
`04-iberia-mediterranean-refined` exports; their original exports are archived.
Read the latest GeoClick notes before continuing.

The completed US edition has **five videos covering the 48 contiguous
states**, with John: Northeast (9), South Atlantic (8), South Central (8),
Midwest (12), West (11). Use `src/lessons/usa-five-video-coverage.json` and
the `usa-five-*.json` lessons. Alaska and Hawaii are deliberately omitted at
the user's request; briefly explain in the last video that their distinctive
locations already make them easy to remember. Do not add supplemental views.
Close the Known empty notice and hide the toolbar using the real eye button.
Outputs belong in `rendered/usa-five-20261101/`. Keep optional captions separate.
All five are complete, with 48 distinct states exactly once. The collection
ZIP is `rendered/usa-five-20261101/all-five-videos.zip`; per-episode masters are
`01-northeast/geoclick/` through `05-west/geoclick/play-no-subtitles.mp4`.

Historical four-video edition: **episode 1: Northeast, including Vermont
(11 states)**. Earlier western and ten-state Northeast videos are prototypes.
Consult `src/lessons/usa-coverage.json` for canonical coverage; do not count the
prototypes as prior episodes. YouTube masters must have optional subtitles,
delivered separately, with no burned-in narration captions.

**The historical four-episode series is complete: all 50 distinct US states,
without duplicates.** Episode 4 covers the thirteen Western states. The local
USA game omits Alaska and Hawaii, so episode 4 uses clearly labelled Natural
Earth supplemental geographic views for those two. DC is not counted as a
state. Consult the ledger before further work; no uncovered US states remain.

The preferred human-play replay is `rendered/human-state-hooks-20261030/`,
6m41 with 49 named placement hooks recalling geography and facts from the four
lessons. Short holds keep narration with its current target. Utah is last.
Optional English/German/Italian captions remain separate. The prior generic
`human-player-20261030` commentary was explicitly rejected and is superseded.
For human replays, comment on each named state with a useful memory hook;
avoid generic descriptions of dragging, confirmations or zooming.
The native result is 49/49 first try, zero mistakes (48 contiguous states + DC),
separate from the canonical 50-state series. See the GeoClick notes.

Preserve existing user changes. Videos and intermediate recordings belong in
the ignored `rendered/` directory.

Accepted narrator choices and setup for another computer are recorded in
`docs/GEOCLICK.md`; voice IDs are in `src/lessons/narrator-voices.json`.
Git excludes generated media and credentials; transfer those separately.
