const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// Game state enum
const GamePhase = {
    LOBBY: 'lobby',
    PREP: 'prep',
    NIGHT: 'night',
    DAY: 'day',
    TASK: 'task',
    VOTING: 'voting',
    RESULT: 'result'
};

// Role types
const RoleType = {
    HERO: 'hero',
    TRAITOR: 'traitor',
    CIVILIAN: 'civilian'
};

// Tasks list
const TASKS = [
    {
        type: 'wiring',
        name: 'Connect Wires',
        description: 'Connect matching colored wires to bypass security',
        location: 'server-room'
    },
    {
        type: 'hacking',
        name: 'Bypass Firewall',
        description: 'Find and enter the correct sequence to breach the firewall',
        location: 'security'
    },
    {
        type: 'decryption',
        name: 'Decrypt Security Code',
        description: 'Decode the security pattern to gain access',
        location: 'office'
    },
    {
        type: 'memorization',
        name: 'Memory Circuit',
        description: 'Memorize and repeat the sequence to unlock the circuit',
        location: 'lab'
    },
    {
        type: 'lockpicking',
        name: 'Pick the Lock',
        description: 'Find the correct tumbler positions to open the lock',
        location: 'vault'
    }
];

// Game rooms
const gameRooms = new Map();

// Create the socket handler
exports.handler = async function(event, context) {
    // Only allow GET requests for the initial WebSocket handshake
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed'
        };
    }

    // Create HTTP server and Socket.io instance
    const httpServer = createServer();
    const ioServer = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling'],
        maxHttpBufferSize: 1e6, // 1MB
        pingTimeout: 30000,
        pingInterval: 10000
    });
    
    // Setup Socket.io connection handler
    ioServer.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        
        // Create room
        socket.on('createRoom', ({ playerName }, callback) => {
            try {
                // Generate room code
                const roomId = generateRoomCode();
                
                // Create player object
                const player = {
                    id: socket.id,
                    name: playerName,
                    isHost: true,
                    isReady: false,
                    role: null,
                    room: 'entrance',
                    color: getRandomColor()
                };
                
                // Create room
                gameRooms.set(roomId, {
                    id: roomId,
                    hostId: socket.id,
                    players: [player],
                    phase: GamePhase.LOBBY,
                    tasks: {
                        total: 3,
                        completed: 0,
                        sabotaged: 0,
                        list: selectRandomTasks(3)
                    },
                    votes: {},
                    chatHistory: [], // Add chat history storage
                    gameTimer: null,
                    phaseEndTime: null
                });
                
                // Join the room
                socket.join(roomId);
                
                // Send room created event
                socket.emit('roomCreated', {
                    roomId,
                    hostId: socket.id,
                    players: [player]
                });
                
                console.log(`Room created: ${roomId} by ${playerName}`);
                
                // Call the callback to confirm success
                if (typeof callback === 'function') callback({ success: true });
            } catch (error) {
                console.error('Error creating room:', error);
                if (typeof callback === 'function') callback({ success: false, error: error.message });
            }
        });
        
        // Join room
        socket.on('joinRoom', ({ playerName, roomId }) => {
            // Check if room exists
            if (!gameRooms.has(roomId)) {
                socket.emit('error', { message: 'Room does not exist' });
                return;
            }
            
            const room = gameRooms.get(roomId);
            
            // Check if game is in progress
            if (room.phase !== GamePhase.LOBBY) {
                socket.emit('error', { message: 'Game already in progress' });
                return;
            }
            
            // Check if room is full
            if (room.players.length >= 6) {
                socket.emit('error', { message: 'Room is full' });
                return;
            }
            
            // Create player object
            const player = {
                id: socket.id,
                name: playerName,
                isHost: false,
                isReady: false,
                role: null,
                room: 'entrance',
                color: getRandomColor()
            };
            
            // Add player to room
            room.players.push(player);
            
            // Join the room
            socket.join(roomId);
            
            // Send joined room event
            socket.emit('joinedRoom', {
                roomId,
                hostId: room.hostId,
                players: room.players
            });
            
            // Notify others
            socket.to(roomId).emit('playerJoined', {
                players: room.players
            });
            
            console.log(`Player ${playerName} joined room ${roomId}`);
        });
        
        // Start game
        socket.on('startGame', ({ roomId }) => {
            // Check if room exists
            if (!gameRooms.has(roomId)) {
                socket.emit('error', { message: 'Room does not exist' });
                return;
            }
            
            const room = gameRooms.get(roomId);
            
            // Check if sender is host
            if (socket.id !== room.hostId) {
                socket.emit('error', { message: 'Only the host can start the game' });
                return;
            }
            
            // Check if enough players
            if (room.players.length < 3) {
                socket.emit('error', { message: 'Need at least 3 players to start' });
                return;
            }
            
            // Assign roles
            assignRoles(room);
            
            // Set game phase
            room.phase = GamePhase.PREP;
            
            // Notify all players
            ioServer.to(roomId).emit('gameStarted');
            
            // Send role assignments to each player
            room.players.forEach(player => {
                const extraInfo = getExtraInfo(player, room);
                ioServer.to(player.id).emit('roleAssigned', {
                    role: player.role,
                    extraInfo
                });
            });
            
            // Start first phase (night)
            setTimeout(() => {
                startPhase(room, GamePhase.NIGHT);
            }, 5000);
            
            console.log(`Game started in room ${roomId}`);
        });

        // Enhanced message handling
        socket.on('sendMessage', (data) => {
            const { roomId, message, timestamp, senderId } = data;
            
            // Check if room exists
            if (!gameRooms.has(roomId)) {
                socket.emit('error', { message: 'Room does not exist' });
                return;
            }
            
            const room = gameRooms.get(roomId);
            
            // Find player
            const player = room.players.find(p => p.id === socket.id);
            if (!player) {
                socket.emit('error', { message: 'Player not found in room' });
                return;
            }
            
            // Create message object
            const messageObj = {
                id: uuidv4(),
                player: player.name,
                senderId: socket.id,
                message,
                timestamp: timestamp || Date.now(),
                role: player.role // Include role for potential special formatting
            };
            
            // Store in chat history
            if (!room.chatHistory) room.chatHistory = [];
            room.chatHistory.push(messageObj);
            
            // Limit history to 100 messages
            if (room.chatHistory.length > 100) {
                room.chatHistory = room.chatHistory.slice(-100);
            }
            
            // Broadcast message to all players in the room
            ioServer.to(roomId).emit('chatMessage', messageObj);
        });
        
        // Get chat history
        socket.on('getChatHistory', ({ roomId }, callback) => {
            // Check if room exists
            if (!gameRooms.has(roomId)) {
                socket.emit('error', { message: 'Room does not exist' });
                return;
            }
            
            const room = gameRooms.get(roomId);
            
            // Return chat history
            if (typeof callback === 'function') {
                callback(room.chatHistory || []);
            } else {
                socket.emit('chatHistory', room.chatHistory || []);
            }
        });
        
        // Disconnect
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            
            // Find rooms this player is in
            gameRooms.forEach((room, roomId) => {
                const playerIndex = room.players.findIndex(p => p.id === socket.id);
                if (playerIndex !== -1) {
                    const player = room.players[playerIndex];
                    
                    // Remove player from room
                    room.players.splice(playerIndex, 1);
                    
                    // Notify other players
                    socket.to(roomId).emit('playerLeft', {
                        players: room.players,
                        leftPlayer: player.name
                    });
                    
                    // Add system message to chat
                    const systemMessage = {
                        id: uuidv4(),
                        player: 'System',
                        senderId: 'system',
                        message: `${player.name} has left the heist.`,
                        timestamp: Date.now(),
                        type: 'system'
                    };
                    
                    if (!room.chatHistory) room.chatHistory = [];
                    room.chatHistory.push(systemMessage);
                    
                    // Broadcast system message
                    ioServer.to(roomId).emit('chatMessage', systemMessage);
                    
                    // If room is empty, delete it
                    if (room.players.length === 0) {
                        gameRooms.delete(roomId);
                        console.log(`Room deleted: ${roomId}`);
                    }
                    // If host left, assign new host
                    else if (socket.id === room.hostId) {
                        room.hostId = room.players[0].id;
                        room.players[0].isHost = true;
                        
                        // Notify new host
                        ioServer.to(room.hostId).emit('becameHost');
                        
                        // Notify all players of new host
                        ioServer.to(roomId).emit('newHost', {
                            hostId: room.hostId,
                            hostName: room.players[0].name
                        });
                    }
                }
            });
        });
    });

    return {
        statusCode: 200,
        body: 'Socket server is running'
    };
};

