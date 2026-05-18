const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { searchMp4Files } = require('./mp4-search.js');

function createMainWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 760,
    minHeight: 560,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, 'brennprozess.html'));
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('choose-directory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select folder to search for MP4 files',
    properties: ['openDirectory'],
  });

  return canceled ? null : filePaths[0];
});

ipcMain.handle('search-mp4', async (_, startPath, maxDepth) => {
  const results = [];
  await searchMp4Files(startPath, { maxDepth, currentDepth: 0 }, results);
  return results;
});
