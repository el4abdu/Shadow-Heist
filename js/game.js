// Shadow Heist - Main Game Logic

// Game configuration
const GAME_CONFIG = {
    maxPlayers: 6,
    taskCount: 3,
    roles: {
        masterThief: {
            name: 'Master Thief',
            type: 'hero',
            description: 'You know one innocent player. You can lockpick to delay sabotage.',
            ability: 'lockpick'
        },
        hacker: {
            name: 'Hacker',
            type: 'hero',
            description: 'You can reveal a player\'s true alignment once per game.',
            ability: 'reveal'
        },
        infiltrator: {
            name: 'Infiltrator',
            type: 'traitor',
            description: 'You can sabotage tasks secretly. You can frame a player as suspicious.',
            ability: 'sabotage'
        },
        doubleAgent: {
            name: 'Double Agent',
            type: 'traitor',
            description: 'You appear innocent in investigations. You can fake tasks.',
            ability: 'fake'
        },
        civilian1: {
            name: 'Civilian',
            type: 'civilian',
            description: 'Complete tasks to win the heist. Be careful of being framed.',
            ability: 'none'
        },
        civilian2: {
            name: 'Civilian',
            type: 'civilian',
            description: 'Complete tasks to win the heist. Be careful of being framed.',
            ability: 'none'
        }
    },
    gamePhases: ['prep', 'night', 'day', 'task', 'voting', 'result'],
    timeouts: {
        night: 30, // seconds
        day: 120,
        voting: 45,
        task: 90
    }
};

// Game state
let gameState = {
    roomId: null,
    players: [],
    playerRole: null,
    phase: null,
    tasks: {
        total: GAME_CONFIG.taskCount,
        completed: 0,
        sabotaged: 0
    },
    time: 0,
    votingResults: {},
    messages: [],
    gameOver: false,
    winner: null
};

// Socket connection
let socket;

// DOM Elements
const screens = {
    welcome: document.getElementById('welcome-screen'),
    lobby: document.getElementById('lobby-screen'),
    game: document.getElementById('game-screen'),
    meeting: document.getElementById('meeting-screen'),
    result: document.getElementById('result-screen')
};

