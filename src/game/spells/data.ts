export type Element = 'fire' | 'ice' | 'lightning' | 'shadow' | 'nature' | 'arcane';

export interface Spell {
  id: string;
  name: string;
  element: Element;
  difficulty: 1 | 2 | 3 | 4 | 5;
  lore: string;
}

export const spells: Spell[] = [
  { id: 'ignis-luminare', name: 'Ignis Luminare', element: 'fire', difficulty: 2, lore: 'Summons a radiant flame to sear the path ahead.' },
  { id: 'glacies-orbis', name: 'Glacies Orbis', element: 'ice', difficulty: 2, lore: 'Encases the air in frost, forming a chilling sphere.' },
  { id: 'fulmen-ictus', name: 'Fulmen Ictus', element: 'lightning', difficulty: 3, lore: 'Channels a quicksilver bolt that snaps to the target.' },
  { id: 'umbra-velaris', name: 'Umbra Velaris', element: 'shadow', difficulty: 3, lore: 'Weaves a veil of dusk to swallow light with silence.' },
  { id: 'silva-animare', name: 'Silva Animare', element: 'nature', difficulty: 2, lore: 'Awakens the breath of the grove to entwine foes.' },
  { id: 'arcanum-spicula', name: 'Arcanum Spicula', element: 'arcane', difficulty: 4, lore: 'Forged from pure intent, a lance of aether pierces wards.' },
];

export function getSpells() {
  return spells;
}

export type { Spell as SpellType };
export default spells;
