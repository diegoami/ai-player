// The eyes: a screenshot of the game, the candidate actions marked on it, and
// a model that picks one.
//
// The tool never asks a model for pixel coordinates. The adapter says what the
// legal actions are and where they are on screen; the tool marks each one
// with a number; the model answers with a number. The model describes what it
// sees and the adapter does the clicking, so a game does not need to be
// pixel-perfect to be played.
import { addOther, addOpenRouter } from './cost.mjs';
import { loadKeys } from './keys.mjs';
import { parseJsonLoose } from './json.mjs';

/**
 * Marks the actions on the page, takes the picture, and takes the marks off
 * again. The picture is what the model sees.
 */
export async function shoot(page, actions) {
	const marks = actions
		.map((a, i) => (a.at ? { n: i + 1, x: a.at.x, y: a.at.y } : null))
		.filter(Boolean);
	await page.evaluate((list) => {
		const layer = document.createElement('div');
		layer.id = '__ai_player_marks';
		layer.style.cssText =
			'position:fixed;inset:0;pointer-events:none;z-index:2147483647;font-family:system-ui,sans-serif;';
		for (const m of list) {
			const badge = document.createElement('div');
			badge.textContent = String(m.n);
			badge.style.cssText = `position:absolute;left:${m.x}px;top:${m.y}px;transform:translate(-50%,-50%);
				width:32px;height:32px;border-radius:50%;background:#e8590c;color:#fff;
				font-size:19px;font-weight:700;line-height:32px;text-align:center;
				box-shadow:0 0 0 3px #fff,0 2px 8px rgba(0,0,0,.55);`;
			layer.appendChild(badge);
		}
		document.body.appendChild(layer);
	}, marks);
	const shot = await page.screenshot({ type: 'png', scale: 'css' });
	await page.evaluate(() => document.getElementById('__ai_player_marks')?.remove());
	return shot.toString('base64');
}

/** The list of actions as the model is told about them. */
export function describeActions(actions) {
	return actions
		.map((a, i) => `${i + 1}. ${a.label}${a.hint ? ` (${a.hint})` : ''}`)
		.join('\n');
}

/**
 * Asks the brain and returns the parsed JSON.
 *
 * MiniMax is reached through its Anthropic-compatible endpoint, which takes
 * images and sits inside the owner's plan. OpenRouter is the alternative: more
 * models to choose from, and it reports the cost of every call.
 *
 * `image` is optional: a question about the screen needs one, a question about
 * what just happened does not.
 */
export async function askBrain(cfg, { text, image, maxTokens = 1200, temperature = 0.8 }) {
	return cfg.brain === 'openrouter'
		? askOpenRouter(cfg, { text, image, maxTokens, temperature })
		: askMinimax(cfg, { text, image, maxTokens, temperature });
}

async function askMinimax(cfg, { text, image, maxTokens, temperature }) {
	loadKeys();
	const key = process.env.MINIMAX_API_KEY;
	if (!key) throw new Error('MINIMAX_API_KEY is not set');
	const content = [];
	if (image) content.push({ type: 'image', source: { type: 'base64', media_type: 'image/png', data: image } });
	content.push({ type: 'text', text });
	const res = await fetch('https://api.minimax.io/anthropic/v1/messages', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'anthropic-version': '2023-06-01',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: cfg.model,
			max_tokens: maxTokens,
			temperature,
			messages: [{ role: 'user', content }]
		})
	});
	const raw = await res.text();
	if (!res.ok) throw new Error(`MiniMax ${res.status}: ${raw.slice(0, 300)}`);
	const json = JSON.parse(raw);
	const reply = Array.isArray(json.content)
		? json.content.map((b) => b.text ?? '').join('')
		: '';
	if (!reply) throw new Error(`MiniMax returned no content: ${raw.slice(0, 200)}`);
	// The plan covers this traffic, so there is nothing to bill; the tokens
	// are kept so a run can still say what it used.
	addOther(
		'MiniMax',
		0,
		(json.usage?.input_tokens ?? 0) + (json.usage?.output_tokens ?? 0)
	);
	return parseJsonLoose(reply);
}

async function askOpenRouter(cfg, { text, image, maxTokens, temperature }) {
	loadKeys();
	const key = process.env.OPENROUTER_API_KEY;
	if (!key) throw new Error('OPENROUTER_API_KEY is not set');
	const content = [];
	if (image)
		content.push({ type: 'image_url', image_url: { url: `data:image/png;base64,${image}` } });
	content.push({ type: 'text', text });
	const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://ai-player.local',
			'X-Title': 'ai-player'
		},
		body: JSON.stringify({
			model: cfg.model,
			max_tokens: maxTokens,
			temperature,
			messages: [{ role: 'user', content }]
		})
	});
	const raw = await res.text();
	if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${raw.slice(0, 300)}`);
	const json = JSON.parse(raw);
	const reply = json.choices?.[0]?.message?.content;
	if (!reply) throw new Error(`OpenRouter returned no content: ${raw.slice(0, 300)}`);
	addOpenRouter(json.usage);
	return parseJsonLoose(reply);
}
