# GeoClick subtitles

English subtitles for the current November 2026 editions are preserved here:
five US episodes, six Europe episodes, seven Asia episodes, eight Africa
episodes, three North America episodes, three South America episodes, six
Europe capitals episodes, seven Asia capitals episodes, three South America
capitals episodes and five North America capitals episodes, 106 files in total.
Each episode
has optional SRT and WebVTT tracks. WebVTT retains the original top positioning.
Use the numbered episode folders to find the matching track.

[manifest.json](manifest.json) records the canonical production ledger, master
path, known YouTube video ID, original subtitle paths, byte sizes and SHA-256
hashes. These are exact copies from the approved exports, including the refined
Europe episodes 2 and 4 and Asia episode 1. Superseded exports and historical
prototypes are excluded. Known video IDs do not establish whether YouTube has
accepted a caption. All 26 videos were published on 2 November 2026 with
subtitles deliberately postponed: ten US and Europe videos keep the captions
they already had, and sixteen have none yet. Add the deferred captions later,
per video, with installed youtube3's own caption upload; the runbook lists the
video IDs and warns against resuming the native Africa and Europe 6 queues.
The three North America episodes were uploaded unlisted on 2 November 2026
and their video IDs are recorded here; their captions are deferred too. The
three South America episodes went out the same way, unlisted, with their video
IDs recorded here. The six Europe capitals episodes and the seven Asia
capitals episodes went out unlisted too, with their video IDs recorded here,
and the three South America capitals episodes and five North America capitals
episodes followed them, also unlisted.

These text files travel with Git. Media and publishing checkpoints remain in
ignored `rendered/` folders and must be backed up separately. Keep original
caption inputs and queue fingerprints in place when recovering publication.
Use [the publishing workflow](../docs/YOUTUBE_PUBLISHING.md) for account writes;
copying or restoring these files does not upload captions.

For future approved exports, follow the current production ledger's `video`
path and copy the adjacent `subtitles.en.srt` and `subtitles.en.vtt` without
retiming or converting them. Validate both with installed youtube3's offline
`captions.check_caption(path)` and update the manifest with their exact hashes.

Use the installed youtube3 Python environment for the repeatable offline
backup command:

```powershell
& "$env:LOCALAPPDATA/Programs/youtube3/Scripts/python.exe" bin/backup-geoclick-subtitles.py --series africa
```

The command requires a completed series and passed visual reviews, preserves
other series, and refuses to replace differing existing backup files. It
delegates caption validation to youtube3 and copies no media or checkpoints.
