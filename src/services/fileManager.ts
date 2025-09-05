import { promises as fs } from 'fs';
import path from 'path';

export class FileManager {
  private baseDir: string;

  constructor(baseDir: string = './data') {
    this.baseDir = baseDir;
  }

  private getFilePath(category: string, filename: string): string {
    return path.join(process.cwd(), this.baseDir, category, `${filename}.json`);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async readJSON(category: string, filename: string): Promise<any> {
    try {
      const filePath = this.getFilePath(category, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`File not found: ${category}/${filename}.json`);
      return null;
    }
  }

  async writeJSON(category: string, filename: string, data: any): Promise<any> {
    try {
      const dirPath = path.join(process.cwd(), this.baseDir, category);
      await this.ensureDirectoryExists(dirPath);
      
      const filePath = this.getFilePath(category, filename);
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(filePath, jsonData, 'utf-8');
      
      return data;
    } catch (error) {
      console.error(`Error writing file: ${category}/${filename}.json`, error);
      throw error;
    }
  }

  async listFiles(category: string): Promise<string[]> {
    try {
      const dirPath = path.join(process.cwd(), this.baseDir, category);
      const files = await fs.readdir(dirPath);
      return files.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''));
    } catch (error) {
      console.warn(`Directory not found: ${category}`);
      return [];
    }
  }

  async deleteFile(category: string, filename: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(category, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting file: ${category}/${filename}.json`, error);
      return false;
    }
  }

  async backup(): Promise<string> {
    const backupDir = path.join(process.cwd(), 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    await this.ensureDirectoryExists(backupPath);
    
    const categories = ['schedules', 'assignments', 'dayparts'];
    for (const category of categories) {
      const categoryBackupPath = path.join(backupPath, category);
      await this.ensureDirectoryExists(categoryBackupPath);
      
      const files = await this.listFiles(category);
      for (const file of files) {
        const data = await this.readJSON(category, file);
        if (data) {
          await fs.writeFile(
            path.join(categoryBackupPath, `${file}.json`),
            JSON.stringify(data, null, 2)
          );
        }
      }
    }
    
    return backupPath;
  }
}

// Singleton instance
export const fileManager = new FileManager();
