# GeoClick subtitles

English subtitles for the current November 2026 editions are preserved here:
five US episodes, six Europe episodes, seven Asia episodes and eight Africa
episodes, 52 files in total. Each episode
has optional SRT and WebVTT tracks. WebVTT retains the original top positioning.
Use the numbered episode folders to find the matching track.

[manifest.json](manifest.json) records the canonical production ledger, master
path, known YouTube video ID, original subtitle paths, byte sizes and SHA-256
hashes. These are exact copies from the approved exports, including the refined
Europe episodes 2 and 4 and Asia episode 1. Superseded exports and historical
prototypes are excluded. Known video IDs do not establish visibility or whether
YouTube has accepted captions; Asia and Africa episodes are prepared offline only.

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
