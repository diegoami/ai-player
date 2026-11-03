# ai-player working notes

For GeoClick YouTube publishing, read [docs/YOUTUBE_PUBLISHING.md](docs/YOUTUBE_PUBLISHING.md).
Use `bin/geoclick-youtube.ps1` and installed youtube3 **2.10.0**. OAuth,
uploads, captions and uncertain-write recovery belong to youtube3; do not
reimplement them or modify its repository. The profile/channel/playlist,
all 77 known video IDs and original queue locations are pinned in
`config/geoclick-youtube.json`. Preserve all native checkpoints and the shared
upload ledger. Never reupload known videos. The old operational scripts now
delegate here; their originals are backed up. Stop calls using an exhausted quota bucket; private uploads have a separate
quota bucket and may continue through the upload-only runner. Stop on upload quota
errors; do not create a scheduled task.

**All 77 GeoClick videos are published.** Thirty-two are public (2 November
2026): US 5, Europe 6, Asia 7, Africa 8, North America 3 and South America 3,
each with the playlist link in every description. Twenty-one more went out the
same day as **unlisted** members at the end of the same public playlist: the
Europe capitals, Asia capitals, South America capitals and North America
capitals lessons. Four more, the Oceania capitals lessons, the six Africa
capitals lessons and the thirteen regions lessons went out unlisted on
3 November 2026. The playlist `PLNl_MybP55PE` is public with all 77 members
in order, confirmed by a fresh read on 3 November 2026: none missing, none
duplicated, the playlist link in every description.
The owner postponed
subtitles, so no caption
track was installed for Europe 6, the seven Asia videos, the eight Africa
videos, the twenty North America, South America and capitals videos, the
four Oceania capitals videos, the six Africa capitals videos or any of
the thirteen regions lessons; the ten US and Europe captions already accepted
remain. Add the deferred captions later per video with
`bin/install-captions.py`, which uses youtube3's own caption upload, keeps a
ledger of accepted caption IDs and stops on a quota refusal. **Do not resume
the Africa or Europe 6 native queues**: their queued publication target is
still private or unlisted and would un-publish those videos.

The completed Africa edition has **eight regional lessons** with John.
Use `src/lessons/africa-coverage.json`: 54 countries once each, plus Western
Sahara as a disputed-territory stop. Somaliland is a related selection within
Somalia, not another country. All 52 native targets and four supplemental
island countries must be demonstrated. Outputs: `rendered/africa-eight-20261102/`.
All media checks and visual reviews passed; the collection ZIP is
`all-eight-africa-videos.zip` under that output root. Exact optional English
SRT/WebVTT backups are in tracked `subtitles/africa/`. Eight entries are
prepared in the separate publishing batch. All eight uploads were authorized
and accepted privately, then published with their screenshot thumbnails and
playlist seats. IDs are in the Africa production ledger and subtitle
manifest. `videos.insert` has its own quota bucket:
`bin/upload-africa-private.py` uses native youtube3 callbacks to pause immediately
after upload, retaining the same queue, jobs and shared ledger. Never recreate
the queue or reupload known IDs. See the runbook for finishing-stage recovery.

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
export is archived. The owner authorized the seven uploads on 2 November 2026:
they went out through youtube3's own plan/run/queue flow and the shared ledger
with a caption-free derived batch (`bin/upload-asia.py`), and their captions
are still deferred. Read the latest GeoClick notes before further work.

The completed North America edition has **three country lessons**, with John,
interesting facts/location hooks and separate optional English captions. It
uses GeoClick's native `north-america-countries` map, whose 16 country targets
are all demonstrated once each: Canada, the United States, Mexico, seven
Central American countries and six Caribbean countries. Greenland is not a
target of that map. Use `src/lessons/north-america-coverage.json` and
`src/lessons/north-america-content.mjs`. Output: `rendered/north-america-three-20261102/`;
the collection ZIP is `all-three-north-america-videos.zip` under that root.
Durations are 2:47, 6:52 and 5:25. Exact optional English SRT/WebVTT backups
are in tracked `subtitles/north-america/`. The owner authorized the upload:
the three videos are **unlisted** in playlist `PLNl_MybP55PE` as
`mEvKC8wtS44`, `CktKmkqtw8g` and `Fm2Y-M0-Btw`, with the playlist link and
their screenshot thumbnails; their captions are deferred. See the GeoClick
notes for the two things a new map needs: on-land click points per stop, and
a restore list so the real Clear button exists.

