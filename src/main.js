// src/main.js - fixed-stage pixel-runner with HUD, coins, hearts, and pixel sprite characters
(function(){
  // canvas and resizing
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // maintain pixel-perfect drawing scale factor for sprites
  }
  window.addEventListener('resize', resize);
  resize();

  // disable smoothing for pixel-art look
  ctx.imageSmoothingEnabled = false;

  // load assets
  const bg = new Image(); bg.src = 'assets/backgrounds/city_stage.svg';
  const spriteImg = new Image(); spriteImg.src = 'assets/sprites/spritesheet_64.svg';
  let assetsLoaded = 0; const totalAssets = 2;
  bg.onload = ()=>{ assetsLoaded++; };
  spriteImg.onload = ()=>{ assetsLoaded++; };

  // sprite & animation params
  const FRAME_W = 64, FRAME_H = 64, COLS = 6;
  let animFrame = 0, animTimer = 0, animInterval = 80;

  // characters
  let character = 0; // 0 Sana (right), 1 Abdullah (left)
  document.addEventListener('keydown', e=>{ if(e.code==='Digit1') character = 0; if(e.code==='Digit2') character = 1; });

  // stage geometry (fixed map)
  const stage = { width: 1600, height: 720, groundY: 520, scale:1 };

  // place coins along the stage
  const coins = [];
  for(let x=600; x<1400; x+=80) coins.push({x, y: stage.groundY - 120, collected:false});

  // players state
  const sana = { x: 1100, y: stage.groundY - FRAME_H, w: FRAME_W, h: FRAME_H, vy:0, onGround:true, hearts:3 };
  const abd = { x: 500, y: stage.groundY - FRAME_H, w: FRAME_W, h: FRAME_H, vy:0, onGround:true, hearts:3 };
  const player = sana; // default player is Sana (right)

  // camera is fixed to center like the example
  function worldToScreen(wx, wy){
    // we'll center the stage in the canvas
    const offsetX = (canvas.width - stage.width*stage.scale)/2;
    const offsetY = (canvas.height - stage.height*stage.scale)/2;
    return { x: Math.round(offsetX + wx*stage.scale), y: Math.round(offsetY + wy*stage.scale) };
  }

  // input
  const keys = {};
  addEventListener('keydown', e=>{ keys[e.code]=true; if ((e.code==='Space' || e.code==='ArrowUp' || e.code==='KeyW') && player.onGround) { player.vy = -18; player.onGround=false; emit(player.x + player.w/2, player.y + player.h, '#ffd9f0', 12); } });
  addEventListener('keyup', e=>{ keys[e.code]=false; });

  // particles
  const particles = [];
  function emit(x,y,color,count=10){ for(let i=0;i<count;i++){ particles.push({ x, y, vx:(Math.random()-0.5)*6, vy:(-Math.random()*6-2), age:0, life:60+Math.random()*40, size:2+Math.random()*4, color }); } }

  // HUD values
  let score = 0; let startTime = Date.now(); let level = 3; let gap = Math.abs(sana.x - abd.x);

  // helper draw functions
  function drawPixelText(ctx, text, x, y, scale=1){ ctx.save(); ctx.font = (14*scale) + 'px monospace'; ctx.fillStyle = '#ffd86b'; ctx.fillText(text, x, y); ctx.restore(); }

  // main update/draw loop
  let last = 0;
  function loop(ts){ if (!last) last = ts; const dt = Math.min(40, ts - last); last = ts;
    // update animations
    animTimer += dt; if (animTimer >= animInterval){ animTimer = 0; animFrame = (animFrame + 1) % COLS; }

    // physics for both characters
    [sana, abd].forEach(ch => {
      ch.vy += 0.9; ch.y += ch.vy * dt/16;
      if (ch.y + ch.h >= stage.groundY){ ch.y = stage.groundY - ch.h; ch.vy = 0; ch.onGround = true; }
    });

    // player selection
    // (player variable points to sana by default but user can switch)

    // coin collection
    for(const c of coins){ if(!c.collected){ const pw = (player === sana ? sana : abd); if (Math.abs(pw.x - c.x) < 48){ c.collected = true; score += 200; emit(c.x, c.y, '#ffd24d', 12); playBeep(880,'sine',0.06,0.06); } } }

    // gap measure
    gap = Math.abs(sana.x - abd.x);

    // draw
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // center stage
    const sx = Math.round((canvas.width - stage.width)/2);
    const sy = Math.round((canvas.height - stage.height)/2);

    // draw background (scale to fit stage width)
    if (bg.complete){
      // preserve pixel look by drawing at integer positions
      ctx.drawImage(bg, sx, sy, stage.width, stage.height);
    } else {
      // fallback background
      ctx.fillStyle = '#6b83b0'; ctx.fillRect(sx, sy, stage.width, stage.height);
    }

    // draw coins
    for(const c of coins){ if (!c.collected){ const p = worldToScreen(c.x, c.y); ctx.fillStyle = '#ffd24d'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10, 10, 0,0,2*Math.PI); ctx.fill(); } }

    // draw characters (sprite)
    function drawChar(ch, row){
      const p = worldToScreen(ch.x, ch.y);
      const sxsrc = animFrame * FRAME_W; const sysrc = row * FRAME_H;
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(p.x + ch.w/2, p.y + ch.h + 8, ch.w*0.5, 8, 0,0,Math.PI*2); ctx.fill();
      if (spriteImg.complete){ ctx.imageSmoothingEnabled = false; ctx.drawImage(spriteImg, sxsrc, sysrc, FRAME_W, FRAME_H, p.x, p.y, ch.w, ch.h); }
      else { ctx.fillStyle = row===0 ? '#ff66b2' : '#1fe0ff'; ctx.fillRect(p.x, p.y, ch.w, ch.h); }
    }
    drawChar(abd, 1);
    drawChar(sana, 0);

    // particles
    for(let i = particles.length-1; i>=0; i--){ const pr = particles[i]; pr.age++; pr.vy += 0.2; pr.x += pr.vx * dt/16; pr.y += pr.vy * dt/16; ctx.globalAlpha = Math.max(0, 1 - pr.age/pr.life); ctx.fillStyle = pr.color; ctx.beginPath(); ctx.ellipse(pr.x + sx, pr.y + sy, pr.size, pr.size, 0,0,2*Math.PI); ctx.fill(); ctx.globalAlpha = 1; if (pr.age > pr.life) particles.splice(i,1); }

    // HUD
    ctx.save(); ctx.fillStyle = '#ffd86b'; ctx.font = '22px monospace'; ctx.fillText('SCORE: ' + String(score).padStart(5,'0'), 28, 40); const elapsed = Math.floor((Date.now() - startTime)/1000); const mm = String(Math.floor(elapsed/60)).padStart(2,'0'); const ss = String(elapsed%60).padStart(2,'0'); ctx.fillText('TIME: ' + mm + ':' + ss, 28, 76);
    // gap center
    ctx.textAlign = 'center'; ctx.fillText('GAP: ' + Math.floor(gap) + 'm', canvas.width/2, 40); ctx.textAlign = 'left';
    // top-right level and portraits (simplified)
    ctx.fillStyle = '#fff'; ctx.fillText('LEVEL ' + level, canvas.width - 160, 40);
    // hearts
    for(let i=0;i<sana.hearts;i++){ ctx.fillStyle = '#ff6b6b'; ctx.fillRect(canvas.width - 160 + i*18, 56, 12, 12); }
    for(let i=0;i<abd.hearts;i++){ ctx.fillStyle = '#ff6b6b'; ctx.fillRect(canvas.width - 80 + i*18, 56, 12, 12); }
    ctx.restore();

    requestAnimationFrame(loop);
  }

  // small audio helper
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audio = AudioCtx ? new AudioCtx() : null;
  function playBeep(freq, type='sine', duration=0.08, gain=0.06){ if (!audio) return; const o = audio.createOscillator(); const g = audio.createGain(); o.type = type; o.frequency.value = freq; g.gain.value = gain; o.connect(g); g.connect(audio.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration); o.stop(audio.currentTime + duration + 0.02); }

  // expose small controls
  document.getElementById('startBtn').addEventListener('click', ()=>{ startGame(); });
  function startGame(){ startTime = Date.now(); score = 0; sana.x = 1100; abd.x = 500; sana.hearts=3; abd.hearts=3; }

  // initialize
  startGame(); requestAnimationFrame(loop);
})();
