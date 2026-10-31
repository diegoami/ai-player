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

For the observed human-play demonstration, timed third-person commentary is
in `src/lessons/human-geoclick-commentary.json`. Run
`node bin/narrate-recording.mjs` to recreate the clean narrated copy from the
user-supplied Bandicam source. The source recording is preserved; optional
caption translations use the matching `.subtitles.json` file.

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
| `--lang=` | `en` | The language the narrator speaks. `en`, `it`, `es`, `fr`, `de` |
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
