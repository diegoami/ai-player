import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';
import{countries}from'../src/lessons/europe-capitals-content.mjs';

const ledgerPath='src/lessons/europe-capitals-coverage.json';
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error('Europe capitals ledger exists; --refresh-lessons preserves production history');
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/europe-capitals/map.json','utf8'));
const native=new Set(catalog.targets.flatMap(t=>[t.name,t.names?.en].filter(Boolean)));
const B=(w,s,e,n)=>[[w,s],[e,n]];

const groups=[
 {id:'north-atlantic-nordics',title:'North Atlantic and the Nordics',initial:B(-22,50,20,66),
  names:['Reykjavík','Helsinki','Oslo','Stockholm','Copenhagen','Dublin','London'],
  intro:'We begin in the north: the North Atlantic capitals of Reykjavík, Dublin and London, and the Nordic cluster of Helsinki, Oslo, Stockholm and Copenhagen.',
  recap:['Reykjavík is the far north-west, above the Atlantic. Dublin and London face the Irish Sea, and Copenhagen, Stockholm, Oslo and Helsinki line the Baltic side.',
   'Remember smoky bay and hot springs, the Danes\' merchant harbour, the log islands of Stockholm, the Peace Prize of Oslo, and the tunnel under London that was the world\'s first Underground.']},
 {id:'baltic-and-the-east',title:'The Baltic and the East',initial:B(20,46,42,61),
  names:['Tallinn','Riga','Vilnius','Minsk','Warsaw','Kyiv','Moscow','Chișinău'],
  intro:'Eight capitals run from the Baltic states in the north to Moscow and Chișinău in the east.',
  recap:['Tallinn, Riga and Vilnius are the three Baltic states. Minsk, Warsaw and Kyiv lie further south and east, and Moscow and Chișinău close the group.',
   'Remember the Danish town of Tallinn, the Hanseatic Riga, the Vilnia and the republic of Užupis, the rebuilt Minsk, the mermaid legend of Warsaw, the three brothers of Kyiv, and the Moscow that swapped with St Petersburg.']},
 {id:'west-and-centre',title:'The West and the Centre',initial:B(-1,45,24,55),
  names:['Amsterdam','Brussels','Luxembourg','Paris','Berlin','Prague','Vienna','Bratislava','Budapest'],
  intro:'Nine capitals fill the crowded middle of Europe: the three of the Low Countries and France, then Germany, the Czech Republic, Austria, Slovakia and Hungary.',
  recap:['Amsterdam, Brussels and Luxembourg are the three Low Countries, with Paris to their south. Berlin is east of them, and Prague, Vienna, Bratislava and Budapest run along the Danube basin.',
   'Remember the dam on the Amstel, the settlement in the marsh, the Gibraltar of the North, the Parisii and their catacombs, the swamp behind the bear, the threshold of Prague, and the three towns of Budapest joined in 1873.']},
 {id:'alps-and-italy',title:'The Alps and Italy',initial:B(-1,41,17,50),
  names:['Vaduz','Bern','Ljubljana','Zagreb','San Marino','Rome','Monaco','Andorra la Vella'],
  intro:'Eight capitals lie along the Alpine arc: Liechtenstein and Switzerland, then Slovenia and Croatia, and the Italian peninsula with its two tiny states.',
  recap:['Vaduz and Bern sit in the Alps; Ljubljana and Zagreb are just south of them. San Marino, Rome and Monaco run down the Italian peninsula, with Andorra la Vella across the mountains to the west.',
   'Remember the prince\'s castle and the landlocked Liechtenstein, the bear city of Bern and Einstein\'s year of 1905, the dragon of Ljubljana, the hill behind Zagreb, the stonemason of San Marino, the twins of Rome, the dwelling alone of Heracles, and the highest capital in Europe.']},
 {id:'the-balkans',title:'The Balkans',initial:B(17,39,30,47),
  names:['Tirana','Pristina','Belgrade','Podgorica','Skopje','Sarajevo','Sofia','Bucharest'],
  intro:'Eight capitals of the Balkans, from Albania and Kosovo in the south-west to Serbia, Montenegro, North Macedonia, Bosnia and Herzegovina, Bulgaria and Romania.',
  recap:['Tirana and Pristina are the southern pair, Belgrade the great river capital in the north, with Podgorica, Skopje and Sarajevo around it, and Sofia and Bucharest to the east.',
   'Remember the mosque and bazaar of Tirana, the NEWBORN monument of Pristina, the white city at two rivers, the little hill of Podgorica, Kenzo Tange\'s Skopje, the palace field of Sarajevo, the wisdom of Saint Sophia, and the shepherd\'s Little Paris.']},
 {id:'iberia-and-mediterranean',title:'Iberia and the Mediterranean',initial:B(-12,34,28,42),
  names:['Madrid','Lisbon','Athens','Valletta'],
  intro:'Four capitals close the series: the two of the Iberian peninsula, the old capital of the Mediterranean, and the smallest of the island capitals.',
  recap:['Madrid and Lisbon are the two Iberian capitals, Athens the old one of the Mediterranean, and Valletta the island capital off Sicily.',
   'Remember the source of water, the safe harbour, the olive tree of Athena, and the grand master who held Malta in 1565.']
}];

const byName=new Map(countries.map(c=>[c.name,c])),rows=[],root='rendered/europe-capitals-20261102';
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
 const lesson={title:`Europe capitals ${words[i]} of six · ${g.title}`,edition:'Europe capitals · Six regional lessons · John · November 2026',
  mapId:'europe-capitals',area:'Europe',unit:'capitals',
  url:'http://localhost:5187/map/europe-capitals',manual:'http://localhost:5187/manual',
  viewport:{width:1600,height:900},initialBounds:g.initial,
  restore:states.map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),
  intro:[`Welcome to the Europe capitals, episode ${words[i]} of six. First, I clear the chosen names for a fresh regional lesson.`,g.intro],
  states,recapGestures:[{bounds:g.initial}],recap:g.recap};
 const path=`src/lessons/europe-capitals-0${i+1}-${g.id}.json`;
 writeFileSync(path,JSON.stringify(lesson,null,2)+'\n');
 rows.push({id:g.id,title:g.title,status:'prepared',lesson:path,places:g.names,countries:g.names,
  nativeTargets:states.map(s=>s.name),relatedTargets:[],supplemental:[],video:`${root}/0${i+1}-${g.id}/geoclick/play-no-subtitles.mp4`});
}
const all=rows.flatMap(e=>e.places);
if(all.length!==44||new Set(all).size!==44)throw Error('Coverage mismatch: forty-four capitals exactly once');
const covered=t=>all.includes(t.name)||(t.names&&t.names.en&&all.includes(t.names.en));
if(catalog.targets.some(t=>!covered(t)))throw Error('Not every native Europe capital target is taught');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({
 edition:'Europe capitals · Six regional lessons · November 2026',
 status:'in-production',
 scope:'All 44 capital targets of GeoClick\'s native europe-capitals map, each exactly once: the capitals of every European country the map names. Episode groups are teaching routes, not an official classification, and map targets do not settle political status or boundaries.',
 targetCount:44,countryCount:44,nativeTargetCount:44,nativeTeachingStopCount:44,supplementalCount:0,
 coveredPlaceCount:0,episodes:rows},null,2)+'\n');
console.log(rows.map(e=>`${e.id}: ${e.places.length} stops`).join('\n'));
