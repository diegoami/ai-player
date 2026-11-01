// Build the explicitly requested 48-state edition from the reviewed lesson material.
import {readFileSync,writeFileSync} from 'node:fs';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const originals=['northeast','south','midwest','west'].map((n,i)=>read(`src/lessons/usa-episode-0${i+1}-${n}.json`));
const catalog=new Map(originals.flatMap(l=>l.states).map(s=>[s.name,s]));
const source='https://www.census.gov/programs-surveys/economic-census/guidance-geographies/levels.html';
const definitions=[
 ['northeast','Northeast',['Maine','New Hampshire','Vermont','Massachusetts','Rhode Island','Connecticut','New York','New Jersey','Pennsylvania'],[[-80.8,38.5],[-66.7,47.5]],
  'We begin with all six New England states, then New York, New Jersey and Pennsylvania. Together they form the Census Northeast.',
  ['New England gives us Maine, New Hampshire, Vermont, Massachusetts, Rhode Island and Connecticut. Then New York, New Jersey and Pennsylvania complete our nine-state group.','Remember Vermont west of New Hampshire, the small coastal pair below Massachusetts, and Pennsylvania south of New York. Next time we follow the Atlantic south.']],
 ['south-atlantic','South Atlantic',['Delaware','Maryland','Virginia','West Virginia','North Carolina','South Carolina','Georgia','Florida'],[[-85.8,24],[-74,41.2]],
  'Our eight-state route follows the South Atlantic group: Delaware and Maryland, Virginia and West Virginia, the Carolinas, Georgia and Florida. West Virginia is the inland mountain member.',
  ['Trace our eight states from Delaware and Maryland around the Chesapeake, into Virginia and West Virginia, then down through North Carolina, South Carolina, Georgia and Florida.','Remember the two Virginias, the Carolina pair, and Florida below Georgia. These are the eight states of the Census South Atlantic division; Washington, D.C., is not a state.']],
 ['south-central','South Central',['Kentucky','Tennessee','Alabama','Mississippi','Louisiana','Arkansas','Oklahoma','Texas'],[[-107,25],[-81,40]],
  'Today we connect the eight South Central states. We start with Kentucky and Tennessee, move down to Alabama and Mississippi, then follow Louisiana, Arkansas, Oklahoma and Texas westward.',
  ['Our first pair was Kentucky above Tennessee. Below them came Alabama and Mississippi; then Louisiana below Arkansas, with Oklahoma above Texas farther west.','Those eight states combine the Census East and West South Central divisions. Picture their linked pairs, with the Mississippi River and Gulf Coast helping you keep your bearings.']],
 ['midwest','Midwest',['Ohio','Michigan','Indiana','Illinois','Wisconsin','Minnesota','Iowa','Missouri','Kansas','Nebraska','South Dakota','North Dakota'],[[-105,36],[-80.3,49.5]],
  'Today we explore all twelve Midwest states, from the Great Lakes through the Mississippi Valley to the central Plains. Lakes, river borders and north-south pairs will guide us.',
  ['Start with Ohio, Michigan, Indiana and Illinois; continue around the lakes to Wisconsin and Minnesota. Then locate Iowa above Missouri.','Finish with the Plains stack: Kansas, Nebraska, South Dakota and North Dakota. That completes all twelve Midwest states. One final episode will take us across the West.']],
 ['west','West',['Montana','Idaho','Wyoming','Colorado','New Mexico','Arizona','Utah','Nevada','California','Oregon','Washington'],[[-125.3,30.9],[-102,49.5]],
  'For our final episode, we explore eleven Western states: the northern Rockies, the Four Corners group, Nevada and the three Pacific coast states.',
  ['Trace Montana, Idaho and Wyoming; then the Four Corners loop of Colorado, New Mexico, Arizona and Utah. Nevada leads us to California, Oregon and Washington.','Across five videos, we have covered all forty-eight contiguous states, exactly once. We deliberately left out Alaska and Hawaii: their distinctive locations already make them easy to remember.','Our mainland tour is complete. Use the regional groups, neighbouring states and memorable facts to rebuild the map in your mind, then test yourself in GeoClick.']]
];
const byName=(lesson,name)=>lesson.states.find(s=>s.name===name);
const edit=(lesson,name,index,text)=>{byName(lesson,name).lines[index]=text;};
const move=(lesson,name,text,bounds)=>Object.assign(byName(lesson,name),{transition:text,gestures:[{bounds}]});
const episodes=definitions.map(([slug,region,names,bounds,opening,recap],i)=>{
 const states=names.map(n=>structuredClone(catalog.get(n)));
 const lesson={title:`Episode ${i+1} of 5 · ${region} · ${names.length} states`,edition:'Five videos · 48 contiguous states · John · November 2026',manual:'http://127.0.0.1:5188/manual',url:'http://127.0.0.1:5188/map/usa-states',viewport:{width:1600,height:900},regionSource:source,restore:states.map(({name,location})=>({name,...(location?{location}:{} )})),intro:[`Welcome to episode ${['one','two','three','four','five'][i]} of our U.S. states series. First, I clear the map so we can study a fresh group.`,opening],states,recapGestures:[{bounds}],recap};
 return {id:slug,lesson,path:`src/lessons/usa-five-0${i+1}-${slug}.json`};
});
const [ne,sa,sc,mw,we]=episodes.map(e=>e.lesson);
move(ne,'New York',"Let's move southwest to New York. Its inland reach, Long Island, and its neighbours New Jersey and Pennsylvania now come into view.",[[-80.8,38.5],[-71.7,45.2]]);
move(ne,'New Jersey',"Let's look more closely at New Jersey, between the Atlantic coast and Pennsylvania across the Delaware River.",[[-76.6,38.7],[-73.3,41.6]]);
edit(ne,'New Jersey',2,"Remember New Jersey's narrow coast beside Pennsylvania. We turn inland to Pennsylvania next, our final northeastern state.");
move(ne,'Pennsylvania',"Now widen the view westward to Pennsylvania, the final member of our Northeast group.",[[-81,38.8],[-74.3,43.2]]);
edit(ne,'Pennsylvania',2,"Pennsylvania completes our nine northeastern states. Keep it below New York, above Maryland, and west of New Jersey across the Delaware River.");
move(sa,'Delaware',"Begin with a close view of Delaware, the small state between Delaware Bay and Maryland.",[[-76.6,38],[-73.3,41.6]]);
edit(sa,'Virginia',0,"Virginia lies south of Maryland and north of North Carolina. West Virginia is a separate state on its inland side.");
edit(sa,'Virginia',2,"Keep Virginia below Maryland and along the Atlantic. Next, we turn inland to West Virginia and compare their shapes.");
move(sa,'West Virginia',"Let's compare the two Virginias. West Virginia's mountain outline lies inland from the larger coastal state.",[[-83.8,36.3],[-75,41]]);
edit(sa,'West Virginia',2,"Remember West Virginia's northern and eastern panhandles. Virginia reaches the Atlantic; West Virginia is landlocked. Next, we return to the coast in North Carolina.");
edit(sa,'Georgia',2,"Think of Georgia as the broad state above Florida. Alabama is to its west; now follow the coast down onto Florida, our final state today.");
edit(sa,'Florida',2,"Remember both parts of Florida: the south-pointing peninsula and the west-reaching panhandle. That completes our eight-state South Atlantic route.");
move(sc,'Kentucky',"Let's begin with Kentucky above Tennessee, two long states stretching west from the Appalachians.",[[-90.5,34.5],[-81,40]]);
edit(sc,'Tennessee',2,"Keep Kentucky above Tennessee. Below Tennessee sit Mississippi, Alabama and Georgia. We now turn south to Alabama.");
move(sc,'Alabama',"Now follow Alabama and Mississippi down toward the Gulf, then turn west along the coast into Louisiana.",[[-94.5,28.5],[-84.5,35.3]]);
move(sc,'Arkansas',"Turn inland to Arkansas and Oklahoma. Louisiana is below Arkansas, while Texas waits below Oklahoma.",[[-103.5,32.8],[-89.5,37.5]]);
edit(sc,'Texas',2,"Texas completes our eight South Central states. Its northern panhandle sits below Oklahoma's, while its southeastern edge reaches the Gulf.");
move(mw,'Ohio',"Let's begin with Ohio on Lake Erie, then travel around the Great Lakes and west across the Midwest.",[[-85,38.5],[-80.3,43.2]]);
edit(mw,'North Dakota',2,"North Dakota completes our twelve Midwest states. Trace the Plains stack from south to north: Kansas, Nebraska, South Dakota, North Dakota.");
edit(we,'Washington',2,"Keep Washington State on the Pacific, far from Washington, D.C. Washington completes our eleven Western states and the mainland series.");
const names=episodes.flatMap(e=>e.lesson.states.map(s=>s.name));
if(names.length!==48||new Set(names).size!==48||names.some(n=>['Alaska','Hawaii','District of Columbia'].includes(n)))throw Error('Invalid 48-state coverage');
const canonical=read('src/lessons/usa-coverage.json').episodes.flatMap(e=>e.covered??[]).filter(n=>!['Alaska','Hawaii'].includes(n));
if(canonical.length!==48||canonical.some(n=>!names.includes(n)))throw Error('Missing canonical mainland state');
for(const e of episodes){
 const text=JSON.stringify(e.lesson);if(/thirteen new|eleventh state|fifty distinct|thirty-seven|twenty-four|supplemental/.test(text))throw Error(`Stale series text: ${e.id}`);
 writeFileSync(e.path,JSON.stringify(e.lesson,null,2)+'\n');
}
const ledger={edition:'Five-video mainland edition · November 2026',status:'in-production',scope:'48 contiguous US states',excluded:['Alaska','Hawaii'],exclusionReason:'Deliberately omitted at user request; explained briefly in episode 5 because their distinctive locations are easy to remember',regionSource:source,coveredStateCount:0,episodes:episodes.map((e,i)=>({id:e.id,status:'prepared',lesson:e.path,states:e.lesson.states.map(s=>s.name),video:`rendered/usa-five-20261101/0${i+1}-${e.id}/geoclick/play-no-subtitles.mp4`}))};
writeFileSync('src/lessons/usa-five-video-coverage.json',JSON.stringify(ledger,null,2)+'\n');
console.log(ledger.episodes.map(e=>`${e.id}: ${e.states.length} — ${e.states.join(', ')}`).join('\n'));
