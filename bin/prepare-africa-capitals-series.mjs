import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{countries}from'../src/lessons/africa-capitals-content.mjs';

const ledgerPath='src/lessons/africa-capitals-coverage.json';
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error('Africa capitals ledger exists; --refresh-lessons preserves production history');
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/africa-capitals/map.json','utf8'));
const native=new Set(catalog.targets.flatMap(t=>[t.name,t.names?.en].filter(Boolean)));
const B=(w,s,e,n)=>[[w,s],[e,n]];

const groups=[
 {id:'north-africa-and-the-sahara',title:'North Africa and the Sahara',initial:B(-25,13,35,38),
  names:['Tunis','Algiers','Rabat','Tripoli','Cairo','Nouakchott','Khartoum','Praia'],
  intro:'We begin along the northern shore of Africa, where the Mediterranean meets the Sahara, and we end out in the Atlantic islands.',
  recap:['Tunis faces Carthage across its lake, Algiers steps down to its harbour, Rabat keeps the kasbah at the strait, and Tripoli holds the red castle above the Libyan shore.',
   'Remember Cairo at the head of the Nile delta, the shore capital of the Sahara at Nouakchott, the capital between two Niles at Khartoum, and the island capital of Praia on Santiago.']},
 {id:'the-sahel-and-the-gulf-of-guinea',title:'The Sahel and the Gulf of Guinea',initial:B(-19,4,3,16),
  names:['Dakar','Banjul','Bissau','Conakry','Freetown','Monrovia','Yamoussoukro','Accra','Lomé'],
  intro:'Now the western coast, where the Sahel meets the Gulf of Guinea and the Atlantic trade has left its marks.',
  recap:['Dakar stands on the far western peninsula, Banjul on an island in the river mouth, and Bissau below Senegal on the turtle islands.',
   'Remember “beyond the waters” at Conakry, the freed-people settlement at Freetown, the American cape at Monrovia, the inland basilica at Yamoussoukro, the fort coast at Accra and the beachfront arch at Lomé.']},
 {id:'the-sahel-interior-and-the-gulf-states',title:'The Sahel interior and the Gulf states',initial:B(-10,-1,17,15),
  names:['Porto-Novo','Abuja','Niamey','Ouagadougou','Bamako','N\'Djamena','Yaoundé','Malabo','Libreville'],
  intro:'This episode runs inland from the Gulf of Guinea across the Sahel, and then out again to the island and the equatorial coast.',
  recap:['Porto-Novo keeps the old royal capital of Dahomey, Abuja sits on its rock in the middle of Nigeria, Niamey on the Niger River, Ouagadougou in the middle of Burkina Faso and Bamako on the river below it.',
   'Remember the resting place by the Chari at N\'Djamena, the forest capital with the reunification monument at Yaoundé, the island capital under a volcano at Malabo, and “liberty” at the Ogooué mouth in Libreville.']},
 {id:'the-horn-and-the-great-lakes',title:'The Horn and the Great Lakes',initial:B(27,-8,48,17),
  names:['Djibouti','Asmara','Addis Ababa','Mogadishu','Hargeisa','Kampala','Nairobi','Kigali','Gitega','Dodoma'],
  intro:'We turn to the Horn of Africa at the Red Sea, then inland to the great lakes of the equator.',
  recap:['Djibouti guards the strait where the railway from inland Ethiopia reaches the sea, Asmara keeps its modernist highland buildings, Addis Ababa holds Lucy’s country, and Mogadishu faces the Indian Ocean.',
   'Remember the two Somali capitals, Hargeisa inland in the north and Mogadishu on the ocean in the south, then the royal tombs above Lake Victoria at Kampala, the railway capital and its park at Nairobi, the green hills at Kigali, the inland centre at Gitega and the middle-of-Tanzania capital at Dodoma.']},
 {id:'central-africa-and-the-zambezi',title:'Central Africa and the Zambezi',initial:B(11,-28,36,7),
  names:['Bangui','Brazzaville','Kinshasa','Luanda','Lilongwe','Lusaka','Harare','Maputo'],
  intro:'From the middle of the continent we follow the Congo down to the Atlantic, and then the Zambezi basin to the Indian Ocean.',
  recap:['Bangui stands at the top of the Congo Basin, Brazzaville on the right bank of the Congo River and Kinshasa opposite it on the left.',
   'Remember the Portuguese harbour at Luanda with its fort above, the planned inland capital at Lilongwe, the middle of Zambia at Lusaka, the renamed highveld capital at Harare, and the natural harbour with the only natural lighthouse in the world at Maputo.']},
 {id:'southern-africa-and-the-indian-ocean-islands',title:'Southern Africa and the Indian Ocean islands',initial:B(4,-35,49,2),
  names:['Windhoek','Gaborone','Pretoria','Bloemfontein','Cape Town','Mbabane','Maseru','Antananarivo','Moroni','São Tomé'],
  intro:'The last episode closes the series in the far south, with the three South African capitals, the two small inland countries, and the islands of the western Indian Ocean.',
  recap:['Windhoek keeps the hot springs in its highland basin, Gaborone was chosen because it lay inside Botswana rather than on its border, and South Africa shows three capitals at once: Pretoria to administer, Bloemfontein to judge, Cape Town to legislate under Table Mountain.',
   'Remember the highveld capital of eSwatini at Mbabane, the country inside a country at Maseru, the highland capital of Madagascar at Antananarivo, the volcano island at Moroni, and the equatorial island capital at São Tomé.']}
];

