import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{countries,regions}from'../src/lessons/north-america-content.mjs';

const ledgerPath='src/lessons/north-america-coverage.json';
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error('North America ledger exists; --refresh-lessons preserves production history');
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/north-america-countries/map.json','utf8'));
const native=new Set(catalog.targets.map(t=>t.name));
const B=(w,s,e,n)=>[[w,s],[e,n]];

const groups=[
 {id:'canada-united-states',title:'Canada and the United States',frame:'north',
  initial:B(-141,25,-53,84),
  names:['Canada','United States'],
  intro:'We begin with the two countries that fill the north and the middle of the continent: Canada above, and the United States below it.',
  recap:['Canada lies north of the United States and shares its only land border with it. Canada is the northern shield with the longest coastline in the world; the United States is the middle band between Canada and Mexico.',
   'Remember a village name that became a whole country, and more lakes than the rest of the world, in the north. Remember Vespucci, Yellowstone and two states added in 1959, in the middle.']},
 {id:'mexico-central-america',title:'Mexico and Central America',frame:'central',
  initial:B(-118,7,-76,33),
  names:['Mexico','Belize','Guatemala','Honduras','El Salvador','Nicaragua','Costa Rica','Panama'],
  intro:'Eight countries run down the southern neck of the continent: Mexico first, then the Central American chain from Belize on the Caribbean to Panama on the Pacific.',
  recap:['Mexico is the large country at the north of the chain. Belize, Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica and Panama follow southward, most of them narrow and touching both seas.',
   'Remember maize and chocolate, a language that came from a village, a blue hole, Tikal, Copán, the Pacific sliver, bull sharks, a country without an army, and the canal that joins two oceans.']},
 {id:'caribbean',title:'The Caribbean',frame:'caribbean',
  initial:B(-85,9,-60,28),
  names:['The Bahamas','Cuba','Haiti','Dominican Republic','Jamaica','Trinidad and Tobago'],
  intro:'Six island countries finish our North America route, across the Bahamas, Cuba, the two halves of Hispaniola, Jamaica and the islands off Venezuela.',
  recap:['The Bahamas lie north of Cuba. Cuba is the long big island; Haiti and the Dominican Republic share Hispaniola to its east; Jamaica sits south of Cuba; Trinidad and Tobago lie off the coast of Venezuela.',
   'Remember shallow banks and swimming pigs, an island Columbus thought was Asia, the first state founded by former slaves, the oldest European city still standing in the Americas, reggae, and steelpan drums.']}
];

const byName=new Map(countries.map(c=>[c.name,c])),rows=[],root='rendered/north-america-three-20261102';
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
 const lesson={title:`North America ${words[i]} of three · ${g.title}`,edition:'North America countries · Three regional lessons · John · November 2026',
  mapId:'north-america-countries',area:'North America',unit:'places',
  url:'http://localhost:5187/map/north-america-countries',manual:'http://localhost:5187/manual',
  viewport:{width:1600,height:900},initialBounds:g.initial,
  restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
  intro:[`Welcome to North America episode ${words[i]} of three. First, I clear the chosen names for a fresh regional lesson.`,g.intro],
  states,recapGestures:[{bounds:g.initial}],recap:g.recap};
 const path=`src/lessons/north-america-0${i+1}-${g.id}.json`;
 writeFileSync(path,JSON.stringify(lesson,null,2)+'\n');
 rows.push({id:g.id,title:g.title,status:'prepared',lesson:path,places:g.names,countries:g.names,
  nativeTargets:states.map(s=>s.name),relatedTargets:[],supplemental:[],video:`${root}/0${i+1}-${g.id}/geoclick/play-no-subtitles.mp4`});
}
const all=rows.flatMap(e=>e.places);
if(all.length!==16||new Set(all).size!==16)throw Error('Coverage mismatch: sixteen countries exactly once');
if(catalog.targets.some(t=>!all.includes(t.name)))throw Error('Not every native North America target is taught');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:'North America · Three regional lessons · November 2026',
 status:'in-production',
 scope:'All 16 country targets of GeoClick\'s native north-america-countries map: Canada, the United States, Mexico, seven Central American countries and six Caribbean countries, each exactly once. Greenland is not part of this map.',
 targetCount:16,countryCount:16,nativeTargetCount:16,nativeTeachingStopCount:16,supplementalCount:0,
 coveredPlaceCount:0,episodes:rows},null,2)+'\n');
console.log(rows.map(e=>`${e.id}: ${e.places.length} stops`).join('\n'));
