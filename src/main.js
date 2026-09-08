// src/main.js - simple endless-runner style demo
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;

// Player
const player = { x: 100, y: H - 120, w: 40, h: 40, vy: 0, jumpPower: -14, onGround: false };
let gravity = 0.7;

// Obstacles
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 90; // frames
let speed = 4;

// Game state
let running = false;
let score = 0;
let frame = 0;

// Input
const keys = {};
addEventListener('keydown', e=>{ keys[e.code] = true });
addEventListener('keyup', e=>{ keys[e.code] = false });

function reset(){
  player.x = 100; player.y = H - 120; player.vy = 0; player.onGround = false;
  obstacles = []; spawnTimer = 0; score = 0; frame = 0; speed = 4; running = true;
}

function spawnObstacle(){
  const h = 30 + Math.random()*60;
  obstacles.push({ x: W + 20, y: H - 80 - (h-30), w: 30 + Math.random()*30, h: h });
}

function update(){
  frame++;
  // Player input: jump
  if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround){
    player.vy = player.jumpPower; player.onGround = false;
  }

  // Physics
  player.vy += gravity;
  player.y += player.vy;
  if (player.y + player.h >= H - 40){ player.y = H - 40 - player.h; player.vy = 0; player.onGround = true; }

  // Obstacles
  spawnTimer++;
  if (spawnTimer >= spawnInterval){ spawnTimer = 0; spawnObstacle(); if (spawnInterval>45) spawnInterval -= 1; }
  for (let i = obstacles.length-1; i>=0; i--){
    obstacles[i].x -= speed;
    if (obstacles[i].x + obstacles[i].w < 0) { obstacles.splice(i,1); score += 1; }
  }

  // Increase difficulty
  if (frame % 600 === 0) speed += 0.5;

  // Collisions
  for (const ob of obstacles){
    if (rectsOverlap(player, ob)) { running = false; }
  }
}

function rectsOverlap(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function draw(){
  // clear
  ctx.fillStyle = '#071026'; ctx.fillRect(0,0,W,H);

  // ground
  ctx.fillStyle = '#052033'; ctx.fillRect(0,H-40,W,40);

  // player
  ctx.fillStyle = '#0ea5a6'; ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.strokeRect(player.x, player.y, player.w, player.h);

  // obstacles
  ctx.fillStyle = '#e3342f';
  for (const ob of obstacles){ ctx.fillRect(ob.x, ob.y, ob.w, ob.h); }

  // UI
  ctx.fillStyle = '#fff'; ctx.font = '18px Arial'; ctx.fillText('Score: '+score, 12, 28);
  if (!running){
    ctx.fillStyle = 'rgba(2,6,23,0.6)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff'; ctx.font = '28px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Game Over — Click Start or press Space', W/2, H/2);
    ctx.textAlign = 'left';
  }
}

let last = 0;
function loop(ts){
  if (!last) last = ts;
  const dt = ts - last; last = ts;
  if (running) update();
  draw();
  requestAnimationFrame(loop);
}

// Start UI
document.getElementById('startBtn').addEventListener('click', ()=>{ reset(); });
// allow space to restart after death
addEventListener('keydown', e=>{ if (!running && (e.code === 'Space' || e.code === 'Enter')) reset(); });

// initialize
reset();
requestAnimationFrame(loop);
