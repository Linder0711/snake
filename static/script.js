/*
 * script.js — Grid-based Snake with keyboard + mobile controls (D-pad + swipe)
 */

// DOM refs
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');

// Grid config
const gridSize = 20; // pixels per tile
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;

// Game state
let snake;          // [{x,y}, ...]
let direction;      // {x,y} current direction
let nextDirection;  // queued direction to apply next tick
let food;           // {x,y}
let score;
let gameInterval;   // setInterval id
let gameOver;

// Init or reset
function init() {
  const startX = Math.floor(tileCountX / 2);
  const startY = Math.floor(tileCountY / 2);
  snake = [{ x: startX, y: startY }];
  direction = { x: 1, y: 0 };
  nextDirection = { ...direction };
  score = 0;
  gameOver = false;

  generateFood();
  updateScore();

  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 100);
}

// Score UI
function updateScore() {
  scoreDisplay.textContent = `Score: ${score}`;
}

// Food spawn (on-grid, never outside)
function generateFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * tileCountX),
      y: Math.floor(Math.random() * tileCountY)
    };
  } while (snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
  food = newFood;
}

// Main loop
function gameLoop() {
  // apply queued direction
  direction = { ...nextDirection };

  // new head
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  // walls
  if (
    newHead.x < 0 || newHead.x >= tileCountX ||
    newHead.y < 0 || newHead.y >= tileCountY
  ) {
    endGame();
    return;
  }

  // self
  if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
    endGame();
    return;
  }

  // move
  snake.unshift(newHead);

  // eat
  if (newHead.x === food.x && newHead.y === food.y) {
    score++;
    updateScore();
    generateFood();
  } else {
    snake.pop();
  }

  draw();
}

// Render
function draw() {
  // board
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // snake
  ctx.fillStyle = '#00ff00';
  snake.forEach(seg => {
    ctx.fillRect(seg.x * gridSize, seg.y * gridSize, gridSize, gridSize);
  });

  // food
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

// Game over state
function endGame() {
  gameOver = true;
  clearInterval(gameInterval);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = '28px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = '16px Courier New';
  ctx.fillText('Press Space or Play Again', canvas.width / 2, canvas.height / 2 + 20);
}

// Keyboard controls (prevents reversal)
function handleKeydown(event) {
  const { key } = event;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
    event.preventDefault();
  }

  if (gameOver) {
    if (key === ' ') init();
    return;
  }

  switch (key) {
    case 'ArrowUp':
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

// Shared helper for mobile input
function setNextDirection(dx, dy) {
  if (gameOver) return;
  // prevent 180-degree reversal
  if (dx !== 0 && direction.x !== 0) return;
  if (dy !== 0 && direction.y !== 0) return;
  nextDirection = { x: dx, y: dy };
}

// D-pad wiring (works with your existing HTML controls or injects one)
function ensureControls() {
  let controls = document.querySelector('.controls');
  if (!controls) {
    // Inject a simple D-pad if none present
    controls = document.createElement('div');
    controls.className = 'controls';
    // Minimal inline styles to ensure usability without CSS changes
    Object.assign(controls.style, {
      display: 'grid',
      gridTemplateColumns: '80px 80px 80px',
      gridTemplateRows: '80px 80px 80px',
      gap: '8px',
      margin: '16px auto 0',
      touchAction: 'none',
      userSelect: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      maxWidth: '260px'
    });

    function makeBtn(label, dx, dy, col, row) {
      const b = document.createElement('button');
      b.textContent = label;
      b.setAttribute('data-dx', String(dx));
      b.setAttribute('data-dy', String(dy));
      Object.assign(b.style, {
        fontSize: '28px',
        border: '2px solid #333',
        borderRadius: '12px',
        width: '100%',
        height: '100%',
        background: '#f7f7f7'
      });
      b.style.gridColumn = String(col);
      b.style.gridRow = String(row);
      return b;
    }

    controls.appendChild(makeBtn('▲', 0, -1, 2, 1));
    controls.appendChild(makeBtn('◀', -1, 0, 1, 2));
    controls.appendChild(makeBtn('▶', 1, 0, 3, 2));
    controls.appendChild(makeBtn('▼', 0, 1, 2, 3));

    // place after canvas
    canvas.parentNode.insertBefore(controls, canvas.nextSibling);
  }

  // Pointer handler for all buttons with data-dx/dy
  controls.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('button[data-dx]');
    if (!btn) return;
    e.preventDefault();
    const dx = parseInt(btn.getAttribute('data-dx'), 10);
    const dy = parseInt(btn.getAttribute('data-dy'), 10);
    setNextDirection(dx, dy);
  }, { passive: false });
}

// Swipe controls
let touchStartX = null;
let touchStartY = null;

function onTouchStart(e) {
  if (!e.touches || e.touches.length === 0) return;
  // Prevent page scroll if starting on the canvas or controls
  if (e.target === canvas || e.target.closest('.controls')) e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}
function onTouchEnd(e) {
  if (touchStartX === null || touchStartY === null) return;
  const t = e.changedTouches && e.changedTouches[0];
  if (!t) return;

  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const threshold = 24; // pixels

  if (Math.max(absX, absY) >= threshold) {
    if (absX > absY) {
      if (dx > 0) setNextDirection(1, 0);
      else        setNextDirection(-1, 0);
    } else {
      if (dy > 0) setNextDirection(0, 1);
      else        setNextDirection(0, -1);
    }
  }

  touchStartX = null;
  touchStartY = null;
}

// Listeners
document.addEventListener('keydown', handleKeydown, { passive: false });
restartBtn.addEventListener('click', init);
document.addEventListener('touchstart', onTouchStart, { passive: false });
document.addEventListener('touchend', onTouchEnd, { passive: true });

// Boot
window.addEventListener('load', () => {
  ensureControls();
  init();
});