The completed North America capitals edition has **five capital lessons**, with
John, interesting facts/location hooks and separate optional English captions.
It uses GeoClick's native `north-america-capitals` point map, whose 23 capital
targets are all demonstrated once each: Canada, the United States, Mexico, the
seven Central American countries with Belize, and the Caribbean islands. The
fact card shows the English display name, so Mexico City is taught as Mexico
City. Use `src/lessons/north-america-capitals-coverage.json` and
`src/lessons/north-america-capitals-content.mjs`. Output:
`rendered/north-america-capitals-20261102/`; the collection ZIP is
`all-five-north-america-capitals-videos.zip`. Durations are 2:56, 5:33, 3:16,
3:52 and 3:09. Exact optional English SRT/WebVTT backups are in tracked
`subtitles/north-america-capitals/`. The five videos went out **unlisted** in
the same playlist as `JDlnPz-Rsl4`, `-5npYYzoZ3I`, `JAi68d3yfrA`, `lNI6UGU06ys`
and `m9A2bJ8kt0M`, with their captions deferred.

The **regions series** teaches one country's own first-level regions, one
video per country. It is driven by `src/lessons/regions-series.json`, so a
new country is one config entry plus one content file; the prepare, render and
package scripts are shared (`bin/prepare-regions-series.mjs`,
`bin/render-regions-series.mjs`, `bin/package-regions-series.mjs`). A country
with a `groups` list becomes one lesson per group, and each group keeps the
map's own tour order within itself.

Thirteen countries are done and published, all **unlisted** in the same playlist
on 3 November 2026, with their screenshot thumbnails and the playlist link and
their captions deferred:

| Country | Lesson | Regions | Duration | Video ID |
|---|---|---|---|---|
| Spain | Spain's regions | 16 | 10:26 | `Z8iZlY9Qzjw` |
| Italy | Italy's regions | 20 | 17:33 | `5i72VO8Wvuc` |
| France | France's regions | 13 | 11:16 | `s9J0aijRe_s` |
| Germany | Germany's states | 16 | 13:16 | `7KuXcUTaqjI` |
| Great Britain | Great Britain's regions | 15 | 11:16 | `vMJ_OlR3H_Q` |
| Poland | Poland's regions | 16 | 12:29 | `8ekHRnJEBSk` |
| Ukraine | Western and northern Ukraine | 12 | 10:41 | `sURTlO3p-GU` |
| Ukraine | Eastern and southern Ukraine | 15 | 11:46 | `gJuGUEOPU3U` |
| Australia | Australia's states | 8 | 7:00 | `i1y0HpL7AT0` |
| Canada | Canada's provinces | 13 | 12:11 | `kbvMYoH0bDY` |
| South Africa | South Africa's provinces | 9 | 7:30 | `IfKuFofmhKY` |
| Morocco | Morocco's regions | 12 | 9:29 | `o2jXgTKKJRo` |
| Egypt | Egypt's regions | 27 | 21:04 | `I-4uyV_cjQI` |
| Sweden | Sweden's regions | 21 | 16:13 | `eELcpw0Qycw` |

Each content file is `src/lessons/<country>-regions-content.mjs` and each
ledger `src/lessons/<country>-regions-coverage.json`; the outputs are
`rendered/<country>-regions-20261103/` with a collection ZIP per country. The
click points are verified in a real browser by `bin/find-map-points.mjs`, and
`bin/check-regions-content.mjs` checks a content module against its brief and
its verified points. `bin/region-brief.mjs` writes the brief each country is
written from.

The completed Africa capitals edition has **six capital lessons**, with John,
interesting facts/location hooks and separate optional English captions. It
uses GeoClick's native `africa-capitals` point map, whose 54 capital targets
are all demonstrated once each: the capital of every African country the map
names, with South Africa's three capitals all taught and Hargeisa taught as
the capital of Somaliland alongside Mogadishu as the capital of Somalia. Use
`src/lessons/africa-capitals-coverage.json` and
`src/lessons/africa-capitals-content.mjs`. Output:
`rendered/africa-capitals-20261103/`; the collection ZIP is
`all-six-africa-capitals-videos.zip`. Durations are 5:59, 6:20, 6:08, 7:12,
5:56 and 7:05. Exact optional English SRT/WebVTT backups are in tracked
`subtitles/africa-capitals/`. The owner authorized the upload on
3 November 2026: the six videos went out **unlisted** in the same playlist as
`OIuDFN43_Fk`, `sYksvGMl4Do`, `MGpDV2baADw`, `2BT9vKBG43I`, `K9L_xDLywDA`
and `33laD-nUU5I`, with their screenshot thumbnails and the playlist link;
their captions are deferred. Nothing may be re-uploaded after it goes out.

