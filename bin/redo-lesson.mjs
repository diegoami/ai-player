// Redo one lesson in its chosen layout: preflight, record with the original
// narration reused from the cached clips, verify, and update the redo ledger.
// The recording inputs are protected the same way the series renderers
// protect them: an existing verified recording is never redone, and approved
// lesson content that changed refuses to record over the old export.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve, join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
for (const required of ['lesson', 'out', 'ledger', 'episode', 'cache']) {
  if (!args[required]) throw Error(`Use --lesson= --out= --ledger= --episode= --cache= [--base=] [--voice=]`);
}
const lessonPath = resolve(args.lesson);
const lesson = JSON.parse(readFileSync(lessonPath, 'utf8'));
const out = resolve(args.out);
const base = args.base ?? 'http://localhost:5187';
const voice = args.voice ?? 'moss_audio_5421e68d-d4ad-11f1-8568-2afee2873678';
const ledgerPath = resolve(args.ledger);
const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const episode = ledger.episodes.find(e => e.id === args.episode);
if (!episode) throw Error(`Unknown episode ${args.episode} in ${args.ledger}`);

const checkedContent = l => JSON.stringify({ mapId: l.mapId, supplement: l.supplement, states: l.states.map(({ name, location, view, rotateExtra, factContains, lines, gestures, relatedSelections }) => ({ name, location, view, rotateExtra, factContains, lines, gestures, relatedSelections })) });
const run = (script, argv, label) => new Promise((res, rej) => {
  console.log(`START ${label}`);
  const p = spawn(process.execPath, [script, ...argv], { stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  const capture = data => { const s = data.toString(); log += s; process.stdout.write(`[${label}] ${s}`); };
  p.stdout.on('data', capture); p.stderr.on('data', capture);
  p.on('error', rej);
  p.on('exit', code => { writeFileSync(join(out, `${label}.log`), log); code === 0 ? res() : rej(Error(`${label} exited ${code}`)); });
});
const argsFor = (dir, inspect) => ['--game=geoclick', `--base=${base}`, `--lesson=${lessonPath}`, `--out=${dir}`, `--voice=${voice}`,
  ...(inspect ? ['--inspect'] : [`--audio-cache=${args.cache}`])];

mkdirSync(out, { recursive: true });

// Preflight unless a completed, matching one exists. The recorder appends
// its own geoclick level under --out, so the root is passed and the
// artifacts live one level down.
const preflightDir = join(out, 'preflight');
const preflightArtifacts = join(preflightDir, 'geoclick');
const preflightProof = join(preflightArtifacts, 'trace.json');
const preflightScript = join(preflightArtifacts, 'lesson.json');
if (!existsSync(preflightProof) || !existsSync(preflightScript) ||
    !JSON.parse(readFileSync(preflightProof, 'utf8')).result?.completedPilot ||
    checkedContent(JSON.parse(readFileSync(preflightScript, 'utf8'))) !== checkedContent(lesson)) {
  await run('bin/geoclick-lesson.mjs', argsFor(preflightDir, true), 'preflight');
}

// Record unless a completed recording with matching inputs exists.
const recordDir = out;
const recordArtifacts = join(recordDir, 'geoclick');
mkdirSync(recordDir, { recursive: true });
const proof = join(recordArtifacts, 'trace.json');
const video = join(recordArtifacts, 'play-no-subtitles.mp4');
if (existsSync(video) && existsSync(proof) && JSON.parse(readFileSync(proof, 'utf8')).result?.completedPilot &&
    checkedContent(JSON.parse(readFileSync(join(recordArtifacts, 'lesson.json'), 'utf8'))) !== checkedContent(lesson)) {
  throw Error(`Approved recording inputs changed: choose a new export path for ${episode.id}`);
}
if (!existsSync(video) || !existsSync(proof) || !JSON.parse(readFileSync(proof, 'utf8')).result?.completedPilot) {
  await run('bin/geoclick-lesson.mjs', argsFor(recordDir, false), 'record');
}

// Verify unless done.
const report = join(recordArtifacts, 'verification.json');
if (!existsSync(report)) {
  await run('bin/verify-lesson-video.mjs', [`--dir=${recordArtifacts}`], 'verify');
}
const verification = JSON.parse(readFileSync(report, 'utf8'));

// Update the ledger episode.
if (episode.status !== 'complete') episode.status = 'media-verified-awaiting-visual-review';
episode.durationSeconds = verification.durationSeconds;
writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + '\n');
console.log(`DONE ${episode.id}: ${Math.floor(verification.durationSeconds / 60)}:${String(Math.round(verification.durationSeconds % 60)).padStart(2, '0')}`);