const elements = {
    playerName: document.getElementById('player-name'),
    joinGameBtn: document.getElementById('join-game-btn'),
    createGameBtn: document.getElementById('create-game-btn'),
    roomCode: document.getElementById('room-code'),
    playersList: document.getElementById('players'),
    startGameBtn: document.getElementById('start-game-btn'),
    leaveLobbyBtn: document.getElementById('leave-lobby-btn'),
    timeCounter: document.getElementById('time-counter'),
    tasksCompleted: document.getElementById('tasks-completed'),
    sabotageCounter: document.getElementById('sabotage-counter'),
    roleName: document.getElementById('role-name'),
    useAbilityBtn: document.getElementById('use-ability-btn'),
    reportBtn: document.getElementById('report-btn'),
    votingPlayers: document.getElementById('voting-players'),
    votingTimer: document.getElementById('voting-timer'),
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    sendChatBtn: document.getElementById('send-chat-btn'),
    resultTitle: document.getElementById('result-title'),
    resultMessage: document.getElementById('result-message'),
    playerRoles: document.getElementById('player-roles'),
    playAgainBtn: document.getElementById('play-again-btn'),
    gameModal: document.getElementById('game-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalContent: document.getElementById('modal-content'),
    closeModal: document.querySelector('.close-modal'),
    gameMap: document.querySelector('.game-map'),
    taskContainer: document.getElementById('task-container')
};

// Initialize
function init() {
    // Connect to Socket.io server
    connectToServer();
    
    // Add event listeners
    addEventListeners();
}

// Connect to Socket.io server
function connectToServer() {
    // Determine server URL based on environment
    let serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000'  // Local development
        : window.location.origin;  // Production (Netlify)
    
    // Connect to Socket.io
    socket = io(serverUrl, {
        path: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? '/' // Local development
            : '/.netlify/functions/socket-server' // Production (Netlify serverless function)
    });
    
    // Add connection status handlers
    socket.on('connect', handleSocketConnect);
    socket.on('connect_error', handleSocketError);
    socket.on('disconnect', handleSocketDisconnect);
    
    // Set up other Socket event listeners
    setupSocketListeners();
}

// Handle socket connection
function handleSocketConnect() {
    console.log('Connected to server');
    UI.showToast('Connected to server', 'success');
    
    // Check if reconnecting with active game
    if (gameState.roomId) {
        // TODO: Implement reconnection logic
        console.log('Reconnecting to room:', gameState.roomId);
    }
}

// Handle socket error
function handleSocketError(error) {
    console.error('Socket connection error:', error);
    UI.showToast('Connection error. Retrying...', 'error');
}

// Handle socket disconnection
function handleSocketDisconnect(reason) {
    console.log('Disconnected from server:', reason);
    UI.showToast('Disconnected from server. Trying to reconnect...', 'warning');
}

// Socket event listeners
function setupSocketListeners() {
    socket.on('roomCreated', handleRoomCreated);
    socket.on('joinedRoom', handleJoinedRoom);
    socket.on('playerJoined', handlePlayerJoined);
    socket.on('playerLeft', handlePlayerLeft);
    socket.on('gameStarted', handleGameStarted);
    socket.on('roleAssigned', handleRoleAssigned);
    socket.on('phaseChanged', handlePhaseChanged);
    socket.on('taskUpdate', handleTaskUpdate);
    socket.on('chatMessage', handleChatMessage);
    socket.on('voteUpdate', handleVoteUpdate);
    socket.on('voteResult', handleVoteResult);
    socket.on('gameOver', handleGameOver);
    socket.on('error', handleError);
}

// Event handlers for UI interactions
function addEventListeners() {
    // Welcome screen
    elements.joinGameBtn.addEventListener('click', joinGame);
    elements.createGameBtn.addEventListener('click', createGame);
    elements.playerName.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') joinGame();
    });
    
    // Lobby screen
    elements.startGameBtn.addEventListener('click', startGame);
    elements.leaveLobbyBtn.addEventListener('click', leaveLobby);
    
    // Game screen
    elements.useAbilityBtn.addEventListener('click', useAbility);
    elements.reportBtn.addEventListener('click', callMeeting);
    
    // Meeting screen
    elements.sendChatBtn.addEventListener('click', sendChatMessage);
    elements.chatInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Result screen
    elements.playAgainBtn.addEventListener('click', playAgain);
    
    // Modal
    elements.closeModal.addEventListener('click', closeModal);
}

// Socket event handlers
function handleRoomCreated(data) {
    gameState.roomId = data.roomId;
    showScreen('lobby');
    elements.roomCode.textContent = data.roomId;
    updatePlayersList(data.players);
    
    // Only show start button to host
    elements.startGameBtn.style.display = socket.id === data.hostId ? 'block' : 'none';
}

function handleJoinedRoom(data) {
    gameState.roomId = data.roomId;
    showScreen('lobby');
    elements.roomCode.textContent = data.roomId;
    updatePlayersList(data.players);
    
    // Only show start button to host
    elements.startGameBtn.style.display = socket.id === data.hostId ? 'block' : 'none';
}

function handlePlayerJoined(data) {
    updatePlayersList(data.players);
}

function handlePlayerLeft(data) {
    updatePlayersList(data.players);
}

function handleGameStarted() {
    showScreen('game');
    gameState.phase = 'prep';
}

function handleRoleAssigned(data) {
    gameState.playerRole = data.role;
    elements.roleName.textContent = `Role: ${GAME_CONFIG.roles[data.role].name}`;
    
    // Show role information modal
    const role = GAME_CONFIG.roles[data.role];
    showModal('Your Role: ' + role.name, `
        <div class="role-info">
            <p><strong>Type:</strong> ${role.type}</p>
            <p><strong>Description:</strong> ${role.description}</p>
            <p><strong>Ability:</strong> ${role.ability}</p>
            ${data.extraInfo ? `<p><strong>Intel:</strong> ${data.extraInfo}</p>` : ''}
        </div>
    `);
}

