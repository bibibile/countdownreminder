const { contextBridge, ipcRenderer } = require('electron')

// 暴露安全的 API 到浏览器的 window 对象上
contextBridge.exposeInMainWorld('electronAPI', {
  togglePin: () => ipcRenderer.invoke('toggle-pin'),
  closeApp: () => ipcRenderer.invoke('close-app')
})
