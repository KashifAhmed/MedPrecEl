// src/db/prescriptions.ts
import PouchDB from 'pouchdb';
import PouchFind from 'pouchdb-find';
PouchDB.plugin(PouchFind);

interface Prescription {
  content: string;
  date: string;
  doctor_id: number;
  patient_id: number;
  synced?: boolean;
}

class PrescriptionDB {
  private db: PouchDB.Database;
  private apiUrl = 'https://stage.app.medlucy.com/api/prescriptions';
  private syncInProgress = false;

  constructor() {
    this.db = new PouchDB('prescriptions');
    this.setupSync();
  }

  async create(prescription: Prescription) {
    try {
      const doc = {
        ...prescription,
        _id: new Date().toISOString() + Math.random().toString(36).substring(7),
        synced: false,
        createdAt: new Date().toISOString()
      };

      await this.db.put(doc);

      // Try immediate sync if online
      if (navigator.onLine) {
        this.startSync();
      }

      return { success: true, id: doc._id };
    } catch (error) {
      console.error('Error creating prescription:', error);
      return { success: false, error };
    }
  }

  private async syncToServer() {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      const token  = await localStorage.getItem('token')

      const result: any = await this.db.find({
        selector: { synced: false }
      });

      for (const doc of result.docs) {
        try {
          const response: any = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              content: doc.content,
              date: doc.date,
              doctor_id: doc.doctor_id,
              patient_id: doc.patient_id
            })
          });
          console.log('Sync response:', response)
          if (response.id) {
            await this.db.put({
              ...doc,
              synced: true
            });
          }
        } catch (error) {
          console.error('Sync failed for doc:', doc._id);
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private startSync() {
    if (!this.syncInProgress) {
      this.syncToServer();
    }
  }

  private setupSync() {
    window.addEventListener('online', () => {
      this.startSync();
    });
  }
}

export const prescriptionDB = new PrescriptionDB();