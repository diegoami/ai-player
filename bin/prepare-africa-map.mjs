import{readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const world=JSON.parse(readFileSync('rendered/europe-natural-earth-10m.geojson','utf8'));
const targets=['Comoros','Mauritius','Seychelles','São Tomé and Príncipe'];
const aliases={'São Tomé and Principe':'São Tomé and Príncipe','Sao Tome and Principe':'São Tomé and Príncipe'};
const context=['Madagascar','Mozambique','Tanzania','Kenya','Somalia','Gabon','Cameroon','Equatorial Guinea','Republic of the Congo','Republic of Congo','France'];
const round=c=>typeof c[0]==='number'?c.map(n=>Number(n.toFixed(6))):c.map(round);
const features=world.features.flatMap(f=>{
 const name=aliases[f.properties.ADMIN]??f.properties.ADMIN;
 if(!targets.includes(name)&&!context.includes(name))return[];
 // French overseas polygons retain their source attribution and geometry.
 return[{type:'Feature',properties:{name,kind:targets.includes(name)?'state':'country'},geometry:{type:f.geometry.type,coordinates:round(f.geometry.coordinates)}}];
});
if(targets.some(n=>!features.some(f=>f.properties.name===n)))throw Error('Missing Africa supplemental target');
const data=JSON.stringify({type:'FeatureCollection',features});
writeFileSync('src/lessons/data/africa-islands.geojson',data);
writeFileSync('src/lessons/data/africa-islands.source.json',JSON.stringify({publisher:'Natural Earth',scale:'1:10m',license:'Public domain',licenseUrl:'https://www.naturalearthdata.com/about/terms-of-use/',source:'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson',retrieved:'2026-11-01',processed:'2026-11-02',sha256:createHash('sha256').update(data).digest('hex'),processing:'Four supplemental island countries and neighbouring context, coordinates rounded to six decimal places. Real geographic positions and relative scale retained. Generalized land polygons may omit tiny islands and reefs. France context includes overseas islands; attribution is not a sovereignty determination.'},null,2)+'\n');
writeFileSync('src/lessons/data/africa-islands.LICENSE.txt','Africa supplemental geography\n\nNatural Earth 1:10m country polygons, public domain. https://www.naturalearthdata.com/about/terms-of-use/\nOriginal positions and relative scale retained. Generalized land polygons, not street or survey data.\n');
console.log(`${features.length} Natural Earth features`);
