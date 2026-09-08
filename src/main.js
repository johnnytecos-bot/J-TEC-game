// src/main.js - integrate sprite sheet (Sana / Abdullah) into cinematic runner
(function(){
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function resize(){
    const maxW = Math.min(window.innerWidth - 40, 1200);
    const ratio = 3/2;
    canvas.width = Math.floor(maxW);
    canvas.height = Math.floor(maxW / ratio);
  }
  window.addEventListener('resize', resize);
  resize();

  const spriteCols = 6, spriteRows = 2, frameW = 48, frameH = 48;

  // load sprite sheet (SVG will render as image in most browsers)
  const spriteImg = new Image();
  spriteImg.src = 'assets/sprites/spritesheet.svg';
  let spritesLoaded = false;
  spriteImg.onload = ()=>{ spritesLoaded = true; };

  // character selection: 0 = Sana (top), 1 = Abdullah (bottom)
  let character = 0;
  document.addEventListener('keydown', e=>{ if (e.code === 'Digit1') character = 0; if (e.code === 'Digit2') character = 1; });

  // animation timing
  let animTimer = 0, animInterval = 80, animFrame = 0;

  // rest of cinematic game variables (kept similar to prior cinematic version)
  let lastTs = 0; const AudioCtx = window.AudioContext || window.webkitAudioContext; const audio = AudioCtx ? new AudioCtx() : null;
  function playBeep(frequency, type='sine', duration=0.08, gain=0.08){ if (!audio) return; const o = audio.createOscillator(); const g = audio.createGain(); o.type = type; o.frequency.value = frequency; g.gain.value = gain; o.connect(audio.destination); o.connect(audio.destination); o.connect(g); g.connect(audio.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration); o.stop(audio.currentTime + duration + 0.02); }

  const lerp = (a,b,t) => a + (b-a)*t; const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  // parallax layers (kept lightweight)
  class ParallaxLayer{ constructor(speed, drawFn){ this.speed = speed; this.drawFn = drawFn; this.offset = 0; } update(dt, gs){ this.offset = (this.offset + this.speed * gs * dt/16) % (canvas.width); } draw(ctx, ox, oy){ ctx.save(); ctx.translate(-this.offset + ox, oy); this.drawFn(ctx); ctx.restore(); } }
  function drawSky(ctx){ const w = canvas.width, h = canvas.height; const g = ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#01273a'); g.addColorStop(0.5,'#042b3e'); g.addColorStop(1,'#071026'); ctx.fillStyle = g; ctx.fillRect(0,0,w*2,h); }
  function drawMountains(ctx,scale,color){ const w = canvas.width*2, h = canvas.height; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0,h*0.7); for(let x=0;x<w;x+=80){ const y = h*0.7 - Math.abs(Math.sin((x/120))*120*scale) - (Math.random()*8); ctx.lineTo(x,y); } ctx.lineTo(w,h); ctx.closePath(); ctx.fill(); }
  function drawClouds(ctx){ const w = canvas.width*2, h = canvas.height; ctx.fillStyle = 'rgba(255,255,255,0.06)'; for(let i=0;i<14;i++){ const x = (i*200) % (w); const y = 40 + (i%3)*20 + Math.sin(i)*10; ctx.beginPath(); ctx.ellipse(x, y, 60, 22, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(x+40, y+6, 50,18,0,0,Math.PI*2); ctx.fill(); } }
  function drawForeGround(ctx){ const w = canvas.width*2, h = canvas.height; ctx.fillStyle = '#042a31'; ctx.fillRect(0, h-80, w, 80); ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1; for(let x=0;x<w;x+=30){ ctx.beginPath(); ctx.moveTo(x, h-40); ctx.lineTo(x+10,h-36); ctx.stroke(); } }
  const layers = [ new ParallaxLayer(0.2, drawSky), new ParallaxLayer(0.35, ctx=>drawMountains(ctx,0.5,'#06313a')), new ParallaxLayer(0.6, drawClouds), new ParallaxLayer(0.9, ctx=>drawMountains(ctx,1,'#052b34')), new ParallaxLayer(1.6, drawForeGround) ];

  // player
  const player = { x: 140, y: 0, w: 48, h: 48, vy: 0, jumpPower: -16, onGround: false, scaleX:1, scaleY:1 };
  const particles = [];
  function emit(x,y,color,count=8){ for(let i=0;i<count;i++){ particles.push({ x, y, vx:(Math.random()-0.5)*6, vy:(-Math.random()*6-1), life:60 + Math.random()*30, age:0, size:2+Math.random()*3, color }); } }

  // obstacles
  let obstacles = [], spawnTimer = 0, spawnInterval = 90, baseSpeed = 4, frame = 0, running=false, gameOver=false, shake=0;

  // input
  const keys = {};
  addEventListener('keydown', e=>{ keys[e.code] = true; if ((e.code==='Space' || e.code==='Enter') && !running) start(); });
  addEventListener('keyup', e=>{ keys[e.code] = false; });

  function start(){ if (audio && audio.state === 'suspended') audio.resume(); running = true; gameOver = false; obstacles = []; spawnTimer=0; spawnInterval=90; baseSpeed=4; player.y = canvas.height - 80 - player.h; player.vy = 0; player.onGround = true; }

  function spawnObstacle(){ const h = 40 + Math.random()*80; const w = 40 + Math.random()*60; obstacles.push({ x: canvas.width + 40, y: canvas.height - 80 - h, w, h, wobble: Math.random()*0.8 }); }

  function rectsOverlap(a,b){ return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function update(dt){ frame++; animTimer += dt; if (animTimer >= animInterval){ animTimer = 0; animFrame = (animFrame + 1) % spriteCols; }
    // jump
    if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && player.onGround && running){ player.vy = player.jumpPower; player.onGround = false; emit(player.x+player.w/2, player.y+player.h, '#c8f8f0', 12); playBeep(560,'triangle',0.06,0.06); }
    player.vy += 0.8; player.y += player.vy * dt/16; if (player.y + player.h >= canvas.height - 80){ if (!player.onGround){ player.onGround = true; player.vy = 0; player.y = canvas.height - 80 - player.h; emit(player.x+player.w/2, player.y+player.h, '#c8f8f0', 18); playBeep(220,'sine',0.08,0.08); player.scaleY = 1.3; player.scaleX = 0.8; } } else { player.onGround = false; }
    player.scaleY = lerp(player.scaleY,1,0.12); player.scaleX = lerp(player.scaleX,1,0.12);
    spawnTimer++; if (spawnTimer >= spawnInterval){ spawnTimer=0; spawnObstacle(); if (spawnInterval>45) spawnInterval -= 0.6; }
    for (let i=obstacles.length-1;i>=0;i--){ const ob = obstacles[i]; ob.x -= baseSpeed * dt/16; ob.x += Math.sin(frame*0.02 + ob.wobble)*0.2; if (ob.x + ob.w < -60){ obstacles.splice(i,1); } if (rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, ob)){ if (running){ running=false; gameOver=true; shake=18; playBeep(90,'sawtooth',0.4,0.12); } } }
    for (let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.age += dt/16; p.vy += 0.25; p.x += p.vx * dt/16; p.y += p.vy * dt/16; if (p.age > p.life) particles.splice(i,1); }
    shake *= 0.92; if (frame % 300 === 0) baseSpeed += 0.4; }

  function draw(ts){ if (!lastTs) lastTs = ts; const dt = Math.min(40, ts - lastTs); lastTs = ts; if (running) update(dt);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let camX=0, camY=0; camX += (Math.random()-0.5)*shake; camY += (Math.random()-0.5)*shake;
    for (const l of layers){ l.update(dt, baseSpeed); l.draw(ctx, camX*0.6, camY*0.4); }
    ctx.save(); ctx.translate(camX, camY);
    for (const ob of obstacles){ ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.fillRect(ob.x+6, ob.y+ob.h-6, ob.w, 8); const grad = ctx.createLinearGradient(ob.x,ob.y,ob.x,ob.y+ob.h); grad.addColorStop(0,'#f35b4a'); grad.addColorStop(1,'#c12b24'); ctx.fillStyle = grad; ctx.fillRect(ob.x, ob.y, ob.w, ob.h); ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect(ob.x+4, ob.y+4, ob.w-8, 4); }
    // draw player sprite if loaded
    const drawX = player.x, drawY = player.y, drawW = player.w, drawH = player.h;
    if (spritesLoaded){ const sx = animFrame * frameW; const sy = character * frameH; ctx.save(); ctx.translate(drawX + drawW/2, drawY + drawH/2); ctx.scale(player.scaleX, player.scaleY); ctx.translate(-drawX - drawW/2, -drawY - drawH/2); ctx.drawImage(spriteImg, sx, sy, frameW, frameH, drawX, drawY, drawW, drawH); ctx.restore(); }
    else { ctx.fillStyle='#76fff0'; ctx.fillRect(player.x, player.y, player.w, player.h); }
    for (const p of particles){ ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1 - p.age/p.life); ctx.beginPath(); ctx.ellipse(p.x, p.y, p.size, p.size, 0,0,Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore(); ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font = Math.max(14, Math.floor(canvas.height*0.03)) + 'px Inter, Arial'; ctx.fillText('Score: '+Math.floor(frame/10), 14, 28);
    if (!running){ ctx.fillStyle='rgba(2,6,23,0.6)'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#fff'; ctx.font = Math.max(22, Math.floor(canvas.height*0.05)) + 'px Inter, Arial'; ctx.textAlign='center'; if (gameOver) ctx.fillText('Impact — Game Over', canvas.width/2, canvas.height/2 - 20); else ctx.fillText('Press Start or Space to play (1=Sana, 2=Abdullah)', canvas.width/2, canvas.height/2 - 20); ctx.textAlign='left'; }
    requestAnimationFrame(draw); }

  // start button
  document.getElementById('startBtn').addEventListener('click', ()=>{ if (!running) start(); else start(); });
  player.y = canvas.height - 80 - player.h; player.onGround = true; requestAnimationFrame(draw);
})();
