const PouchDB = require('pouchdb');
const PouchFind = require('pouchdb-find');

// Initialize PouchDB
PouchDB.plugin(PouchFind);
let db = new PouchDB('http://127.0.0.1:5984/MedPrecel');
// let db = new PouchDB('medDB_PrecP');

async function initializeDatabase() {
  try {
    await db.createIndex({
      index: {
        fields: ['date', 'patient_id', 'doctor_id']
      }
    });
    console.log('Database indexes created successfully');
    return db;
  } catch (error) {
    console.error('Error creating database indexes:', error);
    throw error;
  }
}

function getDatabase() {
  return db;
}

function resetDatabase() {
  db.close();
  db = new PouchDB(process.env.OFFLINE_DB_NAME);
  return db;
}

module.exports = {
  initializeDatabase,
  getDatabase,
  resetDatabase
};