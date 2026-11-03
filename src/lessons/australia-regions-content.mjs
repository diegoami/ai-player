// Original narration for the states of Australia: location, sourced fact, and a memory hook.
// The map's own curated cards for australia-regions were checked against each entry, and the
// click points are verified in a real browser.
const c=(name,location,frame,where,fact,hook,sources)=>({name,location,frame,lines:[where,fact,hook],sources:Array.isArray(sources)?sources:[sources]});
const W=name=>`https://en.wikipedia.org/wiki/${name}`;

export const regions=[
 c('Northern Territory',[133.5002,-18.5161],[[131.25,-20.266],[135.75,-16.766]],
  'The Northern Territory is a territory, not a state, and it fills the middle north of the continent between Western Australia and Queensland, with Darwin on the Timor Sea.',
  'The giant red rock Uluru is here, and it was handed back to its Anangu owners in 1985 and leased back as a national park, while the territory holds a sixth of the land with only about one per cent of the people.',
  'Remember the red rock in the middle of the country and a northern territory that never became a state.',
  [W('Northern_Territory'),W('Uluru'),W('Darwin')]),
 c('Queensland',[145.7534,-19.6467],[[143.503,-21.397],[148.003,-17.897]],
  'Queensland is the big north-eastern state, reaching from the Northern Territory border to the Coral Sea, with Brisbane on its south-east coast.',
  'The Great Barrier Reef runs for 2,300 kilometres along this coast, the largest structure on earth built by living things, and the Daintree rainforest at the far north is the oldest continuously surviving rainforest in the world.',
  'Remember the coral coast with the great reef running beside it and the oldest rainforest still growing right down to the shore.',
  [W('Queensland'),W('Great_Barrier_Reef'),W('Daintree_Rainforest')]),
 c('Western Australia',[120.9597,-24.4079],[[118.71,-26.158],[123.21,-22.658]],
  'Western Australia fills the whole western third of the continent, from the Northern Territory border down to the Southern Ocean, with Perth on its south-west corner.',
  'It is a third of the land, the largest subdivision of any country on earth after Russia’s Sakha, and its capital Perth is the most isolated major city in the world.',
  'Remember the empty west, a third of the country, with the loneliest capital on earth down in its south-west corner.',
  [W('Western_Australia'),W('Perth'),W('Stromatolite')]),
 c('South Australia',[135.0001,-32.0352],[[132.75,-33.785],[137.25,-30.285]],
  'South Australia is the central state, running from the Northern Territory border down to the Southern Ocean and reaching west to the coast and east to the Victorian border, with Adelaide on the shore.',
  'It is the only state founded entirely by free settlers, with no convicts, and it is also the driest state on the driest inhabited continent, yet the Barossa Valley in it grows Australia’s best known wine.',
  'Remember the settler state in the middle of the continent, the driest of them all, with the Barossa vineyards in its south-east corner.',
  [W('South_Australia'),W('Barossa_Valley'),W('Coober_Pedy')]),
 c('New South Wales',[147.3153,-32.8298],[[145.065,-34.58],[149.565,-31.08]],
  'New South Wales runs down the eastern seaboard from the Queensland border to the Victorian border, with Sydney on the coast and the Australian Capital Territory enclosed inside it.',
  'Captain Cook named it in 1770 when he thought the coast looked like south Wales, and it was the first British colony in Australia in 1788, so every other eastern state was carved out of it.',
  'Remember the first colony and the coast that looks like Wales, with Sydney Harbour in the middle of it.',
  [W('New_South_Wales'),W('Sydney'),W('Sydney_Opera_House')]),
 c('Australian Capital Territory',[149.0602,-35.5304],[[148.26,-36.13],[149.86,-34.93]],
  'The Australian Capital Territory is a territory, not a state, and the smallest of the eight, lying entirely inland inside New South Wales with Canberra in the middle of it.',
  'The land was taken out of New South Wales in 1911 to make room for a capital, because Sydney and Melbourne could not agree where it should go, and the city was designed by an American, Walter Burley Griffin.',
  'Remember the smallest of the eight, an inland patch of capital land cut out of New South Wales to settle a quarrel between two rival cities.',
  [W('Australian_Capital_Territory'),W('Canberra'),W('Walter_Burley_Griffin')]),
 c('Victoria',[145.4696,-36.5378],[[143.22,-38.288],[147.72,-34.788]],
  'Victoria is the small south-eastern state between South Australia and New South Wales, facing Bass Strait and the Southern Ocean, with Melbourne near its south-east corner.',
  'The gold rush of 1851 made Melbourne briefly the richest city in the world, and Victoria is the smallest state on the mainland and the most densely populated. The Twelve Apostles on its coast are limestone stacks the Southern Ocean is still knocking down, and only eight of them are still standing.',
  'Remember the smallest mainland state, crowded with people, with the gold rush town of Melbourne and the sea stacks the waves are eating.',
  [W('Victoria_(state)'),W('Melbourne'),W('Twelve_Apostles_(Victoria)')]),
 c('Tasmania',[146.134,-41.6276],[[143.884,-43.378],[148.384,-39.878]],
  'Tasmania is an island state, a whole island south of the mainland across Bass Strait, with Hobart on its north-east shore and no land border with any other region.',
  'The sea rose and cut it off from the mainland about 12,000 years ago, which is why the Tasmanian devil survives here and nowhere else, and the cleanest air in the world was measured at Cape Grim in its north-west.',
  'Remember the island down south with the devil on it, cut off by the rising sea long before any map was drawn.',
  [W('Tasmania'),W('Tasmanian_devil'),W('Hobart')])
];
