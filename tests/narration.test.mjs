import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { readConfig } from '../src/core/config.mjs';
import { languageRule } from '../src/core/persona.mjs';
import { canReuseSpeech, defaultVoice, narrationSettings, speechCacheKey } from '../src/core/narration.mjs';

const john = 'moss_audio_5421e68d-d4ad-11f1-8568-2afee2873678';
const italianClone = 'moss_audio_7c908e62-d4ab-11f1-bf7a-5699d2bd1137';
const cfg = { voiceProvider: 'minimax', voice: john, lang: 'en' };

test('new MiniMax narration uses the owner-approved voice for each accepted language', () => {
	assert.equal(defaultVoice('minimax', 'en'), john);
	for (const language of ['it', 'de', 'fr', 'zh'])
		assert.equal(defaultVoice('minimax', language), italianClone);
	assert.equal(defaultVoice('minimax', 'es'), 'Spanish_SereneWoman');
	assert.match(languageRule('zh'), /write every line in Mandarin Chinese/);
});

test('a command-line voice overrides the accepted default', () => {
	const dir = mkdtempSync(join(tmpdir(), 'ai-player-voice-test-'));
	try {
		const defaults = readConfig([`--out=${dir}`, '--lang=en', '--voice-provider=minimax']);
		assert.equal(defaults.voice, john);
		assert.equal(defaults.dir, join(dir, 'geoclick'));
		const explicit = readConfig([`--out=${dir}`, '--lang=en', '--voice-provider=minimax', '--voice=English_expressive_narrator']);
		assert.equal(explicit.voice, 'English_expressive_narrator');
	} finally { rmSync(dir, { recursive: true, force: true }); }
});

test('identical words recorded by different voices cannot reuse a clip', () => {
	const text = 'Welcome to the geography lesson.';
	assert.notEqual(speechCacheKey(cfg, text), speechCacheKey({ ...cfg, voice: 'English_expressive_narrator' }, text));
	assert.notEqual(speechCacheKey(cfg, text), speechCacheKey({ ...cfg, lang: 'de' }, text));
	assert.notEqual(speechCacheKey(cfg, text), speechCacheKey(cfg, text + ' Again.'));
	assert.equal(speechCacheKey(cfg, text), speechCacheKey({ ...cfg }, text));
});

test('changing the speech model invalidates speech reuse', () => {
	const before = process.env.AI_PLAYER_SPEECH_MODEL;
	try {
		process.env.AI_PLAYER_SPEECH_MODEL = 'speech-02-hd';
		const old = speechCacheKey(cfg, 'Hello.');
		const trace = { narration: narrationSettings(cfg) };
		process.env.AI_PLAYER_SPEECH_MODEL = 'speech-2.8-hd';
		assert.notEqual(speechCacheKey(cfg, 'Hello.'), old);
		assert.equal(canReuseSpeech(trace, cfg), false);
	} finally {
		if (before === undefined) delete process.env.AI_PLAYER_SPEECH_MODEL;
		else process.env.AI_PLAYER_SPEECH_MODEL = before;
	}
});

test('audio-cache imports need a matching recorded narrator identity', () => {
	assert.equal(canReuseSpeech({ lines: [] }, cfg), false);
	assert.equal(canReuseSpeech({ narration: narrationSettings(cfg) }, cfg), true);
	assert.equal(canReuseSpeech({ narration: { ...narrationSettings(cfg), voice: 'English_expressive_narrator' } }, cfg), false);
	assert.equal(canReuseSpeech(null, cfg), false);
});
