// Shadow Heist - Server (Socket.io)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create Socket.io server
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, './')));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Game rooms
const gameRooms = new Map();

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

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    // Create room
    socket.on('createRoom', ({ playerName }) => {
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
    
    // Leave room
    socket.on('leaveRoom', ({ roomId }) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) {
            return;
        }
        
        const room = gameRooms.get(roomId);
        
        // Remove player from room
        const playerIndex = room.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== -1) {
            const player = room.players[playerIndex];
            room.players.splice(playerIndex, 1);
            
            // Leave the room
            socket.leave(roomId);
            
            // If room is empty, remove it
            if (room.players.length === 0) {
                if (room.gameTimer) {
                    clearTimeout(room.gameTimer);
                }
                gameRooms.delete(roomId);
                console.log(`Room ${roomId} removed`);
                return;
            }
            
            // If host left, assign new host
            if (player.isHost && room.players.length > 0) {
                room.players[0].isHost = true;
                room.hostId = room.players[0].id;
            }
            
            // Notify others
            io.to(roomId).emit('playerLeft', {
                players: room.players,
                hostId: room.hostId
            });
            
            console.log(`Player ${player.name} left room ${roomId}`);
        }
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
        io.to(roomId).emit('gameStarted');
        
        // Send role assignments to each player
        room.players.forEach(player => {
            const extraInfo = getExtraInfo(player, room);
            io.to(player.id).emit('roleAssigned', {
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
    
    // Call meeting
    socket.on('callMeeting', ({ roomId }) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) return;
        
        const room = gameRooms.get(roomId);
        
        // Check if not already in voting or meeting phase
        if (room.phase === GamePhase.VOTING) return;
        
        // Cancel current phase timer
        if (room.gameTimer) {
            clearTimeout(room.gameTimer);
            room.gameTimer = null;
        }
        
        // Start voting phase
        startPhase(room, GamePhase.VOTING);
        
        const caller = room.players.find(p => p.id === socket.id);
        
        // Notify all players
        io.to(roomId).emit('meetingCalled', {
            caller: caller.name
        });
        
        console.log(`Meeting called in room ${roomId} by ${caller.name}`);
    });
    
    // Send chat message
    socket.on('sendMessage', ({ roomId, message }) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) return;
        
        const room = gameRooms.get(roomId);
        
        // Find sender
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;
        
        // Send message to all players in room
        io.to(roomId).emit('chatMessage', {
            player: player.name,
            message
        });
    });
    
    // Cast vote
    socket.on('castVote', ({ roomId, votedFor }) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) return;
        
        const room = gameRooms.get(roomId);
        
        // Check if in voting phase
        if (room.phase !== GamePhase.VOTING) return;
        
        // Record vote
        room.votes[socket.id] = votedFor;
        
        // Check if all votes are in
        const allVoted = room.players.every(player => 
            room.votes[player.id] !== undefined
        );
        
        // Update votes
        io.to(roomId).emit('voteUpdate', {
            votes: room.votes
        });
        
        // If all voted, end voting phase early
        if (allVoted) {
            if (room.gameTimer) {
                clearTimeout(room.gameTimer);
                room.gameTimer = null;
            }
            
            processVotes(room);
        }
    });
    
    // Complete task
    socket.on('completeTask', ({ roomId, taskIndex }) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) return;
        
        const room = gameRooms.get(roomId);
        
        // Check if in task phase
        if (room.phase !== GamePhase.TASK) return;
        
        // Check if task exists
        if (taskIndex < 0 || taskIndex >= room.tasks.list.length) return;
        
        // Increment completed tasks
        room.tasks.completed++;
        
        // Update tasks
        io.to(roomId).emit('taskUpdate', {
            total: room.tasks.total,
            completed: room.tasks.completed,
            sabotaged: room.tasks.sabotaged
        });
        
        // Check win condition
        if (room.tasks.completed >= room.tasks.total) {
            // Heroes win
            endGame(room, 'heroes');
        }
    });
    
    // Sabotage task
    socket.on('sabotageTask', ({ roomId, taskIndex }) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) return;
        
        const room = gameRooms.get(roomId);
        
        // Check if in task phase
        if (room.phase !== GamePhase.TASK) return;
        
        // Check if task exists
        if (taskIndex < 0 || taskIndex >= room.tasks.list.length) return;
        
        // Check if player is traitor
        const player = room.players.find(p => p.id === socket.id);
        if (!player || !isTraitor(player)) return;
        
        // Increment sabotaged tasks
        room.tasks.sabotaged++;
        
        // Update tasks
        io.to(roomId).emit('taskUpdate', {
            total: room.tasks.total,
            completed: room.tasks.completed,
            sabotaged: room.tasks.sabotaged
        });
        
        // Check win condition
        if (room.tasks.sabotaged >= room.tasks.total) {
            // Traitors win
            endGame(room, 'traitors');
        }
    });
    
    // Use lockpick ability
    socket.on('useLockpick', ({ roomId, targetIndex }) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) return;
        
        const room = gameRooms.get(roomId);
        
        // Check if player is Master Thief
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.role !== 'masterThief') return;
        
        // Decrement sabotaged tasks
        if (room.tasks.sabotaged > 0) {
            room.tasks.sabotaged--;
            
            // Update tasks
            io.to(roomId).emit('taskUpdate', {
                total: room.tasks.total,
                completed: room.tasks.completed,
                sabotaged: room.tasks.sabotaged
            });
            
            // Notify player
            socket.emit('abilityUsed', {
                ability: 'lockpick',
                success: true,
                message: 'You successfully removed a sabotage!'
            });
            
            // Notify others (without specifics)
            socket.to(roomId).emit('abilityUsed', {
                player: player.name,
                ability: 'unknown',
                message: `${player.name} used an ability`
            });
        }
    });
    
    // Use reveal ability
    socket.on('useReveal', ({ roomId, targetId }, callback) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) return;
        
        const room = gameRooms.get(roomId);
        
        // Check if player is Hacker
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.role !== 'hacker') return;
        
        // Find target player
        const targetPlayer = room.players.find(p => p.id === targetId);
        if (!targetPlayer) return;
        
        // Check for Double Agent (appears innocent)
        let alignment = getPlayerAlignment(targetPlayer);
        if (targetPlayer.role === 'doubleAgent') {
            alignment = 'Innocent'; // Double agent appears innocent
        }
        
        // Send result to Hacker only
        callback({
            playerName: targetPlayer.name,
            alignment
        });
        
        // Notify others (without specifics)
        socket.to(roomId).emit('abilityUsed', {
            player: player.name,
            ability: 'unknown',
            message: `${player.name} used an ability`
        });
    });
    
    // Get lockpickable targets
    socket.on('getLockpickableTargets', ({ roomId }, callback) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) return callback([]);
        
        const room = gameRooms.get(roomId);
        
        // Check if player is Master Thief
        const player = room.players.find(p => p.id === socket.id);
        if (!player || player.role !== 'masterThief') return callback([]);
        
        // Return targets (if there are sabotaged tasks)
        if (room.tasks.sabotaged > 0) {
            callback([{ id: 'sabotage', name: 'Sabotaged System' }]);
        } else {
            callback([]);
        }
    });
    
    // Play again
    socket.on('playAgain', ({ roomId }) => {
        // Check if room exists
        if (!gameRooms.has(roomId)) return;
        
        const room = gameRooms.get(roomId);
        
        // Check if in result phase
        if (room.phase !== GamePhase.RESULT) return;
        
        // Reset game
        room.phase = GamePhase.LOBBY;
        room.tasks = {
            total: 3,
            completed: 0,
            sabotaged: 0,
            list: selectRandomTasks(3)
        };
        room.votes = {};
        
        // Reset players
        room.players.forEach(player => {
            player.role = null;
            player.isReady = false;
            player.room = 'entrance';
        });
        
        // Clear any timers
        if (room.gameTimer) {
            clearTimeout(room.gameTimer);
            room.gameTimer = null;
        }
        
        // Notify all players
        io.to(roomId).emit('gameReset', {
            players: room.players
        });
        
        console.log(`Game reset in room ${roomId}`);
    });
    
    // Disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Find rooms this player is in
        gameRooms.forEach((room, roomId) => {
            const playerIndex = room.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                // Handle as if player left room
                socket.emit('leaveRoom', { roomId });
            }
        });
    });
});

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

