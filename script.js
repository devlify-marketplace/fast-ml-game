// Fast ML Game — script.js
// Uses MediaPipe Hands to control a simple 'catch the falling objects' game.

const video = document.getElementById('video');
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');

// Game state
let width = 900, height = 480;
let running = false;
let lastTime = 0;
let player = { x: width / 2, y: height - 40, w: 140, h: 18 };
let objects = [];
let spawnTimer = 0;
let score = 0;
let lives = 3;
let inputX = null; // normalized 0..1 from hand
let smoothing = 0.2;
let keyboard = { left: false, right: false };

// Resize canvas to container width
function resizeCanvas(){
  const rect = canvas.getBoundingClientRect();
  width = Math.max(320, Math.floor(rect.width));
  // keep a fixed height ratio
  height = Math.floor(width * 480 / 900);
  canvas.width = width;
  canvas.height = height;
  player.y = height - 36;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Helpers
function spawnObject(){
  const size = 18 + Math.random() * 28;
  objects.push({
    x: Math.random() * (width - size),
    y: -size,
    r: size,
    speed: 80 + Math.random() * 160
n  });
}

function resetGame(){
  objects = [];
  score = 0;
  lives = 3;
  scoreEl.textContent = score;
  livesEl.textContent = lives;
}

function update(dt){
  // input -> player.x
  if (inputX !== null){
    const targetX = inputX * width;
    player.x += (targetX - player.x) * smoothing * Math.min(6, dt * 0.06);
  } else {
    // keyboard fallback
    if (keyboard.left) player.x -= 400 * dt;
    if (keyboard.right) player.x += 400 * dt;
  }
  // clamp
  player.x = Math.max(player.w / 2, Math.min(width - player.w / 2, player.x));

  // spawn
  spawnTimer += dt;
  const spawnRate = Math.max(0.25, 1.0 - score / 100); // faster with higher score
  if (spawnTimer > spawnRate) {
    spawnTimer = 0;
    spawnObject();
  }

  // update objects
  for (let i = objects.length - 1; i >= 0; i--){
    const o = objects[i];
    o.y += o.speed * dt * (1 + score / 50);
    // collision with player (simple AABB vs circle)
    const px = player.x, py = player.y, pw = player.w, ph = player.h;
    const closestX = Math.max(px - pw/2, Math.min(o.x + o.r/2, px + pw/2));
    const closestY = Math.max(py - ph/2, Math.min(o.y + o.r/2, py + ph/2));
    const dx = (o.x + o.r/2) - closestX;
    const dy = (o.y + o.r/2) - closestY;
    if (dx*dx + dy*dy < (o.r/2)*(o.r/2)){
      // caught
      objects.splice(i,1);
      score += 1;
      scoreEl.textContent = score;
      continue;
    }
    if (o.y - o.r > height){
      objects.splice(i,1);
      lives -= 1;
      livesEl.textContent = lives;
      if (lives <= 0){
        running = false;
        stopGame();
      }
    }
  }
}

function draw(){
  ctx.clearRect(0,0,width,height);

  // background grid
  ctx.fillStyle = '#071021';
  ctx.fillRect(0,0,width,height);

  // objects
  for (const o of objects){
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(o.x + o.r/2, o.y + o.r/2, o.r/2, 0, Math.PI*2);
    ctx.fill();
  }

  // player (catcher)
  ctx.fillStyle = '#7ef9f7';
  ctx.beginPath();
  ctx.roundRect(player.x - player.w/2, player.y - player.h/2, player.w, player.h, 8);
  ctx.fill();

  // HUD
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(6,6,200,34);
  ctx.fillStyle = '#c5f7f6';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`Score: ${score}`, 14, 28);
}

// polyfill for roundRect if missing
if (!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r){
    if (typeof r === 'number') r = {tl:r,tr:r,br:r,bl:r};
    this.beginPath();
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
  }
}

function gameLoop(ts){
  if (!running) return;
  if (!lastTime) lastTime = ts;
  const dt = (ts - lastTime) / 1000;
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function startGame(){
  resetGame();
  running = true;
  lastTime = 0;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  requestAnimationFrame(gameLoop);
}

function stopGame(){
  running = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  // draw final state so user sees the end
  draw();
}

startBtn.addEventListener('click', () => {
  startGame();
});
stopBtn.addEventListener('click', () => {
  running = false;
  stopGame();
});

// Keyboard fallback
window.addEventListener('keydown', (e)=>{
  if (e.key === 'ArrowLeft') keyboard.left = true;
  if (e.key === 'ArrowRight') keyboard.right = true;
});
window.addEventListener('keyup', (e)=>{
  if (e.key === 'ArrowLeft') keyboard.left = false;
  if (e.key === 'ArrowRight') keyboard.right = false;
});

// MediaPipe Hands setup
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
  minDetectionConfidence: 0.6,
  minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const cameraUtils = window.Camera;
let camera = null;

async function initCamera(){
  try{
    camera = new cameraUtils(video, {
      onFrame: async () => {
        await hands.send({image: video});
      },
      width: 640,
      height: 480
    });
    await camera.start();
    console.log('Camera started');
  } catch (err){
    console.warn('Camera init failed:', err);
  }
}

function onResults(results){
  // results.multiHandLandmarks is normalized coordinates (0..1)
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0){
    const lm = results.multiHandLandmarks[0];
    // use index finger tip (landmark 8) to control x
    const indexTip = lm[8];
    // x is mirrored for front camera; adjust if needed
    inputX = indexTip.x; // normalized 0..1
  } else {
    inputX = null;
  }
}

// initialize camera on load
initCamera();

// pointer fallback: if user taps/clicks canvas, move player there
canvas.addEventListener('pointermove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  inputX = Math.max(0, Math.min(1, x));
});

canvas.addEventListener('pointerleave', ()=>{ /* don't reset to allow keyboard */ });

// initial draw
draw();
