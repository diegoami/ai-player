import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{countries}from'../src/lessons/oceania-capitals-content.mjs';

const ledgerPath='src/lessons/oceania-capitals-coverage.json';
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error('Oceania capitals ledger exists; --refresh-lessons preserves production history');
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/oceania-capitals/map.json','utf8'));
const native=new Set(catalog.targets.flatMap(t=>[t.name,t.names?.en].filter(Boolean)));
const B=(w,s,e,n)=>[[w,s],[e,n]];

const groups=[
 {id:'palau-pohnpei-and-the-marshalls',title:'Palau, Pohnpei and the Marshalls',initial:B(133,5,173,9.5),
  names:['Ngerulmud','Palikir','Majuro'],
  intro:'We begin in the western Pacific, on three small island states: Palau, the Caroline Islands and the Marshall Islands.',
  recap:['Ngerulmud sits on Babeldaob, Palikir on Pohnpei, and Majuro on an atoll ring in the Marshalls.',
   'Remember Washington\'s little copy on Babeldaob, the stone city of Nan Madol beside Palikir, and the sixty islets and one long road of Majuro.']},
 {id:'kiribati-and-tuvalu',title:'Kiribati and Tuvalu',initial:B(171,-10.5,179.9,3),
  names:['Tarawa','Funafuti'],
  intro:'Two atoll capitals in the middle of the Pacific, each a ring of land a few metres above the sea.',
  recap:['Tarawa lies just north of the equator and Funafuti just south of it, each the seat of a country spread over a huge area of ocean.',
   'Remember the only country in all four hemispheres, and the airstrip that doubles as a football pitch.']},
 {id:'the-melanesian-capitals',title:'The Melanesian capitals',initial:B(145,-19.5,170,-8),
  names:['Honiara','Port Moresby','Port Vila'],
  intro:'Three capitals of the larger Melanesian states: the Solomon Islands, Papua New Guinea and Vanuatu.',
  recap:['Honiara stands on Guadalcanal in the north, Port Moresby on the Coral Sea in the west, and Port Vila on Efate in the south-east.',
   'Remember the wartime airstrip that became a capital, the Coral Sea city named by an admiral\'s son, and the Anglo-French capital that Cyclone Pam broke.']},
 {id:'fiji-australia-and-new-zealand',title:'Fiji, Australia and New Zealand',initial:B(147,-42.5,179.9,-17),
  names:['Suva','Canberra','Wellington'],
  intro:'And three close the series: Fiji, and the two great southern states of Australia and New Zealand.',
  recap:['Suva stands on a peninsula of Viti Levu in the north of the group, Canberra inland between Sydney and Melbourne, and Wellington at the southern tip of the North Island.',
   'Remember the university that serves a twelfth of the Pacific, the compromise capital laid out in geometric axes, and the windiest and southernmost of the capitals.']}
];

const byName=new Map(countries.map(c=>[c.name,c])),rows=[],root='rendered/oceania-capitals-20261102';
mkdirSync(root,{recursive:true});
const words=['one','two','three','four'];
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
 const lesson={title:`Oceania capitals ${words[i]} of four · ${g.title}`,edition:'Oceania capitals · Four regional lessons · John · November 2026',
  mapId:'oceania-capitals',area:'Oceania',unit:'capitals',
  url:'http://localhost:5187/map/oceania-capitals',manual:'http://localhost:5187/manual',
  viewport:{width:1600,height:900},initialBounds:g.initial,
  restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
  intro:[`Welcome to the Oceania capitals, episode ${words[i]} of four. First, I clear the chosen names for a fresh regional lesson.`,g.intro],
  states,recapGestures:[{bounds:g.initial}],recap:g.recap};
 const path=`src/lessons/oceania-capitals-0${i+1}-${g.id}.json`;
 writeFileSync(path,JSON.stringify(lesson,null,2)+'\n');
 rows.push({id:g.id,title:g.title,status:'prepared',lesson:path,places:g.names,countries:g.names,
  nativeTargets:states.map(s=>s.name),relatedTargets:[],supplemental:[],video:`${root}/0${i+1}-${g.id}/geoclick/play-no-subtitles.mp4`});
}
const all=rows.flatMap(e=>e.places);
if(all.length!==11||new Set(all).size!==11)throw Error('Coverage mismatch: eleven capitals exactly once');
const covered=t=>all.includes(t.name)||(t.names&&t.names.en&&all.includes(t.names.en));
if(catalog.targets.some(t=>!covered(t)))throw Error('Not every native Oceania capital target is taught');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:'Oceania capitals · Four regional lessons · November 2026',
 status:'in-production',
 scope:'All 11 capital targets of GeoClick\'s native oceania-capitals map, each exactly once: the capitals of the Pacific island states and of Australia and New Zealand that the map names. Episode groups are teaching routes, not an official classification, and map targets do not settle political status or boundaries.',
 targetCount:11,countryCount:11,nativeTargetCount:11,nativeTeachingStopCount:11,supplementalCount:0,
 coveredPlaceCount:0,episodes:rows},null,2)+'\n');
console.log(rows.map(e=>`${e.id}: ${e.places.length} stops`).join('\n'));