function startPhase(room, phase) {
    // Set new phase
    room.phase = phase;
    
    // Get timeout for this phase
    let timeout = 0;
    switch (phase) {
        case GamePhase.NIGHT:
            timeout = 30 * 1000; // 30 seconds
            break;
        case GamePhase.DAY:
            timeout = 120 * 1000; // 2 minutes
            break;
        case GamePhase.TASK:
            timeout = 90 * 1000; // 1.5 minutes
            break;
        case GamePhase.VOTING:
            timeout = 45 * 1000; // 45 seconds
            break;
        default:
            timeout = 0;
    }
    
    // Set phase end time
    const timeLeft = timeout / 1000;
    room.phaseEndTime = Date.now() + timeout;
    
    // Send phase change event
    io.to(room.id).emit('phaseChanged', {
        phase,
        timeLeft,
        tasks: phase === GamePhase.TASK ? room.tasks.list : null,
        players: room.players
    });
    
    console.log(`Phase changed to ${phase} in room ${room.id}`);
    
    // Set timer for next phase
    if (timeout > 0) {
        room.gameTimer = setTimeout(() => {
            handlePhaseEnd(room);
        }, timeout);
    }
}

function handlePhaseEnd(room) {
    room.gameTimer = null;
    
    // Handle based on current phase
    switch (room.phase) {
        case GamePhase.NIGHT:
            startPhase(room, GamePhase.DAY);
            break;
        case GamePhase.DAY:
            startPhase(room, GamePhase.TASK);
            break;
        case GamePhase.TASK:
            // Alternate between night and task phases
            startPhase(room, GamePhase.NIGHT);
            break;
        case GamePhase.VOTING:
            processVotes(room);
            break;
    }
}

