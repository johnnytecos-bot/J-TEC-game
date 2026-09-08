Sprites and character integration

I added a two-row sprite sheet and integrated it into the game so you can select between Sana (key 1) and Abdullah (key 2). Details:

- assets/sprites/spritesheet.svg — 6-frame top row Sana, 6-frame bottom row Abdullah (48x48 frames). The sheet includes a light-gray grid preview and transparent background.
- src/main.js updated to load the sprite sheet, animate the running frames, and draw the selected character with squash/stretch and particle effects.

Controls:
- 1 = Sana
- 2 = Abdullah
- Space / Up / W = jump
- Start button = start/restart

If you want a PNG instead of SVG, or higher detail pixel art, I can produce a PNG export (I can generate a higher-res raster version and add it to assets) — confirm if you want a PNG and what frame size (32/48/64).