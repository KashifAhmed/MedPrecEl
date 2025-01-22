import { db } from './index';

export class SyncService {
  private syncInProgress = false;

  async syncToServer() {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      const result = await db.find({
        selector: { synced: false }
      });

      // Your sync logic here
    } finally {
      this.syncInProgress = false;
    }
  }

  startSync() {
    if (!this.syncInProgress) {
      this.syncToServer().catch(console.error);
    }
  }
}
