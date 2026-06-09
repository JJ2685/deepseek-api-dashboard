const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

let mainWindow = null;
let server = null;

const PORT = 5196;
const DIST = path.join(__dirname, '..', 'dist');
const CONFIG_PATH = path.join(app.getPath('userData'), 'window-state.json');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function loadWindowState() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const state = JSON.parse(raw);
      if (state && typeof state.width === 'number' && typeof state.height === 'number') {
        return {
          width: Math.max(state.width, 280),
          height: Math.max(state.height, 360),
        };
      }
    }
  } catch { /* corrupt file, use defaults */ }
  return { width: 360, height: 520 };
}

function saveWindowState() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getBounds();
  const state = { width: bounds.width, height: bounds.height };
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(state), 'utf-8');
  } catch { /* ignore write errors */ }
}

function startServer() {
  if (server) return;
  server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(DIST, urlPath.slice(1));
    const ext = path.extname(filePath).toLowerCase();

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    } catch {
      try {
        const fallback = fs.readFileSync(path.join(DIST, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fallback);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    }
  });

  server.listen(PORT, '127.0.0.1');
}

function createWindow() {
  const { width, height } = loadWindowState();

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 280,
    minHeight: 360,
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

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.on('close', () => {
    saveWindowState();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (server) server.close();
  app.quit();
});

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