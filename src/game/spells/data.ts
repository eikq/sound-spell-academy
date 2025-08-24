export type Element = 'fire' | 'ice' | 'lightning' | 'shadow' | 'nature' | 'arcane';

export interface Spell {
  id: string;
  displayName: string;
  canonical: string;
  aliases: string[];
  phonemes: string[];
  category: 'Charm' | 'Jinx' | 'Hex' | 'Curse' | 'Transfiguration' | 'Defense' | 'Healing' | 'Utility';
  element: Element;
  difficulty: 1 | 2 | 3 | 4 | 5;
  basePower: number;
  manaCost: number;
  cooldownMs: number;
  effect: string;
}

export const HARRY_POTTER_SPELLS: Spell[] = [
  {
    id: 'expelliarmus',
    displayName: 'Disarm',
    canonical: 'Expelliarmus',
    aliases: ['expelliarmus', 'expelliamus', 'expeliarmus', 'disarm', 'expellyarmus'],
    phonemes: ['ek-spel-ee-AR-mus'],
    category: 'Charm',
    element: 'arcane',
    difficulty: 2,
    basePower: 1.0,
    manaCost: 15,
    cooldownMs: 1200,
    effect: 'Disarms and staggers the foe.'
  },
  {
    id: 'stupefy',
    displayName: 'Stun',
    canonical: 'Stupefy',
    aliases: ['stupefy', 'stupify', 'stupifye', 'stun', 'stupifi'],
    phonemes: ['STOO-puh-fy'],
    category: 'Jinx',
    element: 'lightning',
    difficulty: 2,
    basePower: 1.05,
    manaCost: 18,
    cooldownMs: 1200,
    effect: 'Stunning bolt; short daze.'
  },
  {
    id: 'protego',
    displayName: 'Shield',
    canonical: 'Protego',
    aliases: ['protego', 'proteco', 'proteger', 'shield', 'pro-tay-go'],
    phonemes: ['pro-TAY-go'],
    category: 'Defense',
    element: 'arcane',
    difficulty: 2,
    basePower: 0.8,
    manaCost: 12,
    cooldownMs: 800,
    effect: 'Magical shield; blocks next attack.'
  },
  {
    id: 'avada-kedavra',
    displayName: 'Death Curse',
    canonical: 'Avada Kedavra',
    aliases: ['avada kedavra', 'avada ke davra', 'death curse', 'killing curse'],
    phonemes: ['ah-VAH-da ke-DAH-vra'],
    category: 'Curse',
    element: 'shadow',
    difficulty: 5,
    basePower: 2.0,
    manaCost: 50,
    cooldownMs: 2500,
    effect: 'Unforgivable Curse; ultimate power.'
  },
  {
    id: 'incendio',
    displayName: 'Flame',
    canonical: 'Incendio',
    aliases: ['incendio', 'insendio', 'fire', 'flame', 'in-sen-dee-oh'],
    phonemes: ['in-SEN-dee-oh'],
    category: 'Charm',
    element: 'fire',
    difficulty: 2,
    basePower: 1.15,
    manaCost: 20,
    cooldownMs: 1300,
    effect: 'Fire jet; burn DoT.'
  },
  {
    id: 'aguamenti',
    displayName: 'Water Jet',
    canonical: 'Aguamenti',
    aliases: ['aguamenti', 'aquamenti', 'water', 'agua menti', 'agua-menti'],
    phonemes: ['AH-gwah-MEN-tee'],
    category: 'Charm',
    element: 'ice',
    difficulty: 2,
    basePower: 0.95,
    manaCost: 16,
    cooldownMs: 1200,
    effect: 'Water stream; quenches burn.'
  },
  {
    id: 'episkey',
    displayName: 'Mend',
    canonical: 'Episkey',
    aliases: ['episkey', 'episky', 'heal', 'mend', 'eh-piss-kee'],
    phonemes: ['eh-PISS-kee'],
    category: 'Healing',
    element: 'nature',
    difficulty: 2,
    basePower: -0.8,
    manaCost: 25,
    cooldownMs: 1500,
    effect: 'Heals small amount; cleanse 1 debuff.'
  },
  {
    id: 'lumos',
    displayName: 'Light',
    canonical: 'Lumos',
    aliases: ['lumos', 'lumous', 'lummos', 'light', 'loomoos'],
    phonemes: ['LOO-mos'],
    category: 'Utility',
    element: 'lightning',
    difficulty: 1,
    basePower: 0.0,
    manaCost: 8,
    cooldownMs: 900,
    effect: 'Illuminates; accuracy boost window.'
  },
  {
    id: 'crucio',
    displayName: 'Torture',
    canonical: 'Crucio',
    aliases: ['crucio', 'torture', 'croo-see-oh'],
    phonemes: ['CROO-see-oh'],
    category: 'Curse',
    element: 'shadow',
    difficulty: 4,
    basePower: 1.8,
    manaCost: 35,
    cooldownMs: 2200,
    effect: 'Torture curse; extreme pain.'
  },
  {
    id: 'imperio',
    displayName: 'Control',
    canonical: 'Imperio',
    aliases: ['imperio', 'control', 'im-pair-ee-oh'],
    phonemes: ['im-PAIR-ee-oh'],
    category: 'Curse',
    element: 'shadow',
    difficulty: 5,
    basePower: 1.2,
    manaCost: 40,
    cooldownMs: 2000,
    effect: 'Mind control; turn enemy briefly.'
  },
  {
    id: 'sectumsempra',
    displayName: 'Dark Slash',
    canonical: 'Sectumsempra',
    aliases: ['sectumsempra', 'sectum sempra', 'dark slash', 'sek-tum-sem-pra'],
    phonemes: ['sek-TUM-sem-prah'],
    category: 'Curse',
    element: 'shadow',
    difficulty: 4,
    basePower: 1.6,
    manaCost: 30,
    cooldownMs: 1800,
    effect: 'Slashing curse; causes bleeding.'
  },
  {
    id: 'expecto-patronum',
    displayName: 'Patronus',
    canonical: 'Expecto Patronum',
    aliases: ['expecto patronum', 'patronum', 'patronus', 'expecto', 'ex-pek-toh'],
    phonemes: ['ex-PEK-toh pah-TROH-num'],
    category: 'Defense',
    element: 'arcane',
    difficulty: 4,
    basePower: 1.2,
    manaCost: 35,
    cooldownMs: 1600,
    effect: 'Holy burst; strong ward vs shadow.'
  },
  {
    id: 'riddikulus',
    displayName: 'Ridicule',
    canonical: 'Riddikulus',
    aliases: ['riddikulus', 'ridikulus', 'ridiculous', 'ridik-ulus'],
    phonemes: ['rih-dih-KYOO-lus'],
    category: 'Charm',
    element: 'lightning',
    difficulty: 2,
    basePower: 0.9,
    manaCost: 14,
    cooldownMs: 1200,
    effect: 'Fear cleanse; small dmg burst.'
  },
  {
    id: 'petrificus-totalus',
    displayName: 'Bind',
    canonical: 'Petrificus Totalus',
    aliases: ['petrificus totalus', 'petrificus', 'totalus', 'bind', 'petrify'],
    phonemes: ['peh-TRI-fi-kus toe-TAL-us'],
    category: 'Hex',
    element: 'shadow',
    difficulty: 3,
    basePower: 1.0,
    manaCost: 22,
    cooldownMs: 1500,
    effect: 'Root; brief heavy stagger.'
  },
  {
    id: 'wingardium-leviosa',
    displayName: 'Levitate',
    canonical: 'Wingardium Leviosa',
    aliases: ['wingardium leviosa', 'leviosa', 'levi oh sa', 'levitate', 'wingardium'],
    phonemes: ['win-GAR-dee-um le-vee-OH-sa'],
    category: 'Charm',
    element: 'arcane',
    difficulty: 3,
    basePower: 0.8,
    manaCost: 18,
    cooldownMs: 1400,
    effect: 'Lifts & drops target; minor dmg.'
  }
];

export default HARRY_POTTER_SPELLS;