// Shadow Heist - Task System

// Task types configuration
const TASK_TYPES = {
    wiring: {
        name: 'Wiring',
        render: renderWiringTask,
        check: checkWiringTask
    },
    hacking: {
        name: 'Hacking',
        render: renderHackingTask,
        check: checkHackingTask
    },
    decryption: {
        name: 'Decryption',
        render: renderDecryptionTask,
        check: checkDecryptionTask
    },
    memorization: {
        name: 'Memorization',
        render: renderMemorizationTask,
        check: checkMemorizationTask
    },
    lockpicking: {
        name: 'Lockpicking',
        render: renderLockpickingTask,
        check: checkLockpickingTask
    }
};

// Task templates (will be randomly selected for each game)
const TASK_TEMPLATES = [
    {
        type: 'wiring',
        name: 'Connect Wires',
        description: 'Connect matching colored wires to bypass security',
        difficulty: 'easy'
    },
    {
        type: 'hacking',
        name: 'Bypass Firewall',
        description: 'Find and enter the correct sequence to breach the firewall',
        difficulty: 'medium'
    },
    {
        type: 'decryption',
        name: 'Decrypt Security Code',
        description: 'Decode the security pattern to gain access',
        difficulty: 'hard'
    },
    {
        type: 'memorization',
        name: 'Memory Circuit',
        description: 'Memorize and repeat the sequence to unlock the circuit',
        difficulty: 'medium'
    },
    {
        type: 'lockpicking',
        name: 'Pick the Lock',
        description: 'Find the correct tumbler positions to open the lock',
        difficulty: 'easy'
    }
];

// Function called by game.js to load a specific task minigame
function loadTaskGame(taskType, containerElement) {
    // Return early if task type doesn't exist
    if (!TASK_TYPES[taskType]) {
        containerElement.innerHTML += '<p>Task unavailable</p>';
        return;
    }

    // Render the task
    TASK_TYPES[taskType].render(containerElement);
}

// Check if a task is completed correctly
function checkTaskCompletion(taskType, data) {
    if (!TASK_TYPES[taskType]) return false;
    return TASK_TYPES[taskType].check(data);
}

