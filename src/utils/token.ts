import { app } from 'electron';
import path from 'path';
import fs from 'fs';

export const tokenUtils = {
  ensureDirectoryExists(filePath: string) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
  },

  async save(token: string) {
    try {
      const tokenPath = path.join(app.getPath('userData'), 'token.json');
      this.ensureDirectoryExists(tokenPath);
      fs.writeFileSync(tokenPath, JSON.stringify({ token }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async get() {
    try {
      const tokenPath = path.join(app.getPath('userData'), 'token.json');
      if (!fs.existsSync(tokenPath)) {
        return { token: null };
      }
      const data = fs.readFileSync(tokenPath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      return { token: null };
    }
  }
};