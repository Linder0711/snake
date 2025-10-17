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
// === MUSIC SETUP ===

// List of available background tracks
const musicTracks = [
  "/static/sounds/bg1.mp3",
  "/static/sounds/bg2.mp3",
  "/static/sounds/bg3.mp3",
  "/static/sounds/bg4.mp3",
  "/static/sounds/bg5.mp3"
];

let bgMusic = null; // holds the current Audio object

function startRandomMusic() {
  // Stop previous track if playing
  if (bgMusic) {
    bgMusic.pause();
    bgMusic = null;
  }

  // Pick a random track
  const randomIndex = Math.floor(Math.random() * musicTracks.length);
  const selectedTrack = musicTracks[randomIndex];

  // Load and play
  bgMusic = new Audio(selectedTrack);
  bgMusic.loop = true;
  bgMusic.volume = 0.4;
  bgMusic.play().catch(() => {});
}

function stopMusic() {
  if (bgMusic) {
    bgMusic.pause();
    bgMusic.currentTime = 0;
  }
}

const sndEat = new Audio("/static/sounds/eat.wav");
const sndStart = new Audio("/static/sounds/start.wav");
const sndCrash = new Audio("/static/sounds/crash.wav");
[sndEat, sndStart, sndCrash].forEach(snd => {
  snd.preload = "auto";
  snd.volume = 0.6;
});
sndCrash.volume = 0.7;
// Init or reset
function init() {
  function unlockSounds() {
  [sndEat, sndStart, sndCrash].forEach(snd => {
    snd.play().then(() => {
      snd.pause();
      snd.currentTime = 0;
    }).catch(() => {});
  });
}

startBtn.addEventListener('click', () => {
  unlockSounds();   
  document.getElementById('startContainer').style.display = 'none';
  init();
});
  stopMusic();
  startRandomMusic();
  sndStart.currentTime = 0;
  sndStart.play().catch(() => {});
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
function drawStartScreen() {
  ctx.fillStyle = '#001';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#00eaff';
  ctx.font = '24px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('Snake', canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = '16px Courier New';
  ctx.fillText('Press Start or space to Play', canvas.width / 2, canvas.height / 2 + 20);
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
  sndEat.currentTime = 0;
  sndEat.play().catch(() => {});
  generateFood();
} else {
  snake.pop();
}


  draw();
}

// Render
function draw() {
  // background grid-like field
  ctx.fillStyle = '#001';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // snake
  ctx.fillStyle = '#00ffff';
  snake.forEach(seg => {
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
    ctx.fillRect(seg.x * gridSize, seg.y * gridSize, gridSize - 1, gridSize - 1);
  });
  ctx.shadowBlur = 0;

  // food
  ctx.fillStyle = '#ff00ff';
  ctx.shadowColor = '#ff00ff';
  ctx.shadowBlur = 10;
  ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);
  ctx.shadowBlur = 0;
}

// Game over state
function endGame() {
  sndCrash.currentTime = 0;
sndCrash.play().catch(() => {});

  stopMusic();

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

  const formContainer = document.getElementById('scoreFormContainer');
  const scoreInput = document.getElementById('playerScore');

  if (formContainer && scoreInput) {
    // populate hidden score field
    scoreInput.value = score;

    // reveal the form
    formContainer.style.display = 'block';
  }
}

// Keyboard controls (prevents reversal)
function handleKeydown(event) {
  const { key } = event;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(key)) {
    event.preventDefault();
  }

if (!gameInterval && !gameOver && key === ' ') {
  document.getElementById('startContainer').style.display = 'none';
  init();
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

function ensureControls() {
  let controls = document.querySelector('.controls');
  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'controls';
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

    canvas.parentNode.insertBefore(controls, canvas.nextSibling);
  }

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
const toggleSoundBtn = document.getElementById("toggleSound");
if (toggleSoundBtn) {
  toggleSoundBtn.addEventListener("click", () => {
    if (bgMusic) bgMusic.muted = !bgMusic.muted;
  });

};
// Boot
window.addEventListener('load', () => {
  ensureControls();

  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      document.getElementById('startContainer').style.display = 'none';
      init();
    });
  }
document.getElementById('toggleLeaderboardBtn')?.addEventListener('click', () => {
  const board = document.getElementById('leaderboard');
  if (board) board.classList.add('active');
});

document.getElementById('closeLeaderboardBtn')?.addEventListener('click', () => {
  const board = document.getElementById('leaderboard');
  if (board) board.classList.remove('active');
});

  // Draw a static board before starting
  drawStartScreen();
});
