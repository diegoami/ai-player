// Where the API keys come from.
//
// The keys live outside the repository, in the owner's key file. This module
// reads that file at runtime and puts the credentials into the environment.
// Nothing is written to disk here, and no key is ever copied into the project.
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Only credentials are taken: the key file holds ordinary settings too. */
const CREDENTIAL = /(_API_KEY|_TOKEN|_SECRET|_GROUP_ID)$/;

let loaded = false;

/**
 * Loads the key file once. Variables already in the environment win, so a
 * shell that exports a key overrides the file.
 */
export function loadKeys() {
	if (loaded) return;
	loaded = true;
	const file = process.env.AI_KEYS_FILE ?? join(homedir(), '.config', 'ai-keys.env');
	if (!existsSync(file)) return;
	let text;
	try {
		text = readFileSync(file, 'utf8');
	} catch {
		return;
	}
	for (const line of text.split(/\r?\n/)) {
		const m = line.trim().match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
		if (!m) continue;
		const [, key, rawValue] = m;
		if (!CREDENTIAL.test(key)) continue;
		let value = rawValue.trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		)
			value = value.slice(1, -1);
		if (value && !process.env[key]) process.env[key] = value;
	}
}

/** Whether a key is available, without printing it. */
export function hasKey(name) {
	loadKeys();
	return !!process.env[name];
}
