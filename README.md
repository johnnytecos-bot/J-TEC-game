J TEC game — Cinematic update

I updated the starter game to feel more cinematic and responsive. Changes include:

- Responsive canvas sizing for different screen widths
- Parallax background layers (sky, mountains, clouds, foreground) for depth
- Particle effects on jump and landing for tactile feel
- Squash/stretch animation on the player when landing
- Camera shake and a heavier hit impact when you collide with an obstacle
- Simple generated sound effects (using WebAudio) for jump and hit events
- Improved obstacle visuals and lighting highlights

How to test
1. Serve the repo and open the game (recommended):
   - python -m http.server 8000
   - open http://localhost:8000
2. Controls: Space / Up / W to jump. Click Start to begin.

Next enhancements I can add (pick one):
- Add art and sprite assets (I can add a small art pack)
- Add mobile touch controls and virtual buttons
- Add music, more advanced audio, and SFX files
- Add menu, high-score persistence (localStorage), and pause

If you want a specific cinematic effect (e.g., slow-motion on hit, dynamic camera follow, or intro animation lengthening), tell me which and I'll implement it.
