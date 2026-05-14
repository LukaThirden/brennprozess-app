# MP4 Search App Design

## Goal
Build a simple local tool that searches for `.mp4` files on your computer without requiring any external dependencies.

## Approach
- Use a Node.js script to perform a recursive filesystem scan.
- Search starts from a user-specified directory or the current working directory.
- Filter files by the `.mp4` extension, case-insensitive.
- Handle common filesystem permission issues gracefully.
- Support optional JSON output for integration with other tools.

## Features
- Recursive directory traversal
- Max recursion depth control
- Human-readable terminal output
- JSON mode for programmatic consumption
- Works on macOS, Linux, and Windows

## Usage
1. Open a terminal in the project folder.
2. Run:
   ```bash
   node mp4-search.js /Users/yourname
   ```
3. Optional flags:
   - `--json` to print JSON output
   - `--max-depth N` to limit recursion depth
   - `--help` to view usage

## Example
```bash
node mp4-search.js --max-depth 5 --json /Users/yourname/Videos
```

## Future Enhancements
- Add a small GUI using Electron or Tauri
- Allow searching by multiple video extensions
- Add a file preview option
- Save search results to a file
