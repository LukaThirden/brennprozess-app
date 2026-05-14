# Website with Menu Bar

A simple static website with a top navigation menu containing `Program`, `Info`, and `Newsletter` sections.

The content is inspired by the Stretcher project website at `www.strrretcher.ch`, including current exhibition highlights, project information, opening hours, and a newsletter signup.

## Files

- `index.html` — main page
- `styles.css` — styling for layout and menu
- `mp4-search.js` — Node.js script to scan a folder for `.mp4` files
- `mp4-search-design.md` — design and usage notes for the MP4 search app
- `app.html` — Electron app UI
- `app.css` — Electron app styling
- `app.js` — Electron app renderer logic
- `electron-main.js` — Electron app main process
- `preload.js` — Electron secure preload bridge
- `package.json` — Electron app configuration
- `mp4-search-app-design.md` — Electron app design notes

## Usage

Open `index.html` in your browser to view the site.

## MP4 Search Tool

This project now includes both a terminal utility and a desktop Electron app for searching MP4 files.

### Desktop app

Install dependencies and launch the Electron app:

```bash
npm install
npm start
```

### Command-line tool

Run the CLI search tool:

```bash
node mp4-search.js [path]
```

Example:

```bash
node mp4-search.js /Users/yourname/Videos
```

Options:

- `--json` output results as JSON
- `--max-depth N` limit recursion depth
- `--help` show usage information
