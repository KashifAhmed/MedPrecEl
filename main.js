const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  const tryConnection = async () => {
    try {
      await fetch('http://localhost:5173');
      win.loadURL('http://localhost:5173');
      win.webContents.openDevTools();
    } catch (err) {
      // In production, we need to look in the correct dist folder
      const prodPath = path.join(__dirname, 'dist', 'index.html');
      const devPath = path.join(__dirname, 'index.html');
      
      // Try production path first, then fallback to dev path
      if (fs.existsSync(prodPath)) {
        win.loadFile(prodPath);
      } else if (fs.existsSync(devPath)) {
        win.loadFile(devPath);
      } else {
        console.error('Could not find index.html in any location');
        win.loadFile(path.join(__dirname, '404.html')); // Optional: load an error page
      }
    }
  };

  tryConnection();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});