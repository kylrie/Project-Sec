import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 650,
    title: 'F.R.I.D.A.Y. Tactical AI Voice Secretary',
    backgroundColor: '#050811',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  mainWindow.loadURL(clientUrl).catch(() => {
    // Fallback to local static build
    const indexPath = path.join(__dirname, '../client/dist/index.html');
    mainWindow.loadFile(indexPath);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('[Desktop] F.R.I.D.A.Y. Application Shell Ready (< 1s start)');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function toggleWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register Global Hotkey: Ctrl + Shift + Space
  const shortcutRegistered = globalShortcut.register('CommandOrControl+Shift+Space', () => {
    console.log('[Desktop] Global Hotkey (Ctrl+Shift+Space) triggered');
    toggleWindow();
  });

  if (shortcutRegistered) {
    console.log('[Desktop] Global Hotkey Ctrl+Shift+Space registered successfully.');
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
