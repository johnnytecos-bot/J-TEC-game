Endless side-scrolling runner update

I updated the game to a 2D side-view endless runner with the following changes:

- A real endless procedural world: obstacles spawn and move left; coins spawn in patterns; speed ramps up over time.
- Player actions: jump (Space/Up/W/tap) and slide (Down/S or mobile slide button). Sliding shortens the collider so you can dodge low obstacles.
- Cinematic polish: parallax background tiling, ground tiles, particle effects on collect, shadow, camera-synced distance & level.
- HUD: score, time, high score (persisted to localStorage), level.
- Mobile controls: on-screen Jump and Slide buttons (hidden on wide screens).

How to test locally
1. Serve the repo folder (recommended):
   - python -m http.server 8000
   - open http://localhost:8000
2. Controls:
   - Jump: Space / Up Arrow / W (or mobile: JUMP button)
   - Slide: Down Arrow / S (or mobile: SLIDE button)
   - Start/Restart: Start / Restart button

Notes & next steps
- I used the existing SVG sprite/background placeholders. For pixel-perfect visuals, I still recommend replacing the SVGs with PNG exports. If you want I can export high-quality 64×64 PNG frames and a 1920×720 PNG background and push them next.
- I can also: add better tile art, animated coins, SFX/music, smooth camera follow, motion blur, and difficulty tuning.

If you want me to export PNGs now, reply "PNG replace" and I will push rasterized assets and a final polish commit.
