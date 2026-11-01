import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {countries,regions} from '../src/lessons/europe-content.mjs';
const ledgerPath='src/lessons/europe-coverage.json';
if(existsSync(ledgerPath)&&!process.argv.includes('--refresh-lessons'))throw Error('Europe ledger already exists; use --refresh-lessons to update scripts while preserving production history');
const catalog=JSON.parse(readFileSync('../Geoclick2027/data/maps/europe-countries/map.json','utf8'));
const native=new Map(catalog.targets.map(t=>[t.name,t]));
const groups=[
 {id:'north-atlantic-nordics',title:'North Atlantic and Nordics',names:['Iceland','Ireland','United Kingdom','Denmark','Norway','Sweden','Finland'],bounds:[[-27,49],[33,72]],intro:'We begin with seven places around the North Atlantic and northern Europe: Iceland, Ireland, the United Kingdom, Denmark, Norway, Sweden and Finland.',recap:['Retrace the islands first: Iceland far northwest, Ireland west of Great Britain, and the United Kingdom spanning Great Britain and Northern Ireland.','Then Denmark below the Scandinavian Peninsula, Norway along its Atlantic side, Sweden on its Baltic side, and Finland farther east. Connect each location with its fact, and try tracing the route without the labels.']},
 {id:'western-europe',title:'Western Europe',names:['France','Belgium','Netherlands','Luxembourg','Monaco'],bounds:[[-6,41],[9,54]],intro:'Today we connect France with the Benelux countries, then zoom into Monaco on the French Riviera. Monaco needs a labelled supplemental map because GeoClick omits it.',recap:['Our western chain is France, Belgium and the Netherlands, with Luxembourg tucked inland between Belgium, France and Germany. Remember the metre, three languages, Holland and the grand duchy.','Monaco is the tiny Riviera state on France’s Mediterranean edge. Its oceanographic story completes this five-place group; the labelled supplemental view keeps its real location visible.']},
 {id:'central-europe',title:'Central Europe',names:['Germany','Switzerland','Liechtenstein','Austria','Poland','Czechia','Slovakia','Hungary'],bounds:[[4,45],[25,56]],intro:'Eight places connect the central crossroads and the Alps: Germany, Switzerland, Liechtenstein, Austria, Poland, Czechia, Slovakia and Hungary. Liechtenstein uses a labelled supplemental map.',recap:['Germany anchors the north; Switzerland and Austria follow the Alps, with tiny Liechtenstein between them. Remember reunification, four languages, the doubly landlocked country, and Vienna’s music.','Farther east, Poland sits above Czechia and Slovakia; Hungary lies below Slovakia. Keep Slovakia beside Czechia, not confused with Slovenia. Those eight places complete our central group.']},
 {id:'iberia-mediterranean',title:'Iberia and Mediterranean',names:['Portugal','Spain','Andorra','Italy','San Marino','Vatican City','Malta'],bounds:[[-11,33],[19,48]],intro:'Our seven-place route joins Iberia with Italy and the central Mediterranean. Andorra, San Marino, Vatican City and Malta use clearly labelled supplemental maps, because the game omits these small countries.',recap:['Portugal faces the Atlantic along western Iberia; Spain fills most of the peninsula, with Andorra in the Pyrenees between Spain and France.','Italy gives us the boot, Sicily and Sardinia. Keep its two enclaves separate: San Marino near the Adriatic, and Vatican City inside Rome.','Malta lies below Sicily. Think mountain valley, medieval republic, basilica and ancient stone temples: four very small states with very different locations and stories.']},
 {id:'balkans-greece',title:'Balkans and Greece',names:['Slovenia','Croatia','Bosnia and Herzegovina','Montenegro','Serbia','Kosovo','Albania','North Macedonia','Greece'],bounds:[[12,34],[29,48]],intro:'Today we learn nine map targets through the Adriatic and Balkan region, ending in Greece. Kosovo is included as a GeoClick target; its disputed status will be explained at its stop.',recap:['Begin with Slovenia below Austria, then Croatia’s coastal curve around Bosnia and Herzegovina. Montenegro and Albania continue along the sea; Serbia and Kosovo sit inland.','North Macedonia lies above Greece and east of Albania. Greece completes the southern peninsula and its islands. Remember the cave salamander, Dubrovnik, Mostar’s bridge, and Lake Ohrid as anchors along the route.']},
 {id:'baltic-eastern-europe',title:'Baltic and Eastern Europe',names:['Estonia','Latvia','Lithuania','Belarus','Ukraine','Moldova','Romania','Bulgaria','Russia'],bounds:[[18,40],[62,70]],intro:'Our final nine-place group follows the Baltic countries south through Belarus and Ukraine, then Moldova, Romania and Bulgaria, finishing with European Russia.',recap:['The Baltic stack is Estonia, Latvia, Lithuania. Inland, Belarus is above Ukraine; Moldova fits between Ukraine and Romania, while Bulgaria sits below Romania along the Black Sea.','Russia continues far beyond Europe; its Siberian facts belong outside this European map view. Across six lessons we covered all thirty-nine GeoClick Europe targets, plus six microstates in labelled supplemental views.','This is the scope of our map-based series, not a universal definition of Europe. Türkiye, Cyprus and the Caucasus are outside this map’s target list and are left for neighbouring-region lessons. Rebuild the six groups using their locations and memorable facts.']}
];
const output='rendered/europe-six-20261101';
const byName=new Map(countries.map(c=>[c.name,c]));
const rows=[];
for(const [i,g] of groups.entries()){
 let previousFrame,previousView='geoclick';
 const states=g.names.map(name=>{
  const row=structuredClone(byName.get(name));if(!row)throw Error(`Missing ${name}`);
  const bounds=typeof row.frame==='string'?regions[row.frame]:row.frame;
  const view=row.view??'geoclick';
  if(view==='geoclick'&&!native.has(name))throw Error(`Missing native target ${name}`);
  row.cameraBounds=bounds;
  if(JSON.stringify(bounds)!==previousFrame||view!==previousView){
   row.transition=row.view==='supplemental'?`Let's locate ${name} on a labelled supplemental map, then zoom in to see its outline.`:`Let's bring ${name} and its neighbours into a closer view.`;
   row.gestures=[...(row.locator?[{bounds:row.locator}]:[]),{bounds}];
   if(view!==previousView||view==='supplemental')row.view=view;
  }
  previousFrame=JSON.stringify(bounds);previousView=view;
  if(view==='supplemental'){
   row.mapFacts=[row.lines[0],row.lines[1]];row.factContains=undefined;
   row.contextLabels={Monaco:[['France',[7.408,43.75]],['Mediterranean Sea',[7.439,43.726]]],Liechtenstein:[['Switzerland',[9.46,47.14]],['Austria',[9.65,47.22]]],Andorra:[['France',[1.72,42.68]],['Spain',[1.42,42.43]]],'San Marino':[['Italy',[12.39,43.985]]],'Vatican City':[['Rome · Italy',[12.457,41.907]]],Malta:[['Gozo',[14.24,36.05]],['Mediterranean Sea',[14.24,35.8]]]}[name];
  }
  delete row.frame;delete row.locator;return row;
 });
 const supplemental=states.filter(s=>s.view==='supplemental');
 const lesson={title:`Europe ${i+1} of 6 · ${g.title}`,edition:'Europe countries · Six regional lessons · John · November 2026',mapId:'europe-countries',area:'Europe',unit:'places',manual:'http://127.0.0.1:5188/manual',url:'http://127.0.0.1:5188/map/europe-countries',viewport:{width:1600,height:900},initialBounds:g.bounds,restore:states.filter(s=>s.view!=='supplemental').map(s=>({name:s.name,location:s.location,bounds:s.cameraBounds})),intro:[`Welcome to Europe episode ${['one','two','three','four','five','six'][i]} of six. First, I clear the chosen names so we can study a fresh regional group.`,g.intro],states,recapGestures:[{bounds:g.bounds,...(supplemental.length?{view:'geoclick'}:{})}],recap:g.recap};
 if(supplemental.length){
  lesson.supplement={data:'src/lessons/data/europe-microstates.geojson',mapCredit:i===3?'Natural Earth / geoBoundaries':'Natural Earth',attribution:'Natural Earth public-domain 1:10m context; public-domain geoBoundaries VAT polygon',contextLabels:[['France',[2.4,46.5]],['Spain',[-3,40]],['Italy',[12.4,43]],['Switzerland',[8,47]],['Austria',[13.4,47.8]],['Sicily',[14,37.5]],['Rome',[12.52,41.89]]],islandLabels:[]};
  lesson.supplement.mapCredit='Natural Earth / geoBoundaries';
  lesson.supplement.mapAttribution='Natural Earth / geoBoundaries · IGN-F 2022 · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> (Monaco)';
 }
 if(i===1)lesson.recapMoves=[[],[{view:'supplemental',bounds:[[6.8,43.2],[8,44.2]]}]];
 if(i===2)lesson.recapMoves=[[{view:'supplemental',bounds:[[7,45.8],[12,49]]}],[{view:'geoclick',bounds:g.bounds}]];
 if(i===3)lesson.recapMoves=[[{view:'supplemental',bounds:[[-1,40],[4,45]]}],[{view:'supplemental',bounds:[[10,40.7],[14,45]]}],[{view:'supplemental',bounds:[[10.5,33.5],[17,38.5]]}]];
 const path=`src/lessons/europe-0${i+1}-${g.id}.json`;writeFileSync(path,JSON.stringify(lesson,null,2)+'\n');
 rows.push({id:g.id,title:g.title,status:'prepared',lesson:path,places:g.names,nativeTargets:states.filter(s=>s.view!=='supplemental').map(s=>s.name),supplemental: supplemental.map(s=>s.name),video:`${output}/0${i+1}-${g.id}/geoclick/play-no-subtitles.mp4`});
}
const all=rows.flatMap(e=>e.places),nativeNames=rows.flatMap(e=>e.nativeTargets);
if(all.length!==45||new Set(all).size!==45||nativeNames.length!==39||catalog.targets.some(t=>!nativeNames.includes(t.name)))throw Error('Coverage must be exactly 39 native targets plus six microstates');
if(!existsSync(ledgerPath))writeFileSync(ledgerPath,JSON.stringify({edition:'Europe · Six regional lessons · November 2026',status:'in-production',scope:'39 GeoClick Europe map targets plus six supplemental microstates, including Kosovo with a status note',targetCount:45,nativeTargetCount:39,supplementalCount:6,coveredPlaceCount:0,outsideScope:['Türkiye','Cyprus','Georgia','Armenia','Azerbaijan'],episodes:rows},null,2)+'\n');
console.log(rows.map(e=>`${e.id}: ${e.places.length} (${e.nativeTargets.length} native, ${e.supplemental.length} supplemental)`).join('\n'));
