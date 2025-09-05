// Storage adapter for Vercel serverless environment
// Uses Vercel KV if available, otherwise falls back to temporary in-memory storage

interface StorageAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

// In-memory storage fallback (data persists only during function execution)
class MemoryStorage implements StorageAdapter {
  private store = new Map<string, any>();

  async get(key: string): Promise<any> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: any): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(prefix?: string): Promise<string[]> {
    const keys = Array.from(this.store.keys());
    return prefix ? keys.filter(key => key.startsWith(prefix)) : keys;
  }
}

// Vercel KV storage (if available)
class VercelKVStorage implements StorageAdapter {
  private kv: any;

  constructor() {
    try {
      // Try to import Vercel KV
      this.kv = require('@vercel/kv');
    } catch {
      throw new Error('Vercel KV not available');
    }
  }

  async get(key: string): Promise<any> {
    try {
      return await this.kv.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    await this.kv.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.kv.del(key);
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      const keys = await this.kv.keys(prefix ? `${prefix}*` : '*');
      return keys || [];
    } catch {
      return [];
    }
  }
}

// Factory to create appropriate storage adapter
function createStorageAdapter(): StorageAdapter {
  // Try Vercel KV first
  try {
    return new VercelKVStorage();
  } catch {
    console.warn('Vercel KV not available, using memory storage');
    return new MemoryStorage();
  }
}

export class CloudFileManager {
  private storage: StorageAdapter;

  constructor() {
    this.storage = createStorageAdapter();
  }

  private getKey(category: string, filename: string): string {
    return `${category}:${filename}`;
  }

  async readJSON(category: string, filename: string): Promise<any> {
    try {
      const key = this.getKey(category, filename);
      const data = await this.storage.get(key);
      return data;
    } catch (error) {
      console.warn(`Data not found: ${category}/${filename}`);
      return null;
    }
  }

  async writeJSON(category: string, filename: string, data: any): Promise<any> {
    try {
      const key = this.getKey(category, filename);
      const dataWithTimestamp = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      await this.storage.set(key, dataWithTimestamp);
      return dataWithTimestamp;
    } catch (error) {
      console.error(`Error storing data: ${category}/${filename}`, error);
      throw new Error('Failed to store data');
    }
  }

  async deleteJSON(category: string, filename: string): Promise<void> {
    try {
      const key = this.getKey(category, filename);
      await this.storage.delete(key);
    } catch (error) {
      console.error(`Error deleting data: ${category}/${filename}`, error);
      throw error;
    }
  }

  async listFiles(category: string): Promise<string[]> {
    try {
      const prefix = `${category}:`;
      const keys = await this.storage.list(prefix);
      return keys.map(key => key.replace(prefix, ''));
    } catch (error) {
      console.error(`Error listing files for category: ${category}`, error);
      return [];
    }
  }

  async exists(category: string, filename: string): Promise<boolean> {
    try {
      const data = await this.readJSON(category, filename);
      return data !== null;
    } catch {
      return false;
    }
  }

  async backup(): Promise<{ [key: string]: any }> {
    try {
      const allKeys = await this.storage.list();
      const backup: { [key: string]: any } = {};
      
      for (const key of allKeys) {
        backup[key] = await this.storage.get(key);
      }
      
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async restore(backupData: { [key: string]: any }): Promise<void> {
    try {
      for (const [key, value] of Object.entries(backupData)) {
        await this.storage.set(key, value);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const cloudFileManager = new CloudFileManager();
