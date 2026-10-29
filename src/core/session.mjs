// The session: a browser, a recording, and a loop of turns.
//
// The loop is the same for every game. What differs is the adapter, which
// answers three questions: what are the legal actions right now, how do I
// carry one out, and what happened.
//
// An adapter looks like this:
//
//   export default {
//     name: 'geoclick',
//     summary: 'Name the region the map lights up',
//     url: 'http://localhost:5199/map/denmark-regions/quiz',
//     serve: { cwd: 'C:/path/to/Geoclick2027', cmd: [...] },
//     async setup(ctx) {},
//     async observe(ctx) {
//       return { actions: [...], prompt: '...', done: false };
//     },
//     async perform(ctx, action) {},
//     async outcome(ctx, action) {
//       return { correct: true, detail: '...', done: false };
//     }
//   };
//
// An action is something the model can choose:
//
//   { id, label, hint?, at?: {x, y}, payload? }
//
// `label` is what the model is told the action is, `at` is where the action
// is marked on the screenshot, and `payload` is whatever the adapter needs to
// carry the action out.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { assemble } from './assemble.mjs';
import { costReport } from './cost.mjs';
import { LINE_RULE, PERSONA, REASON_RULE, languageRule } from './persona.mjs';
import { probeDuration, speak } from './narrator.mjs';
import { askBrain, describeActions, shoot } from './vision.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Plays one game and writes the video, the narration and the trace. */
export async function play(cfg, game) {
	const base = cfg.base || game.url;
	let server;
	if (!cfg.base && game.serve) {
		server = startServer(game.serve, cfg.port);
		if (!(await waitFor(base))) throw new Error(`${base} did not come up`);
	}

	const videoDir = join(cfg.dir, 'video');
	mkdirSync(videoDir, { recursive: true });
	const browser = await chromium.launch();
	const context = await browser.newContext({
		viewport: { width: 1280, height: 720 },
		deviceScaleFactor: 2, // the model gets a sharp screen; the video stays 720p
		recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } }
	});

	// The clock the whole timeline is measured on: the video starts with the page.
	const t0 = Date.now();
	const page = await context.newPage();
	const at = () => (Date.now() - t0) / 1000;

	const ctx = { cfg, page, base, game };
	const trace = { game: game.name, model: cfg.model, brain: cfg.brain, lines: [], turns: [] };

	/** Says a line: generated, spoken, and timed against the video. */
	async function say(text, kind, extra = {}) {
		const line = String(text ?? '').trim() || 'Um. Give me a second.';
		const file = `line-${String(trace.lines.length).padStart(2, '0')}.mp3`;
		const duration = await speak(cfg, line, file);
		const start = at();
		trace.lines.push({ start, end: start + duration, text: line, kind, file, ...extra });
		process.stdout.write(`  [${kind}] ${line}\n`);
		await sleep(duration * 1000); // the agent talks
		return duration;
	}
	ctx.say = say;

	try {
		await game.setup?.(ctx);
		await say(await opening(ctx), 'intro');
		await loop(ctx, trace, say);
		await say(await closing(ctx, trace), 'outro');
	} finally {
		const video = page.video();
		await context.close();
		const videoPath = await video.path();
		await browser.close();
		if (server) stopServer(server);
		trace.video = videoPath;
		trace.duration = probeDuration(videoPath);
		trace.endedAt = at();
		writeFileSync(join(cfg.dir, 'trace.json'), JSON.stringify(trace, null, 2), 'utf8');
	}

	const cut = assemble(cfg, trace);
	trace.costs = { ...(await import('./cost.mjs')).costs };
	writeFileSync(join(cfg.dir, 'trace.json'), JSON.stringify(trace, null, 2), 'utf8');
	process.stdout.write(
		`\n${game.name}: ${trace.turns.length} turns, video ${cut.videoLength.toFixed(1)}s -> ${cut.out}\n`
	);
	process.stdout.write(`\n${costReport()}\n`);
	return trace;
}

