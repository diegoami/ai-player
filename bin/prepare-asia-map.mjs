import{readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const world=JSON.parse(readFileSync('rendered/europe-natural-earth-10m.geojson','utf8'));
const targets=['Bahrain','Maldives','Singapore'];
const context=['Saudi Arabia','Qatar','United Arab Emirates','Oman','Iran','Kuwait','Iraq','India','Sri Lanka','Malaysia','Indonesia','Thailand','Brunei'];
const round=c=>typeof c[0]==='number'?c.map(n=>Number(n.toFixed(6))):c.map(round);
const features=world.features.flatMap(f=>{
 const name=f.properties.ADMIN;
 if(!targets.includes(name)&&!context.includes(name))return[];
 return[{type:'Feature',properties:{name,kind:targets.includes(name)?'state':'country'},geometry:{type:f.geometry.type,coordinates:round(f.geometry.coordinates)}}];
});
if(targets.some(n=>!features.some(f=>f.properties.name===n)))throw Error('Missing supplemental target');
const data=JSON.stringify({type:'FeatureCollection',features});
writeFileSync('src/lessons/data/asia-small-countries.geojson',data);
writeFileSync('src/lessons/data/asia-small-countries.source.json',JSON.stringify({publisher:'Natural Earth',scale:'1:10m',license:'Public domain',licenseUrl:'https://www.naturalearthdata.com/about/terms-of-use/',source:'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson',retrieved:'2026-11-01',sha256:createHash('sha256').update(data).digest('hex'),processing:'Three supplemental countries and neighbouring context, coordinates rounded to six decimal places. Original geographic positions and relative scale retained. Generalized land polygons; reefs, tiny islands, reclamation and causeways may be omitted. No territorial rescaling.'},null,2)+'\n');
writeFileSync('src/lessons/data/asia-small-countries.LICENSE.txt','Asia supplemental geography\n\nNatural Earth 1:10m country polygons, public domain. https://www.naturalearthdata.com/about/terms-of-use/\nOriginal geographic positions and relative scale retained. Generalized land polygons, not street or survey data.\n');
console.log(`${features.length} Natural Earth features`);
