/*
=============================================================================
ARCANE DICTION - MULTIPLAYER SERVER (Node.js + Socket.IO)
=============================================================================

This is the server-side implementation for Arcane Diction's multiplayer
matchmaking and real-time game synchronization.

FEATURES:
- Quick match queue system
- Private room creation with codes
- Bot fallback for disconnections
- Anti-spam casting protection
- WebRTC signaling passthrough
- Player state synchronization

RUN INSTRUCTIONS:
1. npm init -y
2. npm install express socket.io cors
3. node server-snippet.js
4. Server runs on http://localhost:3001
5. Update client socketClient.connect() to use this URL

ENVIRONMENT:
- Set PORT=3001 (default)
- Set NODE_ENV=production for deployment
- Consider rate limiting for production use

=============================================================================
*/

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://your-domain.com"],
    methods: ["GET", "POST"]
  }
});

// Server state
const gameState = {
  // Quick match queue
  quickQueue: [],
  
  // Active rooms
  rooms: new Map(),
  
  // Room codes
  roomCodes: new Map(),
  
  // Player sockets
  players: new Map(),
  
  // Anti-spam tracking
  lastCasts: new Map()
};

// Utility functions
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(players, vsBot = false, roomCode = null) {
  const roomId = 'room_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  
  const room = {
    id: roomId,
    code: roomCode,
    players: players.map(p => ({
      id: p.id,
      nick: p.nick,
      hp: 100,
      mana: 100,
      combo: 0,
      connected: true,
      socket: p.socket
    })),
    vsBot,
    state: 'waiting',
    createdAt: Date.now()
  };
  
  gameState.rooms.set(roomId, room);
  
  if (roomCode) {
    gameState.roomCodes.set(roomCode, roomId);
  }
  
  return room;
}

function cleanupRoom(roomId) {
  const room = gameState.rooms.get(roomId);
  if (room) {
    if (room.code) {
      gameState.roomCodes.delete(room.code);
    }
    gameState.rooms.delete(roomId);
  }
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Register player
  gameState.players.set(socket.id, {
    id: socket.id,
    socket: socket,
    nick: 'Player',
    inRoom: null,
    inQueue: false
  });
  
  // Handle queue join
  socket.on('queue:join', (data) => {
    const { mode, roomCode, nick } = data;
    const player = gameState.players.get(socket.id);
    
    if (!player) return;
    
    player.nick = nick || 'Player';
    
    console.log(`Player ${nick} joining queue: ${mode}`);
    
    switch (mode) {
      case 'quick':
        handleQuickMatch(player);
        break;
        
      case 'code':
        handleRoomJoin(player, roomCode);
        break;
        
      case 'bot':
        handleBotMatch(player);
        break;
    }
  });
  
  // Handle queue cancel
  socket.on('queue:cancel', () => {
    const player = gameState.players.get(socket.id);
    if (player && player.inQueue) {
      const index = gameState.quickQueue.findIndex(p => p.id === socket.id);
      if (index > -1) {
        gameState.quickQueue.splice(index, 1);
      }
      player.inQueue = false;
      socket.emit('queue:cancelled');
    }
  });
  
  // Handle room creation
  socket.on('room:create', () => {
    const roomCode = generateRoomCode();
    socket.emit('room:created', { code: roomCode });
  });
  
  // Handle spell casting
  socket.on('cast', (data) => {
    const { roomId, spellId, accuracy, loudness, power, timestamp } = data;
    const player = gameState.players.get(socket.id);
    
    // Anti-spam protection
    const lastCast = gameState.lastCasts.get(socket.id);
    const now = Date.now();
    
    if (lastCast && (now - lastCast) < 800) {
      console.log(`Cast spam detected from ${socket.id}`);
      return; // Ignore spam casts
    }
    
    gameState.lastCasts.set(socket.id, now);
    
    // Broadcast to room
    const room = gameState.rooms.get(roomId);
    if (room) {
      socket.to(roomId).emit('opponent:cast', {
        spellId,
        accuracy,
        loudness,
        power,
        timestamp,
        playerId: socket.id
      });
      
      console.log(`${player?.nick} cast ${spellId} in room ${roomId}`);
    }
  });
  
  // Handle state updates
  socket.on('state:update', (data) => {
    const { roomId, hp, mana, combo } = data;
    const room = gameState.rooms.get(roomId);
    
    if (room) {
      // Update player state in room
      const playerInRoom = room.players.find(p => p.id === socket.id);
      if (playerInRoom) {
        playerInRoom.hp = hp;
        playerInRoom.mana = mana;
        playerInRoom.combo = combo;
        
        // Broadcast to other players
        socket.to(roomId).emit('opponent:state', {
          playerId: socket.id,
          hp,
          mana,
          combo
        });
      }
    }
  });
  
  // WebRTC signaling passthrough
  socket.on('rtc:signal', (data) => {
    const { roomId, to, signal } = data;
    socket.to(to).emit('rtc:signal', {
      from: socket.id,
      signal
    });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    handleDisconnection(socket.id);
  });
});