/** The loop of turns. */
async function loop(ctx, trace, say) {
	const { cfg, page, game } = ctx;
	for (let turn = 0; turn < cfg.turns; turn++) {
		const seen = await game.observe(ctx);
		if (seen.done) break;
		if (!seen.actions?.length) {
			await sleep(700);
			continue;
		}

		const image = await shoot(page, seen.actions);
		const listing = describeActions(seen.actions);
		const prompt = `${seen.prompt}\n\nThe legal actions are:\n${listing}\n\n${PERSONA}${languageRule(cfg.lang)}\n\n${REASON_RULE}`;

		let answer = {};
		try {
			answer = await askBrain(cfg, { text: prompt, image });
		} catch (e) {
			// One bad answer is not worth losing the round over.
			process.stdout.write(`  ! no answer from the model (${e.message})\n`);
		}

		const picked = pickAction(seen.actions, answer, cfg.mistakes);
		const changed = picked.changed;
		const action = picked.action;
		const reason = String(answer.reason ?? '').trim();
		await say(
			changed ? `Hmm, actually - ${action.label}. ${reason}` : reason,
			'think',
			{ action: action.id }
		);

		await game.perform(ctx, action);
		const outcome = (await game.outcome?.(ctx, action)) ?? {};
		trace.turns.push({ action: action.id, label: action.label, ...outcome });

		await say(
			await reaction(ctx, { action, outcome }),
			'react',
			{ action: action.id, correct: outcome.correct }
		);
		await sleep(600);
	}
}

/**
 * Which action the agent takes. A mediocre player changes its mind with some
 * odds, and says so out loud.
 */
function pickAction(actions, answer, mistakes) {
	const asNumber = (v) => {
		const n = Number(v);
		return Number.isInteger(n) && n >= 1 && n <= actions.length ? n : 0;
	};
	const first = asNumber(answer.action) || 1;
	const alt = asNumber(answer.alt);
	const changed = !!alt && alt !== first && Math.random() < mistakes;
	const index = changed ? alt - 1 : first - 1;
	return { action: actions[index], changed };
}

/** The line before the first turn. */
async function opening(ctx) {
	const { cfg, game } = ctx;
	try {
		const json = await askBrain(cfg, {
			text: `${PERSONA}${languageRule(cfg.lang)}\n\nYou have just opened ${game.name}. Introduce the round in one short spoken sentence, as a slightly nervous player about to start.\n\n${LINE_RULE}`
		});
		return json.line;
	} catch {
		return `Right. ${game.name}. Here we go.`;
	}
}

/** The line after a turn. */
async function reaction(ctx, { action, outcome }) {
	const { cfg } = ctx;
	const facts = outcome.detail
		? `You chose "${action.label}". ${outcome.detail}`
		: `You chose "${action.label}".`;
	try {
		const json = await askBrain(cfg, {
			text: `${PERSONA}${languageRule(cfg.lang)}\n\n${facts}\nReact out loud, as a mediocre player would. If it went badly, own it.\n\n${LINE_RULE}`,
			temperature: 0.9,
			maxTokens: 400
		});
		return json.line;
	} catch {
		return facts;
	}
}

/** The line after the last turn. */
async function closing(ctx, trace) {
	const { cfg } = ctx;
	// Not every game is right or wrong: a board game has moves, not answers.
	const scored = trace.turns.filter((t) => typeof t.correct === 'boolean');
	const summary = scored.length
		? `The game is over: you got ${scored.filter((t) => t.correct).length} of ${scored.length} right.`
		: `The game is over. You played ${trace.turns.length} moves.`;
	try {
		const json = await askBrain(cfg, {
			text: `${PERSONA}${languageRule(cfg.lang)}\n\n${summary} Say what you make of it, out loud, as a mediocre player.\n\n${LINE_RULE}`,
			temperature: 0.9,
			maxTokens: 400
		});
		return json.line;
	} catch {
		return summary;
	}
}

// ------------------------------------------------------------------ the server
function startServer(serve, port) {
	// Windows cannot spawn a .cmd file directly, so npm goes through cmd.exe.
	const [bin, ...args] = serve.cmd;
	const windows = process.platform === 'win32';
	const proc = spawn(windows ? 'cmd.exe' : bin, windows ? ['/c', bin, ...args] : args, {
		cwd: serve.cwd,
		stdio: 'ignore',
		shell: false
	});
	const stop = () => {
		if (process.platform === 'win32')
			spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F']);
		else proc.kill();
	};
	process.on('exit', stop);
	return { proc, stop };
}

function stopServer(server) {
	server.stop();
}

async function waitFor(url, ms = 120000) {
	const end = Date.now() + ms;
	while (Date.now() < end) {
		try {
			if ((await fetch(url)).ok) return true;
		} catch {
			/* not up yet */
		}
		await sleep(1000);
	}
	return false;
}