const byName=new Map(countries.map(c=>[c.name,c])),rows=[],root='rendered/africa-capitals-20261103';
mkdirSync(root,{recursive:true});
const words=['one','two','three','four','five','six'];
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
 const lesson={title:`Africa capitals ${words[i]} of six · ${g.title}`,edition:'Africa capitals · Six regional lessons · John · November 2026',
  mapId:'africa-capitals',area:'Africa',unit:'capitals',
  url:'http://localhost:5187/map/africa-capitals',manual:'http://localhost:5187/manual',
  viewport:{width:1600,height:900},initialBounds:g.initial,
  restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
  intro:[`Welcome to the Africa capitals, episode ${words[i]} of six. First, I clear the chosen names for a fresh regional lesson.`,g.intro],
  states,recapGestures:[{bounds:g.initial}],recap:g.recap};
 const path=`src/lessons/africa-capitals-0${i+1}-${g.id}.json`;
 writeFileSync(path,JSON.stringify(lesson,null,2)+'\n');
 rows.push({id:g.id,title:g.title,status:'prepared',lesson:path,places:g.names,countries:g.names,
  nativeTargets:states.map(s=>s.name),relatedTargets:[],supplemental:[],video:`${root}/0${i+1}-${g.id}/geoclick/play-no-subtitles.mp4`});
}
const all=rows.flatMap(e=>e.places);
if(all.length!==54||new Set(all).size!==54)throw Error('Coverage mismatch: fifty-four capitals exactly once');
const covered=t=>all.includes(t.name)||(t.names&&t.names.en&&all.includes(t.names.en));
if(catalog.targets.some(t=>!covered(t)))throw Error('Not every native Africa capital target is taught');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:'Africa capitals · Six regional lessons · November 2026',
 status:'in-production',
 scope:'All 54 capital targets of GeoClick\'s native africa-capitals map, each exactly once: the capitals of the African countries the map names, with South Africa\'s three capitals all taught and Hargeisa taught as the capital of Somaliland alongside Mogadishu as the capital of Somalia. Episode groups are teaching routes, not an official classification, and map targets do not settle political status or boundaries.',
 targetCount:54,countryCount:54,nativeTargetCount:54,nativeTeachingStopCount:54,supplementalCount:0,
 coveredPlaceCount:0,episodes:rows},null,2)+'\n');
console.log(rows.map(e=>`${e.id}: ${e.places.length} stops`).join('\n'));
