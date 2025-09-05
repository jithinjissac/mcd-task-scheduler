const fs = require('fs').promises;
const path = require('path');

class FileManager {
  constructor(dataDir = './data') {
    this.dataDir = dataDir;
  }

  // Ensure directory exists
  async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  // Read JSON file
  async readJSON(category, dateKey) {
    try {
      const filePath = path.join(this.dataDir, category, `${dateKey}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  // Write JSON file
  async writeJSON(category, dateKey, data) {
    const dirPath = path.join(this.dataDir, category);
    await this.ensureDir(dirPath);
    
    const filePath = path.join(dirPath, `${dateKey}.json`);
    const jsonData = {
      ...data,
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    return jsonData;
  }

  // List all files in a category
  async listFiles(category) {
    try {
      const dirPath = path.join(this.dataDir, category);
      const files = await fs.readdir(dirPath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  // Get latest schedule across all dates
  async getLatestSchedule() {
    try {
      const dates = await this.listFiles('schedules');
      if (dates.length === 0) return null;

      let latestSchedule = null;
      let latestDate = null;

      for (const date of dates) {
        const schedule = await this.readJSON('schedules', date);
        if (schedule) {
          const uploadDate = new Date(schedule.uploadedAt || schedule.lastUpdated);
          if (!latestDate || uploadDate > latestDate) {
            latestDate = uploadDate;
            latestSchedule = { ...schedule, date };
          }
        }
      }

      return latestSchedule;
    } catch (error) {
      console.error('Error getting latest schedule:', error);
      return null;
    }
  }

  // Backup data
  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.dataDir, 'backups', timestamp);
    await this.ensureDir(backupDir);

    const categories = ['schedules', 'assignments', 'dayparts'];
    for (const category of categories) {
      const files = await this.listFiles(category);
      const categoryBackupDir = path.join(backupDir, category);
      await this.ensureDir(categoryBackupDir);

      for (const dateKey of files) {
        const data = await this.readJSON(category, dateKey);
        if (data) {
          const filePath = path.join(categoryBackupDir, `${dateKey}.json`);
          await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        }
      }
    }

    return backupDir;
  }
}

module.exports = FileManager;
