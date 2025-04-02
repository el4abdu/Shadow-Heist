// Shadow Heist - UI Utilities

// Additional UI elements not directly related to core game mechanics
document.addEventListener('DOMContentLoaded', () => {
    // Set up any global UI elements, animations, transitions, etc.
    setupModalHandlers();
    setupScreenTransitions();
    setupMapRendering();
    setupTaskStyles();
});

// Screen transitions with smooth animations
function setupScreenTransitions() {
    // Fade-in animation for screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.addEventListener('transitionend', (e) => {
            if (e.propertyName === 'opacity' && !screen.classList.contains('active')) {
                screen.style.display = 'none';
            }
        });
    });
}

// Modal handlers
function setupModalHandlers() {
    const modal = document.getElementById('game-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Close modal when clicking the X
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Prevent propagation on modal content
    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// Game map rendering
function setupMapRendering() {
    const gameMap = document.querySelector('.game-map');
    if (!gameMap) return;
    
    // Create the game map (will be a simple grid for demo)
    renderMap(gameMap);
}

// Task styling elements
function setupTaskStyles() {
    // Add additional CSS for task minigames
    addTaskStyles();
}

// Render game map
function renderMap(container) {
    // For demo, create a simple grid-based map
    const mapHTML = `
        <div class="game-map-container">
            <div class="map-grid">
                ${generateMapCells()}
            </div>
            <div class="player-markers" id="player-markers"></div>
        </div>
    `;
    
    container.innerHTML = mapHTML;
    
    // Add player markers (will be updated via Socket.io)
    updatePlayerPositions([]);
}

// Generate map grid cells
function generateMapCells() {
    const rooms = [
        { id: 'entrance', name: 'Entrance', type: 'neutral' },
        { id: 'server-room', name: 'Server Room', type: 'task' },
        { id: 'vault', name: 'Vault', type: 'task' },
        { id: 'security', name: 'Security Office', type: 'task' },
        { id: 'lab', name: 'Research Lab', type: 'task' },
        { id: 'office', name: 'Executive Office', type: 'task' },
        { id: 'hallway1', name: 'Hallway', type: 'connecting' },
        { id: 'hallway2', name: 'Hallway', type: 'connecting' },
        { id: 'hallway3', name: 'Hallway', type: 'connecting' }
    ];
    
    return rooms.map(room => `
        <div class="map-cell ${room.type}" data-room-id="${room.id}">
            <div class="room-name">${room.name}</div>
            ${room.type === 'task' ? '<div class="task-indicator"></div>' : ''}
        </div>
    `).join('');
}

// Update player positions on map
function updatePlayerPositions(players) {
    const markerContainer = document.getElementById('player-markers');
    if (!markerContainer) return;
    
    // Clear existing markers
    markerContainer.innerHTML = '';
    
    // Add player markers
    players.forEach(player => {
        const marker = document.createElement('div');
        marker.className = 'player-marker';
        marker.dataset.playerId = player.id;
        marker.style.backgroundColor = player.color || '#8e44ad';
        
        // Position the marker based on player's room
        const roomElement = document.querySelector(`.map-cell[data-room-id="${player.room}"]`);
        if (roomElement) {
            const rect = roomElement.getBoundingClientRect();
            const containerRect = markerContainer.getBoundingClientRect();
            
            // Randomize position a bit within room
            const offsetX = Math.random() * 30 - 15;
            const offsetY = Math.random() * 30 - 15;
            
            marker.style.left = `${rect.left - containerRect.left + rect.width/2 + offsetX}px`;
            marker.style.top = `${rect.top - containerRect.top + rect.height/2 + offsetY}px`;
            
            // Add player name
            const nameTag = document.createElement('div');
            nameTag.className = 'player-name-tag';
            nameTag.textContent = player.name;
            marker.appendChild(nameTag);
            
            markerContainer.appendChild(marker);
        }
    });
}

// Add dynamic CSS for tasks
function addTaskStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Wiring Task */
        .wiring-task {
            padding: 1rem;
        }
        
        .wires-container {
            display: flex;
            justify-content: space-between;
            margin: 1rem 0;
        }
        
        .wires-left, .wires-right {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .wire {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .wire.selected {
            transform: scale(1.1);
        }
        
        .wire.connected {
            opacity: 0.7;
            cursor: default;
        }
        
        .wire-end {
            width: 20px;
            height: 20px;
            border-radius: 50%;
        }
        
        .wire-label {
            font-weight: bold;
        }
        
        .wires-connections {
            position: relative;
            height: 100%;
            width: 100%;
            min-height: 200px;
        }
        
        /* Hacking Task */
        .hacking-task {
            padding: 1rem;
            text-align: center;
        }
        
        .hack-sequence-display {
            font-size: 3rem;
            height: 5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 1rem 0;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
        }
        
        .hack-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .hack-btn {
            font-size: 1.5rem;
            padding: 1rem;
        }
        
        .hack-input {
            display: flex;
            justify-content: center;
            gap: 0.5rem;
            margin: 1rem 0;
        }
        
        .hack-input-value {
            width: 40px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
        }
        
        /* Decryption Task */
        .decryption-task {
            padding: 1rem;
        }
        
        .target-pattern, .player-pattern {
            margin: 1rem 0;
        }
        
        .decryption-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        
        .grid-cell {
            width: 60px;
            height: 60px;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .grid-cell.active {
            background-color: var(--primary-color);
            transform: scale(1.05);
        }
        
        /* Memorization Task */
        .memorization-task {
            padding: 1rem;
            text-align: center;
        }
        
        .memory-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .memory-btn {
            width: 80px;
            height: 80px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .memory-btn.active {
            transform: scale(1.1);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
        }
        
        .memory-btn.error {
            background-color: var(--danger-color) !important;
        }
        
        .memory-status {
            margin: 1rem 0;
            font-size: 1.2rem;
        }
        
        /* Lockpicking Task */
        .lockpicking-task {
            padding: 1rem;
        }
        
        .lock-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin: 1rem 0;
        }
        
        .lock-pin {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .pin-position {
            width: 30px;
            text-align: center;
            font-weight: bold;
        }
        
        .pin-slider {
            flex: 1;
        }
        
        .pin-control {
            width: 100%;
            cursor: pointer;
        }
        
        .pin-status {
            width: 80px;
            text-align: center;
        }
        
        .pin-status.correct {
            color: var(--success-color);
            font-weight: bold;
        }
        
        .pin-status.close {
            color: var(--warning-color);
        }
        
        .pin-status.far {
            color: var(--text-color);
            opacity: 0.7;
        }
        
        .pin-status.wrong {
            color: var(--danger-color);
        }
        
        .lock-feedback {
            text-align: center;
            margin-top: 1rem;
            font-style: italic;
        }
        
        /* Task completion */
        .task-complete {
            position: relative;
        }
        
        .task-complete::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 5rem;
            color: var(--success-color);
            animation: pulseSuccess 1s ease-in-out;
        }
        
        @keyframes pulseSuccess {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            70% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        
        /* Map styling */
        .game-map-container {
            position: relative;
            width: 100%;
            height: 100%;
        }
        
        .map-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 10px;
            height: 100%;
            padding: 1rem;
        }
        
        .map-cell {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 1rem;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            transition: background-color 0.3s ease;
        }
        
        .map-cell.task {
            background-color: rgba(142, 68, 173, 0.2);
        }
        
        .map-cell.neutral {
            background-color: rgba(52, 73, 94, 0.2);
        }
        
        .map-cell:hover {
            background-color: rgba(255, 255, 255, 0.15);
        }
        
        .room-name {
            font-size: 0.9rem;
            font-weight: 600;
            text-align: center;
        }
        
        .task-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: var(--primary-color);
        }
        
        .player-markers {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
        .player-marker {
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            z-index: 10;
            transition: all 0.5s ease;
        }
        
        .player-name-tag {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7rem;
            white-space: nowrap;
        }
        
        /* Toast notifications */
        .toast-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 350px;
        }
        
        .toast {
            background-color: rgba(44, 62, 80, 0.95);
            color: #fff;
            padding: 0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            overflow: hidden;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            position: relative;
            min-height: 60px;
        }
        
        .toast.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .toast-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 50px;
            height: 100%;
            font-size: 1.2rem;
            padding: 0 5px;
        }
        
        .toast.success .toast-icon {
            background-color: rgba(46, 204, 113, 0.2);
            color: #2ecc71;
        }
        
        .toast.error .toast-icon {
            background-color: rgba(231, 76, 60, 0.2);
            color: #e74c3c;
        }
        
        .toast.warning .toast-icon {
            background-color: rgba(241, 196, 15, 0.2);
            color: #f1c40f;
        }
        
        .toast.info .toast-icon {
            background-color: rgba(52, 152, 219, 0.2);
            color: #3498db;
        }
        
        .toast-message {
            flex: 1;
            padding: 12px 10px;
            font-size: 0.9rem;
        }
        
        .toast-close {
            background: none;
            border: none;
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            padding: 0 10px;
            font-size: 0.8rem;
            height: 100%;
            display: flex;
            align-items: center;
            transition: color 0.3s ease;
        }
        
        .toast-close:hover {
            color: rgba(255, 255, 255, 0.8);
        }
    `;
    
    document.head.appendChild(style);
}

// Utility functions for UI
function showToast(message, type = 'info', duration = 3000) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        default:
            icon = '<i class="fas fa-info-circle"></i>';
    }
    
    // Set toast content
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close"><i class="fas fa-times"></i></button>
    `;
    
    // Get toast container or create it
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Show with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Close button functionality
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    });
    
    // Hide after duration
    if (duration > 0) {
        setTimeout(() => {
            if (toast.parentNode) {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toastContainer.removeChild(toast);
                    }
                }, 300);
            }
        }, duration);
    }
    
    return toast;
}

// Export functions to be used in other modules
window.UI = {
    showToast,
    updatePlayerPositions
}; 