function handlePhaseChanged(data) {
    gameState.phase = data.phase;
    
    switch (data.phase) {
        case 'night':
            handleNightPhase(data);
            break;
        case 'day':
            handleDayPhase(data);
            break;
        case 'task':
            handleTaskPhase(data);
            break;
        case 'voting':
            handleVotingPhase(data);
            break;
        case 'result':
            handleResultPhase(data);
            break;
    }
    
    // Update timer
    if (data.timeLeft) {
        startPhaseTimer(data.timeLeft);
    }
}

function handleTaskUpdate(data) {
    gameState.tasks = data;
    elements.tasksCompleted.textContent = data.completed;
    elements.sabotageCounter.textContent = data.sabotaged;
}

function handleChatMessage(data) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `<strong>${data.player}:</strong> ${data.message}`;
    elements.chatMessages.appendChild(messageElement);
    
    // Auto-scroll to bottom
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

function handleVoteUpdate(data) {
    gameState.votingResults = data.votes;
    updateVotingUI();
}

function handleVoteResult(data) {
    showModal('Vote Results', `
        <div class="vote-result">
            <p>${data.message}</p>
            ${data.banished ? `<p>${data.banished} was banished and was a ${data.banishedRole}.</p>` : ''}
        </div>
    `);
    
    // Timeout to close the modal and continue
    setTimeout(() => {
        closeModal();
    }, 3000);
}

function handleGameOver(data) {
    gameState.gameOver = true;
    gameState.winner = data.winner;
    
    showScreen('result');
    elements.resultTitle.textContent = data.winner === 'heroes' ? 'HEIST SUCCESSFUL' : 'HEIST FAILED';
    elements.resultMessage.textContent = data.message;
    
    // Display all player roles
    elements.playerRoles.innerHTML = '';
    data.roles.forEach(player => {
        const roleCard = document.createElement('div');
        roleCard.className = 'player-role-card';
        roleCard.innerHTML = `
            <div class="role-title">${player.name}</div>
            <div class="role-text">${GAME_CONFIG.roles[player.role].name} (${GAME_CONFIG.roles[player.role].type})</div>
        `;
        elements.playerRoles.appendChild(roleCard);
    });
}

function handleError(data) {
    showModal('Error', `<p>${data.message}</p>`);
}

// UI update functions
function showScreen(screenName) {
    // Hide all screens
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show requested screen
    screens[screenName].classList.add('active');
}

function updatePlayersList(players) {
    gameState.players = players;
    elements.playersList.innerHTML = '';
    
    players.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.innerHTML = `
            <div class="player-item ${player.id === socket.id ? 'current-player' : ''}">
                ${player.name} ${player.isHost ? '(Host)' : ''}
            </div>
        `;
        elements.playersList.appendChild(playerItem);
    });
}

function showModal(title, content) {
    elements.modalTitle.textContent = title;
    elements.modalContent.innerHTML = content;
    elements.gameModal.style.display = 'block';
}

function closeModal() {
    elements.gameModal.style.display = 'none';
}

function startPhaseTimer(seconds) {
    // Update timer display
    updateTimerDisplay(seconds);
    
    // Clear any existing timer
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // Start new timer
    let timeLeft = seconds;
    gameState.timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(gameState.timerInterval);
        }
    }, 1000);
}

function updateTimerDisplay(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    elements.timeCounter.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    
    // Also update voting timer if in voting phase
    if (gameState.phase === 'voting') {
        elements.votingTimer.textContent = seconds;
    }
}

// Phase handlers
function handleNightPhase(data) {
    // Update UI for night phase
    if (isTraitor()) {
        // Show sabotage options
        showSabotageOptions();
    } else if (isHero()) {
        // Show hero abilities
        showHeroAbilities();
    }
}

function handleDayPhase(data) {
    // Update UI for day phase - discussions
    showScreen('game');
}

function handleTaskPhase(data) {
    // Update UI for task phase
    showScreen('game');
    
    // Load tasks for player
    loadTasks(data.tasks);
}

