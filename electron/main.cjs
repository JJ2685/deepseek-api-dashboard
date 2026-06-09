const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 280,
    height: 380,
    minWidth: 220,
    minHeight: 300,
    frame: false,
    backgroundColor: '#f5f5f5',
    resizable: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('window:close', () => { mainWindow?.close(); });
ipcMain.on('window:minimize', () => { mainWindow?.minimize(); });

ipcMain.handle('window:toggleAlwaysOnTop', () => {
  if (!mainWindow) return false;
  const current = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!current);
  return !current;
});