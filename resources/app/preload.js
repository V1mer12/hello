const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('myBIBLIA', {
  loadWorkspace: () => ipcRenderer.invoke('workspace:get'),
  saveWorkspace: (payload) => ipcRenderer.invoke('workspace:save', payload),
  getAppInfo: () => ipcRenderer.invoke('app:info')
});
