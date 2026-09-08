J TEC game

This repository is a simple browser-based JavaScript starter for the "J TEC game" project. It includes a minimal playable demo: an endless-runner style game where you jump a square past incoming obstacles.

Files added:
- index.html — main page with the canvas and controls
- styles.css — basic styling
- src/main.js — game loop, input, obstacles, scoring
- assets/.gitkeep — placeholder for future assets

How to run locally:
1. Option A (recommended): Serve with a simple static server
   - Python 3: python -m http.server 8000
   - Node: npx http-server
   Then open http://localhost:8000 in your browser.

2. Option B: Open index.html directly in the browser (some browsers may restrict module/script features when opened via file://)

Next steps you might want me to take:
- Add art and sound assets
- Implement mobile/touch controls
- Add levels, menus, and persistent high score
- Enable GitHub Pages deployment

License: MIT
