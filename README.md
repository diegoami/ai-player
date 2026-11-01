# ai-player

An agent that plays web games by looking at the screen, says out loud what it
is doing, and writes a video of the round.

It is a tool, not a game. It plays the games it is given an adapter for, and
its default persona thinks out loud with some hesitation. The Malpaco adapter
instead uses a competent persona and disables intentional mistakes.

```
npm install
npm run play -- --game=geoclick
```

The video lands in `rendered/<game>/play.mp4`: the gameplay with burned-in
subtitles and the narration mixed in.

## How a turn works

1. **Look.** The adapter says what the legal actions are and where they are on
   screen. The tool marks each one with a number and takes a picture.
2. **Choose.** The picture and the numbered actions go to a vision model, which
   answers with a number and a sentence for what it thinks it is seeing.
3. **Say.** The sentence becomes speech as the game is played, so the pauses in
   the video are the model's own hesitations and the words land on the action.
4. **Act.** The adapter carries the action out, and reports what happened.
5. **React.** The model says something about how it went.

The tool never asks a model for pixel coordinates. The model picks from a
numbered list; the adapter does the clicking. That is what lets a game that was
never written for this be played: it only has to say what its moves are.

## The games

| Game | What it does |
|---|---|
| `geoclick` | A map quiz: name the region the map lights up |
| `malpaco` | An island-conquest board game against computer opponents |

```
npm run play -- --game=malpaco --lang=it
```

Malpaco defaults to `http://localhost:5173/`. Before playing, it reads
`/manual/index.html` and inspects the public Countries list for actual neighbours
and island bonuses. The model receives the manual, public board and recent
outcomes on every decision. Reinforcement actions place the full pool; attack
actions require at least twice the defending armies plus one, then fight one
exchange at a time until capture or that conservative safety stop.
Capture move-in is a separate confirmed choice. This does not guarantee a win.

To record a reproducible local demonstration:

```
npm run play -- --game=malpaco --base=http://localhost:5173/?seed=1994 --brain=openrouter --turns=24
```

`--turns` counts model decisions, including capture confirmations; waiting for
computer opponents does not consume that budget. The output also includes the
manual, inspected map and a trace with before/after country and army counts.

## GeoClick teaching pilot

YouTube operations are owned by this repository through
`bin/geoclick-youtube.ps1`, using installed youtube3 2.10.0. Read the
[publishing runbook](docs/YOUTUBE_PUBLISHING.md) before account operations.
Original US/Europe queues and the shared upload ledger remain authoritative.
The eleven-video public release is quota-blocked; seven Asia entries are
prepared offline only.

The completed Asia edition has seven regional lessons with John,
interesting facts, geographic memory hooks and separate optional English captions.
See `src/lessons/asia-coverage.json`: 49 teaching stops, with Northern Cyprus
demonstrated within the Cyprus stop, and Bahrain, Maldives and Singapore in
labelled supplemental views. All 47 native Asia targets are visited. Run
`node bin/render-asia-series.mjs`; `--inspect` checks map actions and
`--prepare-only` prepares narration. Outputs: `rendered/asia-seven-20261101/`.
All 49 stops appear exactly once; the collection is
`rendered/asia-seven-20261101/all-seven-asia-videos.zip`. The coverage ledger
selects the reviewed masters, including refined episode 1.

The completed Europe teaching series uses six regional lessons, John’s English narration,
and separate optional captions. It covers all 39 native GeoClick Europe targets
plus six microstates in clearly labelled supplemental geographic views. See
`src/lessons/europe-coverage.json` and [the recording notes](docs/GEOCLICK.md).
Run `node bin/render-europe-series.mjs`; use `--inspect` for silent checks or
`--prepare-only` for audio preparation. Outputs go under
`rendered/europe-six-20261101/`. All 45 places appear exactly once. The collection
is `rendered/europe-six-20261101/all-six-europe-videos.zip`; the coverage ledger
selects the reviewed exports, including refined Western and Mediterranean views.

