/*
 * script.js
 *
 * Implements a simple, grid‑based Snake game using vanilla JavaScript.  The
 * core game loop consists of updating the snake's position, drawing
 * the game state to the canvas, and scheduling the next tick.  When
 * the snake collides with a wall or itself, the game ends and the
 * player can restart via the button or spacebar.  Arrow keys control
 * the direction of the snake.
 */

// Grab references to DOM elements up front for efficiency
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');

// Grid configuration.  Each cell is gridSize by gridSize pixels.
const gridSize = 20;
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;

// Game state variables
let snake;          // Array of segments, each with x and y properties
let direction;      // Current movement direction of the snake
let nextDirection;  // Direction to be applied on the next tick
let food;           // Current food position
let score;
let gameInterval;   // Stores setInterval id for the game loop
let gameOver;       // Boolean flag to indicate if the game has ended

/**
 * Initializes or resets the game state and starts the game loop.
 */
function init() {
    // Start the snake in the centre of the canvas
    const startX = Math.floor(tileCountX / 2);
    const startY = Math.floor(tileCountY / 2);
    snake = [ { x: startX, y: startY } ];
    direction = { x: 1, y: 0 };       // Start moving to the right
    nextDirection = { ...direction }; // Copy the initial direction
    score = 0;
    gameOver = false;

    generateFood();
    updateScore();

    // Clear any existing game loop
    if (gameInterval) clearInterval(gameInterval);
    // Call the game loop every 100ms for consistent timing
    gameInterval = setInterval(gameLoop, 100);
}

/**
 * Updates the displayed score on the page.
 */
function updateScore() {
    scoreDisplay.textContent = `Score: ${score}`;
}

/**
 * Generates a new food position ensuring it does not collide with the snake.
 */
function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * tileCountX),
            y: Math.floor(Math.random() * tileCountY)
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    food = newFood;
}

/**
 * Primary game loop executed on each tick.  Moves the snake, checks
 * collisions, handles food consumption and draws the current state.
 */
function gameLoop() {
    // Update the snake's current direction to the queued nextDirection
    direction = { ...nextDirection };

    // Calculate new head position
    const newHead = {
        x: snake[0].x + direction.x,
        y: snake[0].y + direction.y
    };

    // Collision detection: walls
    if (newHead.x < 0 || newHead.x >= tileCountX || newHead.y < 0 || newHead.y >= tileCountY) {
        endGame();
        return;
    }
    // Collision detection: self
    if (snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        endGame();
        return;
    }

    // Insert new head at the front of the snake array
    snake.unshift(newHead);

    // Check for food collision
    if (newHead.x === food.x && newHead.y === food.y) {
        score++;
        updateScore();
        generateFood();
        // Do not remove tail when eating food, effectively growing the snake
    } else {
        // Remove the last segment to maintain current length
        snake.pop();
    }

    // Render the current game state
    draw();
}

/**
 * Draws the game board, snake and food on the canvas.
 */
function draw() {
    // Clear the entire canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the snake: iterate over each segment
    ctx.fillStyle = '#00ff00'; // green for snake
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize, gridSize);
    });

    // Draw the food
    ctx.fillStyle = '#ff0000'; // red for food
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

/**
 * Handles the end of the game, stopping the loop and displaying a message.
 */
function endGame() {
    gameOver = true;
    clearInterval(gameInterval);

    // Overlay a semi‑transparent black rectangle
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the game over text
    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '16px Courier New';
    ctx.fillText('Press Space or Play Again', canvas.width / 2, canvas.height / 2 + 20);
}

/**
 * Handles keydown events for controlling the snake and restarting the game.
 * @param {KeyboardEvent} event The keydown event object
 */
function handleKeydown(event) {
    const { key } = event;
    // Prevent default behaviour of arrow keys and space (scrolling)
    if ([ 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ' ].includes(key)) {
        event.preventDefault();
    }

    if (gameOver) {
        // If the game is over, pressing space restarts it
        if (key === ' ') {
            init();
        }
        return;
    }

    switch (key) {
        case 'ArrowUp':
            // Prevent reversing direction into itself
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            break;
        case 'ArrowDown':
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            break;
        case 'ArrowRight':
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            break;
        default:
            break;
    }
}

// Event listeners
document.addEventListener('keydown', handleKeydown);
restartBtn.addEventListener('click', () => {
    // Only restart if the game is over or if a user explicitly wants to reset
    init();
});

// Start the game when the page has finished loading
window.addEventListener('load', init);
