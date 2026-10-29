// The voice.
//
// Every line is turned into speech as the game is played, and the agent waits
// while it is speaking. The pauses in the video are then the model's own
// hesitations, and the words land on the action they describe.
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { addSpeech } from './cost.mjs';
import { loadKeys } from './keys.mjs';

/** Sends a line to a voice provider and writes an mp3. Returns its duration. */
export async function speak(cfg, text, file) {
	const target = join(cfg.dir, 'clips', file);
	const provider = cfg.voiceProvider;
	if (provider === 'minimax') await minimaxTts(cfg, text, target);
	else if (provider === 'elevenlabs') await elevenlabsTts(cfg, text, target);
	else edgeTts(cfg, text, target);
	addSpeech(provider, text.length);
	if (!existsSync(target)) throw new Error(`No audio written for "${text.slice(0, 40)}"`);
	return probeDuration(target);
}

/** MiniMax speech synthesis: https://api.minimax.io/v1/t2a_v2 */
async function minimaxTts(cfg, text, target) {
	loadKeys();
	const key = process.env.MINIMAX_API_KEY;
	const groupId = process.env.MINIMAX_GROUP_ID ?? '';
	const url = `https://api.minimax.io/v1/t2a_v2${groupId ? `?GroupId=${groupId}` : ''}`;
	const res = await fetch(url, {
		method: 'POST',
		headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: process.env.AI_PLAYER_SPEECH_MODEL ?? 'speech-02-hd',
			text,
			stream: false,
			voice_setting: { voice_id: cfg.voice, speed: 1, vol: 1, pitch: 0 },
			audio_setting: { sample_rate: 32000, bitrate: 128000, format: 'mp3' }
		})
	});
	const raw = await res.text();
	if (!res.ok) throw new Error(`MiniMax speech ${res.status}: ${raw.slice(0, 300)}`);
	const json = JSON.parse(raw);
	const hex = json.data?.audio;
	if (!hex) throw new Error(`MiniMax speech gave no audio: ${raw.slice(0, 200)}`);
	writeFileSync(target, Buffer.from(hex, 'hex'));
}

/** ElevenLabs text to speech. Needs a plan that allows the voice. */
async function elevenlabsTts(cfg, text, target) {
	loadKeys();
	const key = process.env.ELEVENLABS_API_KEY;
	const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${cfg.voice}`, {
		method: 'POST',
		headers: { 'xi-api-key': key, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			text,
			model_id: 'eleven_multilingual_v2',
			voice_settings: { stability: 0.35, similarity_boost: 0.8, style: 0.5 }
		})
	});
	if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 300)}`);
	writeFileSync(target, Buffer.from(await res.arrayBuffer()));
}

/** Microsoft Edge read-aloud voices: free, no key, and good enough to listen to. */
function edgeTts(cfg, text, target) {
	execFileSync(
		'python',
		['-I', '-m', 'edge_tts', '--voice', cfg.voice, '--text', text, '--write-media', target],
		{ stdio: ['ignore', 'ignore', 'pipe'] }
	);
}

/** The length of a media file in seconds. */
export function probeDuration(file) {
	const out = execFileSync('ffprobe', [
		'-v',
		'error',
		'-show_entries',
		'format=duration',
		'-of',
		'csv=p=0',
		file
	]).toString();
	return Number(out.trim());
}
