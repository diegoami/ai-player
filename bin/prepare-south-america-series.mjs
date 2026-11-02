import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{countries,regions}from'../src/lessons/south-america-content.mjs';

const ledgerPath='src/lessons/south-america-coverage.json';
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error('South America ledger exists; --refresh-lessons preserves production history');
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/south-america-countries/map.json','utf8'));
const native=new Set(catalog.targets.map(t=>t.name));
const B=(w,s,e,n)=>[[w,s],[e,n]];

const groups=[
 {id:'northern-countries',title:'The Northern Countries',frame:'north',initial:B(-80,-5,-53,13),
  names:['Colombia','Venezuela','Guyana','Suriname'],
  intro:'We begin in the north of South America: Colombia on the Caribbean, Venezuela beside it, and the two small Guianas on the Atlantic, Guyana and Suriname.',
  recap:['Colombia sits in the north-west with Venezuela to its east. Guyana and Suriname follow along the Atlantic, with Brazil inland behind them.',
   'Remember a navigator who never visited his namesake country, Little Venice, the land of many waters, and the 1667 peace that gave England New York.']},
 {id:'along-the-andes',title:'Along the Andes',frame:'andes',initial:B(-92,-19,-66,2),
  names:['Ecuador','Peru','Bolivia','Chile'],
  intro:'Four countries run down the Andean west of the continent: Ecuador on the equator, Peru below it, Bolivia inland, and Chile the long thin strip along the Pacific.',
  recap:['Ecuador is on the equator, Peru below it with Chile along the coast and Bolivia inland. Chile runs the whole western edge down to the far south.',
   'Remember the Galápagos and Chimborazo, the potato and Machu Picchu, the world\'s largest salt flat and highest capital, and the driest desert outside the poles.']},
 {id:'brazil-and-the-south',title:'Brazil and the Southern Countries',frame:'south',initial:B(-75,-56,-34,6),
  names:['Brazil','Paraguay','Uruguay','Argentina'],
  intro:'Finally the east and the south: Brazil filling the eastern half of the continent, with Paraguay, Uruguay and Argentina below it.',
  recap:['Brazil touches every other South American country except Chile and Ecuador. Paraguay is landlocked between Brazil and Argentina, Uruguay is on the Atlantic, and Argentina fills the far south.',
   'Remember brazilwood and Portuguese and the Amazon, two official languages and Itaipú, the first World Cup in 1930, and the silver that gave Argentina its name.']}
];

const byName=new Map(countries.map(c=>[c.name,c])),rows=[],root='rendered/south-america-three-20261102';
mkdirSync(root,{recursive:true});
const words=['one','two','three'];
for(const[i,g]of groups.entries()){
 let priorBounds;
 const states=g.names.map(name=>{
  if(!byName.has(name))throw Error(`Missing notes ${name}`);
  if(!native.has(name))throw Error(`Not a native target: ${name}`);
  const row=structuredClone(byName.get(name)),bounds=regions[row.frame];
  row.cameraBounds=bounds;
  if(JSON.stringify(bounds)!==priorBounds){row.transition=`Let's bring ${name} and its neighbours into view.`;row.gestures=[{bounds}];}
  priorBounds=JSON.stringify(bounds);
  delete row.frame;
  return row;
 });
 const lesson={title:`South America ${words[i]} of three · ${g.title}`,edition:'South America countries · Three regional lessons · John · November 2026',
  mapId:'south-america-countries',area:'South America',unit:'places',
  url:'http://localhost:5187/map/south-america-countries',manual:'http://localhost:5187/manual',
  viewport:{width:1600,height:900},initialBounds:g.initial,
  restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
  intro:[`Welcome to South America episode ${words[i]} of three. First, I clear the chosen names for a fresh regional lesson.`,g.intro],
  states,recapGestures:[{bounds:g.initial}],recap:g.recap};
 const path=`src/lessons/south-america-0${i+1}-${g.id}.json`;
 writeFileSync(path,JSON.stringify(lesson,null,2)+'\n');
 rows.push({id:g.id,title:g.title,status:'prepared',lesson:path,places:g.names,countries:g.names,
  nativeTargets:states.map(s=>s.name),relatedTargets:[],supplemental:[],video:`${root}/0${i+1}-${g.id}/geoclick/play-no-subtitles.mp4`});
}
const all=rows.flatMap(e=>e.places);
if(all.length!==12||new Set(all).size!==12)throw Error('Coverage mismatch: twelve countries exactly once');
if(catalog.targets.some(t=>!all.includes(t.name)))throw Error('Not every native South America target is taught');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:'South America · Three regional lessons · November 2026',
 status:'in-production',
 scope:'All 12 country targets of GeoClick\'s native south-america-countries map, each exactly once: the four northern countries, the four Andean western countries and the four eastern and southern countries. French Guiana is not a target of this map.',
 targetCount:12,countryCount:12,nativeTargetCount:12,nativeTeachingStopCount:12,supplementalCount:0,
 coveredPlaceCount:0,episodes:rows},null,2)+'\n');
console.log(rows.map(e=>`${e.id}: ${e.places.length} stops`).join('\n'));
