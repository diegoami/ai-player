import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{countries}from'../src/lessons/asia-capitals-content.mjs';

const ledgerPath='src/lessons/asia-capitals-coverage.json';
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error('Asia capitals ledger exists; --refresh-lessons preserves production history');
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/asia-capitals/map.json','utf8'));
const native=new Set(catalog.targets.flatMap(t=>[t.name,t.names?.en].filter(Boolean)));
const B=(w,s,e,n)=>[[w,s],[e,n]];

const groups=[
 {id:'central-asia-and-caucasus',title:'Central Asia and the Caucasus',initial:B(44,32,114,58),
  names:['Astana','Ulaanbaatar','Bishkek','Tashkent','Dushanbe','Ashgabat','Tbilisi','Baku','Yerevan'],
  intro:'Nine capitals run from the steppes of Central Asia to the Caucasus: Astana, Ulaanbaatar, Bishkek, Tashkent, Dushanbe and Ashgabat, then Tbilisi, Baku and Yerevan.',
  recap:['Astana and Ulaanbaatar are the two great steppe capitals, with Bishkek, Tashkent, Dushanbe and Ashgabat between them. Tbilisi, Baku and Yerevan close the group in the Caucasus.',
   'Remember the capital renamed four times, the Red Hero of the cold, the stone city rebuilt after its earthquake, the Monday market town, the city of love, the warm spring, the lowest capital on Earth, and the pink city founded before Rome.']},
 {id:'east-asia',title:'East Asia',initial:B(110,22,146,46),
  names:['Beijing','Pyongyang','Seoul','Tokyo','Taipei'],
  intro:'Five capitals of East Asia: the northern and southern Korean states, the two great East Asian powers, and Taipei in the north of Taiwan.',
  recap:['Beijing is the northern capital of China, Pyongyang the flat-land capital of North Korea, Seoul the capital of South Korea, Tokyo the eastern capital of Japan, and Taipei the north of Taiwan.',
   'Remember the Forbidden City closed for five hundred years, the Juche Tower, the city whose name simply means capital, Edo the largest city in the world by 1720, and the night markets of Taipei.']},
 {id:'south-asia',title:'South Asia',initial:B(60,5,92,37),
  names:['New Delhi','Islamabad','Kabul','Kathmandu','Thimphu','Dhaka','Colombo'],
  intro:'Seven capitals of South Asia: the two planned capitals of the north, the Hindu Kush, the Himalaya, the Bengal delta and the island of Sri Lanka.',
  recap:['New Delhi and Islamabad are the twentieth-century planned capitals, with Kabul in the Hindu Kush between them. Kathmandu and Thimphu are the Himalayan valleys, Dhaka the delta, and Colombo the ocean port.',
   'Remember the garden capital of 1931, the tent-shaped mosque, Babur\'s tomb, the temple of a single tree, the capital with no traffic lights, the rickshaw capital, and the harbour Arab traders knew first.']},
 {id:'levant-iraq-turkey-iran',title:'The Levant, Iraq, Türkiye and Iran',initial:B(28,28,62,46),
  names:['Nicosia','Beirut','Damascus','Amman','Jerusalem','Baghdad','Ankara','Tehran'],
  intro:'Eight capitals of the eastern Mediterranean and the Middle East: the island of Cyprus, the Levant coast, the Jordan, Jerusalem, the Tigris, and the two great inland powers.',
  recap:['Nicosia stands alone on Cyprus, then Beirut, Damascus and Amman run along the Levant with Jerusalem among them. Baghdad sits on the Tigris, Ankara in Anatolia, and Tehran below the Alborz.',
   'Remember the eleven bastions and the crossing street, the wells and the law school, the oldest great mosque, the theatre cut into a hill, the holy city of three religions, the round city of 762, the anchor chosen over Istanbul, and the capital of 1786.']},
 {id:'gulf-and-peninsula',title:'The Gulf and the Peninsula',initial:B(46,14,62,34),
  names:['Kuwait City','Manama','Doha','Abu Dhabi','Riyadh','Muscat','Sanaa'],
  intro:'Seven capitals of the Gulf and the Arabian Peninsula: the bay cities of the north and the inland capitals of the centre and the south.',
  recap:['Kuwait City, Manama and Doha line the Gulf\'s northern shore, with Abu Dhabi further west. Riyadh stands inland in the Najd highlands, Muscat on the coast of Oman, and Sanaa high on the Yemeni plateau.',
   'Remember the twin towers of the emblem, the place of rest beside ancient Dilmun, the pearl divers who grew rich, the father of the gazelle, the gardens of the oases, the harbour of two Portuguese forts, and the city founded by a son of Noah.']},
 {id:'mainland-southeast-asia',title:'Mainland Southeast Asia',initial:B(96,5,120,26),
  names:['Bangkok','Phnom Penh','Vientiane','Hanoi','Naypyidaw','Kuala Lumpur'],
  intro:'Six capitals of mainland Southeast Asia: the Chao Phraya, the Mekong, the Red River and the Malay peninsula.',
  recap:['Bangkok stands on the Chao Phraya, Phnom Penh where the Tonlé Sap meets the Mekong, Vientiane across the river from Thailand, Hanoi in the bend of the Red River, Naypyidaw in the Shan hills, and Kuala Lumpur at a muddy confluence.',
   'Remember the city of angels and its 46-metre Buddha, the hill of Daun Penh, the golden stupa, the ascending dragon, the capital built from nothing, and the muddy confluence of two rivers.']},
 {id:'maritime-southeast-asia',title:'The Maritime South-East',initial:B(100,-12,130,18),
  names:['Manila','Jakarta','Bandar Seri Begawan','Singapore','Dili'],
  intro:'Five capitals of the maritime south-east: the Spanish walled city, the sinking capital of Java, the sultanate on Borneo, the island city and the far east of Timor.',
  recap:['Manila is in the north of the Philippines, Jakarta on the north coast of Java, Bandar Seri Begawan across Borneo\'s river, Singapore at the tip of the peninsula, and Dili on the north coast of Timor.',
   'Remember where the nilad grows, the complete victory that became Batavia, the gold mosque over its lagoon, the lion city where no lions lived, and Cristo Rei above the northern coast.']}
];

