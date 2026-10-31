#!/usr/bin/env node
// Re-export an existing narrated recording without burning in captions.
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {assemble} from '../src/core/assemble.mjs';
const arg=process.argv.find(a=>a.startsWith('--dir='))?.slice(6);
if(!arg)throw Error('Usage: node bin/export-clean-video.mjs --dir=rendered/<run>/geoclick');
const dir=resolve(arg);
const trace=JSON.parse(readFileSync(join(dir,'trace.json'),'utf8'));
const result=assemble({dir,trimStart:trace.trimStart??0,trimEnd:trace.lines.at(-1).end+2,burnSubtitles:false,videoFilename:'play-no-subtitles.mp4'},trace);
console.log(result);
