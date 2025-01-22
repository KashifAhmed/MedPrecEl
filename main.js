const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

require("dotenv").config();

const { initializeIpcHandlers } = require('./ipc-handlers');
const { setupAppLifecycle } = require('./app-lifecycle');
const { startPeriodicSync } = require('./sync-service');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const tryConnection = async () => {
    try {
      await fetch('http://localhost:5173');
      win.loadURL('http://localhost:5173');
      win.webContents.openDevTools();
    } catch (err) {
      const prodPath = path.join(__dirname, 'dist', 'index.html');
      const devPath = path.join(__dirname, 'index.html');
      
      if (fs.existsSync(prodPath)) {
        win.loadFile(prodPath);
      } else if (fs.existsSync(devPath)) {
        win.loadFile(devPath);
      } else {
        console.error('Could not find index.html');
        win.loadFile(path.join(__dirname, '404.html'));
      }
    }
  };

  tryConnection();
  return win;
}

async function main() {
  await initializeIpcHandlers();
  setupAppLifecycle(createWindow);
  startPeriodicSync();
}

main().catch(console.error);