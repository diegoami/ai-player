#!/usr/bin/env node
// Plays a game and writes a video of it.
//
//   node bin/play.mjs                       the default game
//   node bin/play.mjs --game=malpaco
//   node bin/play.mjs --list
//
// Run `node bin/play.mjs --help` for the flags.
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readConfig } from '../src/core/config.mjs';
import { play } from '../src/core/session.mjs';

const gamesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'games');

/** Every adapter in src/games. */
function loadGames() {
	return readdirSync(gamesDir)
		.filter((f) => f.endsWith('.mjs'))
		.map((f) => f.replace(/\.mjs$/, ''));
}

/** An adapter, by name. */
const loadGame = (name) => import(pathToFileURL(join(gamesDir, `${name}.mjs`)).href);

const cfg = readConfig();

if (cfg.list) {
	for (const name of loadGames()) {
		const game = (await loadGame(name)).default;
		process.stdout.write(`${name.padEnd(12)} ${game.summary ?? ''}\n`);
	}
	process.exit(0);
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
	const game = (await loadGame(cfg.game)).default;
	process.stdout.write(
		`ai-player - plays ${game.name} and writes a video of it\n\n` +
			`  --game=<name>        which game to play (${loadGames().join(', ')})\n` +
			`  --brain=<provider>   minimax (default) or openrouter\n` +
			`  --model=<model>      the model that looks at the screen\n` +
			`  --mistakes=<0..1>    how often the agent changes its mind\n` +
			`  --voice=<id>         the narrator's voice\n` +
			`  --voice-provider=<p> minimax, elevenlabs or edge\n` +
			`  --base=<url>         drive a game that is already running\n` +
			`  --turns=<n>          how many turns to play\n` +
			`  --out=<folder>       where the video goes (default rendered/<game>)\n`
	);
	process.exit(0);
}

const name = cfg.game;
if (!loadGames().includes(name)) {
	process.stdout.write(`No game called "${name}". Try: ${loadGames().join(', ')}\n`);
	process.exit(1);
}

const game = (await loadGame(name)).default;
process.stdout.write(`ai-player: playing ${game.name}\n`);
await play(cfg, game);