function handleVotingPhase(data) {
    // Update UI for voting phase
    showScreen('meeting');
    
    // Populate voting UI
    populateVotingUI(data.players);
}

function handleResultPhase(data) {
    // Result is handled by the gameOver event
}

// Voting UI
function populateVotingUI(players) {
    elements.votingPlayers.innerHTML = '';
    
    players.forEach(player => {
        if (player.id === socket.id) return; // Skip self
        
        const playerCard = document.createElement('div');
        playerCard.className = 'player-vote-card';
        playerCard.dataset.playerId = player.id;
        playerCard.innerHTML = `<div class="player-name">${player.name}</div>`;
        
        playerCard.addEventListener('click', () => {
            voteForPlayer(player.id);
        });
        
        elements.votingPlayers.appendChild(playerCard);
    });
    
    // Add a "Skip Vote" option
    const skipCard = document.createElement('div');
    skipCard.className = 'player-vote-card skip-vote';
    skipCard.innerHTML = `<div class="player-name">Skip Vote</div>`;
    skipCard.addEventListener('click', () => {
        voteForPlayer(null);
    });
    elements.votingPlayers.appendChild(skipCard);
}

function updateVotingUI() {
    // Clear selection
    document.querySelectorAll('.player-vote-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Highlight selected vote if any
    const myVote = gameState.votingResults[socket.id];
    if (myVote) {
        const selectedCard = document.querySelector(`.player-vote-card[data-player-id="${myVote}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        } else if (myVote === null) {
            document.querySelector('.skip-vote').classList.add('selected');
        }
    }
}

// Tasks
function loadTasks(tasks) {
    elements.taskContainer.innerHTML = '';
    
    tasks.forEach((task, index) => {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div class="task-name">${task.name}</div>
            <div class="task-description">${task.description}</div>
        `;
        
        taskElement.addEventListener('click', () => {
            startTask(task, index);
        });
        
        elements.taskContainer.appendChild(taskElement);
    });
}

function startTask(task, taskIndex) {
    // Show task in modal
    showModal(task.name, `
        <div class="task-game" id="task-game-container">
            <!-- Task will be loaded here -->
            <p>${task.description}</p>
            <div class="task-controls">
                <button id="complete-task-btn" class="btn primary-btn">Complete Task</button>
                ${isTraitor() ? '<button id="sabotage-task-btn" class="btn danger-btn">Sabotage</button>' : ''}
            </div>
        </div>
    `);
    
    // Load the specific task mini-game
    loadTaskGame(task.type, document.getElementById('task-game-container'));
    
    // Add event listeners for task buttons
    document.getElementById('complete-task-btn').addEventListener('click', () => {
        completeTask(taskIndex);
    });
    
    if (isTraitor()) {
        document.getElementById('sabotage-task-btn').addEventListener('click', () => {
            sabotageTask(taskIndex);
        });
    }
}

// Player actions
function joinGame() {
    const playerName = elements.playerName.value.trim();
    if (!playerName) {
        showModal('Error', '<p>Please enter a name</p>');
        return;
    }
    
    const roomId = prompt('Enter the room code:');
    if (!roomId) return;
    
    socket.emit('joinRoom', { playerName, roomId });
}

function createGame() {
    const playerName = elements.playerName.value.trim();
    if (!playerName) {
        showModal('Error', '<p>Please enter a name</p>');
        return;
    }
    
    socket.emit('createRoom', { playerName });
}

function startGame() {
    if (gameState.players.length < 3) {
        showModal('Error', '<p>You need at least 3 players to start</p>');
        return;
    }
    
    socket.emit('startGame', { roomId: gameState.roomId });
}

function leaveLobby() {
    socket.emit('leaveRoom', { roomId: gameState.roomId });
    showScreen('welcome');
    gameState.roomId = null;
    gameState.players = [];
}

function useAbility() {
    if (gameState.phase !== 'night' && gameState.phase !== 'day') {
        showModal('Error', '<p>You can only use abilities during night or day phases</p>');
        return;
    }
    
    const role = gameState.playerRole;
    const ability = GAME_CONFIG.roles[role].ability;
    
    // Different ability logic based on role
    switch (ability) {
        case 'lockpick':
            showLockpickOptions();
            break;
        case 'reveal':
            showRevealOptions();
            break;
        case 'sabotage':
            showSabotageOptions();
            break;
        case 'fake':
            showFakeTaskOptions();
            break;
        default:
            showModal('No Ability', '<p>You don\'t have a special ability to use</p>');
    }
}

function callMeeting() {
    socket.emit('callMeeting', { roomId: gameState.roomId });
}

function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    socket.emit('sendMessage', { roomId: gameState.roomId, message });
    elements.chatInput.value = '';
}

