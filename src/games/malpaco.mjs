// Malpaco: an island-conquest board game against computer opponents.
//
// The board is an SVG map. Every region is a `g.country` element carrying who
// owns it and how many armies stand on it, and the human player is the seat
// the turn tracker marks as "you" (seat 1, blue).
//
// A turn is not one click. The game walks through phases, and the adapter
// keeps track of which one it is in:
//
//   cards        choose or skip a card, or skip to the next phase
//   reinforce    put the pool of armies onto one of your own regions
//   attack       pick a region of yours, then one of the enemy next to it
//   end          hand the turn back and wait for your next one
//
// Every step is defensive: if a button the game would normally show is not
// there, the adapter moves on rather than stopping the run.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Where the human player sits, and the colour they play. */
const YOU = 'seat1';
const COLOURS = { seat1: 'blue', seat2: 'orange', seat3: 'green', seat4: 'purple' };

export default {
	name: 'malpaco',
	summary: 'Play an island-conquest board game against computer opponents',
	url: process.env.MALPACO_URL ?? 'https://malpaco.netlify.app/?seed=1994',

	/** Start a game with the default settings. */
	async setup(ctx) {
		const { page, base } = ctx;
		await page.goto(base, { waitUntil: 'networkidle' });
		await page.waitForSelector('#start-game', { timeout: 60000 });
		await page.click('#start-game');
		await sleep(3000);
		ctx.state = { phase: 'cards', source: null };
	},

	/** The regions on the map, with where they are on screen. */
	async regions(page) {
		return page.evaluate(() =>
			[...document.querySelectorAll('g.country')].map((g) => {
				const b = g.getBoundingClientRect();
				return {
					id: g.dataset.id,
					owner: g.dataset.owner,
					armies: Number(g.dataset.armies ?? 0),
					x: Math.round(b.x + b.width / 2),
					y: Math.round(b.y + b.height / 2),
					w: Math.round(b.width),
					h: Math.round(b.height)
				};
			})
		);
	},

	/** What the game says about whose turn it is and what it wants. */
	async guidance(page) {
		return page.evaluate(() => {
			const seatRow = document.querySelector('#turn-tracker [data-current="true"]');
			return {
				phase: document.getElementById('turn-phase')?.textContent?.trim() ?? '',
				instruction: document.getElementById('turn-instruction')?.textContent?.trim() ?? '',
				pool: Number(document.getElementById('placement-pool-count')?.textContent?.trim() ?? 0),
				current: seatRow?.dataset?.turnPlayer ?? null,
				status: document.getElementById('game-status')?.textContent?.trim() ?? ''
			};
		});
	},

	/** Where a region sits on the map, in words, for the model to choose by. */
	place(box) {
		const left = box.x < 640;
		const top = box.y < 360;
		return `${top ? 'upper' : 'lower'} ${left ? 'left' : 'right'}`;
	},

	/** The legal actions right now. */
	async observe(ctx) {
		const { page } = ctx;
		const g = await this.guidance(page);

		// Not our turn: skip ahead to it.
		if (g.current && g.current !== YOU) {
			await page.click('#fast-forward-button').catch(() => {});
			await sleep(1200);
			return { actions: [], prompt: '', waiting: true };
		}

		const regions = await this.regions(page);
		const mine = regions.filter((r) => r.owner === YOU);

		// Reinforcement: put the pool on one of our own regions.
		if (/place armies|reinforc/i.test(g.instruction) && g.pool > 0) {
			ctx.state.phase = 'reinforce';
			return {
				actions: mine.map((r) => ({
					id: `reinforce:${r.id}`,
					label: `the ${COLOURS[r.owner] ?? r.owner} region ${this.place(r)}`,
					hint: `${r.armies} armies on it now`,
					at: { x: r.x, y: r.y },
					payload: r
				})),
				prompt:
					`You are playing an island-conquest game. You are the ${COLOURS[YOU]} player. ` +
					`You have ${g.pool} armies to place on your own regions. ` +
					`Which one of your regions should they go to?`
			};
		}

		// Attack: first the region that attacks, then the one attacked.
		if (ctx.state.phase === 'attack-target' && ctx.state.source) {
			const enemies = regions.filter(
				(r) => r.owner !== YOU && this.near(ctx.state.source, r, regions)
			);
			if (enemies.length) {
				return {
					actions: enemies.map((r) => ({
						id: `attack:${ctx.state.source.id}:${r.id}`,
						label: `the ${COLOURS[r.owner] ?? r.owner} region ${this.place(r)}`,
						hint: `${r.armies} armies defending it`,
						at: { x: r.x, y: r.y },
						payload: r
					})),
					prompt:
						`You are attacking from your region ${this.place(ctx.state.source)}. ` +
						`Which enemy region do you attack? Prefer one you can take.`
				};
			}
			ctx.state.phase = 'attack-source';
		}

		if (ctx.state.phase === 'attack-source') {
			const attackers = mine.filter((r) => r.armies >= 2);
			if (attackers.length) {
				return {
					actions: attackers.map((r) => ({
						id: `source:${r.id}`,
						label: `your region ${this.place(r)}`,
						hint: `${r.armies} armies on it`,
						at: { x: r.x, y: r.y },
						payload: r
					})),
					prompt:
						`It is your turn to attack. Choose one of your regions to attack from. ` +
						`A region with more armies attacks more safely.`
				};
			}
		}

		// Nothing else to do this turn.
		ctx.state.phase = 'end';
		return {
			actions: [
				{
					id: 'end-turn',
					label: 'end your turn',
					hint: 'nothing else to do'
				}
			],
			prompt:
				`You are playing an island-conquest game. You are the ${COLOURS[YOU]} player. ` +
				`There is nothing else for you to do this turn.`
		};
	},

	/** Whether two regions touch, by their distance on screen. */
	near(a, b, all) {
		const distance = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
		const closest = Math.min(
			...all
				.filter((r) => r.id !== a.id && r.id !== b.id)
				.map((r) => distance(a, r))
		);
		return distance(a, b) < Math.max(closest, 1) * 1.6;
	},

	/** Carry the action out. */
	async perform(ctx, action) {
		const { page } = ctx;
		if (action.id === 'end-turn') {
			await page.click('#end-turn-button').catch(() => {});
			await sleep(600);
			return;
		}
		if (action.id.startsWith('source:')) {
			ctx.state.source = action.payload;
			ctx.state.phase = 'attack-target';
			await page.mouse.click(action.payload.x, action.payload.y);
			await sleep(700);
			return;
		}
		if (action.id.startsWith('attack:')) {
			await page.mouse.click(action.payload.x, action.payload.y);
			await sleep(900);
			await page.click('#single-exchange-button').catch(() => {});
			await sleep(1200);
			return;
		}
		if (action.id.startsWith('reinforce:')) {
			await page.mouse.click(action.payload.x, action.payload.y);
			await sleep(900);
			// The panel that opens has a confirm button; it is called
			// something different in different phases, so look for the
			// obvious ones and take the default amount if there is none.
			await this.confirmPlacement(ctx);
			await sleep(900);
		}
	},

	/** Press the confirm button of the panel that is open, if there is one. */
	async confirmPlacement(ctx) {
		const { page } = ctx;
		const clicked = await page.evaluate(() => {
			const drawer = document.getElementById('game-focus-drawer');
			const scope = drawer && drawer.offsetParent ? drawer : document;
			const buttons = [...scope.querySelectorAll('button')].filter((b) => b.offsetParent);
			const confirm = buttons.find((b) => /confirm|place|ok|apply/i.test(b.textContent ?? ''));
			if (confirm) {
				confirm.click();
				return confirm.textContent.trim();
			}
			return null;
		});
		if (!clicked) {
			// No panel: the click may have placed the armies on its own.
			await page.keyboard.press('Enter').catch(() => {});
		}
		return clicked;
	},

	/** What the game says about what just happened. */
	async outcome(ctx, action) {
		const { page } = ctx;
		const g = await this.guidance(page);
		if (action.id === 'end-turn')
			return { detail: 'You ended your turn and the computers take over.' };
		if (action.id.startsWith('attack:')) {
			const battle = await page.evaluate(() => ({
				source: document.getElementById('battle-source-name')?.textContent?.trim(),
				target: document.getElementById('battle-target-name')?.textContent?.trim(),
				status: document.getElementById('battle-status')?.textContent?.trim()
			}));
			const parts = [];
			if (battle.source) parts.push(`You attacked ${battle.target} from ${battle.source}.`);
			if (battle.status) parts.push(battle.status);
			return { detail: parts.join(' ') || 'The attack was fought.' };
		}
		if (action.id.startsWith('reinforce:'))
			return { detail: `You put your armies on ${action.label}.` };
		return { detail: g.instruction };
	}
};
