// The knobs, from the command line and the environment.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { LANGUAGES } from './persona.mjs';

/** The default voice of each provider. */
const VOICES = {
	minimax: 'English_expressive_narrator',
	elevenlabs: '21m00Tcm4TlvDq8ikWAM',
	edge: 'en-GB-SoniaNeural'
};

/** The default brain of each provider. */
const BRAINS = {
	minimax: 'MiniMax-M3',
	openrouter: 'anthropic/claude-haiku-5.5'
};

export function readConfig(argv = process.argv.slice(2)) {
	const flag = (name, fallback) => {
		const hit = argv.find((a) => a.startsWith(`--${name}=`));
		return hit ? hit.slice(name.length + 3) : fallback;
	};
	const out = {
		game: flag('game', process.env.AI_PLAYER_GAME ?? 'geoclick'),
		// The brain is the model that looks at the screen and chooses.
		brain: flag('brain', process.env.AI_PLAYER_BRAIN ?? 'minimax'),
		model: flag('model', ''),
		// How often the agent changes its mind and goes with its second choice.
		mistakes: Number(flag('mistakes', process.env.AI_PLAYER_MISTAKES ?? '0.4')),
		voiceProvider: flag('voice-provider', process.env.AI_PLAYER_VOICE_PROVIDER ?? 'auto'),
		voice: flag('voice', ''),
		// The language the narrator speaks.
		lang: flag('lang', process.env.AI_PLAYER_LANG ?? 'en'),
		out: flag('out', process.env.AI_PLAYER_OUT ?? 'rendered'),
		// A game already running: the tool drives it instead of starting one.
		base: flag('base', process.env.AI_PLAYER_BASE ?? ''),
		turns: Number(flag('turns', process.env.AI_PLAYER_TURNS ?? '12')),
		port: Number(flag('port', process.env.AI_PLAYER_PORT ?? '5199')),
		list: argv.includes('--list')
	};
	if (!out.model) out.model = BRAINS[out.brain] ?? BRAINS.minimax;
	if (out.voiceProvider === 'auto') out.voiceProvider = 'minimax';
	// The voice follows the language unless one is named.
	if (!out.voice)
		out.voice = LANGUAGES[out.lang]?.voice ?? VOICES[out.voiceProvider] ?? VOICES.edge;
	out.dir = join(process.cwd(), out.out, out.game);
	mkdirSync(join(out.dir, 'clips'), { recursive: true });
	mkdirSync(join(out.dir, 'video'), { recursive: true });
	return out;
}
