# GeoClick subtitles

English subtitles for the current November 2026 editions are preserved here:
five US episodes, six Europe episodes and seven Asia episodes. Each episode
has optional SRT and WebVTT tracks. WebVTT retains the original top positioning.
Use the numbered episode folders to find the matching track.

[manifest.json](manifest.json) records the canonical production ledger, master
path, known YouTube video ID, original subtitle paths, byte sizes and SHA-256
hashes. These are exact copies from the approved exports, including the refined
Europe episodes 2 and 4 and Asia episode 1. Superseded exports and historical
prototypes are excluded. Known video IDs do not establish visibility or whether
YouTube has accepted captions; Asia episodes are prepared offline only.

These text files travel with Git. Media and publishing checkpoints remain in
ignored `rendered/` folders and must be backed up separately. Keep original
caption inputs and queue fingerprints in place when recovering publication.
Use [the publishing workflow](../docs/YOUTUBE_PUBLISHING.md) for account writes;
copying or restoring these files does not upload captions.

For future approved exports, follow the current production ledger's `video`
path and copy the adjacent `subtitles.en.srt` and `subtitles.en.vtt` without
retiming or converting them. Validate both with installed youtube3's offline
`captions.check_caption(path)` and update the manifest with their exact hashes.