The completed US teaching edition has **five videos covering the 48
contiguous states**: Northeast, South Atlantic, South Central, Midwest and West.
John narrates location cues, interesting facts and memory hooks. Alaska and
Hawaii are deliberately omitted, with a short explanation in the final video.
See [the current recording notes](docs/GEOCLICK.md) and
`src/lessons/usa-five-video-coverage.json`. Run the prepared edition with
`node bin/render-five-video-series.mjs`; clean MP4 masters and separate optional
English captions go under `rendered/usa-five-20261101/`.

The following commands document the historical pilot and four-video edition.

For the eight-state lesson in **Known** mode, read [the GeoClick notes](docs/GEOCLICK.md)
and run:

```
node bin/geoclick-pilot.mjs --game=geoclick --base=http://localhost:5173 --out=rendered/usa-states-pilot-20261030
```

This prepared lesson reveals eight western states, narrates facts and location
cues, and ends with a recap. It does not play or claim a quiz score. The lesson
text and research links live in `src/lessons/usa-states-pilot.json`.

The current series starts with Northeast **episode 1**, including Vermont
and ten states from the coastal prototype. It uses a separate fact sidebar,
a clear-map opening and closer views for small states:

```
node bin/geoclick-lesson.mjs --game=geoclick --out=rendered/usa-episode-01-northeast-20261030
```

Use `--inspect` for a silent UI preflight. Narration and sources are in
`src/lessons/usa-episode-01-northeast.json`; completed and planned state coverage is
tracked separately in `src/lessons/usa-coverage.json`.
The upload master is `play-no-subtitles.mp4`; captions are separate optional
tracks. Earlier videos are archived prototypes, outside the restarted series.

Episode 2 completes the remaining Census South with 13 new states:

```
node bin/geoclick-lesson.mjs --game=geoclick --lesson=src/lessons/usa-episode-02-south.json --out=rendered/usa-episode-02-south-20261030
```

The runner rejects states already covered in another completed episode.
For episode-specific optional translations, pass the matching file to
`bin/export-subtitle-tracks.mjs` with `--translations=...`.

Episode 3 covers the entire Midwest plus Pennsylvania, with 13 further states:

```
node bin/geoclick-lesson.mjs --game=geoclick --lesson=src/lessons/usa-episode-03-midwest.json --out=rendered/usa-episode-03-midwest-20261030
```

Episode 4 completes the West and the fifty-state series:

```
node bin/geoclick-lesson.mjs --game=geoclick --lesson=src/lessons/usa-episode-04-west.json --out=rendered/usa-episode-04-west-20261030
```

Alaska and Hawaii use labelled supplemental Natural Earth maps because the
local GeoClick USA map omits them. The four canonical episodes cover all 50
states once; the ledger records the verified videos and upload packages.

The preferred human-play replay uses the 49 named memory hooks in
`src/lessons/human-state-hooks.json` and the verified placement timings in
`src/lessons/data/human-placement-events.json`. After restoring the original
Bandicam source referenced by that plan, render a new copy with:

```powershell
node bin/narrate-state-hooks.mjs --out=rendered/human-state-hooks-new-voice
```

This uses John for English narration and preserves the source recording.
The old generic commentary and `bin/narrate-recording.mjs` are superseded;
use the state-specific hooks for new human replays. Optional captions use
`human-state-hooks.subtitles.json` and stay separate from the clean master.

## Narrator choices

New MiniMax narration uses the accepted voices recorded in
`src/lessons/narrator-voices.json`: John for English, and the Italian-recorded
clone for Italian, German, French and Mandarin (`--lang=zh`). An explicit
`--voice=ID` overrides the default. Prepared English lessons and the human
replay retain their English text; a voice/language flag does not translate an
authored script.

Use a new output folder when changing a narrator. Speech filenames include
text, language, provider, voice and speech model, so an old stock-voice clip
cannot silently substitute for the accepted voice. `--audio-cache` reuse also
requires matching narrator metadata in the saved trace. Older traces without
that metadata are not reused automatically. Existing videos are not regenerated.

## Windows runtime setup

Use native Windows Node 24/npm, then install the committed dependencies:

```powershell
npm ci
npx playwright install chromium
Get-Command ffmpeg,ffprobe
```

Install FFmpeg/FFprobe separately if either command is absent. Put the MiniMax
key for the account owning the accepted voices in `~/.config/ai-keys.env`.
The key for narration must have speech access; a working model connection
alone does not verify voice access. OpenRouter and ElevenLabs are optional.

The sibling games need their own `npm ci`. Run GeoClick from
`../Geoclick2027` with `npm run dev` (port 5187), and Malpaco from
`../malpaco` with `npm run dev` (port 5173), in separate terminals. From this
checkout, a silent GeoClick teaching preflight is:

```powershell
node bin/geoclick-lesson.mjs --game=geoclick --base=http://127.0.0.1:5187 --inspect --out=rendered/geoclick-preflight
```

Use `--base=http://127.0.0.1:5173/` for the Malpaco adapter. Always verify the
app behind a URL: the two games must not share the same port. On a Windows
`projects` junction, start GeoClick from its physical path
(on Leopard, `H:\projects\Geoclick2027`) so Vite's allowed paths match its
generated files. The quiz adapter resolves this path automatically.
Runtime setup does not restore ignored media; rebuilding the existing human replay still
requires its original Bandicam recording. Run `npm test` for offline narrator
selection and speech-cache checks.

## Adding a game

A game is one file in `src/games/`. It answers three questions: what are the
legal actions right now, how do I carry one out, and what happened.

```js
export default {
	name: 'mygame',
	summary: 'One line, for the list of games',
	url: 'http://localhost:5173/play',

	/** Optional: start the game and get in. */
	async setup(ctx) {
		await ctx.page.goto(ctx.base);
		await ctx.page.click('#start');
	},

	/** The legal actions right now. */
	async observe(ctx) {
		return {
			actions: [
				{
					id: 'left',
					label: 'the door on the left',
					hint: 'it is open',
					at: { x: 120, y: 300 }, // where to mark it on the picture
					payload: { anything: 'the adapter needs' }
				}
			],
			prompt: 'What the model is told about the screen'
		};
	},

	/** Carry the action out. */
	async perform(ctx, action) {
		await ctx.page.mouse.click(action.payload.x, action.payload.y);
	},

	/** What happened. */
	async outcome(ctx, action) {
		return { correct: true, detail: 'You went through the door.' };
	}
};
```

`at` is optional: without it the action is only in the list the model reads.
`correct` is optional too, and only games with right and wrong answers should
set it.

## Keys

The keys live outside the repository, in the owner's key file
(`~/.config/ai-keys.env`, or `AI_KEYS_FILE` to point elsewhere). The tool reads
them at runtime. Nothing is written to disk, and no key is ever copied into the
project.

- `MINIMAX_API_KEY` - the brain and the voice. MiniMax is reached through its
  Anthropic-compatible endpoint, which takes images.
- `OPENROUTER_API_KEY` - the alternative brain, for when you want a different
  model. It reports the cost of every call.
- `ELEVENLABS_API_KEY` - an alternative voice, if the plan allows it.

## Flags

| Flag | Default | What it does |
|---|---|---|
| `--game=` | `geoclick` | Which game to play |
| `--brain=` | `minimax` | `minimax` or `openrouter` |
| `--model=` | per brain | The model that looks at the screen |
| `--mistakes=` | `0.4` | How often the agent chooses its second choice; disabled for Malpaco |
| `--lang=` | `en` | The language the narrator speaks. `en`, `it`, `es`, `fr`, `de`, `zh` |
| `--voice=` | per language | The narrator's voice |
| `--voice-provider=` | `minimax` | `minimax`, `elevenlabs` or `edge` |
| `--base=` | none | Drive a game that is already running |
| `--turns=` | `12` | How many turns to play |
| `--out=` | `rendered` | Where the video goes |

## What it costs

The voice is most of it: MiniMax bills speech by the character, $0.10 per
thousand. A five-turn round is around 1,200 characters, so about twelve cents.
The vision calls cost a fraction of a cent each. Every run prints what it
spent.
