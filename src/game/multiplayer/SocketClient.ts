import { io, Socket } from 'socket.io-client';
import { Room, Player, MatchMode } from '@/types/game';

export interface SocketEvents {
  // Queue events
  'queue:join': (data: { mode: MatchMode; roomCode?: string; nick: string }) => void;
  'queue:waiting': () => void;
  'queue:timeout': () => void;
  'queue:cancel': () => void;
  
  // Match events
  'match:found': (data: { roomId: string; players: Player[]; vsBot: boolean }) => void;
  'match:start': (data: { countdown: number }) => void;
  'match:end': (data: { winner: string; reason: string }) => void;
  
  // Game events
  'cast': (data: { roomId: string; spellId: string; accuracy: number; loudness: number; power: number; timestamp: number }) => void;
  'state:update': (data: { players: Player[]; gameState: any }) => void;
  
  // Connection events
  'opponent:connected': (data: { playerId: string }) => void;
  'opponent:disconnected': (data: { playerId: string }) => void;
  
  // WebRTC signaling
  'rtc:signal': (data: { roomId: string; to: string; signal: any }) => void;
  'rtc:offer': (data: any) => void;
  'rtc:answer': (data: any) => void;
  'rtc:ice-candidate': (data: any) => void;
}

class SocketClient {
  private socket: Socket | null = null;
  private callbacks: Map<string, Function[]> = new Map();
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // In production, this would connect to your actual server
        // For demo purposes, we'll simulate the connection
        console.log('Connecting to matchmaking server...');
        
        // Simulate socket connection
        setTimeout(() => {
          console.log('Connected to matchmaking server');
          resolve();
        }, 1000);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }
  
  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  emit<K extends keyof SocketEvents>(event: K, data?: any) {
    // In a real implementation, this would emit to the actual socket
    console.log(`Socket emit: ${event}`, data);
    
    // Simulate server responses for demo
    this.simulateServerResponse(event as string, data);
  }
  
  private simulateServerResponse(event: string, data: any) {
    // Simulate realistic server responses for demo purposes
    switch (event) {
      case 'queue:join':
        if (data.mode === 'bot') {
          setTimeout(() => {
            this.triggerCallback('match:found', {
              roomId: 'bot-room-' + Date.now(),
              players: [
                { id: 'player', nick: data.nick, hp: 100, mana: 100, combo: 0, connected: true },
                { id: 'bot', nick: 'AI Opponent', hp: 100, mana: 100, combo: 0, connected: true }
              ],
              vsBot: true
            });
          }, 500);
        } else {
          setTimeout(() => {
            this.triggerCallback('queue:waiting');
          }, 100);
          
          // Simulate finding a match after some time
          setTimeout(() => {
            this.triggerCallback('match:found', {
              roomId: 'room-' + Date.now(),
              players: [
                { id: 'player', nick: data.nick, hp: 100, mana: 100, combo: 0, connected: true },
                { id: 'opponent', nick: 'Worthy Adversary', hp: 100, mana: 100, combo: 0, connected: true }
              ],
              vsBot: false
            });
          }, 3000 + Math.random() * 5000); // 3-8 seconds
        }
        break;
        
      case 'queue:cancel':
        // Cancel any pending match finding
        break;
    }
  }
  
  private triggerCallback(event: string, data?: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

export const socketClient = new SocketClient();