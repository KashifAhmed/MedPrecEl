const path = require('path');
const fs = require('fs');
const { app } = require('electron');
const { getDatabase } = require('./database');

let syncInProgress = false;

async function syncToServer() {
  return
  if (syncInProgress) return;
  
  const db = getDatabase();
  
  try {
    syncInProgress = true;
    const result = await db.find({
      selector: { synced: false }
    });

    console.log('Documents to sync:', result.docs);
    
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

        const response = await fetch(`${process.env.VITE_API_URL}/prescriptions`, {
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
            _rev: doc._rev
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

function startPeriodicSync() {
  setInterval(() => {
    startSync();
  }, 30000); // Check every 30 seconds
}

module.exports = {
  syncToServer,
  startSync,
  startPeriodicSync
};