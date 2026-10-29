# ai-player

An agent that plays web games by looking at the screen, says out loud what it
is doing, and writes a video of the round.

It is a tool, not a game. It plays the games it is given an adapter for, and
it is deliberately mediocre at them: the point of the video is a player
thinking out loud, not a machine being good.

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
| `--mistakes=` | `0.4` | How often the agent changes its mind and goes with its second choice |
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
