const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const overlay = document.querySelector("#game-overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayMessage = document.querySelector("#overlay-message");
const overlayAction = document.querySelector("#overlay-action");
const touchControls = document.querySelector(".touch-controls");
const mobileBreakpoint = window.matchMedia("(max-width: 1024px)");

const cellSize = 20;
const columns = canvas.width / cellSize;
const rows = canvas.height / cellSize;
const directions = {
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
};

let snake;
let direction;
let nextDirection;
let apple;
let score;
let gameState = "ready";
let lastStep = 0;
let animationFrame;
const stepDelay = 135;

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = direction;
  score = 0;
  scoreElement.textContent = "00";
  apple = placeApple();
  draw();
}

function placeApple() {
  let position;
  do {
    position = {
      x: Math.floor(Math.random() * columns),
      y: Math.floor(Math.random() * rows),
    };
  } while (snake.some((segment) => segment.x === position.x && segment.y === position.y) ||
    (apple && apple.x === position.x && apple.y === position.y));
  return position;
}

function drawApple() {
  const centerX = apple.x * cellSize + cellSize / 2;
  const centerY = apple.y * cellSize + cellSize / 2 + 1;
  context.fillStyle = "#ff625a";
  context.beginPath();
  context.arc(centerX, centerY, 7, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ff9b7b";
  context.beginPath();
  context.arc(centerX - 2, centerY - 2, 2, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#91e65e";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(centerX, centerY - 7);
  context.quadraticCurveTo(centerX + 1, centerY - 12, centerX + 5, centerY - 11);
  context.stroke();
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
if (!snake) return;

  drawApple();
  snake.forEach((segment, index) => {
    const inset = index === 0 ? 2 : 3;
    context.fillStyle = index === 0 ? "#b5f484" : "#75cf50";
    context.beginPath();
    context.roundRect(
      segment.x * cellSize + inset,
      segment.y * cellSize + inset,
      cellSize - inset * 2,
      cellSize - inset * 2,
      5,
    );
    context.fill();
  });

  const head = snake[0];
  context.fillStyle = "#18251b";
  const eyeX = head.x * cellSize + cellSize / 2 + direction.x * 4;
  const eyeY = head.y * cellSize + cellSize / 2 + direction.y * 4;
  if (direction.x !== 0) {
    context.beginPath();
    context.arc(eyeX, eyeY - 3, 1.5, 0, Math.PI * 2);
    context.arc(eyeX, eyeY + 3, 1.5, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    context.arc(eyeX - 3, eyeY, 1.5, 0, Math.PI * 2);
    context.arc(eyeX + 3, eyeY, 1.5, 0, Math.PI * 2);
    context.fill();
  }
}

function showOverlay(title, message, action) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  overlayAction.textContent = action;
  overlay.classList.remove("is-hidden");
}

function startGame() {
  if (gameState === "running") return;
  if (gameState === "over") resetGame();
  gameState = "running";
  lastStep = 0;
  overlay.classList.add("is-hidden");
  cancelAnimationFrame(animationFrame);
  animationFrame = requestAnimationFrame(gameLoop);
}

function endGame() {
  gameState = "over";
  showOverlay("FIM DE JOGO", `Sua pontuação: ${score}`, mobileBreakpoint.matches ? "Toque na tela para jogar novamente" : "Aperte R para jogar novamente");
}

function update() {
  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };
  const ateApple = head.x === apple.x && head.y === apple.y;
  const bodyToCheck = ateApple ? snake : snake.slice(0, -1);
  const hitWall = head.x < 0 || head.x >= columns || head.y < 0 || head.y >= rows;
  const hitBody = bodyToCheck.some((segment) => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitBody) {
    endGame();
    return;
  }

  snake.unshift(head);
  if (ateApple) {
    score += 1;
    scoreElement.textContent = String(score).padStart(2, "0");
    apple = placeApple();
  } else {
    snake.pop();
  }
  draw();
}

function gameLoop(timestamp) {
  if (gameState !== "running") return;
  if (timestamp - lastStep >= stepDelay) {
    update();
    lastStep = timestamp;
  }
  if (gameState === "running") animationFrame = requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const requestedDirection = directions[key];

  if (requestedDirection) {
    event.preventDefault();
    if (gameState === "running" && requestedDirection.x !== -direction.x && requestedDirection.y !== -direction.y) {
      nextDirection = requestedDirection;
    }
    return;
  }

  if (key === "Enter" && gameState === "ready" && !mobileBreakpoint.matches) startGame();
  if (key === "r" && gameState === "over" && !mobileBreakpoint.matches) startGame();
});

resetGame();

function updateDeviceInstructions() {
  if (gameState === "ready") {
    overlayMessage.textContent = mobileBreakpoint.matches
      ? "Toque nas setas para movimentar a cobra."
      : "Utilize as setas do teclado ou W, A, S, D para movimentar a cobra.";
    overlayAction.textContent = mobileBreakpoint.matches
      ? "Toque na tela para iniciar o jogo"
      : "Aperte ENTER para iniciar o jogo";
  } else if (gameState === "over") {
    overlayAction.textContent = mobileBreakpoint.matches
      ? "Toque na tela para jogar novamente"
      : "Aperte R para jogar novamente";
  }
}

overlay.addEventListener("click", () => {
  if (mobileBreakpoint.matches && (gameState === "ready" || gameState === "over")) startGame();
});

touchControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-direction]");
  if (!button) return;
  if (gameState === "ready") startGame();
  if (gameState !== "running") return;

  const requestedDirection = directions[button.dataset.direction];
  if (requestedDirection.x !== -direction.x || requestedDirection.y !== -direction.y) {
    nextDirection = requestedDirection;
  }
});

mobileBreakpoint.addEventListener("change", updateDeviceInstructions);
updateDeviceInstructions();

