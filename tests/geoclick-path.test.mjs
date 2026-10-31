import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('GeoClick starts from the physical checkout behind a Windows projects junction', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'ai-player-game-path-'));
	const saved = process.env.GEOCLICK_PATH;
	try {
		const physical = join(dir, 'physical-projects', 'Geoclick2027');
		mkdirSync(physical, { recursive: true });
		const alias = join(dir, 'projects');
		symlinkSync(join(dir, 'physical-projects'), alias, 'junction');
		process.env.GEOCLICK_PATH = join(alias, 'Geoclick2027');
		const { default: game } = await import('../src/games/geoclick.mjs?junction-test');
		assert.equal(game.serve.cwd, realpathSync(physical));
	} finally {
		if (saved === undefined) delete process.env.GEOCLICK_PATH;
		else process.env.GEOCLICK_PATH = saved;
		rmSync(dir, { recursive: true, force: true });
	}
});
