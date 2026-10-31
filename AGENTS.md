# ai-player working notes

For GeoClick work, read [docs/GEOCLICK.md](docs/GEOCLICK.md) before operating or
recording the game. It contains the manual digest, controls, teaching workflow,
and the eight-state pilot procedure requested by the user.

The current series restarts with **episode 1: Northeast, including Vermont
(11 states)**. Earlier western and ten-state Northeast videos are prototypes.
Consult `src/lessons/usa-coverage.json` for canonical coverage; do not count the
prototypes as prior episodes. YouTube masters must have optional subtitles,
delivered separately, with no burned-in narration captions.

**The canonical four-episode series is complete: all 50 distinct US states,
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
