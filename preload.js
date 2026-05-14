const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mp4Search', {
  chooseDirectory: () => ipcRenderer.invoke('choose-directory'),
  search: (startPath, maxDepth) => ipcRenderer.invoke('search-mp4', startPath, maxDepth),
});
