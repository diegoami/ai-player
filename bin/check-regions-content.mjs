// Check a region's content module against its brief and its verified click points.
// Every target exactly once, the map's own names, the verified click point, the
// brief's camera frame, three narration lines and at least one source.
import { readFileSync } from 'node:fs';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
if (!args.map || !args.content) throw Error('Use --map=<mapId> --content=<file> [--brief=<file>] [--points=<file>]');
const brief = JSON.parse(readFileSync(args.brief ?? `rendered/regions-brief/${args.map}.json`, 'utf8'));
const points = JSON.parse(readFileSync(args.points ?? `rendered/map-points/${args.map}.json`, 'utf8')).points;
const { regions } = await import(`../${args.content}`);

const problems = [];
const seen = new Set();
for (const target of brief.targets) {
  const row = regions.find(r => r.name === target.name);
  if (!row) { problems.push(`missing: ${target.name}`); continue; }
  if (seen.has(target.name)) problems.push(`repeated: ${target.name}`);
  seen.add(target.name);
  const verified = points[target.name]?.point;
  if (!verified) problems.push(`no verified click point: ${target.name}`);
  else if (Math.abs(row.location[0] - verified[0]) > 0.0002 || Math.abs(row.location[1] - verified[1]) > 0.0002) {
    problems.push(`click point differs: ${target.name} has ${JSON.stringify(row.location)}, verified ${JSON.stringify(verified)}`);
  }
  const frame = JSON.stringify(row.frame), wanted = JSON.stringify(target.frame);
  if (frame !== wanted) problems.push(`frame differs: ${target.name} has ${frame}, brief ${wanted}`);
  if (!Array.isArray(row.lines) || row.lines.length !== 3) problems.push(`needs three lines: ${target.name}`);
  else row.lines.forEach((line, i) => { if (typeof line !== 'string' || line.trim().length < 25) problems.push(`line ${i + 1} too short: ${target.name}`); });
  if (!Array.isArray(row.sources) || !row.sources.length) problems.push(`no sources: ${target.name}`);
  else row.sources.forEach(source => { if (!/^https:\/\//.test(source)) problems.push(`source is not a URL: ${target.name}`); });
}
for (const row of regions) if (!brief.targets.some(t => t.name === row.name)) problems.push(`not a map target: ${row.name}`);
if (regions.length !== brief.targets.length) problems.push(`expected ${brief.targets.length} entries, found ${regions.length}`);

console.log(JSON.stringify({ map: args.map, entries: regions.length, targets: brief.targets.length, problems }, null, 2));
process.exit(problems.length ? 1 : 0);
