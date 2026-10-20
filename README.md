# Lane – Fitness Tracker
Node.js + Express backend, vanilla HTML/CSS/JS frontend. Workouts are stored in `data.json`.

## Run locally
npm install
npm start      # http://localhost:3000

## Deploy (Render)
1. Push to GitHub.
2. Render > New > Web Service > pick the repo.
3. Build command: `npm install` | Start command: `npm start`

Note: free hosts reset the disk on redeploy, so `data.json` may be wiped. For permanent storage, swap in a database such as MongoDB or SQLite.