// Quick match handling
function handleQuickMatch(player) {
  player.inQueue = true;
  gameState.quickQueue.push(player);
  
  player.socket.emit('queue:waiting');
  
  // Try to match immediately
  if (gameState.quickQueue.length >= 2) {
    const player1 = gameState.quickQueue.shift();
    const player2 = gameState.quickQueue.shift();
    
    player1.inQueue = false;
    player2.inQueue = false;
    
    const room = createRoom([player1, player2], false);
    
    // Add players to socket room
    player1.socket.join(room.id);
    player2.socket.join(room.id);
    
    player1.inRoom = room.id;
    player2.inRoom = room.id;
    
    // Notify players
    io.to(room.id).emit('match:found', {
      roomId: room.id,
      players: room.players.map(p => ({ id: p.id, nick: p.nick, hp: p.hp, mana: p.mana, combo: p.combo })),
      vsBot: false
    });
    
    console.log(`Match created: ${player1.nick} vs ${player2.nick}`);
    
    // Start countdown
    setTimeout(() => {
      io.to(room.id).emit('match:start', { countdown: 3 });
    }, 1000);
  } else {
    // Set timeout for bot fallback
    setTimeout(() => {
      if (player.inQueue) {
        const index = gameState.quickQueue.findIndex(p => p.id === player.id);
        if (index > -1) {
          gameState.quickQueue.splice(index, 1);
          player.inQueue = false;
          
          player.socket.emit('queue:timeout');
          
          // Offer bot match
          setTimeout(() => {
            handleBotMatch(player);
          }, 1000);
        }
      }
    }, 15000); // 15 second timeout
  }
}

// Room join handling
function handleRoomJoin(player, roomCode) {
  if (!roomCode) {
    player.socket.emit('error', { message: 'Room code required' });
    return;
  }
  
  const roomId = gameState.roomCodes.get(roomCode);
  if (!roomId) {
    player.socket.emit('error', { message: 'Room not found' });
    return;
  }
  
  const room = gameState.rooms.get(roomId);
  if (!room) {
    player.socket.emit('error', { message: 'Room no longer exists' });
    return;
  }
  
  if (room.players.length >= 2) {
    player.socket.emit('error', { message: 'Room is full' });
    return;
  }
  
  // Add player to room
  room.players.push({
    id: player.id,
    nick: player.nick,
    hp: 100,
    mana: 100,
    combo: 0,
    connected: true,
    socket: player.socket
  });
  
  player.socket.join(room.id);
  player.inRoom = room.id;
  
  // Notify all players
  io.to(room.id).emit('match:found', {
    roomId: room.id,
    players: room.players.map(p => ({ id: p.id, nick: p.nick, hp: p.hp, mana: p.mana, combo: p.combo })),
    vsBot: false
  });
  
  console.log(`${player.nick} joined room ${roomCode}`);
  
  // Start match if room is full
  if (room.players.length === 2) {
    setTimeout(() => {
      io.to(room.id).emit('match:start', { countdown: 3 });
    }, 1000);
  }
}

// Bot match handling
function handleBotMatch(player) {
  const room = createRoom([player], true);
  
  // Add bot player
  room.players.push({
    id: 'bot',
    nick: 'AI Opponent',
    hp: 100,
    mana: 100,
    combo: 0,
    connected: true,
    socket: null
  });
  
  player.socket.join(room.id);
  player.inRoom = room.id;
  
  player.socket.emit('match:found', {
    roomId: room.id,
    players: room.players.map(p => ({ id: p.id, nick: p.nick, hp: p.hp, mana: p.mana, combo: p.combo })),
    vsBot: true
  });
  
  console.log(`Bot match created for ${player.nick}`);
  
  setTimeout(() => {
    player.socket.emit('match:start', { countdown: 3 });
  }, 1000);
}

// Handle player disconnection
function handleDisconnection(socketId) {
  const player = gameState.players.get(socketId);
  
  if (player) {
    // Remove from queue
    if (player.inQueue) {
      const index = gameState.quickQueue.findIndex(p => p.id === socketId);
      if (index > -1) {
        gameState.quickQueue.splice(index, 1);
      }
    }
    
    // Handle room disconnection
    if (player.inRoom) {
      const room = gameState.rooms.get(player.inRoom);
      if (room) {
        // Notify other players
        player.socket.to(player.inRoom).emit('opponent:disconnected', {
          playerId: socketId
        });
        
        // Clean up room if empty or offer bot replacement
        const remainingPlayers = room.players.filter(p => p.id !== socketId && p.socket);
        if (remainingPlayers.length === 0) {
          cleanupRoom(player.inRoom);
        } else if (remainingPlayers.length === 1 && !room.vsBot) {
          // Offer bot replacement
          const remainingPlayer = remainingPlayers[0];
          remainingPlayer.socket.emit('opponent:left', {
            message: 'Your opponent disconnected. Switching to bot...'
          });
          
          setTimeout(() => {
            room.vsBot = true;
            room.players = [remainingPlayer, {
              id: 'bot',
              nick: 'AI Opponent',
              hp: 100,
              mana: 100,
              combo: 0,
              connected: true,
              socket: null
            }];
            
            remainingPlayer.socket.emit('bot:joined');
          }, 2000);
        }
      }
    }
    
    gameState.players.delete(socketId);
    gameState.lastCasts.delete(socketId);
  }
}

// Cleanup old rooms periodically
setInterval(() => {
  const now = Date.now();
  const oldRooms = [];
  
  gameState.rooms.forEach((room, roomId) => {
    if (now - room.createdAt > 3600000) { // 1 hour
      oldRooms.push(roomId);
    }
  });
  
  oldRooms.forEach(roomId => {
    console.log(`Cleaning up old room: ${roomId}`);
    cleanupRoom(roomId);
  });
}, 300000); // Check every 5 minutes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    players: gameState.players.size,
    rooms: gameState.rooms.size,
    queue: gameState.quickQueue.length,
    uptime: process.uptime()
  });
});

// CORS middleware
app.use(cors());

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🧙‍♂️ Arcane Diction Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});