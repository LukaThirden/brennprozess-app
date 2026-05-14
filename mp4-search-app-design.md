# MP4 Search Electron App

## Overview
This project now includes a small Electron desktop app for searching `.mp4` files.

## App Structure
- `electron-main.js` — Electron main process, window creation, and IPC handlers
- `preload.js` — secure renderer bridge exposing search functions
- `app.html` — desktop UI
- `app.js` — UI interactions and result rendering
- `app.css` — styling for the desktop app
- `mp4-search.js` — shared MP4 search engine, now usable as CLI or Electron module

## Features
- Select any folder with a folder picker
- Optionally set recursion depth
- Display found MP4 file paths in a scrollable list
- Works on macOS, Windows, and Linux with Electron

## Run the app
1. Install dependencies:
   ```bash
   npm install
   ```
2. Launch the desktop app:
   ```bash
   npm start
   ```

## CLI usage
The same search logic can still be used from the terminal:

```bash
npm run cli -- /Users/yourname/Videos
```
