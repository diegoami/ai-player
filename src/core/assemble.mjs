// Cutting the video, the narration and the subtitles into one mp4.
//
// The agent stage wrote the recording and a trace: every spoken line with the
// second it started and the second it ended. Here the clips are laid on that
// timeline, an SRT is written from the same lines, and ffmpeg puts the three
// together.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

/** Runs ffmpeg, keeping the console quiet unless it fails. */
function ffmpeg(args, cwd) {
	try {
		execFileSync('ffmpeg', ['-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'], cwd });
	} catch (e) {
		const err = e.stderr?.toString() ?? '';
		throw new Error(`ffmpeg failed: ${err.split('\n').slice(-6).join('\n')}`);
	}
}

/** The length of a media file in seconds. */
function duration(file) {
	return Number(
		execFileSync('ffprobe', [
			'-v',
			'error',
			'-show_entries',
			'format=duration',
			'-of',
			'csv=p=0',
			file
		])
			.toString()
			.trim()
	);
}

/** Writes an SRT file from the trace's lines. */
export function writeSrt(lines, file) {
	const stamp = (s) => {
		const roundedMs = Math.round(s * 1000);
		const ms = roundedMs % 1000;
		const total = Math.floor(roundedMs / 1000);
		const p = (n, w = 2) => String(n).padStart(w, '0');
		return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)},${p(ms, 3)}`;
	};
	writeFileSync(
		file,
		lines.map((l, i) => `${i + 1}\n${stamp(l.start)} --> ${stamp(l.end)}\n${l.text}\n`).join('\n'),
		'utf8'
	);
}

/**
 * The recording the browser made. The trace knows where it is; if the run
 * died before it could say, the folder still has it.
 */
function findVideo(dir, trace) {
	if (trace?.video) {
		const p = isAbsolute(trace.video) ? trace.video : join(process.cwd(), trace.video);
		if (existsSync(p)) return p;
	}
	const folder = join(dir, 'video');
	if (!existsSync(folder)) return undefined;
	const found = readdirSync(folder).filter((f) => f.endsWith('.webm'));
	return found.length ? join(folder, found[0]) : undefined;
}

/** Cuts the mp4. Returns where it went and how long it is. */
export function assemble(cfg, trace) {
	const trimStart = cfg.trimStart ?? 0;
	const videoPath = findVideo(cfg.dir, trace);
	if (!videoPath) throw new Error('No video found');
	const clips = trace.lines.filter((l) => existsSync(join(cfg.dir, 'clips', l.file)))
		.map((l) => ({ ...l, start: l.start - trimStart, end: l.end - trimStart }));
	if (!clips.length) throw new Error('No narration clips found');

	// ffmpeg runs inside the output folder, so the subtitle file is a plain
	// relative name and no drive letter confuses the filter.
	const rel = (p) => p.slice(cfg.dir.length + 1).split('\\').join('/');

	// Every clip is delayed to its own second and the delays are mixed.
	const inputs = [];
	const filters = [];
	clips.forEach((l, i) => {
		inputs.push('-i', rel(join(cfg.dir, 'clips', l.file)));
		filters.push(`[${i}]adelay=${Math.round(l.start * 1000)}:all=1[a${i}]`);
	});
	const mixed = clips.map((_, i) => `[a${i}]`).join('');
	const audioFile = 'narration.wav';
	ffmpeg(
		[
			...inputs,
			'-filter_complex',
			`${filters.join(';')};${mixed}amix=inputs=${clips.length}:normalize=0[out]`,
			'-map',
			'[out]',
			'-ar',
			'44100',
			'-ac',
			'2',
			'-c:a',
			'pcm_s16le',
			audioFile
		],
		cfg.dir
	);
	const audioEnd = Math.max(...clips.map((l) => l.end));

	writeSrt(
		clips.map((l) => ({ start: l.start, end: l.end, text: l.text })),
		join(cfg.dir, 'subtitles.srt')
	);

	const out = join(cfg.dir, cfg.videoFilename ?? 'play.mp4');
	const videoLength = cfg.videoDuration ?? (Math.min(duration(videoPath), cfg.trimEnd ?? Infinity) - trimStart);
	const total = Math.max(videoLength, audioEnd) + (cfg.tailSeconds ?? 0.5);
	const style = [
		'FontName=Arial',
		// libass scales against a 288px-tall reference, so 12 lands near 30px
		// on a 720p frame.
		`FontSize=${cfg.subtitleFontSize ?? 12}`,
		'PrimaryColour=&H00FFFFFF',
		'OutlineColour=&H00000000',
		'BackColour=&HB4000000',
		'BorderStyle=3',
		'Outline=1',
		'Shadow=0',
		`Alignment=${cfg.subtitleAlignment ?? 2}`,
		`MarginV=${cfg.subtitleMarginV ?? 24}`
	].join(',');

	ffmpeg(
		[
			'-i',
			videoPath,
			'-i',
			audioFile,
			'-map', '0:v:0',
			'-map', '1:a:0',
			// Freeze the last frame if the narration runs past the recording.
			'-vf',
			`${trimStart || cfg.trimEnd ? `trim=start=${trimStart}${cfg.trimEnd ? `:end=${cfg.trimEnd}` : ''},setpts=PTS-STARTPTS,` : ''}${cfg.videoFilter ? `${cfg.videoFilter},` : ''}tpad=stop_mode=clone:stop_duration=${Math.ceil(total - videoLength) + 1}${cfg.burnSubtitles === false ? '' : `,subtitles=filename=subtitles.srt:force_style='${style}'`}`,
			'-c:v',
			'libx264',
			'-preset',
			'medium',
			'-crf',
			'20',
			'-pix_fmt',
			'yuv420p',
			'-c:a',
			'aac',
			'-b:a',
			'160k',
			'-t',
			total.toFixed(2),
			'-movflags',
			'+faststart',
			rel(out)
		],
		cfg.dir
	);
	return { out, videoLength, audioEnd };
}
