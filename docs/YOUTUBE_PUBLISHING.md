# GeoClick YouTube publishing

ai-player owns the GeoClick publishing policy and entrypoint. Installed
**youtube3 2.10.0** owns OAuth, uploads, caption insertion, job checkpoints,
duplicate protection and recovery. Its installed code and repository are not
modified. Use its Python environment, not the unrelated default Python.

Destination: profile `lynxsupercluster`, channel `UCQHMx6rNOKfLxFRI4_Tf6cA`,
playlist [`PLNl_MybP55PE`](https://www.youtube.com/playlist?list=PLNl_MybP55PE),
**Learning Geography with Geoclick**. Policy and known IDs are in
[config/geoclick-youtube.json](../config/geoclick-youtube.json).

## Commands from ai-player

```powershell
# No account access: inspect checkpoints, known IDs and the shared ledger.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode audit

# No account access: preserve original operational files and install delegates.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode migrate

# No account access: prepare the seven approved Asia masters and captions.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode prepare

# Account reads, no account writes: reconcile a fresh public-release preview.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode plan

# Authorized account writes: recover the final Europe entry, then release 11 videos.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode resume

# Account reads only: check public visibility, descriptions, metadata and order.
powershell -NoProfile -ExecutionPolicy Bypass -File bin/geoclick-youtube.ps1 -Mode verify
```

The wrapper defaults to
`$env:LOCALAPPDATA\Programs\youtube3\Scripts\python.exe`. Set
`YOUTUBE3_PYTHON` if the installed youtube3 interpreter lives elsewhere. The
equivalent direct command is `& $env:YOUTUBE3_PYTHON -u bin/geoclick-youtube.py audit`.
No interpreter, credential, profile or OAuth token is copied into this repo.
The Python entrypoint applies the same Windows-principal environment setup as
the installed youtube3 launcher for SSH sessions, then delegates authentication
entirely to `YoutubeClient`.

`plan` and `verify` consume quota. Do not run them as repeated quota probes.
After a quota refusal, stop all account calls. Once quota/access is known to
permit work, run `resume` once. No retry loop or scheduled task is installed.
The workflow lock prevents concurrent invocations of the migrated entrypoint.

## Authority and retained files

Versioned English subtitle backups for all 18 current US, Europe and Asia
episodes are in [subtitles/](../subtitles/README.md). Its manifest maps exact
caption bytes to canonical masters and the eleven known YouTube IDs. These
backups do not replace the original queue caption inputs or checkpoints;
Asia remains an offline preparation.

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

## Offline Asia queue

`prepare` reads only the three current canonical production ledgers and uses
the Asia ledger's approved paths. US and Europe already have known uploads.
Historical four-video US exports, prototypes and superseded renders are not
queued. The seven Asia entries use refined episode 1 and their adjacent approved
English SRT tracks. Caption validation and batch resolution use youtube3's
offline functions; thumbnails are screenshots extracted from those masters.

Output: `rendered/asia-seven-20261101/youtube-publishing/batch.json`,
`offline-manifest.json` and seven JPEG thumbnails. Every description contains
the playlist, game, GeoClick repository and ai-player repository links. Masters
and captions have fingerprints; planned visibility is private with subscriber
notifications disabled. **Uploading Asia is not authorized by this release.**

This is a durable offline batch definition, not a fabricated native youtube3
queue: native `plan_batch` verifies the account and therefore needs API reads.
No native Asia queue or new upload ledger is created offline. After separate
owner authorization, use youtube3's own plan/run/queue flow and the same shared
ledger; do not build custom upload, OAuth, caption or recovery code.

## Last attempt: 1 November 2026, 22:08 UTC

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
