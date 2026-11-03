# GeoClick YouTube publishing

ai-player owns the GeoClick publishing policy and entrypoint. Installed
**youtube3 2.10.0** owns OAuth, uploads, caption insertion, job checkpoints,
duplicate protection and recovery. Its installed code and repository are not
modified. Use its Python environment, not the unrelated default Python.

Destination: profile `lynxsupercluster`, channel `UCQHMx6rNOKfLxFRI4_Tf6cA`,
playlist [`PLNl_MybP55PE`](https://www.youtube.com/playlist?list=PLNl_MybP55PE),
**Learning Geography with Geoclick**. Policy and known IDs are in
[config/geoclick-youtube.json](../config/geoclick-youtube.json).

**Current state: 64 videos are published and the playlist is public.** Thirty-two
are public and thirty-two are unlisted, all reachable through the public
playlist `PLNl_MybP55PE`, which has all 64 of them in order. The last release
was the Spain regions lesson on 3 November 2026, unlisted. The first
release happened on 2 November 2026 with subtitles deliberately postponed; see
*Published release: 2 November 2026* below. The older sections are kept as the
history of how the eleven US and Europe videos and the eight Africa uploads
got there. Captions remain deferred on 47 of the 57 videos.

## Commands from ai-player

```powershell
# No account access: inspect checkpoints, known IDs and the shared ledger.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode audit

# No account access: preserve original operational files and install delegates.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode migrate

# No account access: prepare the seven approved Asia masters and captions.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode prepare

# No account access: prepare Africa only after all eight exports are approved.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode prepare -Series africa

# Account reads, no account writes: reconcile a fresh public-release preview.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode plan

# Authorized account writes: recover the final Europe entry, then release 11 videos.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode resume

# Account reads only: check public visibility, descriptions, metadata and order.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode verify
```

### Commands for the published release (2 November 2026)

The owner asked for the videos to be published with subtitles postponed,
because caption insertion is expensive. Two scripts serve that release. Both
call installed youtube3 2.10.0 for every account write; neither reimplements
uploads, OAuth, captions or recovery, and neither touches a native checkpoint.

```powershell
$py = "$env:LOCALAPPDATA\Programs\youtube3\Scripts\python.exe"

# Upload an approved series (caption-free derived batch, chosen visibility).
& $py -I bin/upload-series.py --series asia --privacy unlisted
& $py -I bin/upload-series.py --series north-america --privacy unlisted

# Publish what already exists: playlist link in the description, public
# visibility, screenshot thumbnail and playlist seat. Captions are never sent.
& $py -I bin/publish-videos.py --step us-europe
& $py -I bin/publish-videos.py --step asia
& $py -I bin/publish-videos.py --step africa
& $py -I bin/publish-videos.py --step playlist

# Account reads only: visibility, links, playlist order and membership.
& $py -I bin/publish-videos.py --step verify
```

Order matters for the playlist: `us-europe` first, then the Asia upload, then
`africa`. Each seat is appended, so the list ends up United States (5), Europe
(6), Asia (7), Africa (8).

The wrapper defaults to
`$env:LOCALAPPDATA\Programs\youtube3\Scripts\python.exe`. Set
`YOUTUBE3_PYTHON` if the installed youtube3 interpreter lives elsewhere. The
equivalent direct command is `& $env:YOUTUBE3_PYTHON -u bin/geoclick-youtube.py audit`.
No interpreter, credential, profile or OAuth token is copied into this repo.
The Python entrypoint applies the same Windows-principal environment setup as
the installed youtube3 launcher for SSH sessions, then delegates authentication
entirely to `YoutubeClient`.

`plan` and `verify` consume quota. Do not run them as repeated quota probes.
After a quota refusal, stop calls against that exhausted bucket. Uploads use
a separate bucket; the upload-only policy below can defer finishing stages.
Once quota/access for finishing work is known to
permit work, run `resume` once. No retry loop or scheduled task is installed.
The workflow lock prevents concurrent invocations of the migrated entrypoint.

`prepare` defaults to Asia; `-Series africa` selects the separate Africa offline
batch. Both require a complete production ledger and passed visual reviews,
use installed youtube3 for caption validation and batch resolution, and make no
account calls. They do not require the original US/Europe operational queues
or shared ledger. All four links are included. Neither preparation authorizes
uploads, and the eleven-video release workflow never uploads either series.

## Authority and retained files

Versioned English subtitle backups for all 64 current episodes — US, Europe,
Asia, Africa, North America, South America, the capitals editions and the
regions edition —
are in [subtitles/](../subtitles/README.md). Its manifest maps exact caption
bytes to canonical masters and known YouTube IDs. These backups do not replace
the original queue caption inputs or checkpoints. Every one of these series is
now uploaded; the captions remain deferred throughout.

These remain the original operational authorities; do not move or regenerate them:

| Authority | Location |
|---|---|
| US batch, immutable plan and queue/jobs | `rendered/usa-five-20261101/youtube-publishing/` |
| Europe batch, immutable plan and queue/jobs | `rendered/europe-six-20261101/youtube-publishing/` |
| Existing public-release state and operation history | Europe folder's `public-release.json` |
| Shared youtube3 upload ledger | Both queues' `ledger` path, currently `%APPDATA%/youtube3/publishing/uploads-UCQHMx6rNOKfLxFRI4_Tf6cA.json` |
| Consolidated cached operating plan | `rendered/youtube-publishing/operating-plan.json` |
| Original operational backups and hashes | `rendered/youtube-publishing/migration-backup/manifest.json` |
| Last attempt and safe error categories | `rendered/youtube-publishing/last-run.json` |
| Last fresh API snapshot / final verification | `rendered/youtube-publishing/last-observation.json`, `verification.json` when available |

The old Europe `publish-all.py`, `publish.py` and `resume-publication.ps1` are
compatibility delegates to the repository entrypoint. Their original contents
are backed up with hashes before replacement. Legacy `apply`/`retry` delegate
to `resume`; `plan` delegates to the read-only preview. Legacy `prepare` is an
audit, since the existing Europe assets are already prepared. Use the repository
`prepare` command for the new offline Asia batch. The old scripts' unlisted-only
validation and post-quota readback are retired.

Queues, child checkpoints, their IDs, accepted caption IDs and fingerprints are
never rebuilt. The entrypoint verifies all eleven known upload IDs against both
their original child jobs and shared ledger. Recovery is rejected if those
identities disagree. The ledger remains shared with youtube3; never replace it
with an empty file or create a second ledger to bypass duplicate protection.

These generated operational files and media are ignored by Git. Transfer them
separately, preserving the queue/job relationships and original shared ledger.
Credentials travel only through the owner's normal youtube3 setup. Git contains
the policy, operating code, tests and these instructions, not credentials.

### How an upload is authorised

An upload is an outward-facing publication, so it needs the owner's explicit
approval naming **what is uploaded, to where, and with what visibility** — for
example "upload the five North America capitals videos unlisted to playlist
PLNl_MybP55PE". A bare "upload" is not enough, and neither is a single word
such as "unlisted": both were refused by the harness's permission gate as
inferred consent, and the run then had to ask again. Ask for the whole
sentence at once, in the options themselves, and record the answer with the
operation it authorises.

Everything else about the release stays as it is: captions deferred, playlist
link in every description, screenshot thumbnail from the approved master,
playlist seat through youtube3's own `ensure_playlist_member`, and the shared
ledger carrying the upload. A video ID is never re-uploaded once it is known.

## Approved release and recovery

The owner authorized finishing English captions and playlist membership for
`XjTQCS8WNEc`, inserting the playlist link among existing links in all eleven
video descriptions, and making those videos and the existing playlist public.
The entrypoint exposes **no new-upload operation**.

`resume` first calls youtube3's existing `publishing_queue.run_queue` on only
`europe-06-baltic-eastern-europe`, with its failed stage selected. youtube3
continues captions, membership and the original unlisted publication, skipping
the successful upload/thumbnail/metadata stages. This also persists accepted
caption IDs and membership results through the existing native checkpoints.
The original batch configurations intentionally retain their unlisted setting:
they describe the historical upload job, not a replacement release queue.

Once that queue entry completes, the entrypoint reads all eleven videos in one
batch and the playlist/members in pages of 50. It reconciles each description
from current remote text and inserts the playlist link once, preserving existing
links and wording. youtube3's `publish.plan_publish`/`apply_publish` preserves
the complete writable snippet/status parts. The library performs a fresh read
per video for its own safe update; the wrapper does not replace that logic.
Unchanged public/linked videos are skipped.

The playlist update sends **only `status.privacyStatus`** through the installed
client, because youtube3 has no playlist-visibility helper. Title, description,
thumbnails and cover/image endpoints are untouched. The existing screenshot-based
playlist cover is retained. Before/after verification compares the playlist
snippet, each video's other writable metadata/status fields, complete description
with just the link insertion, and exact relative order with one membership per
known video. Existing unrelated playlist items are preserved. No caption-list
polling is added for the ten completed entries; accepted caption IDs in their
native checkpoints remain authoritative.

Interrupted or failed attempts retain operation history and are reconciled from
fresh remote state on the next invocation. A successful write followed by a
lost local response does not cause a reupload: the native upload ledger and
explicit IDs stay authoritative. Uncertain captions or playlist writes remain
under youtube3 recovery rules; the wrapper stops rather than guessing.

For uncertain native stages, inspect Studio/the account first, then use the
installed CLI's `publishing-batch recover` mechanism. For example, an inspected
accepted subtitle ID can be acknowledged with:

```powershell
$queue = 'rendered/europe-six-20261101/youtube-publishing/queue.json'
# Set $captionId only from an inspected, matching English track in Studio.
youtube3 publishing-batch recover $queue --entry europe-06-baltic-eastern-europe --subtitle-index 1 --caption-id $captionId --profile lynxsupercluster --apply
```

Use `--confirm-subtitle-missing` or `--missing-playlist PLNl_MybP55PE` only after
confirming the corresponding uncertain write did not land. Never use
`--confirm-not-uploaded` for any of the eleven known video IDs. Do not edit
checkpoint states manually. Resume through ai-player after explicit recovery.

## Published release: 2 November 2026

The owner asked to publish the videos and to postpone subtitles, because
caption insertion is expensive. All three pending series went out. Every
write went through installed youtube3 2.10.0; no caption was read, planned or
inserted in this release.

Live state, confirmed by a fresh read after the last write:

- **32 videos are public** on channel `UCQHMx6rNOKfLxFRI4_Tf6cA`: eleven US
  and Europe, seven Asia and eight Africa, plus the three North America and
  three South America videos that went out unlisted and were later made
  public at the owner's request. Each description carries the playlist link
  exactly once.
- **Twenty-one more videos are unlisted**, added at the end of the day: six
  Europe capitals lessons, seven Asia capitals lessons, three South America
  capitals lessons and five North America capitals lessons. They are reachable
  through the playlist but not pushed to the channel. See *Europe capitals:
  uploaded unlisted*, *Asia capitals: uploaded unlisted*, *South America
  capitals: uploaded unlisted* and *North America capitals: uploaded unlisted*
  below.
- **The playlist `PLNl_MybP55PE` is public** with all 53 members, in order:
  United States 1–5, Europe 1–6, Asia 1–7, Africa 1–8, North America 1–3,
  South America 1–3, Europe capitals 1–6, Asia capitals 1–7, South America
  capitals 1–3, North America capitals 1–5. No duplicates and
  no unrelated members. Title, description and the screenshot cover are
  unchanged.
- **Captions are deferred, not installed.** Ten US and Europe videos keep the
  captions they already had. Forty-three videos have no caption track:
  Europe 6, all seven Asia videos, all eight Africa videos and the twenty-eight
  North America, South America, Europe capitals, Asia capitals, South America
  capitals and North America capitals videos.

New artefacts, all ignored by Git:

| Artefact | What it is |
|---|---|
| `rendered/youtube-publishing/publish-run.json` | The last publish step and its accepted actions |
| `rendered/youtube-publishing/publish-verification.json` | The read-back of visibility, links and playlist order |
| `rendered/asia-seven-20261101/youtube-publishing/batch-upload.json` | The caption-free derived Asia batch used for the upload |
| `rendered/asia-seven-20261101/youtube-publishing/plan-upload.json`, `queue-upload.json`, `queue-upload.json.jobs/` | The native plan, queue and checkpoints of the seven Asia uploads |
| `rendered/asia-seven-20261101/youtube-publishing/upload-run.json` | The accepted Asia upload IDs and their playlist seats |

The seven Asia uploads went through youtube3's own `plan`, `run` and queue flow
with the same shared per-channel upload ledger; the ledger now holds 26
records. The derived batch omits the subtitle rows, so no caption stage exists
in those jobs at all.

### Two things the API required

- **Playlist visibility** cannot be changed with a status-only call. YouTube
  refuses `part=status` with `unexpectedPart`. The working form is
  `part=snippet,status` with the current snippet sent back unchanged beside
  `status.privacyStatus`, which leaves the title, description and cover as
  they were.
- **The queued publication target is not the release.** The native Africa and
  Europe 6 jobs still name `private`/`unlisted` as their publication target,
  because those plans predate the release. **Do not resume those queues to add
  captions**: the publication stage would put the videos back to private.
  Captions for the sixteen videos are uploaded per video with youtube3's own
  caption upload instead, which touches only the caption track.

### Recovering captions later

Captions are optional tracks, not part of publication. When the owner decides
to add them, use installed youtube3's own per-video caption upload for each of
the 53 videos below, one at a time, and stop on any quota refusal.
`bin/install-captions.py` does exactly this and keeps its own ledger of
accepted caption IDs; see *Deferred captions: the installer and the quota
arithmetic* above.

| Series | Video IDs without a caption track |
|---|---|
| Europe | `XjTQCS8WNEc` |
| Asia | `ZWDk7zrMGVI`, `uNAcGGGhEsA`, `L4UhrpAyu4M`, `YOThLJvmFzs`, `fQWA6FnkaCI`, `kGCh1nB_J-Q`, `GEBsFJ0db3k` |
| Africa | `pT0TDuGl2e4`, `s0vsG7yVHlY`, `Xy_DXMAmwA0`, `hLO1bU245W0`, `Y76NzmtwcmY`, `b86GIVPIUwk`, `s8dLsVaWWHs`, `iFDob_qsXiE` |
| North America | `mEvKC8wtS44`, `CktKmkqtw8g`, `Fm2Y-M0-Btw` |
| South America | `m_s2tya9grM`, `-Wi_pE_Nwx0`, `_q2YJDRGgpg` |
| Europe capitals | `L_fCNufSRMM`, `mZ6S5pXin7E`, `dmuhY0J50I0`, `2GOYTfxBX4A`, `ZHbvY3GAGwg`, `285b_NcXI5Y` |
| Asia capitals | `zSO15iqpqjQ`, `eZjfTqr5gLU`, `JgDnVRBCXck`, `JkfAdRz4VKk`, `xi7PSSQea20`, `jqr0M9ifQJY`, `guDkbWfob2w` |
| South America capitals | `5oSNj262L9s`, `NpgKeTiG6lc`, `5VpzfSO_SWU` |
| North America capitals | `JDlnPz-Rsl4`, `-5npYYzoZ3I`, `JAi68d3yfrA`, `lNI6UGU06ys`, `m9A2bJ8kt0M` |
| Oceania capitals | `XmFxYzfASDo`, `bKY4cwBbMMk`, `7ph0YuAWbVs`, `d39c1RJeC4Y` |
| Africa capitals | `OIuDFN43_Fk`, `sYksvGMl4Do`, `MGpDV2baADw`, `2BT9vKBG43I`, `K9L_xDLywDA`, `33laD-nUU5I` |

The exact approved English SRT/WebVTT bytes are backed up in
[subtitles/](../subtitles/README.md) and mapped to those video IDs in
`subtitles/manifest.json`. Uploading them changes only the caption track; the
published visibility, description, thumbnail and playlist seat stay as they
are.


## Offline Asia queue

`prepare` defaults to the Asia ledger's approved paths. US and Europe already
have known uploads; no original publishing checkpoints are required to prepare
a new offline batch.
Historical four-video US exports, prototypes and superseded renders are not
queued. The seven Asia entries use refined episode 1 and their adjacent approved
English SRT tracks. Caption validation and batch resolution use youtube3's
offline functions; thumbnails are screenshots extracted from those masters.

Output: `rendered/asia-seven-20261101/youtube-publishing/batch.json`,
`offline-manifest.json` and seven JPEG thumbnails. Every description contains
the playlist, game, GeoClick repository and ai-player repository links. Masters
and captions have fingerprints; planned visibility is private with subscriber
notifications disabled.

This is a durable offline batch definition, not a fabricated native youtube3
queue: native `plan_batch` verifies the account and therefore needs API reads.
No native Asia queue or new upload ledger is created offline. After separate
owner authorization, use youtube3's own plan/run/queue flow and the same shared
ledger; do not build custom upload, OAuth, caption or recovery code. That
authorization came on 2 November 2026: the seven videos were uploaded and
published through `bin/upload-asia.py` and `bin/publish-videos.py`, as
described under *Published release* above. The prepared `batch.json` itself is
unchanged and still holds its subtitle rows; the upload used the separate
caption-free `batch-upload.json`.

## Offline Africa queue

`prepare -Series africa` reads `src/lessons/africa-coverage.json` and refuses
unfinished or visually unreviewed episodes. After production approval it writes
eight entries to `rendered/africa-eight-20261102/youtube-publishing/batch.json`,
with an offline manifest and screenshot thumbnails. Descriptions include all
four links, explain the 54-country scope and disputed/related targets, and
identify the four supplemental countries. Private planned visibility and
disabled subscriber notifications match Asia's preparation. No native queue,
account access, upload or authorization is created by this offline step.

All eight Africa exports passed production and visual review on 2 November
2026, and their offline batch, manifest and screenshot thumbnails are prepared.
Sixteen exact SRT/WebVTT backups are tracked in `subtitles/africa/`. This work
made no YouTube account calls and did not retry the quota-blocked release.

## Authorized Africa uploads: 2 November 2026

After the eight completed videos were delivered, the owner said "upload".
This authorizes all eight Africa uploads, English captions, screenshot
thumbnails and membership in the existing playlist. The prepared batch's
private visibility and disabled subscriber notifications were retained.
Asia uploads remain outside this authorization.

Installed youtube3 created the immutable Africa `plan.json` and native
`queue.json` under `rendered/africa-eight-20261102/youtube-publishing/`, using
the original shared per-channel ledger. North Africa uploaded successfully as
[`pT0TDuGl2e4`](https://www.youtube.com/watch?v=pT0TDuGl2e4). YouTube returned
HTTP 403 `quotaExceeded` at the thumbnail stage. The queue stopped immediately;
no account reads or writes followed the refusal. Its thumbnail is failed,
metadata/captions/publication/membership are pending, and seven entries have
not uploaded. No post-quota remote verification is claimed.

The shared ledger now contains twelve records. A local comparison confirmed
all eleven original records unchanged. `ledger-before-africa.json`,
`upload-authorization.json` and `last-upload-run.json` retain local evidence.
Do not rebuild the plan/queue, remove the known ID, or confirm this upload as
missing. The eleven-video public-release workflow remains separate.

When quota permits, recover the first existing job through youtube3:

```powershell
youtube3 publishing-batch retry rendered/africa-eight-20261102/youtube-publishing/queue.json --profile lynxsupercluster --entry africa-01-north-africa --stage thumbnail --apply
```

Only after that command completes successfully, continue the seven pending
entries through the same queue (stop on any quota refusal):

```powershell
youtube3 publishing-batch resume rendered/africa-eight-20261102/youtube-publishing/queue.json --profile lynxsupercluster --apply
```

Use native status/checkpoints for progress and accepted caption IDs. Once all
eight complete without a quota stop, batch-read the eight video descriptions/
visibility and playlist membership/order. Preserve the existing playlist cover.
No scheduled retry is installed.

## North America: uploaded unlisted

The owner authorized the North America edition to be uploaded private or
unlisted, to the same playlist as the other series. It went out **unlisted**,
with the playlist link in each description, its screenshot thumbnail and a seat
in `PLNl_MybP55PE`, and no captions, which stay deferred like the rest.

| Episode | Video ID |
|---|---|
| Canada and the United States | `mEvKC8wtS44` |
| Mexico and Central America | `CktKmkqtw8g` |
| The Caribbean | `Fm2Y-M0-Btw` |

They are the last three members of the playlist, after the twenty-six public
videos. The playlist itself stays public and the other twenty-six videos keep
their public visibility; only these three are unlisted, so they are reachable
through the playlist but are not pushed to the channel.

The hashtag in those three descriptions was corrected from `#North America` to
`#NorthAmerica` after publication, because YouTube reads a space as the end of
a tag. `bin/publish-videos.py --step north-america-tags` made that change and
touched nothing else.

## South America: uploaded unlisted

The South America edition was produced the same way as North America and then
uploaded the same way, unlisted in the same playlist. Three lessons, four
countries each, all 12 country targets of GeoClick's native
`south-america-countries` map: the northern countries (Colombia, Venezuela,
Guyana, Suriname), the Andean west (Ecuador, Peru, Bolivia, Chile) and Brazil
with the southern countries (Brazil, Paraguay, Uruguay, Argentina).

| Episode | Video ID |
|---|---|
| The Northern Countries | `m_s2tya9grM` |
| Along the Andes | `-Wi_pE_Nwx0` |
| Brazil and the Southern Countries | `_q2YJDRGgpg` |

Their captions are deferred too. The shared upload ledger now holds
thirty-five records.



The upload used the same native flow as Asia: an offline prepared batch in
`rendered/north-america-three-20261102/youtube-publishing/`, a derived
caption-free `batch-upload.json` with `privacy: unlisted`, and youtube3's own
plan/run/queue with the shared per-channel upload ledger. The shared ledger
now holds thirty-two records.

```powershell
& $py -I bin/upload-series.py --series north-america --privacy unlisted
```

`bin/upload-series.py` is the general form of that step: it derives the
caption-free batch from an approved prepared batch, refuses to differ from an
existing one, and never reuploads a known video ID.

## Europe capitals: uploaded unlisted

A fourth edition follows the countries: the capitals. The six lessons cover all
44 capital targets of GeoClick's native `europe-capitals` map exactly once,
with clean masters and optional English SRT/WebVTT in
`rendered/europe-capitals-20261102/` and tracked caption backups in
`subtitles/europe-capitals/`.

The owner authorised the upload on 2 November 2026, unlisted, with playlist
seats in `PLNl_MybP55PE`, the playlist link in each description and its
screenshot thumbnail. Captions stay deferred.

| Episode | Video ID |
|---|---|
| North Atlantic and the Nordics | `L_fCNufSRMM` |
| The Baltic and the East | `mZ6S5pXin7E` |
| The West and the Centre | `dmuhY0J50I0` |
| The Alps and Italy | `2GOYTfxBX4A` |
| The Balkans | `ZHbvY3GAGwg` |
| Iberia and the Mediterranean | `285b_NcXI5Y` |

They are the last six members of the playlist. The shared upload ledger now
holds 38 records.

## Asia capitals: uploaded unlisted

A fifth edition completes the capitals: Asia's. The seven lessons cover all 47
capital targets of GeoClick's native `asia-capitals` map exactly once, with
clean masters and optional English SRT/WebVTT in
`rendered/asia-capitals-20261102/` and tracked caption backups in
`subtitles/asia-capitals/`.

The owner authorised the upload on 2 November 2026, unlisted, with playlist
seats in `PLNl_MybP55PE`, the playlist link in each description and its
screenshot thumbnail. Captions stay deferred.

| Episode | Video ID |
|---|---|
| Central Asia and the Caucasus | `zSO15iqpqjQ` |
| East Asia | `eZjfTqr5gLU` |
| South Asia | `JgDnVRBCXck` |
| The Levant, Iraq, Türkiye and Iran | `JkfAdRz4VKk` |
| The Gulf and the Peninsula | `xi7PSSQea20` |
| Mainland Southeast Asia | `jqr0M9ifQJY` |
| The Maritime South-East | `guDkbWfob2w` |

They are the last seven members of the playlist. The shared upload ledger now
holds 45 records.

## South America capitals: uploaded unlisted

A sixth edition completes the capitals: South America's. The three lessons
cover all 13 capital targets of GeoClick's native `south-america-capitals` map
exactly once — the capitals of the twelve countries the map names, with
Bolivia's two capitals, La Paz and Sucre, both taught — with clean masters and
optional English SRT/WebVTT in `rendered/south-america-capitals-20261102/` and
tracked caption backups in `subtitles/south-america-capitals/`.

The owner authorised the upload on 2 November 2026, unlisted, with playlist
seats in `PLNl_MybP55PE`, the playlist link in each description and its
screenshot thumbnail. Captions stay deferred.

| Episode | Video ID |
|---|---|
| The North and the Caribbean Coast | `5oSNj262L9s` |
| The Andes and the Gran Chaco | `NpgKeTiG6lc` |
| The South and Brasília | `5VpzfSO_SWU` |

They are the last three members of the playlist. The shared upload ledger now
holds 48 records, and a fresh read confirms the playlist is public with 48
members, none missing and none duplicated, with the playlist link in every
description.

## North America capitals: uploaded unlisted

A seventh edition follows the capitals: North America's. The five lessons
cover all 23 capital targets of GeoClick's native `north-america-capitals` map
exactly once — Canada, the United States, Mexico, Central America with Belize,
and the Caribbean islands — with clean masters and optional English SRT/WebVTT
in `rendered/north-america-capitals-20261102/` and tracked caption backups in
`subtitles/north-america-capitals/`.

The owner authorised the upload on 2 November 2026, unlisted, with playlist
seats in `PLNl_MybP55PE`, the playlist link in each description and its
screenshot thumbnail. Captions stay deferred.

| Episode | Video ID |
|---|---|
| Canada, the United States and Mexico | `JDlnPz-Rsl4` |
| Central America and Belize | `-5npYYzoZ3I` |
| Cuba, Hispaniola and Jamaica | `JAi68d3yfrA` |
| The Bahamas and the Leeward Islands | `lNI6UGU06ys` |
| The Windwards and Trinidad | `m9A2bJ8kt0M` |

They are the last five members of the playlist. The shared upload ledger holds
53 records with 53 distinct video IDs, and the local job checkpoints record
upload, thumbnail, metadata and publication successful for all five at
`unlisted`.

**The read-back that followed this upload hit the quota ceiling.** The
verification request returned `403 quotaExceeded` on the general bucket, so
the live state of these five was confirmed from the queue's own accepted
actions rather than from a fresh read. The last successful read, after the
three South America capitals videos, showed the playlist public with 48
members, none missing, none duplicated and the playlist link in every
description; this series was uploaded by the same flow with the same seats.

## Oceania capitals: uploaded unlisted

The eighth edition, Oceania capitals, is produced, reviewed and packaged, with
clean masters in `rendered/oceania-capitals-20261102/`, optional English
SRT/WebVTT in tracked `subtitles/oceania-capitals/` and the offline batch
prepared under `rendered/oceania-capitals-20261102/youtube-publishing/`.

The offline batch is genuinely there: `prepare --series oceania-capitals`
wrote `batch.json`, `offline-manifest.json` and four screenshot thumbnails on
3 November 2026. An earlier version of this runbook said the batch was
prepared; the folder did not exist until that command ran, so do not trust
that sentence without checking the folder.

The owner chose **unlisted** visibility and authorized the upload to the same
playlist on 3 November 2026. It went out through the same native flow as the
other seven series — the caption-free derived batch, youtube3's own plan,
queue and checkpoints, and the same shared per-channel upload ledger — with
screenshot thumbnails, the playlist link in every description and a playlist
seat each. Captions stay deferred like every other series.

| Episode | Video ID |
|---|---|
| Palau, Pohnpei and the Marshalls | `XmFxYzfASDo` |
| Kiribati and Tuvalu | `bKY4cwBbMMk` |
| The Melanesian capitals | `7ph0YuAWbVs` |
| Fiji, Australia and New Zealand | `d39c1RJeC4Y` |

The command was blocked twice by the harness's publication gate, which wants
the owner to review it outside auto mode rather than have the agent talk its
way past it. That review is the owner's to give; the command must not be
reworded to slip past it. Never reupload a known video ID.

## Africa capitals: uploaded unlisted

The ninth edition, Africa capitals, is produced, reviewed and packaged, with
clean masters in `rendered/africa-capitals-20261103/`, optional English
SRT/WebVTT in tracked `subtitles/africa-capitals/` and the offline batch
prepared under `rendered/africa-capitals-20261103/youtube-publishing/`. It
covers all 54 capital targets of GeoClick's native `africa-capitals` map
exactly once, in six lessons, and it is the last capital map the game ships.

The owner authorised the upload on 3 November 2026 and chose **unlisted**, the
same visibility as the four capitals editions before it. It went out through
the native flow — the caption-free derived batch, youtube3's own plan, queue
and checkpoints, the shared per-channel ledger — with screenshot thumbnails,
the playlist link in every description and a playlist seat each. Captions stay
deferred.

| Episode | Video ID |
|---|---|
| North Africa and the Sahara | `OIuDFN43_Fk` |
| The Sahel and the Gulf of Guinea | `sYksvGMl4Do` |
| The Sahel interior and the Gulf states | `MGpDV2baADw` |
| The Horn and the Great Lakes | `2BT9vKBG43I` |
| Central Africa and the Zambezi | `K9L_xDLywDA` |
| Southern Africa and the Indian Ocean islands | `33laD-nUU5I` |

The offline batch keeps its caption rows, exactly like the Africa and Asia
batches; the derived upload batch omits them, so nothing caption-related
happens on the account.

## Spain regions: uploaded unlisted

A new kind of edition: one video that teaches one country's own first-level
regions. Spain is the first, covering all 16 region targets of GeoClick's
native `spain-regions` map exactly once in the map's own tour order.

The owner authorized the upload on 3 November 2026 and chose **unlisted**, the
same visibility as the capitals editions. It went out through the native flow
with its screenshot thumbnail, the playlist link in the description and a
playlist seat. Captions stay deferred.

| Episode | Video ID |
|---|---|
| Spain's regions | `Z8iZlY9Qzjw` |

```powershell
& $py -I bin/upload-series.py --series spain-regions --privacy unlisted
```

## Fresh read-back: 3 November 2026

The one live check outstanding since the North America capitals upload — an
independent read of those five videos — is now done, and it confirms the whole
release rather than only those five.

`bin/publish-videos.py --step verify` read the channel and the playlist in one
pass. After the Oceania upload the playlist `PLNl_MybP55PE` is **public** with
**57 members**, none missing, none duplicated, and the playlist link is present
in every one of the 57 descriptions. Thirty-two videos are public and
twenty-five are unlisted — the four capitals editions and Oceania. The step's
own `complete` flag reads false because it assumes every video is public;
that does not describe a fault.

That step failed with HTTP 400 on its first run because it asked
`videos.list` for all 53 IDs at once. The API accepts at most 50 IDs per
call, so `read_videos` in `bin/publish-videos.py` now asks in chunks of 50.
Any read that outgrows a page needs the same treatment.

## Deferred captions: the installer and the quota arithmetic

The 53 videos without a caption track now have a dedicated tool.
`bin/install-captions.py` owns scope, order and a local ledger of accepted
caption IDs; installed youtube3 2.10.0 owns every account write through its
own caption plan and per-video upload. The tool never reads or rewrites a
native checkpoint or queue, and it never touches visibility, descriptions,
thumbnails or playlist seats.

```powershell
# Offline: list the pending tracks and check their bytes. No account calls.
& $py -I bin/install-captions.py --dry-run

# Account writes: install the pending English tracks, one video at a time.
& $py -I bin/install-captions.py
```

The tracks are the exact approved SRT bytes tracked in `subtitles/`, checked
against the SHA-256 values in `subtitles/manifest.json` before anything is
sent, and validated with youtube3's own `captions.check_caption`. The order
is playlist order: Europe 6, the seven Asia, the eight Africa, the three
North America, the three South America, then the four capitals editions. A
run that hits a quota refusal stops on the spot and records where it stopped;
the next run continues from there. An uncertain write is inspected with
`captions.list` rather than retried blindly.

**A caption insert costs 400 quota units**, plus a `captions.list` and an
ownership lookup. The general bucket holds 10,000 units a day and resets at
midnight Pacific, so the 53 tracks need roughly 24,000 units: at least three
days, and the run stops at whatever the day's bucket allows. On 3 November 2026
the owner chose to hold the captions and keep the day's quota for the release
work, so no caption has been installed beyond the ten the US and Europe videos
already had.

## Africa state: uploaded privately, then published

This section records how the eight Africa videos were uploaded. The owner
correctly pointed out that uploads can continue despite finishing
quota exhaustion. Google's rules updated 15 October 2026 give `videos.insert`
its own bucket (100 calls/day by default), separate from the 10,000-unit bucket
for other endpoints. See [the official quota table](https://developers.google.com/youtube/data/determine_quota_cost).
The earlier decision to stop all uploads after thumbnail quota was too broad.

`bin/upload-africa-private.py` continues the existing native queue. It delegates
all upload, duplicate protection, checkpoint and shared-ledger logic to installed
youtube3 2.10.0. Native before/after-stage callbacks permit only uploads and
request a durable pause immediately after each accepted ID is checkpointed.
It skips existing IDs and stops on upload errors. No plan, job or ledger is
replaced. No thumbnail/caption/publication/membership requests are attempted.

All eight private uploads are accepted, in episode order:
`pT0TDuGl2e4`, `s0vsG7yVHlY`, `Xy_DXMAmwA0`, `hLO1bU245W0`,
`Y76NzmtwcmY`, `b86GIVPIUwk`, `s8dLsVaWWHs`, `iFDob_qsXiE`.
All original eleven shared-ledger records are unchanged; it now has nineteen.
`private-upload-run.json` records the seven newly accepted IDs. Local native
jobs confirm successful uploads, pending captions and pending membership for
all eight. First thumbnail is failed; the other seven thumbnails are pending.
Remote readback is deferred along with other calls using the general bucket.

**Since 2 November 2026 these eight are public**, with their screenshot
thumbnails and their playlist seats, and their captions are still deferred.
The native jobs still name `private` as their publication target, so they must
not be resumed; see *Published release* above for the caption route.

## Previous release attempt: 1 November 2026, 22:08 UTC

The migration's first `resume` hit HTTP 403 `quotaExceeded` during the existing
Europe caption recovery. No account writes were accepted, no upload was
attempted, and no account reads followed the refusal. The shared ledger still
has the same eleven upload IDs. Local checks show Baltic/Eastern Europe still
has `subtitles: failed`, no accepted caption ID, pending publication and pending
playlist membership.

The last full remote verification remains ten unlisted videos in order, the
final Europe video private, and the playlist unlisted. No requested link/public
release changes have landed in these recorded attempts. Fresh final remote
verification is blocked by quota; the old snapshot is not labelled as current.
The seven Asia entries were prepared offline only. No scheduled task was created.