function processVotes(room) {
    // Count votes
    const voteCount = {};
    let skipCount = 0;
    
    room.players.forEach(player => {
        const vote = room.votes[player.id];
        if (vote === null) {
            skipCount++;
        } else if (vote) {
            voteCount[vote] = (voteCount[vote] || 0) + 1;
        }
    });
    
    // Find most voted player
    let mostVoted = null;
    let maxVotes = 0;
    
    Object.entries(voteCount).forEach(([playerId, count]) => {
        if (count > maxVotes) {
            mostVoted = playerId;
            maxVotes = count;
        } else if (count === maxVotes) {
            // Tie - no one gets banished
            mostVoted = null;
        }
    });
    
    // If most votes are skips, no one gets banished
    if (skipCount > maxVotes) {
        mostVoted = null;
    }
    
    // Handle banishment
    if (mostVoted) {
        const banishedPlayer = room.players.find(p => p.id === mostVoted);
        const banishedRole = banishedPlayer.role;
        const alignment = getPlayerAlignment(banishedPlayer);
        
        // Send vote result
        io.to(room.id).emit('voteResult', {
            banished: banishedPlayer.name,
            banishedRole: alignment,
            message: `${banishedPlayer.name} was banished`
        });
        
        // Check if all traitors are banished
        if (alignment === 'Traitor') {
            const traitorCount = room.players.filter(p => isTraitor(p) && p.id !== mostVoted).length;
            if (traitorCount === 0) {
                // Heroes win
                endGame(room, 'heroes');
                return;
            }
        }
        
        // Check if traitors outnumber heroes
        const remainingPlayers = room.players.filter(p => p.id !== mostVoted);
        const traitorCount = remainingPlayers.filter(p => isTraitor(p)).length;
        const nonTraitorCount = remainingPlayers.length - traitorCount;
        
        if (traitorCount >= nonTraitorCount) {
            // Traitors win
            endGame(room, 'traitors');
            return;
        }
    } else {
        // No one banished
        io.to(room.id).emit('voteResult', {
            banished: null,
            message: 'No one was banished'
        });
    }
    
    // Reset votes
    room.votes = {};
    
    // Continue to next phase
    startPhase(room, GamePhase.TASK);
}

function endGame(room, winner) {
    // Cancel any timers
    if (room.gameTimer) {
        clearTimeout(room.gameTimer);
        room.gameTimer = null;
    }
    
    // Set phase to result
    room.phase = GamePhase.RESULT;
    
    // Prepare player roles for revealing
    const roles = room.players.map(player => ({
        name: player.name,
        role: player.role
    }));
    
    // Send game over event
    io.to(room.id).emit('gameOver', {
        winner,
        message: winner === 'heroes' 
            ? 'The Heroes have successfully completed the heist!' 
            : 'The Traitors have sabotaged the heist!',
        roles
    });
    
    console.log(`Game ended in room ${room.id}. Winner: ${winner}`);
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

function getPlayerAlignment(player) {
    if (isTraitor(player)) {
        return 'Traitor';
    } else {
        return 'Innocent';
    }
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 