function voteForPlayer(playerId) {
    socket.emit('castVote', { roomId: gameState.roomId, votedFor: playerId });
}

function completeTask(taskIndex) {
    socket.emit('completeTask', { roomId: gameState.roomId, taskIndex });
    closeModal();
}

function sabotageTask(taskIndex) {
    socket.emit('sabotageTask', { roomId: gameState.roomId, taskIndex });
    closeModal();
}

function playAgain() {
    // Reset game state
    socket.emit('playAgain', { roomId: gameState.roomId });
}

// Helper functions for abilities
function showLockpickOptions() {
    // Get the current sabotaged task (if any)
    socket.emit('getLockpickableTargets', { roomId: gameState.roomId }, (targets) => {
        if (!targets || targets.length === 0) {
            showModal('Lockpick', '<p>There are no sabotaged tasks to lockpick right now</p>');
            return;
        }
        
        let content = '<div class="ability-options"><p>Choose a sabotaged task to lockpick:</p><div class="options-list">';
        targets.forEach((target, index) => {
            content += `<button class="btn secondary-btn lockpick-option" data-index="${index}">${target.name}</button>`;
        });
        content += '</div></div>';
        
        showModal('Lockpick Ability', content);
        
        // Add event listeners
        document.querySelectorAll('.lockpick-option').forEach(option => {
            option.addEventListener('click', () => {
                const index = option.dataset.index;
                socket.emit('useLockpick', { roomId: gameState.roomId, targetIndex: index });
                closeModal();
            });
        });
    });
}

function showRevealOptions() {
    // Get other players
    const otherPlayers = gameState.players.filter(player => player.id !== socket.id);
    
    if (otherPlayers.length === 0) {
        showModal('Reveal', '<p>There are no other players to investigate</p>');
        return;
    }
    
    let content = '<div class="ability-options"><p>Choose a player to investigate:</p><div class="options-list">';
    otherPlayers.forEach(player => {
        content += `<button class="btn secondary-btn reveal-option" data-player-id="${player.id}">${player.name}</button>`;
    });
    content += '</div></div>';
    
    showModal('Reveal Ability', content);
    
    // Add event listeners
    document.querySelectorAll('.reveal-option').forEach(option => {
        option.addEventListener('click', () => {
            const playerId = option.dataset.playerId;
            socket.emit('useReveal', { roomId: gameState.roomId, targetId: playerId }, (result) => {
                showModal('Investigation Result', `<p>${result.playerName} is a ${result.alignment}!</p>`);
            });
        });
    });
}

function showSabotageOptions() {
    // This will be shown automatically during night phase for traitors
}

function showFakeTaskOptions() {
    // Implement fake task selection logic
    showModal('Fake Task', `
        <div class="ability-options">
            <p>You can pretend to complete tasks without actually doing so.</p>
            <p>During task phase, start a task but click "Complete Task" without actually solving it.</p>
            <p>This will make you appear to be doing tasks to others.</p>
        </div>
    `);
}

// Utility functions
function isTraitor() {
    const role = gameState.playerRole;
    return GAME_CONFIG.roles[role].type === 'traitor';
}

function isHero() {
    const role = gameState.playerRole;
    return GAME_CONFIG.roles[role].type === 'hero';
}

function isCivilian() {
    const role = gameState.playerRole;
    return GAME_CONFIG.roles[role].type === 'civilian';
}

// Initialize the game when the page loads
window.addEventListener('load', init); 