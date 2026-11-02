#!/usr/bin/env node
// Rewrite the lesson.json and lesson.md documents of recorded episodes.
//
// Only the documents are touched: no media, no captions, no trace. The
// narration text is unchanged, so the recorded audio and video stay valid.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
if (!args.ledger) throw Error('Use --ledger=<coverage ledger>');
const ledger = JSON.parse(readFileSync(resolve(args.ledger), 'utf8'));

for (const episode of ledger.episodes) {
  const lesson = JSON.parse(readFileSync(resolve(episode.lesson), 'utf8'));
  const dir = resolve(episode.video, '..');
  writeFileSync(join(dir, 'lesson.json'), JSON.stringify(lesson, null, 2));
  writeFileSync(join(dir, 'lesson.md'), `# ${lesson.title}\n\n${lesson.intro.join('\n\n')}\n\n` +
    lesson.states.map(s => `## ${s.name}\n\n${s.lines.join('\n\n')}\n\n${s.sources.map(url => `[Reference](${url})`).join(', ')}\n`).join('\n') +
    `\n## Recap\n\n${lesson.recap.join('\n\n')}\n`);
  console.log(`${episode.id}: refreshed lesson.json and lesson.md`);
}