The completed Oceania capitals edition has **four capital lessons**, with John,
interesting facts/location hooks and separate optional English captions. It
uses GeoClick's native `oceania-capitals` point map, whose 11 capital targets
are all demonstrated once each: the Pacific island states and Australia and New
Zealand. Use `src/lessons/oceania-capitals-coverage.json` and
`src/lessons/oceania-capitals-content.mjs`. Output:
`rendered/oceania-capitals-20261102/`; the collection ZIP is
`all-four-oceania-capitals-videos.zip`. Durations are 2:33, 2:00, 2:29 and
2:39. Exact optional English SRT/WebVTT backups are in tracked
`subtitles/oceania-capitals/`. The owner authorized the upload on
3 November 2026: the four videos went out **unlisted** in the same playlist as
`XmFxYzfASDo`, `bKY4cwBbMMk`, `7ph0YuAWbVs` and `d39c1RJeC4Y`, with their
screenshot thumbnails and the playlist link; their captions are deferred.
Nothing may be re-uploaded after it goes out.

The completed South America edition has **three country lessons**, with John,
interesting facts/location hooks and separate optional English captions. It
uses GeoClick's native `south-america-countries` map, whose 12 country targets
are all demonstrated once each: Colombia, Venezuela, Guyana, Suriname,
Ecuador, Peru, Bolivia, Chile, Brazil, Paraguay, Uruguay and Argentina.
French Guiana is not a target of that map. Use
`src/lessons/south-america-coverage.json` and
`src/lessons/south-america-content.mjs`. Output:
`rendered/south-america-three-20261102/`; the collection ZIP is
`all-three-south-america-videos.zip` under that root. Durations are 4:01, 4:12
and 4:03. Exact optional English SRT/WebVTT backups are in tracked
`subtitles/south-america/`. The three videos are public in the same playlist
as `m_s2tya9grM`, `-Wi_pE_Nwx0` and `_q2YJDRGgpg`, with their captions
deferred.

The completed South America capitals edition has **three capital lessons**,
with John, interesting facts/location hooks and separate optional English
captions. It uses GeoClick's native `south-america-capitals` point map, whose
13 capital targets are all demonstrated once each: the capitals of the twelve
countries the map names, with Bolivia's two capitals, La Paz and Sucre, both
taught. Use `src/lessons/south-america-capitals-coverage.json` and
`src/lessons/south-america-capitals-content.mjs`. Output:
`rendered/south-america-capitals-20261102/`; the collection ZIP is
`all-three-south-america-capitals-videos.zip`. Durations are 4:07, 3:33 and
3:37. Exact optional English SRT/WebVTT backups are in tracked
`subtitles/south-america-capitals/`. The three videos went out **unlisted**
in the same playlist as `5oSNj262L9s`, `NpgKeTiG6lc` and `5VpzfSO_SWU`, with
their captions deferred.

The completed Europe capitals edition has **six capital lessons**, with John,
interesting facts/location hooks and separate optional English captions. It
uses GeoClick's native `europe-capitals` point map, whose 44 capital targets
are all demonstrated once each. Use
`src/lessons/europe-capitals-coverage.json` and
`src/lessons/europe-capitals-content.mjs`. Output:
`rendered/europe-capitals-20261102/`; the collection ZIP is
`all-six-europe-capitals-videos.zip` under that root. Durations are 5:12,
5:28, 6:15, 5:49, 5:45 and 3:00. Exact optional English SRT/WebVTT backups
are in tracked `subtitles/europe-capitals/`. The six videos went out
**unlisted** in the same playlist as `L_fCNufSRMM`, `mZ6S5pXin7E`,
`dmuhY0J50I0`, `2GOYTfxBX4A`, `ZHbvY3GAGwg` and `285b_NcXI5Y`, with their
captions deferred.

The completed Asia capitals edition has **seven capital lessons**, with John,
interesting facts/location hooks and separate optional English captions. It
uses GeoClick's native `asia-capitals` point map, whose 47 capital targets are
all demonstrated once each. Use `src/lessons/asia-capitals-coverage.json` and
`src/lessons/asia-capitals-content.mjs`. Output:
`rendered/asia-capitals-20261102/`; the collection ZIP is
`all-seven-asia-capitals-videos.zip` under that root. Durations are 6:30,
4:01, 5:14, 6:02, 5:14, 4:45 and 4:07. Exact optional English SRT/WebVTT
backups are in tracked `subtitles/asia-capitals/`. The seven videos went out
**unlisted** in the same playlist as `zSO15iqpqjQ`, `eZjfTqr5gLU`,
`JgDnVRBCXck`, `JkfAdRz4VKk`, `xi7PSSQea20`, `jqr0M9ifQJY` and `guDkbWfob2w`,
with their captions deferred.

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