// Task renderers
function renderWiringTask(container) {
    // Create wiring task
    const wireColors = ['red', 'blue', 'green', 'yellow', 'purple'];
    const shuffledLeft = shuffleArray([...wireColors]);
    const shuffledRight = shuffleArray([...wireColors]);
    
    const taskHTML = `
        <div class="wiring-task">
            <p class="task-instructions">Connect the matching colored wires by clicking on a left wire then a right wire.</p>
            <div class="wires-container">
                <div class="wires-left" id="wires-left">
                    ${shuffledLeft.map((color, i) => `
                        <div class="wire" data-wire-id="left-${i}" data-color="${color}">
                            <div class="wire-end" style="background-color: ${color}"></div>
                            <div class="wire-label">${i + 1}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="wires-right" id="wires-right">
                    ${shuffledRight.map((color, i) => `
                        <div class="wire" data-wire-id="right-${i}" data-color="${color}">
                            <div class="wire-end" style="background-color: ${color}"></div>
                            <div class="wire-label">${i + 1}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="wires-connections" id="wires-connections"></div>
            <div class="task-progress">Connected: <span id="wires-connected">0</span>/${wireColors.length}</div>
        </div>
    `;
    
    container.innerHTML += taskHTML;
    
    // Add wiring interaction logic
    setupWiringInteraction();
}

function renderHackingTask(container) {
    // Create hacking task (sequence matching)
    const sequenceLength = 5;
    const sequence = generateRandomSequence(sequenceLength);
    
    const taskHTML = `
        <div class="hacking-task">
            <p class="task-instructions">Memorize the sequence, then enter it correctly to hack the system.</p>
            <div class="hack-sequence-display" id="hack-sequence-display"></div>
            <div class="hack-buttons">
                <button class="btn secondary-btn hack-btn" data-value="1">1</button>
                <button class="btn secondary-btn hack-btn" data-value="2">2</button>
                <button class="btn secondary-btn hack-btn" data-value="3">3</button>
                <button class="btn secondary-btn hack-btn" data-value="4">4</button>
            </div>
            <div class="hack-input" id="hack-input"></div>
            <button class="btn primary-btn" id="start-hack-sequence">Show Sequence</button>
        </div>
    `;
    
    container.innerHTML += taskHTML;
    
    // Store sequence in data attribute
    container.dataset.hackSequence = sequence.join(',');
    
    // Add hacking interaction logic
    setupHackingInteraction();
}

function renderDecryptionTask(container) {
    // Create decryption task (symbol matching/puzzle)
    const symbols = ['◆', '★', '◯', '△', '□', '♠', '♣', '♥', '♦'];
    const gridSize = 3;
    const pattern = [];
    
    // Generate random pattern
    for (let i = 0; i < gridSize * gridSize; i++) {
        if (Math.random() > 0.6 || pattern.length === 0) {
            pattern.push(1); // 1 = active cell
        } else {
            pattern.push(0); // 0 = inactive cell
        }
    }
    
    // Ensure at least 3 active cells
    let activeCount = pattern.filter(cell => cell === 1).length;
    while (activeCount < 3) {
        const randomIndex = Math.floor(Math.random() * pattern.length);
        if (pattern[randomIndex] === 0) {
            pattern.push(1);
            activeCount++;
        }
    }
    
    const taskHTML = `
        <div class="decryption-task">
            <p class="task-instructions">Discover the correct pattern by clicking cells. Match the target pattern shown.</p>
            <div class="target-pattern">
                <p>Target Pattern:</p>
                <div class="decryption-grid target-grid">
                    ${pattern.map((cell, i) => {
                        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
                        return `<div class="grid-cell ${cell === 1 ? 'active' : ''}" data-index="${i}">${cell === 1 ? symbol : ''}</div>`;
                    }).join('')}
                </div>
            </div>
            <div class="player-pattern">
                <p>Your Pattern:</p>
                <div class="decryption-grid player-grid" id="player-grid">
                    ${Array(gridSize * gridSize).fill(0).map((_, i) => {
                        return `<div class="grid-cell" data-index="${i}"></div>`;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML += taskHTML;
    
    // Store pattern in data attribute
    container.dataset.decryptionPattern = pattern.join(',');
    
    // Add decryption interaction logic
    setupDecryptionInteraction();
}

function renderMemorizationTask(container) {
    // Create memorization task (simon says style)
    const levels = 3;
    const sequenceLength = 4;
    const colors = ['red', 'green', 'blue', 'yellow'];
    
    // Generate a random sequence
    const sequence = [];
    for (let i = 0; i < sequenceLength; i++) {
        sequence.push(Math.floor(Math.random() * colors.length));
    }
    
    const taskHTML = `
        <div class="memorization-task">
            <p class="task-instructions">Watch the sequence, then repeat it by clicking the buttons in the same order.</p>
            <div class="memory-buttons">
                ${colors.map((color, i) => `
                    <button class="memory-btn" data-color="${color}" data-index="${i}" style="background-color: ${color}"></button>
                `).join('')}
            </div>
            <div class="memory-status">Level: <span id="memory-level">1</span>/${levels}</div>
            <button class="btn primary-btn" id="start-memory-sequence">Start Sequence</button>
        </div>
    `;
    
    container.innerHTML += taskHTML;
    
    // Store sequence in data attribute
    container.dataset.memorySequence = sequence.join(',');
    container.dataset.memoryLevel = '1';
    container.dataset.memoryLevels = levels.toString();
    
    // Add memorization interaction logic
    setupMemorizationInteraction();
}

function renderLockpickingTask(container) {
    // Create lockpicking task
    const pins = 3;
    const positions = [];
    
    // Generate random pin positions
    for (let i = 0; i < pins; i++) {
        positions.push(Math.floor(Math.random() * 10) + 1);
    }
    
    const taskHTML = `
        <div class="lockpicking-task">
            <p class="task-instructions">Find the correct position for each pin. Green indicates correct position.</p>
            <div class="lock-container">
                ${Array(pins).fill(0).map((_, i) => `
                    <div class="lock-pin" data-pin="${i}">
                        <div class="pin-position" id="pin-position-${i}">0</div>
                        <div class="pin-slider">
                            <input type="range" class="pin-control" data-pin="${i}" min="1" max="10" value="5">
                        </div>
                        <div class="pin-status" id="pin-status-${i}"></div>
                    </div>
                `).join('')}
            </div>
            <div class="lock-feedback" id="lock-feedback">Adjust each slider to find the correct position</div>
        </div>
    `;
    
    container.innerHTML += taskHTML;
    
    // Store positions in data attribute
    container.dataset.lockPositions = positions.join(',');
    
    // Add lockpicking interaction logic
    setupLockpickingInteraction();
}

// Task interaction setup
function setupWiringTask(container) {
    let selectedWire = null;
    let connections = [];
    const connectionsContainer = document.getElementById('wires-connections');
    const wiresConnectedElement = document.getElementById('wires-connected');
    
    const wireElements = container.querySelectorAll('.wire');
    wireElements.forEach(wire => {
        wire.addEventListener('click', () => {
            const wireId = wire.dataset.wireId;
            const color = wire.dataset.color;
            const side = wireId.split('-')[0];
            
            // If nothing selected, select this wire
            if (!selectedWire) {
                if (side === 'left') {
                    selectedWire = { id: wireId, color, element: wire };
                    wire.classList.add('selected');
                }
                return;
            }
            
            // If clicked on same wire, deselect
            if (selectedWire.id === wireId) {
                selectedWire.element.classList.remove('selected');
                selectedWire = null;
                return;
            }
            
            // If wire is from same side, switch selection
            if (side === selectedWire.id.split('-')[0]) {
                selectedWire.element.classList.remove('selected');
                if (side === 'left') {
                    selectedWire = { id: wireId, color, element: wire };
                    wire.classList.add('selected');
                } else {
                    selectedWire = null;
                }
                return;
            }
            
            // Connect wires if they're from different sides and same color
            if (side === 'right' && color === selectedWire.color) {
                const leftWireRect = selectedWire.element.getBoundingClientRect();
                const rightWireRect = wire.getBoundingClientRect();
                const containerRect = connectionsContainer.getBoundingClientRect();
                
                // Calculate relative positions
                const leftPos = {
                    x: leftWireRect.right - containerRect.left,
                    y: leftWireRect.top + leftWireRect.height/2 - containerRect.top
                };
                
                const rightPos = {
                    x: rightWireRect.left - containerRect.left,
                    y: rightWireRect.top + rightWireRect.height/2 - containerRect.top
                };
                
                // Create SVG line for connection
                const connection = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                connection.style.position = 'absolute';
                connection.style.top = '0';
                connection.style.left = '0';
                connection.style.width = '100%';
                connection.style.height = '100%';
                connection.style.pointerEvents = 'none';
                
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', leftPos.x);
                line.setAttribute('y1', leftPos.y);
                line.setAttribute('x2', rightPos.x);
                line.setAttribute('y2', rightPos.y);
                line.setAttribute('stroke', color);
                line.setAttribute('stroke-width', '3');
                
                connection.appendChild(line);
                connectionsContainer.appendChild(connection);
                
                // Add to connections array
                connections.push({
                    leftId: selectedWire.id,
                    rightId: wireId,
                    color,
                    element: connection
                });
                
                // Disable connected wires
                selectedWire.element.classList.add('connected');
                wire.classList.add('connected');
                
                // Update wires connected
                wiresConnectedElement.textContent = connections.length;
                
                // Reset selection
                selectedWire.element.classList.remove('selected');
                selectedWire = null;
                
                // Check if task is complete
                if (connections.length >= 5) { // 5 wires to connect
                    // Task complete visual feedback
                    container.querySelector('.wiring-task').classList.add('task-complete');
                    
                    // Enable the complete button
                    document.getElementById('complete-task-btn').disabled = false;
                }
            }
        });
    });
}

function setupHackingInteraction() {
    const sequenceDisplay = document.getElementById('hack-sequence-display');
    const hackInput = document.getElementById('hack-input');
    const showButton = document.getElementById('start-hack-sequence');
    const hackButtons = document.querySelectorAll('.hack-btn');
    const container = document.querySelector('.task-game');
    
    const sequence = container.dataset.hackSequence.split(',').map(Number);
    let playerSequence = [];
    let canInput = false;
    
    // Show sequence button
    showButton.addEventListener('click', () => {
        // Disable button during sequence display
        showButton.disabled = true;
        showButton.textContent = 'Watch...';
        
        // Reset input
        playerSequence = [];
        hackInput.innerHTML = '';
        canInput = false;
        
        // Show sequence animation
        let i = 0;
        sequenceDisplay.innerHTML = '';
        
        const showNextNumber = () => {
            if (i < sequence.length) {
                sequenceDisplay.textContent = sequence[i];
                setTimeout(() => {
                    sequenceDisplay.textContent = '';
                    setTimeout(() => {
                        i++;
                        showNextNumber();
                    }, 300);
                }, 700);
            } else {
                // Sequence finished, allow input
                sequenceDisplay.textContent = '?';
                showButton.textContent = 'Show Again';
                showButton.disabled = false;
                canInput = true;
            }
        };
        
        showNextNumber();
    });
    
    // Hack buttons
    hackButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!canInput) return;
            
            const value = parseInt(button.dataset.value);
            playerSequence.push(value);
            
            // Add to visual input
            const inputElement = document.createElement('div');
            inputElement.className = 'hack-input-value';
            inputElement.textContent = value;
            hackInput.appendChild(inputElement);
            
            // Check if sequence is complete
            if (playerSequence.length === sequence.length) {
                // Check if correct
                const correct = playerSequence.every((val, i) => val === sequence[i]);
                
                if (correct) {
                    // Task complete visual feedback
                    container.querySelector('.hacking-task').classList.add('task-complete');
                    sequenceDisplay.textContent = '✓';
                    
                    // Enable the complete button
                    document.getElementById('complete-task-btn').disabled = false;
                } else {
                    // Wrong sequence
                    sequenceDisplay.textContent = '✗';
                    setTimeout(() => {
                        sequenceDisplay.textContent = '?';
                        playerSequence = [];
                        hackInput.innerHTML = '';
                    }, 1000);
                }
            }
        });
    });
}

function setupDecryptionInteraction() {
    const playerGrid = document.getElementById('player-grid');
    const container = document.querySelector('.task-game');
    const targetPattern = container.dataset.decryptionPattern.split(',').map(Number);
    
    const cells = playerGrid.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            // Toggle cell
            cell.classList.toggle('active');
            
            // Check if pattern matches
            const currentPattern = Array.from(cells).map(c => c.classList.contains('active') ? 1 : 0);
            const correct = currentPattern.every((val, i) => val === targetPattern[i]);
            
            if (correct) {
                // Task complete visual feedback
                container.querySelector('.decryption-task').classList.add('task-complete');
                
                // Enable the complete button
                document.getElementById('complete-task-btn').disabled = false;
            }
        });
    });
}

function setupMemorizationInteraction() {
    const memoryButtons = document.querySelectorAll('.memory-btn');
    const startButton = document.getElementById('start-memory-sequence');
    const levelElement = document.getElementById('memory-level');
    const container = document.querySelector('.task-game');
    
    const sequence = container.dataset.memorySequence.split(',').map(Number);
    let currentLevel = parseInt(container.dataset.memoryLevel);
    const maxLevels = parseInt(container.dataset.memoryLevels);
    let playerSequence = [];
    let canInput = false;
    
    // Start button
    startButton.addEventListener('click', () => {
        // Disable buttons during sequence
        startButton.disabled = true;
        memoryButtons.forEach(btn => btn.disabled = true);
        canInput = false;
        
        // Reset player sequence
        playerSequence = [];
        
        // Show sequence for current level
        let i = 0;
        const showNextInSequence = () => {
            if (i < Math.min(sequence.length, currentLevel + 1)) {
                const buttonIndex = sequence[i];
                const button = memoryButtons[buttonIndex];
                
                // Highlight button
                button.classList.add('active');
                
                setTimeout(() => {
                    button.classList.remove('active');
                    setTimeout(() => {
                        i++;
                        showNextInSequence();
                    }, 200);
                }, 600);
            } else {
                // Sequence complete, allow input
                memoryButtons.forEach(btn => btn.disabled = false);
                canInput = true;
            }
        };
        
        showNextInSequence();
    });
    
    // Memory buttons
    memoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!canInput) return;
            
            const index = parseInt(button.dataset.index);
            playerSequence.push(index);
            
            // Visual feedback
            button.classList.add('active');
            setTimeout(() => button.classList.remove('active'), 300);
            
            // Check sequence so far
            const correctSoFar = playerSequence.every((val, i) => val === sequence[i]);
            
            if (!correctSoFar) {
                // Wrong sequence
                memoryButtons.forEach(btn => btn.classList.add('error'));
                setTimeout(() => {
                    memoryButtons.forEach(btn => btn.classList.remove('error'));
                    playerSequence = [];
                    startButton.disabled = false;
                }, 800);
                return;
            }
            
            // Check if sequence is complete for current level
            if (playerSequence.length === Math.min(sequence.length, currentLevel + 1)) {
                // Level complete
                currentLevel++;
                container.dataset.memoryLevel = currentLevel.toString();
                levelElement.textContent = currentLevel;
                
                // Check if all levels complete
                if (currentLevel >= maxLevels) {
                    // Task complete
                    container.querySelector('.memorization-task').classList.add('task-complete');
                    
                    // Enable the complete button
                    document.getElementById('complete-task-btn').disabled = false;
                } else {
                    // Next level
                    playerSequence = [];
                    startButton.disabled = false;
                }
            }
        });
    });
}

function setupLockpickingInteraction() {
    const container = document.querySelector('.task-game');
    const targetPositions = container.dataset.lockPositions.split(',').map(Number);
    const sliders = container.querySelectorAll('.pin-control');
    const feedbackElement = document.getElementById('lock-feedback');
    
    sliders.forEach(slider => {
        const pinIndex = parseInt(slider.dataset.pin);
        const targetPosition = targetPositions[pinIndex];
        const positionElement = document.getElementById(`pin-position-${pinIndex}`);
        const statusElement = document.getElementById(`pin-status-${pinIndex}`);
        
        slider.addEventListener('input', () => {
            const value = parseInt(slider.value);
            positionElement.textContent = value;
            
            // Give feedback based on how close they are
            const difference = Math.abs(value - targetPosition);
            
            if (difference === 0) {
                statusElement.className = 'pin-status correct';
                statusElement.textContent = '✓';
            } else if (difference <= 1) {
                statusElement.className = 'pin-status close';
                statusElement.textContent = 'Close';
            } else if (difference <= 3) {
                statusElement.className = 'pin-status far';
                statusElement.textContent = 'Far';
            } else {
                statusElement.className = 'pin-status wrong';
                statusElement.textContent = '×';
            }
            
            // Check if all pins are correct
            checkLockCompletion();
        });
    });
    
    function checkLockCompletion() {
        const allCorrect = Array.from(sliders).every(slider => {
            const pinIndex = parseInt(slider.dataset.pin);
            const targetPosition = targetPositions[pinIndex];
            return parseInt(slider.value) === targetPosition;
        });
        
        if (allCorrect) {
            // Task complete
            container.querySelector('.lockpicking-task').classList.add('task-complete');
            feedbackElement.textContent = 'Lock opened successfully!';
            
            // Enable the complete button
            document.getElementById('complete-task-btn').disabled = false;
        }
    }
}

// Task completion checkers
function checkWiringTask(data) {
    // In a real implementation, we would check if all wires are connected
    // For this demo, we trust the UI validation done in the interaction setup
    return true;
}

function checkHackingTask(data) {
    // For this demo, we trust the UI validation done in the interaction setup
    return true;
}

function checkDecryptionTask(data) {
    // For this demo, we trust the UI validation done in the interaction setup
    return true;
}

function checkMemorizationTask(data) {
    // For this demo, we trust the UI validation done in the interaction setup
    return true;
}

function checkLockpickingTask(data) {
    // For this demo, we trust the UI validation done in the interaction setup
    return true;
}

// Helper functions
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateRandomSequence(length) {
    const sequence = [];
    for (let i = 0; i < length; i++) {
        sequence.push(Math.floor(Math.random() * 4) + 1); // 1-4
    }
    return sequence;
}

// Set up task interactions when loading a task
function setupWiringInteraction() {
    setTimeout(() => {
        setupWiringTask(document.querySelector('.task-game'));
    }, 100);
}

// Initialize task handlers
document.addEventListener('DOMContentLoaded', () => {
    // This will be handled by the main game.js loadTaskGame function
}); 