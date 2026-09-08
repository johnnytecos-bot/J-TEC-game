// src/main.js - 2D side-scrolling endless runner with cinematic polish
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function resize(){
    // keep a virtual resolution for pixel-art feel
    const vw = Math.max(960, Math.min(window.innerWidth, 1600));
    const vh = Math.max(540, Math.min(window.innerHeight, 900));
    canvas.width = vw;
    canvas.height = vh;
    ctx.imageSmoothingEnabled = false;
  }
  window.addEventListener('resize', resize);
  resize();

  // assets
  const bg = new Image(); bg.src = 'assets/backgrounds/city_stage.svg';
  const sprite = new Image(); sprite.src = 'assets/sprites/spritesheet_64.svg';

  // game state
  let running = false;
  let score = 0;
  let high = parseInt(localStorage.getItem('jtec_high')||'0',10);
  let distance = 0;
  let startTime = 0;
  let level = 1;

  // player
  const player = {
    x: 150,
    y: 0,
    w: 64,
    h: 64,
    vy:0,
    onGround: true,
    jumping: false,
    sliding: false,
    slideTimer: 0,
    hearts: 3
  };

  // world
  let scroll = 0; // world offset
  let speed = 240; // pixels per second
  let speedRamp = 0.015; // increase per second

  // obstacles & coins
  const obstacles = [];
  const coins = [];

  function spawnObstacle(){
    const w = 40 + Math.random()*80;
    const h = 40 + Math.random()*80;
    const y = (canvas.height*0.65) - h; // ground-aligned
    const x = canvas.width + 120 + Math.random()*200;
    obstacles.push({x,y,w,h,passed:false});
  }
  function spawnCoin(x,y){ coins.push({x,y,collected:false,vy:0,angle:Math.random()*Math.PI*2}); }

  // seed initial obstacles/coins
  for(let i=0;i<6;i++){ spawnObstacle(); }
  for(let i=0;i<10;i++){ spawnCoin(canvas.width + i*140, canvas.height*0.55 - (i%3)*30); }

  // animation
  const FRAME_W = 64, FRAME_H = 64, COLS = 6;
  let anim = 0, animTimer = 0;

  // input
  const keys = {};
  window.addEventListener('keydown', e=>{ keys[e.code]=true; if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') ) tryJump(); if (e.code==='ArrowDown' || e.code==='KeyS') trySlide(); });
  window.addEventListener('keyup', e=>{ keys[e.code]=false; if (e.code==='ArrowDown' || e.code==='KeyS') endSlide(); });

  // mobile controls
  document.getElementById('jumpBtn').addEventListener('touchstart', e=>{ e.preventDefault(); tryJump(); });
  document.getElementById('slideBtn').addEventListener('touchstart', e=>{ e.preventDefault(); trySlide(); });
  document.getElementById('slideBtn').addEventListener('touchend', e=>{ e.preventDefault(); endSlide(); });

  function tryJump(){ if (!running) return; if (player.onGround && !player.sliding){ player.vy = -640/60; player.onGround=false; player.jumping=true; playBeep(880,'triangle',0.06,0.06); } }
  function trySlide(){ if (!running) return; if (player.onGround && !player.sliding){ player.sliding = true; player.slideTimer = 0; playBeep(440,'sine',0.06,0.06); } }
  function endSlide(){ player.sliding = false; }

  // collision helpers
  function rectsOverlap(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  // audio helper
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audio = AudioCtx ? new AudioCtx() : null;
  function playBeep(freq,type='sine',dur=0.08,vol=0.06){ if (!audio) return; try{ if (audio.state === 'suspended') audio.resume(); const o = audio.createOscillator(); const g = audio.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = vol; o.connect(g); g.connect(audio.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur); o.stop(audio.currentTime + dur + 0.02); }catch(e){/* ignore */} }

  // particle system (small)
  const particles = [];
  function emit(x,y,color,count=8){ for(let i=0;i<count;i++){ particles.push({x,y,vx:(Math.random()-0.5)*4,vy:(Math.random()*-3)-2,age:0,life:40+Math.random()*30,size:2+Math.random()*3,color}); } }

  // UI refs
  const scoreEl = document.getElementById('scoreVal');
  const timeEl = document.getElementById('timeVal');
  const highEl = document.getElementById('highVal');
  const levelEl = document.getElementById('levelVal');
  const msgEl = document.getElementById('msg');
  highEl.textContent = high;

  // start/restart
  document.getElementById('startBtn').addEventListener('click', ()=>{ start(); });
  function start(){ running = true; score = 0; distance = 0; startTime = Date.now(); speed = 240; player.y = canvas.height*0.65 - player.h; player.vy = 0; player.onGround = true; player.sliding=false; obstacles.length=0; coins.length=0; particles.length=0; for(let i=0;i<6;i++){ spawnObstacle(); } for(let i=0;i<12;i++){ spawnCoin(canvas.width + i*120, canvas.height*0.55 - (i%4)*28); } msgEl.textContent = ''; }

  // game loop
  let last = 0;
  function loop(ts){ if(!last) last = ts; const dt = (ts-last)/1000; last = ts; if (running){
      // update speed
      speed += speedRamp * dt * 60; // ramp
      distance += speed * dt;

      // update player physics
      player.vy += (2000/60) * dt; // gravity scaled
      player.y += player.vy * dt * 60;
      const groundY = canvas.height*0.65 - player.h;
      if (player.y >= groundY){ player.y = groundY; player.vy = 0; player.onGround = true; player.jumping=false; }

      if (player.sliding){ player.slideTimer += dt; if (player.slideTimer > 0.6) player.sliding = false; }

      // spawn obstacles occasionally
      if (Math.random() < 0.02 + Math.min(0.05, distance/200000)) spawnObstacle();

      // move obstacles/coins left by speed * dt
      for(let i=obstacles.length-1;i>=0;i--){ const ob = obstacles[i]; ob.x -= speed * dt; if (ob.x + ob.w < -200) obstacles.splice(i,1); else{
          // collision with player
          const pbox = {x:player.x, y:player.y + (player.sliding? player.h*0.5 : 0), w:player.w, h: player.sliding? player.h*0.5 : player.h};
          if (!ob.passed && ob.x + ob.w < player.x){ ob.passed = true; score += 10; }
          if (rectsOverlap(pbox, ob)){
            // hit
            running = false; msgEl.textContent = 'Game Over'; playBeep(120,'sawtooth',0.3,0.16); if (score > high){ high = score; localStorage.setItem('jtec_high', String(high)); highEl.textContent = high; }
          }
      }}
      for(let i=coins.length-1;i>=0;i--){ const c = coins[i]; c.x -= speed * dt; c.y += Math.sin((ts/200)+i)*0.5; if (c.x < -100) coins.splice(i,1); else{ const pbox = {x:player.x, y:player.y, w:player.w, h:player.h}; if (!c.collected && rectsOverlap(pbox, {x:c.x-8,y:c.y-8,w:16,h:16})){ c.collected = true; score += 50; emit(c.x, c.y, '#ffd24d', 12); playBeep(1000,'sine',0.05,0.06); coins.splice(i,1); } }}

      // particles update
      for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.age++; p.vy += 0.12; p.x += p.vx; p.y += p.vy; if (p.age > p.life) particles.splice(i,1); }

      // anim frame
      animTimer += dt; if (animTimer > 0.09){ animTimer = 0; anim = (anim+1) % COLS; }

      // update score/time
      scoreEl.textContent = score;
      const elapsed = Math.floor((Date.now() - startTime)/1000);
      timeEl.textContent = String(Math.floor(elapsed/60)).padStart(2,'0') + ':' + String(elapsed%60).padStart(2,'0');
      level = 1 + Math.floor(distance/1000);
      levelEl.textContent = level;
    }

    // draw
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // draw background centered and add parallax by shifting slightly based on distance
    const bgX = - (distance*0.02 % canvas.width);
    if (bg.complete) ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
    if (bg.complete) ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);

    // draw ground/platform (tiled) - simple blocks
    const groundY = canvas.height*0.65;
    ctx.fillStyle = '#56473a'; ctx.fillRect(0, groundY, canvas.width, canvas.height-groundY);
    // sidewalk tiles
    ctx.fillStyle = '#6b5d4a'; for(let tx = Math.floor(- (distance % 80)); tx < canvas.width; tx += 80){ ctx.fillRect(tx, groundY, 72, 48); }

    // draw coins
    coins.forEach(c=>{ ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.ellipse(Math.round(c.x - distance%0), Math.round(c.y), 8, 10, 0,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.stroke(); });

    // draw obstacles
    obstacles.forEach(ob=>{
      ctx.fillStyle = '#3b3b5a'; ctx.fillRect(Math.round(ob.x), Math.round(ob.y), ob.w, ob.h);
      ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(Math.round(ob.x)+4, Math.round(ob.y)+4, Math.max(4,ob.w-8), 6);
    });

    // draw player (sprite if available)
    const px = Math.round(player.x);
    const py = Math.round(player.y + (player.sliding? player.h*0.5 : 0));
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(px + player.w/2, groundY + 10, player.w*0.45, 8, 0,0,Math.PI*2); ctx.fill();
    if (sprite.complete){ const sx = anim * FRAME_W; const sy = 0; ctx.drawImage(sprite, sx, sy, FRAME_W, FRAME_H, px, py, player.w, player.h); }
    else { ctx.fillStyle = '#ff66b2'; ctx.fillRect(px, py, player.w, player.h); }

    // particles
    particles.forEach(p=>{ ctx.globalAlpha = Math.max(0, 1 - p.age/p.life); ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size); ctx.globalAlpha = 1; });

    requestAnimationFrame(loop);
  }

  // start loop
  start(); requestAnimationFrame(loop);
})();
