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
const tourNames=order.length===regions.length?order:regions.map(r=>r.name);
if(tourNames.length!==regions.length||new Set(tourNames).size!==tourNames.length)throw Error('Tour and content disagree on the region list');

// A country is one lesson unless the config groups it, in which case each
// group is one lesson and the group keeps the tour order within itself.
const groups=country.groups?.length
  ? country.groups.map(g=>({...g,names:tourNames.filter(n=>g.names.includes(n))}))
  : [{id:'regions',title:country.title,names:tourNames}];
for(const g of groups){
 const missing=g.names.length?[]:['(empty group)'];
 if(g.names.length!==g.requested?.length&&g.requested)missing.push(...g.requested.filter(n=>!g.names.includes(n)));
 if(missing.length)throw Error(`${country.id} group ${g.id}: unknown or missing regions: ${missing.join(', ')}`);
}

const episodes=[],lessons=[];
for(const g of groups){
 let priorBounds;
 const states=g.names.map(name=>{
  if(!byName.has(name))throw Error(`Missing notes ${name}`);
  if(!native.has(name))throw Error(`Not a native target: ${name}`);
  const row=structuredClone(byName.get(name)),bounds=row.frame;
  row.cameraBounds=bounds;
  if(JSON.stringify(bounds)!==priorBounds){row.transition=`Let's bring ${name} into view.`;row.gestures=[{bounds}];}
  priorBounds=JSON.stringify(bounds);
  delete row.frame;
  return row;
 });
 const west=Math.min(...states.map(s=>s.location[0])),east=Math.max(...states.map(s=>s.location[0]));
 const south=Math.min(...states.map(s=>s.location[1])),north=Math.max(...states.map(s=>s.location[1]));
 const initial=[[Number((west-1.2).toFixed(2)),Number((south-1.0).toFixed(2))],[Number((east+1.2).toFixed(2)),Number((north+1.0).toFixed(2))]];
 const number=groups.length>1?`${groups.indexOf(g)+1} of ${groups.length}`:'1 of 1';
 const lesson={
  title:groups.length>1?`${country.title} · ${g.title} · GeoClick Geography`:`${country.title} · GeoClick Geography`,edition:config.edition,
  mapId:country.mapId,area:country.country,unit:'regions',
  url:`http://localhost:5187/map/${country.mapId}`,manual:'http://localhost:5187/manual',
  viewport:{width:1600,height:900},initialBounds:initial,
  restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
  intro:[`Welcome to ${country.title}, part ${number}. First, I clear the chosen names for a fresh regional lesson.`,
   `We work through ${g.names.length} of the ${country.country} regions the map names, once each: where it sits, one fact worth keeping, and a hook to remember it by.`],
  states,recapGestures:[{bounds:initial}],
  recap:[`${g.names.length} regions of ${country.country}, one for each target of the map: ${g.names.slice(0,-1).join(', ')} and ${g.names[g.names.length-1]}.`,
   `Remember the shape of ${country.country} from the inside: the regions nest around each other, and every name on the map belongs somewhere in this one country.`]};
 const lessonPath=groups.length>1?`src/lessons/${country.id}-${g.id}-lesson.json`:`src/lessons/${country.id}-lesson.json`;
 writeFileSync(lessonPath,JSON.stringify(lesson,null,2)+'\n');
 lessons.push(lessonPath);
 episodes.push({id:`${country.id}-${g.id}`,title:g.title,status:'prepared',lesson:lessonPath,
  places:states.map(s=>s.name),countries:states.map(s=>s.name),nativeTargets:states.map(s=>s.name),
  relatedTargets:[],supplemental:[],video:groups.length>1
   ? `${root}/${String(groups.indexOf(g)+1).padStart(2,'0')}-${g.id}/geoclick/play-no-subtitles.mp4`
   : `${root}/geoclick/play-no-subtitles.mp4`});
}

const covered=episodes.flatMap(e=>e.places);
if(covered.length!==catalog.targets.length||new Set(covered).size!==covered.length)throw Error('Coverage mismatch: every native target exactly once');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:`${country.country} · ${config.edition}`,
 status:'in-production',
 scope:`All ${covered.length} region targets of GeoClick's native ${country.mapId} map, each exactly once. Episode groups are teaching routes, not an official classification, and map targets do not settle political status or boundaries.`,
 targetCount:covered.length,countryCount:1,nativeTargetCount:covered.length,nativeTeachingStopCount:covered.length,supplementalCount:0,
 coveredPlaceCount:0,episodes},null,2)+'\n');
console.log(episodes.map(e=>`${e.id}: ${e.places.length} regions -> ${e.lesson}`).join('\n'));
