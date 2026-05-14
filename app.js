const pathInput = document.getElementById('pathInput');
const browseButton = document.getElementById('browseButton');
const searchButton = document.getElementById('searchButton');
const depthInput = document.getElementById('depthInput');
const resultsList = document.getElementById('resultsList');
const statusText = document.getElementById('statusText');

function setStatus(text, isError = false) {
  statusText.textContent = text;
  statusText.style.color = isError ? '#c0392b' : '#2c3e50';
}

function renderResult(paths) {
  resultsList.innerHTML = '';
  if (paths.length === 0) {
    resultsList.innerHTML = '<div class="empty-state">No MP4 files found.</div>';
    return;
  }

  paths.forEach((filePath) => {
    const item = document.createElement('div');
    item.className = 'result-item';
    item.textContent = filePath;
    resultsList.appendChild(item);
  });
}

browseButton.addEventListener('click', async () => {
  const selected = await window.mp4Search.chooseDirectory();
  if (selected) {
    pathInput.value = selected;
  }
});

searchButton.addEventListener('click', async () => {
  const startPath = pathInput.value.trim();
  if (!startPath) {
    setStatus('Please choose or enter a folder path.', true);
    return;
  }

  const rawDepth = depthInput.value.trim();
  const maxDepth = rawDepth === '' ? Infinity : Number(rawDepth);
  if (rawDepth !== '' && (Number.isNaN(maxDepth) || maxDepth < 0)) {
    setStatus('Max depth must be a positive number.', true);
    return;
  }

  setStatus('Searching...');
  searchButton.disabled = true;
  browseButton.disabled = true;

  try {
    const results = await window.mp4Search.search(startPath, maxDepth);
    renderResult(results);
    setStatus(`Found ${results.length} MP4 file${results.length === 1 ? '' : 's'}`);
  } catch (error) {
    renderResult([]);
    setStatus(`Search failed: ${error.message}`, true);
  } finally {
    searchButton.disabled = false;
    browseButton.disabled = false;
  }
});
