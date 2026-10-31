// Voice preferences and the identity of reusable speech clips.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { LANGUAGES } from './persona.mjs';

const preferences = JSON.parse(
	readFileSync(new URL('../lessons/narrator-voices.json', import.meta.url), 'utf8')
);
const fallbackVoices = {
	minimax: 'English_expressive_narrator',
	elevenlabs: '21m00Tcm4TlvDq8ikWAM',
	edge: 'en-GB-SoniaNeural'
};

export function defaultVoice(provider, language) {
	if (provider === preferences.provider) {
		const accepted = Object.values(preferences.voices).find((voice) =>
			voice.languages.includes(language)
		);
		if (accepted) return accepted.voiceId;
	}
	return LANGUAGES[language]?.voice ?? fallbackVoices[provider] ?? fallbackVoices.edge;
}

export function narrationSettings(cfg) {
	return {
		provider: cfg.voiceProvider,
		voice: cfg.voice,
		language: cfg.lang,
		model: cfg.voiceProvider === 'minimax'
			? process.env.AI_PLAYER_SPEECH_MODEL ?? 'speech-02-hd'
			: cfg.voiceProvider === 'elevenlabs' ? 'eleven_multilingual_v2' : null
	};
}

export function speechCacheKey(cfg, text) {
	return createHash('sha256')
		.update(JSON.stringify({ ...narrationSettings(cfg), text }))
		.digest('hex').slice(0, 16);
}

export function canReuseSpeech(trace, cfg) {
	const saved = trace?.narration;
	return !!saved && Object.entries(narrationSettings(cfg))
		.every(([name, value]) => saved[name] === value);
}
