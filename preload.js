const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  getToken: () => ipcRenderer.invoke('get-token'),
  saveToken: (token) => ipcRenderer.invoke('save-token', token),
  clearToken: () => ipcRenderer.invoke('clear-token'),
  db: {
    prescriptions: {
      create: (data) => ipcRenderer.invoke('db-prescription-create', data),
      clear: () => ipcRenderer.invoke('db-prescription-clear'),
      search: (query) => ipcRenderer.invoke('db-prescription-search', query)
    }
  }
})