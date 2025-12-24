import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import Stripe from 'stripe';
import * as dotenv from 'dotenv';
const fs = require('fs');

// Load environment variables from multiple locations
const envPaths = [
  path.join(__dirname, '..', '.env.local'),           // Development
  path.join(process.cwd(), '.env.local'),              // CWD
  path.join(app.getAppPath(), '.env.local'),           // Packaged app
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log('[Main] Loading .env.local from:', envPath);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('[Main] ⚠️ .env.local not found in any location');
}

console.log('[Main] STRIPE_SECRET_KEY loaded:', process.env.STRIPE_SECRET_KEY ? '✅ YES' : '❌ NO');

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('[Main] ❌ STRIPE_SECRET_KEY not found in environment');
}

// Initialize Stripe with error handling
let stripe: Stripe | null = null;
if (stripeKey) {
  try {
    stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    console.log('[Main] ✅ Stripe initialized successfully');
  } catch (err: any) {
    console.error('[Main] ❌ Failed to initialize Stripe:', err.message);
  }
} else {
  console.error('[Main] ❌ Cannot initialize Stripe - no API key available');
}

console.error('[Main] 🚀 MAIN PROCESS STARTED');
console.error('[Main] __dirname:', __dirname);

let mainWindow: BrowserWindow | null;

const isDev = process.env.NODE_ENV === 'development';

console.log('[Main] __dirname:', __dirname);
console.log('[Main] isDev:', isDev);
console.log('[Main] process.cwd():', process.cwd());

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('[Main] Preload path:', preloadPath);
  
  const fs = require('fs');
  const preloadExists = fs.existsSync(preloadPath);
  console.log('[Main] Preload exists:', preloadExists);
  
  if (!preloadExists) {
    console.error('[Main] ❌ Preload file not found at:', preloadPath);
  }
  
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: preloadPath,
      sandbox: true,
    },
  });
  
  // Maximize window on startup
  mainWindow.maximize();
  
  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('[Main] Preload error:', preloadPath, error);
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);
  
  // Focus the window once it's ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.focus();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handler for creating payment intent
console.log('[Main] Registering IPC handler for create-payment-intent');
ipcMain.handle('create-payment-intent', async (event, amount: number, currency: string, description: string) => {
  console.log('[Main] IPC handler called:', { amount, currency, description });
  try {
    if (!stripe) {
      console.error('[Main] Stripe not initialized - missing STRIPE_SECRET_KEY');
      return { error: 'Payment system not configured. Please try again later.' };
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
    });
    console.log('[Main] Payment intent created:', paymentIntent.id);
    return { clientSecret: paymentIntent.client_secret };
  } catch (error: any) {
    console.error('[Main] Payment intent error:', error.message);
    return { error: error.message };
  }
});

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
