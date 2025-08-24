export type GameScene = 'menu' | 'menu_play' | 'practice' | 'match' | 'results';

export type MatchMode = 'quick' | 'code' | 'bot';

export interface Player {
  id: string;
  nick: string;
  hp: number;
  mana: number;
  combo: number;
  connected: boolean;
  micActive?: boolean;
}

export interface Room {
  id: string;
  code?: string;
  players: Player[];
  mode: MatchMode;
  vsBot: boolean;
  state: 'waiting' | 'countdown' | 'active' | 'finished';
  countdown?: number;
}

export interface MatchResult {
  winner: 'player' | 'enemy' | 'bot';
  accuracy: number;
  totalCasts: number;
  matchDuration: number;
}

export interface BotConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  accuracy: [number, number]; // min, max
  castInterval: [number, number]; // min, max ms
}

export interface GameSettings {
  language: string;
  sensitivity: number;
  hotwordMode: boolean;
  ipSafeMode: boolean;
  micEnabled: boolean;
  pushToTalk: boolean;
  sfxVolume: number;
  musicVolume: number;
  voiceVolume: number;
  highContrast: boolean;
  fontSize: number; // 90-120%
}