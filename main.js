const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const PouchDB = require('pouchdb');
const PouchFind = require('pouchdb-find');

// Initialize PouchDB
PouchDB.plugin(PouchFind);
let db = new PouchDB('medDB_PrecP');
let syncInProgress = false;

const ensureDirectoryExists = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

// Initialize database with indexes
const initializeDatabase = async () => {
  try {
    // await db.createIndex({
    //   index: {
    //     fields: ['date']
    //   }
    // });

    console.log('Database indexes created successfully');
  } catch (error) {
    console.error('Error creating database indexes:', error);
  }
};

async function syncToServer() {
  if (syncInProgress) return;
  
  try {
    syncInProgress = true;
    const result = await db.find({
      selector: {}
    });

    console.log('Documents to sync--:', result.docs);
    return
    for (const doc of result.docs) {
      try {
        const tokenPath = path.join(app.getPath('userData'), 'token.json');
        if (!fs.existsSync(tokenPath)) {
          console.log('No token found, skipping sync');
          return;
        }
        
        const tokenData = fs.readFileSync(tokenPath, 'utf8');
        const { token } = JSON.parse(tokenData);

        const body = {
          _id: doc._id,
          content: doc.content,
          date: doc.date,
          doctor_id: doc.doctor_id,
          patient_id: doc.patient_id
        };

        const response = await fetch('https://stage.app.medlucy.com/api/prescriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        
        if (responseData.id) {
          await db.put({
            ...doc,
            synced: true,
            _rev: doc._rev  // Important for updating existing doc
          });
          console.log('Synced document:', doc._id);
        }
      } catch (error) {
        console.error('Sync failed for doc:', doc._id);
        console.error('Error:', error);
      }
    }
  } finally {
    syncInProgress = false;
  }
}

function startSync() {
  if (!syncInProgress) {
    syncToServer().catch(console.error);
  }
}

// Create window
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
}

// IPC Handlers
ipcMain.handle('db-prescription-create', async (event, prescription) => {
  try {
    const doc = {
      ...prescription,
      _id: new Date().toISOString() + Math.random().toString(36).substring(7),
      synced: false,
      createdAt: new Date().toISOString()
    };

    const result = await db.put(doc);
    startSync();
    
    return { success: true, id: result.id };
  } catch (error) {
    if(error.status === 409){
      console.log("It's a conflict need to handle", docId);
      return { success: true, id: error.id };
    }
    return { success: false, error: error.message };
  }
});


ipcMain.handle('db-prescription-add', async (event, prescription) => {
  try {
    const doc = {
      ...prescription,
      synced: true
    };
    const result = await db.put(doc);
    console.log('Document added successfully:', result);

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error adding prescription:');
    console.error(error);
    return { success: false, error: error.message };
  }
});


ipcMain.handle('db-prescription-search', async (event, query) => {
  try {
    const selector = {};
    
    if (query.patient_id) {
      selector.patient_id = parseInt(query.patient_id);
    }
    if (query.doctor_id) {
      selector.doctor_id = parseInt(query.doctor_id);
    }

    const result = await db.find({
      selector
    });
    
    return { success: true, data: result.docs };
  } catch (error) {
    console.error('Search error:', error);
    return { success: false, error: error.message };
  }
});

// Token handlers
ipcMain.handle('save-token', (event, token) => {
  try {
    const tokenPath = path.join(app.getPath('userData'), 'token.json');
    ensureDirectoryExists(tokenPath);
    fs.writeFileSync(tokenPath, JSON.stringify({ token }));
    return { success: true };
  } catch (err) {
    console.error('Error saving token:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-token', () => {
  try {
    const tokenPath = path.join(app.getPath('userData'), 'token.json');
    if (!fs.existsSync(tokenPath)) {
      return { token: null };
    }
    const data = fs.readFileSync(tokenPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error getting token:', err);
    return { token: null };
  }
});

ipcMain.handle('clear-token', async () => {
  try {
    const tokenPath = path.join(app.getPath('userData'), 'token.json');
    if (fs.existsSync(tokenPath)) {
      fs.unlinkSync(tokenPath);
    }
    return { success: true };
  } catch (err) {
    console.error('Error clearing token:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('db-prescription-clear', async () => {
  try {
    await db.destroy();
    // Wait for destruction to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    // Reinitialize
    db = new PouchDB('prescriptions');
    await initializeDatabase();
    return { success: true };
  } catch (err) {
    console.error('Error clearing database:', err);
    return { success: false, error: err.message };
  }
});

// App lifecycle
app.whenReady().then(async () => {
  await initializeDatabase();
  createWindow();
});

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

// Setup periodic sync check
setInterval(() => {
  startSync();
}, 30000); // Check every 30 seconds