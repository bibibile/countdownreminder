const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let mainWindow;
let isPinned = false;

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 520,
    frame: false,         // 无边框
    transparent: false,   // 在Win中配合毛玻璃需要关闭自身纯透明
    backgroundColor: '#00000000', // 窗口底色设为空
    backgroundMaterial: 'acrylic', // 启用 Win11 原生毛玻璃材质！
    alwaysOnTop: false,   // 默认不置顶
    resizable: false,     // 固定大小，避免误触改变形变
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadFile('index.html')

  // 失去焦点时（点击桌面其他地方）变为半透明
  mainWindow.on('blur', () => {
    mainWindow.setOpacity(0.5);
  })

  // 重新获取焦点时恢复正常
  mainWindow.on('focus', () => {
    mainWindow.setOpacity(1.0);
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 监听渲染进程的通讯
ipcMain.handle('toggle-pin', (event) => {
  isPinned = !isPinned;
  // 改变置顶状态
  mainWindow.setAlwaysOnTop(isPinned);
  return isPinned; 
});

ipcMain.handle('close-app', (event) => {
  app.quit();
});
