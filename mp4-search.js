#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const MP4_EXTENSION = '.mp4';

async function searchMp4Files(dir, { maxDepth, currentDepth }, results) {
  if (currentDepth > maxDepth) return;

  let dirHandle;
  try {
    dirHandle = await fs.promises.opendir(dir);
  } catch (error) {
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      return;
    }
    throw error;
  }

  for await (const entry of dirHandle) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === MP4_EXTENSION) {
      results.push(fullPath);
      continue;
    }

    if (entry.isDirectory()) {
      await searchMp4Files(fullPath, { maxDepth, currentDepth: currentDepth + 1 }, results);
    }
  }
}

function printUsage() {
  console.log('Usage: node mp4-search.js [options] [start-directory]');
  console.log('Options:');
  console.log('  --json           Output results as JSON');
  console.log('  --max-depth N    Limit recursion depth (default: unlimited)');
  console.log('  --help           Show this help message');
  console.log('If no directory is provided, the current working directory is searched.');
}

async function main() {
  const args = process.argv.slice(2);
  const options = { json: false, maxDepth: Infinity };
  const paths = [];

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      return;
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--max-depth' || arg === '-d') {
      const next = args[i + 1];
      if (!next || Number.isNaN(Number(next))) {
        console.error('Error: --max-depth requires a numeric value.');
        process.exit(1);
      }
      options.maxDepth = Number(next);
      i += 1;
      continue;
    }

    paths.push(arg);
  }

  const startPath = paths.length ? path.resolve(paths[0]) : process.cwd();
  const results = [];

  try {
    await searchMp4Files(startPath, { maxDepth: options.maxDepth, currentDepth: 0 }, results);
  } catch (error) {
    console.error('Search failed:', error.message);
    process.exit(1);
  }

  if (options.json) {
    process.stdout.write(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log('No MP4 files found.');
    return;
  }

  console.log('Found MP4 files:');
  results.forEach((filePath) => console.log(filePath));
}

module.exports = {
  searchMp4Files,
};

if (require.main === module) {
  main();
}
