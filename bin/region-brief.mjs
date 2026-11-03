// One working brief per region map: the targets in the map's own tour order,
// their click points, the camera frame each region should be framed on, and
// the map's own curated fact cards. The brief is what the narration is
// written against; the frame formula lives here so every country frames its
// regions the same way.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')));
if (!args.map) throw Error('Use --map=<mapId> [--country=<name>] [--out=<file>]');
const base = '../Geoclick2027/data/maps';
const catalog = JSON.parse(readFileSync(`${base}/${args.map}/map.json`, 'utf8'));
const facts = JSON.parse(readFileSync(`${base}/${args.map}/facts.json`, 'utf8'));
const tour = JSON.parse(readFileSync(`${base}/${args.map}/tour.json`, 'utf8'));
const nameById = new Map(catalog.targets.map(t => [t.id, t.name]));
const order = tour.steps.map(s => nameById.get(s.targetId)).filter(Boolean);
const ordered = order.length === catalog.targets.length ? order : catalog.targets.map(t => t.name);

// A region is framed on its own extent, expanded by a quarter and capped, so
// the video shows the whole region in its surroundings.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const frameFor = bbox => {
  const [w, s, e, n] = bbox, bw = e - w, bh = n - s;
  const fw = clamp(bw * 1.25, 1.6, 4.5), fh = clamp(bh * 1.25, 1.2, 3.5);
  const cx = (w + e) / 2, cy = (s + n) / 2;
  return [[Number((cx - fw / 2).toFixed(3)), Number((cy - fh / 2).toFixed(3))],
          [Number((cx + fw / 2).toFixed(3)), Number((cy + fh / 2).toFixed(3))]];
};

const targets = ordered.map(name => {
  const t = catalog.targets.find(x => x.name === name);
  const card = facts[t.id] ?? {};
  const frame = frameFor(t.bbox);
  return {
    name,
    id: t.id,
    location: t.centroid,
    bbox: t.bbox,
    frame,
    frameHoldsClick: frame[0][0] <= t.centroid[0] && t.centroid[0] <= frame[1][0] &&
                     frame[0][1] <= t.centroid[1] && t.centroid[1] <= frame[1][1],
    mapType: card.type ?? null,
    position: card.position ?? null,
    coastal: card.coastal ?? null,
    largestCity: card.largestCity?.name ?? null,
    borders: card.borders ?? [],
    cardHooks: card.hooks?.en ?? []
  };
});

// Flag the pairs whose markers would sit close together inside one frame.
const collisions = [];
for (let i = 0; i < targets.length; i++) {
  for (let j = i + 1; j < targets.length; j++) {
    const a = targets[i], b = targets[j];
    const [lon1, lat1] = a.location, [lon2, lat2] = b.location;
    const wide = Math.max(a.frame[1][0] - a.frame[0][0], b.frame[1][0] - b.frame[0][0]);
    const pixelsPerDegree = 1490 / wide;
    const distance = Math.hypot((lon1 - lon2) * pixelsPerDegree, (lat1 - lat2) * pixelsPerDegree);
    if (distance < 120) collisions.push({ a: a.name, b: b.name, pixels: Math.round(distance) });
  }
}

const brief = {
  map: args.map,
  country: args.country ?? catalog.country ?? args.map,
  targetCount: targets.length,
  targets,
  collisions
};
const out = args.out ?? resolve(`rendered/regions-brief/${args.map}.json`);
mkdirSync(resolve('rendered/regions-brief'), { recursive: true });
writeFileSync(out, JSON.stringify(brief, null, 2) + '\n');
console.log(`${args.map}: ${targets.length} targets, ${collisions.length} close pairs -> ${out}`);
for (const c of collisions) console.log(`  close: ${c.a} / ${c.b} (${c.pixels}px)`);
