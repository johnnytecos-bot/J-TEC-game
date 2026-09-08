Full-screen pixel stage update

I implemented a fixed-stage, full-screen pixel-art scene inspired by the image you provided. Changes pushed:

- assets/backgrounds/city_stage.svg: a stylized pixel-art city street background (1920x720)
- assets/sprites/spritesheet_64.svg: 2-row x 6-frame sprite sheet (64x64 frames) placeholders for Sana and Abdullah
- src/main.js: replaced the runner with a fixed-stage renderer, HUD (score/time/gap/level/hearts), coins across the map, and pixel rendering with nearest-neighbor (imageSmoothing disabled)
- styles.css: updated layout for full-screen canvas and pixelated scaling

How to test
1. Serve the repo and open it in your browser (recommended):
   - python -m http.server 8000
   - open http://localhost:8000
2. Controls: Space/Up/W to jump. Use the Start button to reset. Press 1/2 to change character selection in other modes (placeholder).

Notes & next steps
- The SVG assets are placeholders and scale crisply. For authentic SNES-style pixel art, I recommend exporting raster PNGs (64x64 frames and a 1920x720 stage) with nearest-neighbor scaling. I can export PNGs and replace the SVGs so pixels remain sharp across browsers and to ensure no anti-aliasing.
- Next I can:
  - Replace SVGs with pixel-perfect PNG exports (recommended)
  - Add detailed pixel portraits, coin animation, and sound/music
  - Add collision/damage mechanics and polish movement (camera, easing)

If you want the pixel-perfect PNG replace now, reply "PNG replace" and I will export PNG sprite sheet and background at 64px frames and push them in a follow-up commit.
