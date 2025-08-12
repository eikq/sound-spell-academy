export type Element = 'fire' | 'ice' | 'lightning' | 'shadow' | 'nature' | 'arcane';

export interface Spell {
  id: string;
  name: string;
  element: Element;
  difficulty: 1 | 2 | 3 | 4 | 5;
  lore: string;
}

const spells: Spell[] = [
  {
    id: 'ignis-luminare',
    name: 'Ignis Luminare',
    element: 'fire',
    difficulty: 2,
    lore: 'Summons a radiant plume of emberlight that scorches shadows and forges courage.'
  },
  {
    id: 'gelum-spiculum',
    name: 'Gelum Spiculum',
    element: 'ice',
    difficulty: 3,
    lore: 'Crystallizes air into razor shards of frost that whistle with winter spirits.'
  },
  {
    id: 'vox-fulmina',
    name: 'Vox Fulmina',
    element: 'lightning',
    difficulty: 4,
    lore: 'Channels a storm-tongue bolt that obeys the clarity of one’s voice.'
  },
  {
    id: 'umbra-velaris',
    name: 'Umbra Velaris',
    element: 'shadow',
    difficulty: 3,
    lore: 'Weaves a veil of living dusk, swallowing light with silent elegance.'
  },
  {
    id: 'silva-animare',
    name: 'Silva Animare',
    element: 'nature',
    difficulty: 2,
    lore: 'Awakens the breath of the grove—vines curl and bloom at your command.'
  },
  {
    id: 'arcanum-spiralis',
    name: 'Arcanum Spiralis',
    element: 'arcane',
    difficulty: 5,
    lore: 'A spiral of raw aether that bends reality with disciplined diction.'
  },
  {
    id: 'pyra-chorus',
    name: 'Pyra Chorus',
    element: 'fire',
    difficulty: 1,
    lore: 'A chorus of flickering motes that singe targets in unison.'
  },
  {
    id: 'glacia-murmur',
    name: 'Glacia Murmur',
    element: 'ice',
    difficulty: 2,
    lore: 'A whisper that cools the world, frosting breath and thought.'
  },
  {
    id: 'aether-ray',
    name: 'Aether Ray',
    element: 'arcane',
    difficulty: 4,
    lore: 'Condenses latent aether into a piercing beam of prismatic focus.'
  },
  {
    id: 'thorn-ravel',
    name: 'Thorn Ravel',
    element: 'nature',
    difficulty: 3,
    lore: 'Vines braid into barbed cords that lash toward the unwary.'
  },
  {
    id: 'noctis-breach',
    name: 'Noctis Breach',
    element: 'shadow',
    difficulty: 4,
    lore: 'Rends a seam in the night, letting owlish silence strike.'
  },
  {
    id: 'volt-cantus',
    name: 'Volt Cantus',
    element: 'lightning',
    difficulty: 3,
    lore: 'A sung incantation that summons chain-sparking arcs of zeal.'
  }
];

export default spells;
