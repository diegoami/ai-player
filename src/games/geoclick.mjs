// Geoclick: name the place the map lights up.
//
// The quiz has two ways round. This one uses Name places: the map lights one
// region with a ? marker and the tray offers four names, so the question is
// "what is the place under the marker". It is the round a machine can be
// asked without being told the answer.
//
// The game tells the agent whether it was right: answering opens a popup over
// the place, and that popup carries a `revealed` class when the answer was
// wrong.
import { join } from 'node:path';
import { existsSync, realpathSync } from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Where the Geoclick checkout is. */
const checkout = process.env.GEOCLICK_PATH ?? join(process.cwd(), '..', 'Geoclick2027');
// Vite must use the physical root when Windows projects live behind a junction.
const CHECKOUT = existsSync(checkout) ? realpathSync(checkout) : checkout;
const PORT = process.env.GEOCLICK_PORT ?? '5199';

export default {
	name: 'geoclick',
	summary: 'Name the region the map lights up, on a map quiz',
	// The server root; the route is opened by setup().
	url: `http://localhost:${PORT}`,
	route: `/map/${process.env.GEOCLICK_MAP ?? 'denmark-regions'}/quiz`,
	serve: {
		cwd: CHECKOUT,
		cmd: ['npm', 'run', 'dev', '--workspace=app', '--', '--port', PORT, '--strictPort']
	},

	/** Open the quiz and switch it to Name places. */
	async setup(ctx) {
		const { page, base } = ctx;
		await page.goto(`${base}${this.route}`);
		await page.waitForSelector('[data-testid="mode-place"]', { timeout: 60000 });
		await sleep(2500);
		await page.click('[data-testid="mode-name"]');
		await page.waitForSelector('[data-testid="choice"]', { timeout: 30000 });
		await sleep(1200);
	},

	/** The names on offer, with the keyboard hint taken off the front. */
	async choices(page) {
		return page.evaluate(() =>
			[...document.querySelectorAll('[data-testid="choice"]')].map((b) => {
				const key = b.querySelector('.choice-key');
				return {
					name: b.textContent.replace(key?.textContent ?? '', '').trim(),
					box: b.getBoundingClientRect()
				};
			})
		);
	},

	/** The legal actions: one per name in the tray. */
	async observe(ctx) {
		const { page } = ctx;
		const choices = await this.choices(page);
		if (!choices.length) return { done: true, actions: [], prompt: '' };
		return {
			actions: choices.map((c, i) => ({
				id: c.name,
				label: c.name,
				hint: 'a name in the tray',
				// The badge sits on the key at the left of the button, so the
				// name itself stays readable.
				at: { x: c.box.x + 14, y: c.box.y + c.box.height / 2 },
				index: i
			})),
			prompt:
				'This is a map quiz. One place on the map is lit up with a round ? marker. ' +
				'Give that place its name.'
		};
	},

	/** Click the name. */
	async perform(ctx, action) {
		const { page } = ctx;
		ctx.popupsBefore = await page.locator('.geoclick-solved-popup').count();
		await page.locator('[data-testid="choice"]').nth(action.index).click();
		await page
			.waitForFunction(
				(n) => document.querySelectorAll('.geoclick-solved-popup').length > n,
				ctx.popupsBefore,
				{ timeout: 15000 }
			)
			.catch(() => {});
		await sleep(400);
	},

	/** What the game says about the answer. */
	async outcome(ctx, action) {
		const popup = await ctx.page.evaluate(() => {
			const all = [...document.querySelectorAll('.geoclick-solved-popup')];
			const last = all[all.length - 1];
			return {
				text: last?.textContent?.trim() ?? '',
				revealed: !!last?.classList.contains('revealed')
			};
		});
		const correct = !popup.revealed;
		return {
			correct,
			detail: correct
				? `That was right: ${popup.text}.`
				: `That was wrong. The place that was lit up was ${popup.text}.`
		};
	}
};
