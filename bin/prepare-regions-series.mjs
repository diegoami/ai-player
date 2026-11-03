import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{resolve}from'node:path';

const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const config=JSON.parse(readFileSync('src/lessons/regions-series.json','utf8'));
const country=config.countries.find(c=>c.id===(args.country??config.countries[0].id));
if(!country)throw Error(`Unknown country ${args.country}; known: ${config.countries.map(c=>c.id).join(', ')}`);
const ledgerPath=`src/lessons/${country.id}-coverage.json`;
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error(`${country.id} ledger exists; --refresh-lessons preserves production history`);

const{regions}=await import(`../${country.content}`);
const catalog=JSON.parse(readFileSync(`../Geoclick2027/data/maps/${country.mapId}/map.json`,'utf8'));
const native=new Set(catalog.targets.flatMap(t=>[t.name,t.names?.en].filter(Boolean)));
const byName=new Map(regions.map(r=>[r.name,r])),root=country.root;
mkdirSync(root,{recursive:true});

// The tour is the map's own teaching order; the lesson follows it.
const tour=JSON.parse(readFileSync(`../Geoclick2027/data/maps/${country.mapId}/tour.json`,'utf8'));
const order=tour.steps.map(step=>catalog.targets.find(t=>t.id===step.targetId)?.name).filter(Boolean);
const names=order.length===regions.length?order:regions.map(r=>r.name);
if(names.length!==regions.length||new Set(names).size!==names.length)throw Error('Tour and content disagree on the region list');

let priorBounds;
const states=names.map(name=>{
 if(!byName.has(name))throw Error(`Missing notes ${name}`);
 if(!native.has(name))throw Error(`Not a native target: ${name}`);
 const row=structuredClone(byName.get(name)),bounds=row.frame;
 row.cameraBounds=bounds;
 if(JSON.stringify(bounds)!==priorBounds){row.transition=`Let's bring ${name} into view.`;row.gestures=[{bounds}];}
 priorBounds=JSON.stringify(bounds);
 delete row.frame;
 return row;
});

// The opening view frames the whole country.
const west=Math.min(...catalog.targets.map(t=>t.centroid[0])),east=Math.max(...catalog.targets.map(t=>t.centroid[0]));
const south=Math.min(...catalog.targets.map(t=>t.centroid[1])),north=Math.max(...catalog.targets.map(t=>t.centroid[1]));
const initial=[[Math.round(west-1.2),Math.round(south-1.0)],[Math.round(east+1.2),Math.round(north+1.0)]];
const lesson={
 title:`${country.title} · GeoClick Geography`,edition:config.edition,
 mapId:country.mapId,area:country.country,unit:'regions',
 url:`http://localhost:5187/map/${country.mapId}`,manual:'http://localhost:5187/manual',
 viewport:{width:1600,height:900},initialBounds:initial,
 restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
 intro:[`Welcome to ${country.title}. First, I clear the chosen names for a fresh regional lesson.`,
  `We work through every region of ${country.country} the map names, once each: where it sits, one fact worth keeping, and a hook to remember it by.`],
 states,recapGestures:[{bounds:initial}],
 recap:[`${names.length} regions, one for each target of the map: ${names.slice(0,-1).join(', ')} and ${names[names.length-1]}.`,
  `Remember the shape of ${country.country} from the inside: the regions nest around each other, and every name on the map belongs somewhere in this one country.`]};
const lessonPath=`src/lessons/${country.id}-lesson.json`;
writeFileSync(lessonPath,JSON.stringify(lesson,null,2)+'\n');

const covered=states.map(s=>s.name);
if(covered.length!==catalog.targets.length||new Set(covered).size!==covered.length)throw Error('Coverage mismatch: every native target exactly once');
const episode={id:country.id,title:country.title,status:'prepared',lesson:lessonPath,places:covered,countries:covered,
 nativeTargets:covered,relatedTargets:[],supplemental:[],video:`${root}/geoclick/play-no-subtitles.mp4`};
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:`${country.country} · ${config.edition}`,
 status:'in-production',
 scope:`All ${covered.length} region targets of GeoClick's native ${country.mapId} map, each exactly once. Episode groups are teaching routes, not an official classification, and map targets do not settle political status or boundaries.`,
 targetCount:covered.length,countryCount:1,nativeTargetCount:covered.length,nativeTeachingStopCount:covered.length,supplementalCount:0,
 coveredPlaceCount:0,episodes:[episode]},null,2)+'\n');
console.log(`${country.id}: ${covered.length} regions -> ${lessonPath}`);
