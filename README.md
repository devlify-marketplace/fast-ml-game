# fast-ml-game

Fast ML Game — a small browser demo that uses MediaPipe Hands for low-latency hand tracking to control a simple "catch the falling objects" game.

Features
- Client-side hand tracking using MediaPipe Hands (no server-side ML, no uploads)
- Canvas-based game loop with keyboard fallback (left/right arrows)
- Simple scoring and lives

How to run locally
1. Clone the repository (you need access since the repo is private):

   git clone git@github.com:devlify-marketplace/fast-ml-game.git
   cd fast-ml-game

2. Serve the files with a local server (browser requires camera on secure context or localhost):

   # with Python 3
   python3 -m http.server 8000
   # then open http://localhost:8000

3. Allow camera access when prompted.

Notes and next steps
- The demo uses MediaPipe from CDN. For production, consider bundling or pinning versions.
- To make the repo public, change visibility in repository settings.
- I can add:
  - A Teachable Machine mode (in-browser training)
  - More polished graphics and sound effects
  - Mobile-specific UI improvements