// Helper functions
function generateRoomCode() {
    // Generate a 6-character alphanumeric code
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
}

function getRandomColor() {
    const colors = [
        '#8e44ad', // Purple
        '#2980b9', // Blue
        '#27ae60', // Green
        '#d35400', // Orange
        '#c0392b', // Red
        '#16a085', // Teal
        '#f39c12', // Yellow
        '#7f8c8d'  // Gray
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function selectRandomTasks(count) {
    // Shuffle and select random tasks
    const shuffled = [...TASKS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function assignRoles(room) {
    const roles = [];
    
    // Always include Master Thief and Hacker
    roles.push('masterThief', 'hacker');
    
    // Always include Infiltrator and Double Agent
    roles.push('infiltrator', 'doubleAgent');
    
    // Fill remaining slots with civilians
    const remainingSlots = room.players.length - roles.length;
    for (let i = 0; i < remainingSlots; i++) {
        roles.push(i === 0 ? 'civilian1' : 'civilian2');
    }
    
    // Shuffle roles
    const shuffledRoles = shuffleArray(roles);
    
    // Assign roles to players
    room.players.forEach((player, index) => {
        player.role = shuffledRoles[index];
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getExtraInfo(player, room) {
    // Additional information based on role
    switch (player.role) {
        case 'masterThief': {
            // Know one innocent player
            const innocentPlayers = room.players.filter(p => 
                p.id !== player.id && 
                !isTraitor(p) &&
                p.role !== 'doubleAgent' // Double agent appears innocent but isn't
            );
            
            if (innocentPlayers.length > 0) {
                const knownPlayer = innocentPlayers[Math.floor(Math.random() * innocentPlayers.length)];
                return `You know that ${knownPlayer.name} is innocent.`;
            }
            break;
        }
        case 'infiltrator':
        case 'doubleAgent': {
            // Know who the other traitor is
            const otherTraitor = room.players.find(p => 
                p.id !== player.id && isTraitor(p)
            );
            
            if (otherTraitor) {
                return `Your fellow traitor is ${otherTraitor.name}.`;
            }
            break;
        }
    }
    
    return null;
}

function isTraitor(player) {
    return player.role === 'infiltrator' || player.role === 'doubleAgent';
} 