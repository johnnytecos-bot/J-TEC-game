// src/main.js - cinematic endless-runner with parallax, particles, easing, camera shake, and generated sound
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Responsive sizing
  function resize(){
    const maxW = Math.min(window.innerWidth - 40, 1200);
    const ratio = 3/2; // width / height
    canvas.width = Math.floor(maxW);
    canvas.height = Math.floor(maxW / ratio);
  }
  window.addEventListener('resize', resize);
  resize();

  const W = () => canvas.width;
  const H = () => canvas.height;

  // Timing
  let lastTs = 0;

  // Audio - simple oscillator sounds
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audio = AudioCtx ? new AudioCtx() : null;
  function playBeep(frequency, type='sine', duration=0.08, gain=0.08){
    if (!audio) return;
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type; o.frequency.value = frequency;
    g.gain.value = gain;
    o.connect(g); g.connect(audio.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    o.stop(audio.currentTime + duration + 0.02);
  }

  // Easing helpers
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const lerp = (a,b,t) => a + (b-a)*t;

  // Parallax layers
  class ParallaxLayer{
    constructor(speed, drawFn){ this.speed = speed; this.drawFn = drawFn; this.offset = 0; }
    update(dt, gameSpeed){ this.offset = (this.offset + this.speed * gameSpeed * dt/16) % (W()); }
    draw(ctx, ox, oy){ ctx.save(); ctx.translate(-this.offset + ox, oy); this.drawFn(ctx); ctx.restore(); }
  }

  // Layers: sky gradient, far mountains, clouds, mid mountains, ground decals
  function drawSky(ctx){
    const w = W(), h = H();
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, '#01273a'); g.addColorStop(0.5, '#042b3e'); g.addColorStop(1, '#071026');
    ctx.fillStyle = g; ctx.fillRect(0,0,w*2,h);
  }

  function drawMountains(ctx, scale=1, color='#062e3a'){
    const w = W()*2, h = H();
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(0,h*0.7);
    for(let x=0;x<w;x+=80){
      const y = h*0.7 - Math.abs(Math.sin((x/120))*120*scale) - (Math.random()*8);
      ctx.lineTo(x,y);
    }
    ctx.lineTo(w,h); ctx.closePath(); ctx.fill();
  }

  function drawClouds(ctx){
    const w = W()*2, h = H();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for(let i=0;i<14;i++){
      const x = (i*200) % (w);
      const y = 40 + (i%3)*20 + Math.sin(i)*10;
      ctx.beginPath(); ctx.ellipse(x, y, 60, 22, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+40, y+6, 50,18,0,0,Math.PI*2); ctx.fill();
    }
  }

  function drawForeGround(ctx){
    const w = W()*2, h = H();
    // ground stripe
    ctx.fillStyle = '#042a31'; ctx.fillRect(0, h-80, w, 80);
    // subtle lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
    for(let x=0;x<w;x+=30){ ctx.beginPath(); ctx.moveTo(x, h-40); ctx.lineTo(x+10,h-36); ctx.stroke(); }
  }

  const layers = [
    new ParallaxLayer(0.2, drawSky),
    new ParallaxLayer(0.35, ctx=>drawMountains(ctx,0.5,'#06313a')),
    new ParallaxLayer(0.6, drawClouds),
    new ParallaxLayer(0.9, ctx=>drawMountains(ctx,1,'#052b34')),
    new ParallaxLayer(1.6, drawForeGround)
  ];

  // Player with squash/stretch and trail
  const player = { x: 140, y: 0, w: 52, h: 52, vy: 0, jumpPower: -16, onGround: false, scaleY:1, scaleX:1 };

  // Particles
  const particles = [];
  function emit(x,y,color,count=10){
    for(let i=0;i<count;i++){
      particles.push({ x, y, vx:(Math.random()-0.5)*6, vy:(-Math.random()*6-1), life:60 + Math.random()*30, age:0, size:2+Math.random()*3, color });
    }
  }

  // Obstacles
  let obstacles = [];
  let spawnTimer = 0;
  let spawnInterval = 90;
  let baseSpeed = 4;
  let gameSpeed = 1;

  function spawnObstacle(){
    const h = 40 + Math.random()*80;
    const w = 40 + Math.random()*60;
    obstacles.push({ x: W() + 40, y: H() - 80 - h, w, h, wobble: Math.random()*0.8 });
  }

  // Camera shake and intro cinematic
  let shake = 0;
  let shakeDecay = 0.9;
  let intro = { active: true, t:0, duration: 1600 };
  let running = false;
  let score = 0;
  let frame = 0;
  let gameOver = false;

  // Input
  const keys = {};
  addEventListener('keydown', e => { keys[e.code] = true; if ((e.code==='Space' || e.code==='Enter') && !running) start(); });
  addEventListener('keyup', e => { keys[e.code] = false; });

  function start(){
    // resume audio on user gesture
    if (audio && audio.state === 'suspended') audio.resume();
    running = true; gameOver = false; score = 0; frame = 0; obstacles = []; spawnTimer = 0; spawnInterval = 90; baseSpeed = 4; gameSpeed = 1; intro.active = false;
    player.y = H() - 80 - player.h; player.vy = 0; player.onGround = true; player.scaleX = 1; player.scaleY = 1;
  }

  function reset(){ start(); }

  function update(dt){
    frame++;
    // show intro nice pan if active
    if (intro.active){ intro.t += dt; if (intro.t > intro.duration) intro.active = false; }

    // Input jump
    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround && running){ player.vy = player.jumpPower; player.onGround = false; emit(player.x+player.w/2, player.y+player.h, '#c8f8f0', 12); playBeep(560,'triangle',0.06,0.06); }

    // physics
    player.vy += 0.8; player.y += player.vy;
    if (player.y + player.h >= H() - 80){
      if (!player.onGround){ // just landed
        player.onGround = true; player.vy = 0; player.y = H() - 80 - player.h; emit(player.x+player.w/2, player.y+player.h, '#c8f8f0', 18); playBeep(220,'sine',0.08,0.08);
        // squash/stretch animation
        player.scaleY = 1.3; player.scaleX = 0.8;
      }
    } else { player.onGround = false; }

    // relax scale towards 1
    player.scaleY = lerp(player.scaleY, 1, 0.12);
    player.scaleX = lerp(player.scaleX, 1, 0.12);

    // obstacles
    spawnTimer++;
    if (spawnTimer >= spawnInterval){ spawnTimer = 0; spawnObstacle(); if (spawnInterval>45) spawnInterval -= 0.6; }
    for (let i = obstacles.length -1; i>=0; i--){
      const ob = obstacles[i];
      ob.x -= baseSpeed * gameSpeed * dt/16;
      ob.x += Math.sin(frame*0.02 + ob.wobble)*0.2; // subtle bob
      if (ob.x + ob.w < -60){ obstacles.splice(i,1); score += 1; }
    }

    // particles
    for (let i = particles.length-1; i>=0; i--){
      const p = particles[i]; p.age += dt/16; p.vy += 0.25; p.x += p.vx * dt/16; p.y += p.vy * dt/16; if (p.age > p.life) particles.splice(i,1);
    }

    // collisions
    for (const ob of obstacles){ if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, ob)){
      if (running){ // trigger hit
        running = false; gameOver = true; shake = 18; playBeep(90,'sawtooth',0.4,0.12); // heavier sound
      }
    }}

    // shake decay
    shake *= 0.92;

    // speed ramp
    if (frame % 300 === 0) baseSpeed += 0.4;
  }

  function rectsOverlap(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function drawFrame(ts){
    if (!lastTs) lastTs = ts; const dt = Math.min(40, ts - lastTs); lastTs = ts;
    // update
    if (running) update(dt);

    // clear
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // camera cinematic offset
    let camX = 0, camY = 0;
    if (intro.active){ const p = easeOutCubic(Math.min(1,intro.t/intro.duration)); camX = -lerp(120,0, p); camY = lerp(30,0,p); }
    camX += (Math.random()-0.5)*shake; camY += (Math.random()-0.5)*shake;

    // draw parallax layers
    for (const l of layers){ l.update(dt, baseSpeed*gameSpeed); l.draw(ctx, camX*0.6, camY*0.4); }

    // midground: obstacles shadow
    ctx.save(); ctx.translate(camX, camY);

    // draw obstacles with lighting
    for (const ob of obstacles){
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(ob.x+6, ob.y+ob.h-6, ob.w, 8);
      // body
      const grad = ctx.createLinearGradient(ob.x,ob.y,ob.x, ob.y+ob.h);
      grad.addColorStop(0,'#f35b4a'); grad.addColorStop(1,'#c12b24');
      ctx.fillStyle = grad; ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
      // highlight
      ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(ob.x+4, ob.y+4, ob.w-8, 4);
    }

    // draw player with shadow and squash
    const px = player.x, py = player.y, pw = player.w, ph = player.h;
    // shadow
    ctx.beginPath(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.ellipse(px+pw/2+6, H()-80+8, pw*0.6, 8, 0,0,Math.PI*2); ctx.fill();
    // body with scale
    ctx.save(); ctx.translate(px + pw/2 + camX, py + ph/2 + camY);
    ctx.scale(player.scaleX, player.scaleY);
    ctx.fillStyle = '#76fff0'; ctx.fillRect(-pw/2, -ph/2, pw, ph);
    // soft highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(-pw/4, -ph/2 + 6, pw/2, 8);
    ctx.restore();

    // particles
    for (const p of particles){ ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - p.age/p.life); ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size, 0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; }

    ctx.restore();

    // UI overlay
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = Math.max(14, Math.floor(H()*0.03)) + 'px Inter, Arial'; ctx.fillText('Score: '+score, 14, 28);
    if (!running){
      ctx.fillStyle = 'rgba(2,6,23,0.6)'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#fff'; ctx.font = Math.max(22, Math.floor(H()*0.05)) + 'px Inter, Arial'; ctx.textAlign = 'center';
      if (intro.active) ctx.fillText('J TEC — Preparing the stage...', canvas.width/2, canvas.height/2);
      else if (gameOver) ctx.fillText('Impact — Game Over', canvas.width/2, canvas.height/2 - 20);
      else ctx.fillText('Press Start or Space to play', canvas.width/2, canvas.height/2 - 20);
      ctx.textAlign = 'left';
    }

    requestAnimationFrame(drawFrame);
  }

  // Start button hookup
  document.getElementById('startBtn').addEventListener('click', ()=>{ if (!running) start(); else { /* restart quickly */ start(); } });

  // initial values
  player.y = H() - 80 - player.h; player.onGround = true;
  requestAnimationFrame(drawFrame);
})();
