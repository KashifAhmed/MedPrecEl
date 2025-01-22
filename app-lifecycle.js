const { app } = require('electron');

function setupAppLifecycle(createWindow) {
  app.whenReady().then(() => {
    createWindow();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (require('electron').BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

module.exports = {
  setupAppLifecycle
};