const byName=new Map(countries.map(c=>[c.name,c])),rows=[],root='rendered/asia-capitals-20261102';
mkdirSync(root,{recursive:true});
const words=['one','two','three','four','five','six','seven'];
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
 const lesson={title:`Asia capitals ${words[i]} of seven · ${g.title}`,edition:'Asia capitals · Seven regional lessons · John · November 2026',
  mapId:'asia-capitals',area:'Asia',unit:'capitals',
  url:'http://localhost:5187/map/asia-capitals',manual:'http://localhost:5187/manual',
  viewport:{width:1600,height:900},initialBounds:g.initial,
  restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
  intro:[`Welcome to the Asia capitals, episode ${words[i]} of seven. First, I clear the chosen names for a fresh regional lesson.`,g.intro],
  states,recapGestures:[{bounds:g.initial}],recap:g.recap};
 const path=`src/lessons/asia-capitals-0${i+1}-${g.id}.json`;
 writeFileSync(path,JSON.stringify(lesson,null,2)+'\n');
 rows.push({id:g.id,title:g.title,status:'prepared',lesson:path,places:g.names,countries:g.names,
  nativeTargets:states.map(s=>s.name),relatedTargets:[],supplemental:[],video:`${root}/0${i+1}-${g.id}/geoclick/play-no-subtitles.mp4`});
}
const all=rows.flatMap(e=>e.places);
if(all.length!==47||new Set(all).size!==47)throw Error('Coverage mismatch: forty-seven capitals exactly once');
const covered=t=>all.includes(t.name)||(t.names?.en&&all.includes(t.names.en));
if(catalog.targets.some(t=>!covered(t)))throw Error('Not every native Asia capital target is taught');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:'Asia capitals · Seven regional lessons · November 2026',
 status:'in-production',
 scope:'All 47 capital targets of GeoClick\'s native asia-capitals map, each exactly once: the capitals of every Asian country the map names. Episode groups are teaching routes, not an official classification, and map targets do not settle political status or boundaries.',
 targetCount:47,countryCount:47,nativeTargetCount:47,nativeTeachingStopCount:47,supplementalCount:0,
 coveredPlaceCount:0,episodes:rows},null,2)+'\n');
console.log(rows.map(e=>`${e.id}: ${e.places.length} stops`).join('\n'));
