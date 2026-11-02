import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{countries}from'../src/lessons/south-america-capitals-content.mjs';

const ledgerPath='src/lessons/south-america-capitals-coverage.json';
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error('South America capitals ledger exists; --refresh-lessons preserves production history');
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/south-america-capitals/map.json','utf8'));
const native=new Set(catalog.targets.flatMap(t=>[t.name,t.names?.en].filter(Boolean)));
const B=(w,s,e,n)=>[[w,s],[e,n]];

const groups=[
 {id:'north-and-the-caribbean-coast',title:'The North and the Caribbean Coast',initial:B(-81,-8,-50,13),
  names:['Caracas','Georgetown','Paramaribo','Bogotá','Quito'],
  intro:'We begin in the north: the Andean capitals of Venezuela, Colombia and Ecuador, and the two Guianas on the Atlantic coast.',
  recap:['Caracas sits under the Ávila wall by the Caribbean, Bogotá and Quito climb high into the Andes, and Georgetown and Paramaribo are the two small colonial ports of the Guianas.',
   'Remember the city of Bolívar, the wooden cathedral of Georgetown, the wooden Dutch houses of Paramaribo, the equator capital under a volcano, and the gold of Bacatá.']},
 {id:'the-andes-and-the-gran-chaco',title:'The Andes and the Gran Chaco',initial:B(-80,-27,-54,-9),
  names:['Lima','La Paz','Sucre','Asunción'],
  intro:'Four capitals run down the Pacific and the interior: Peru on the desert coast, the two Bolivian capitals in the highlands, and Paraguay on the river.',
  recap:['Lima is the coastal city in the mist, La Paz and Sucre are the two Bolivian capitals in the Andes, and Asunción is the old river town of the Gran Chaco.',
   'Remember the City of Kings and Pizarro\'s tomb, the canyon of La Paz and its witches\' market, the four names of Sucre, and the founding of Asunción in 1537.']},
 {id:'the-south-and-brasilia',title:'The South and Brasília',initial:B(-74,-37,-44,-12),
  names:['Brasília','Santiago','Buenos Aires','Montevideo'],
  intro:'And four close the series: the new capital of Brazil in the interior, the Chilean capital under the Andes, and the two cities of the Río de la Plata.',
  recap:['Brasília stands alone in the central plateau, Santiago lies under the snow of the Andes, and Buenos Aires and Montevideo face each other across the silver river.',
   'Remember the forty-one months of Brasília, the tower of Santiago under the Andes, the pampas and Martín Fierro of Buenos Aires, and the Rambla of Montevideo.']}
];

const byName=new Map(countries.map(c=>[c.name,c])),rows=[],root='rendered/south-america-capitals-20261102';
mkdirSync(root,{recursive:true});
const words=['one','two','three'];
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
 const lesson={title:`South America capitals ${words[i]} of three · ${g.title}`,edition:'South America capitals · Three regional lessons · John · November 2026',
  mapId:'south-america-capitals',area:'South America',unit:'capitals',
  url:'http://localhost:5187/map/south-america-capitals',manual:'http://localhost:5187/manual',
  viewport:{width:1600,height:900},initialBounds:g.initial,
  restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
  intro:[`Welcome to the South America capitals, episode ${words[i]} of three. First, I clear the chosen names for a fresh regional lesson.`,g.intro],
  states,recapGestures:[{bounds:g.initial}],recap:g.recap};
 const path=`src/lessons/south-america-capitals-0${i+1}-${g.id}.json`;
 writeFileSync(path,JSON.stringify(lesson,null,2)+'\n');
 rows.push({id:g.id,title:g.title,status:'prepared',lesson:path,places:g.names,countries:g.names,
  nativeTargets:states.map(s=>s.name),relatedTargets:[],supplemental:[],video:`${root}/0${i+1}-${g.id}/geoclick/play-no-subtitles.mp4`});
}
const all=rows.flatMap(e=>e.places);
if(all.length!==13||new Set(all).size!==13)throw Error('Coverage mismatch: thirteen capitals exactly once');
const covered=t=>all.includes(t.name)||(t.names&&t.names.en&&all.includes(t.names.en));
if(catalog.targets.some(t=>!covered(t)))throw Error('Not every native South America capital target is taught');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:'South America capitals · Three regional lessons · November 2026',
 status:'in-production',
 scope:'All 13 capital targets of GeoClick\'s native south-america-capitals map, each exactly once: the capitals of the twelve South American countries the map names, with Bolivia\'s two capitals, La Paz and Sucre, both taught. Episode groups are teaching routes, not an official classification.',
 targetCount:13,countryCount:12,nativeTargetCount:13,nativeTeachingStopCount:13,supplementalCount:0,
 coveredPlaceCount:0,episodes:rows},null,2)+'\n');
console.log(rows.map(e=>`${e.id}: ${e.places.length} stops`).join('\n'));
