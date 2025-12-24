// Disable V8 code caching and ICU issues
process.noDeprecation = true;
process.env.ELECTRON_OZONE_PLATFORM_HINT = 'auto';
process.env.ELECTRON_ENABLE_LOGGING = '0';

const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable Chromium media codecs to avoid ffmpeg.dll loading
app.commandLine.appendSwitch('disable-features', 'PlatformMediaCodecs');

let mainWindow;
const isDev = process.env.ELECTRON_START_URL ? true : false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      enableRemoteModule: false,
      sandbox: false,
    },
  });

  let startUrl;
  if (isDev || process.env.ELECTRON_START_URL) {
    startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  } else {
    // In production, the dist folder is inside app.asar in the resources folder
    // Try multiple paths
    let distPath = path.join(__dirname, '..', 'resources', 'app.asar.unpacked', 'dist', 'index.html');
    if (!fs.existsSync(distPath)) {
      // If unpacked version doesn't exist, try the asar version
      distPath = path.join(__dirname, '..', 'resources', 'app', 'dist', 'index.html');
    }
    if (!fs.existsSync(distPath)) {
      // Last resort - try relative to app
      distPath = path.join(__dirname, 'dist', 'index.html');
    }
    startUrl = `file://${distPath}`;
    console.log('Using dist path:', distPath, 'Exists:', fs.existsSync(distPath));
  }

  console.log('Loading URL:', startUrl, 'isDev:', isDev);
  mainWindow.loadURL(startUrl);

  // Only open DevTools in development mode
  if (isDev || process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Create application menu
const menu = Menu.buildFromTemplate([
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
    ],
  },
]);

Menu.setApplicationMenu(menu);
