import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{countries}from'../src/lessons/north-america-capitals-content.mjs';

const ledgerPath='src/lessons/north-america-capitals-coverage.json';
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error('North America capitals ledger exists; --refresh-lessons preserves production history');
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/north-america-capitals/map.json','utf8'));
const native=new Set(catalog.targets.flatMap(t=>[t.name,t.names?.en].filter(Boolean)));
const B=(w,s,e,n)=>[[w,s],[e,n]];

const groups=[
 {id:'canada-the-united-states-and-mexico',title:'Canada, the United States and Mexico',initial:B(-100,18,-70,47),
  names:['Ottawa','Washington, D.C.','Mexico City'],
  intro:'We begin with the three great capitals of the north: Ottawa and Washington, and then Mexico City, far to the south of them.',
  recap:['Ottawa sits on the Ottawa river in Ontario, Washington on the Potomac, and Mexico City in its high valley of volcanoes, two thousand kilometres to the south.',
   'Remember the trade-route capital chosen for its distance from the American border, the capital that belongs to no state, and the sinking city built on a drained lake.']},
 {id:'central-america-and-belize',title:'Central America and Belize',initial:B(-93,7,-78,19),
  names:['Belmopan','Guatemala City','Tegucigalpa','San Salvador','Managua','San José','Panama City'],
  intro:'Seven capitals run down the narrow land between Mexico and Colombia, with Belize on its Caribbean shore.',
  recap:['Belmopan and Guatemala City sit in the north of the isthmus, Tegucigalpa, San Salvador and Managua in the middle, and San José and Panama City at the narrow southern end.',
   'Remember the hurricane-proof capital shaped like a Maya temple, the capital that replaced a ruined Antigua, the two-city capital with Comayagüela, the Valley of the Hammocks, the compromise between León and Granada, the coffee-tax theatre and the first Pacific city of the Americas.']},
 {id:'cuba-hispaniola-and-jamaica',title:'Cuba, Hispaniola and Jamaica',initial:B(-84,17,-68,25),
  names:['Havana','Kingston','Port-au-Prince','Santo Domingo'],
  intro:'Four capitals of the great Caribbean islands: Cuba, Jamaica and the two halves of Hispaniola.',
  recap:['Havana stands on the bay in the west, Kingston on the south coast of Jamaica, and Port-au-Prince and Santo Domingo share Hispaniola between them.',
   'Remember the walled city and the Malecón, the harbour that rose when the earthquake sank Port Royal, the ship-named capital rebuilt after 2010, and the oldest cathedral in the Americas.']},
 {id:'the-bahamas-and-the-leewards',title:'The Bahamas and the Leeward Islands',initial:B(-79,13,-59,27),
  names:['Nassau','Basseterre','Saint John\'s','Roseau','Castries'],
  intro:'Five capitals of the smaller islands: the Bahamas, then the Leeward chain of Saint Kitts, Antigua, Dominica and Saint Lucia.',
  recap:['Nassau stands alone on New Providence in the north, and the four island capitals step south along the Leewards: Basseterre, Saint John\'s, Roseau and Castries.',
   'Remember the pirates\' republic, the low land with its Piccadilly roundabout, the harbour above Nelson\'s Dockyard, the town of reeds and the harbour of the Nobel poet.']},
 {id:'the-windwards-and-trinidad',title:'The Windwards and Trinidad',initial:B(-63,9,-58,15),
  names:['Saint George\'s','Kingstown','Bridgetown','Port-of-Spain'],
  intro:'And four close the series: the Windward islands and Barbados, and the great island of Trinidad at their foot.',
  recap:['Saint George\'s and Kingstown stand on the Grenadines and Saint Vincent, Bridgetown on the Atlantic side of Barbados, and Port-of-Spain on the Gulf of Paria.',
   'Remember the horseshoe harbour, the city of arches with the oldest botanic garden in the Americas, the Parliament that has met since 1639, and the carnival capital with a savannah roundabout.']}
];

const byName=new Map(countries.map(c=>[c.name,c])),rows=[],root='rendered/north-america-capitals-20261102';
mkdirSync(root,{recursive:true});
const words=['one','two','three','four','five'];
for(const[i,g]of groups.entries()){
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
 const lesson={title:`North America capitals ${words[i]} of five · ${g.title}`,edition:'North America capitals · Five regional lessons · John · November 2026',
  mapId:'north-america-capitals',area:'North America',unit:'capitals',
  url:'http://localhost:5187/map/north-america-capitals',manual:'http://localhost:5187/manual',
  viewport:{width:1600,height:900},initialBounds:g.initial,
  restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
  intro:[`Welcome to the North America capitals, episode ${words[i]} of five. First, I clear the chosen names for a fresh regional lesson.`,g.intro],
  states,recapGestures:[{bounds:g.initial}],recap:g.recap};
 const path=`src/lessons/north-america-capitals-0${i+1}-${g.id}.json`;
 writeFileSync(path,JSON.stringify(lesson,null,2)+'\n');
 rows.push({id:g.id,title:g.title,status:'prepared',lesson:path,places:g.names,countries:g.names,
  nativeTargets:states.map(s=>s.name),relatedTargets:[],supplemental:[],video:`${root}/0${i+1}-${g.id}/geoclick/play-no-subtitles.mp4`});
}
const all=rows.flatMap(e=>e.places);
if(all.length!==23||new Set(all).size!==23)throw Error('Coverage mismatch: twenty-three capitals exactly once');
const covered=t=>all.includes(t.name)||(t.names&&t.names.en&&all.includes(t.names.en));
if(catalog.targets.some(t=>!covered(t)))throw Error('Not every native North America capital target is taught');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:'North America capitals · Five regional lessons · November 2026',
 status:'in-production',
 scope:'All 23 capital targets of GeoClick\'s native north-america-capitals map, each exactly once: the capitals of the countries of Canada, the United States, Mexico, Central America and the Caribbean that the map names. The fact card shows the English display name, so Mexico City is taught as Mexico City. Episode groups are teaching routes, not an official classification.',
 targetCount:23,countryCount:23,nativeTargetCount:23,nativeTeachingStopCount:23,supplementalCount:0,
 coveredPlaceCount:0,episodes:rows},null,2)+'\n');
console.log(rows.map(e=>`${e.id}: ${e.places.length} stops`).join('\n'));
