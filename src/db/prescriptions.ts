import { db } from './index';

export const prescriptionDB = {
  async create(prescription: any) {
    try {
      const doc = {
        ...prescription,
        _id: new Date().toISOString() + Math.random().toString(36).substring(7),
        synced: false,
        createdAt: new Date().toISOString()
      };

      const result = await db.put(doc);
      return { success: true, id: result.id };
    } catch (error: any) {
      if(error.status === 409){
        console.log("It's a conflict need to handle", error);
        return { success: true, id: error.id };
      }
      return { success: false, error: error.message };
    }
  },

  async search(query: any) {
    try {
      const selector: any = {};
      
      if (query.patient_id) {
        selector.patient_id = parseInt(query.patient_id);
      }
      if (query.doctor_id) {
        selector.doctor_id = parseInt(query.doctor_id);
      }

      const result = await db.find({ selector });
      return { success: true, data: result.docs };
    } catch (error) {
      console.error('Search error:', error);
      return { success: false, error: error.message };
    }
  },

  async clear() {
    try {
      await db.destroy();
      await new Promise(resolve => setTimeout(resolve, 100));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};