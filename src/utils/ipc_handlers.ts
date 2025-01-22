import { ipcMain } from 'electron';
import { prescriptionDB } from '../db/prescriptions';
import { tokenUtils } from './token';

export const setupIpcHandlers = () => {
  ipcMain.handle('db-prescription-create', (_, prescription) => 
    prescriptionDB.create(prescription));

  ipcMain.handle('db-prescription-search', (_, query) => 
    prescriptionDB.search(query));

  ipcMain.handle('save-token', (_, token) => 
    tokenUtils.save(token));

  ipcMain.handle('get-token', () => 
    tokenUtils.get());
};