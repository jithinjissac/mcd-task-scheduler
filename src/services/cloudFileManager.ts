// Storage adapter for Vercel serverless environment
// Supports Supabase, Vercel KV, or in-memory storage

import { supabase, testSupabaseConnection, type SupabaseRow } from '@/lib/supabase';

interface StorageAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
}

// Supabase storage (preferred option)
class SupabaseStorage implements StorageAdapter {
  private async initTable(): Promise<void> {
    // Create table if it doesn't exist (this will be handled by migration)
    const { error } = await supabase.rpc('create_mcd_data_table_if_not_exists');
    if (error && !error.message.includes('already exists')) {
      console.warn('Could not initialize table:', error);
    }
  }

  private parseKey(key: string): { category: string; filename: string } {
    const [category, filename] = key.split(':');
    return { category: category || 'unknown', filename: filename || 'unknown' };
  }

  async get(key: string): Promise<any> {
    try {
      const { category, filename } = this.parseKey(key);
      const { data, error } = await supabase
        .from('mcd_data')
        .select('data')
        .eq('category', category)
        .eq('filename', filename)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }

      return data?.data || null;
    } catch (error) {
      console.warn(`Supabase get failed for ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      const { category, filename } = this.parseKey(key);
      const { error } = await supabase
        .from('mcd_data')
        .upsert({
          category,
          filename,
          data: value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'category,filename'
        });

      if (error) throw error;
    } catch (error) {
      console.error(`Supabase set failed for ${key}:`, error);
      throw new Error('Failed to save data to database');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { category, filename } = this.parseKey(key);
      const { error } = await supabase
        .from('mcd_data')
        .delete()
        .eq('category', category)
        .eq('filename', filename);

      if (error) throw error;
    } catch (error) {
      console.error(`Supabase delete failed for ${key}:`, error);
      throw error;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      let query = supabase.from('mcd_data').select('category, filename');
      
      if (prefix) {
        const [category] = prefix.split(':');
        if (category) {
          query = query.eq('category', category.replace(':', ''));
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((row: any) => `${row.category}:${row.filename}`);
    } catch (error) {
      console.error('Supabase list failed:', error);
      return [];
    }
  }
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

// Factory to create appropriate storage adapter
async function createStorageAdapter(): Promise<StorageAdapter> {
  // Try Supabase first (preferred option)
  try {
    const isSupabaseAvailable = await testSupabaseConnection();
    if (isSupabaseAvailable) {
      console.log('🎯 Using Supabase for data storage');
      return new SupabaseStorage();
    }
  } catch (error) {
    console.warn('Supabase not available:', error);
  }

  // Fall back to memory storage
  console.warn('⚠️ Using temporary memory storage - data will not persist between sessions');
  return new MemoryStorage();
}

export class CloudFileManager {
  private storage: StorageAdapter | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    this.storage = await createStorageAdapter();
  }

  private async ensureInitialized(): Promise<StorageAdapter> {
    if (this.initPromise) {
      await this.initPromise;
      this.initPromise = null;
    }
    if (!this.storage) {
      throw new Error('Storage adapter not initialized');
    }
    return this.storage;
  }

  private getKey(category: string, filename: string): string {
    return `${category}:${filename}`;
  }

  async readJSON(category: string, filename: string): Promise<any> {
    try {
      const storage = await this.ensureInitialized();
      const key = this.getKey(category, filename);
      const data = await storage.get(key);
      return data;
    } catch (error) {
      console.warn(`Data not found: ${category}/${filename}`);
      return null;
    }
  }

  async writeJSON(category: string, filename: string, data: any): Promise<any> {
    try {
      const storage = await this.ensureInitialized();
      const key = this.getKey(category, filename);
      const dataWithTimestamp = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      await storage.set(key, dataWithTimestamp);
      return dataWithTimestamp;
    } catch (error) {
      console.error(`Error storing data: ${category}/${filename}`, error);
      throw new Error('Failed to store data');
    }
  }

  async deleteJSON(category: string, filename: string): Promise<void> {
    try {
      const storage = await this.ensureInitialized();
      const key = this.getKey(category, filename);
      await storage.delete(key);
    } catch (error) {
      console.error(`Error deleting data: ${category}/${filename}`, error);
      throw error;
    }
  }

  async listFiles(category: string): Promise<string[]> {
    try {
      const storage = await this.ensureInitialized();
      const prefix = `${category}:`;
      const keys = await storage.list(prefix);
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
      const storage = await this.ensureInitialized();
      const allKeys = await storage.list();
      const backup: { [key: string]: any } = {};
      
      for (const key of allKeys) {
        backup[key] = await storage.get(key);
      }
      
      return backup;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async restore(backupData: { [key: string]: any }): Promise<void> {
    try {
      const storage = await this.ensureInitialized();
      for (const [key, value] of Object.entries(backupData)) {
        await storage.set(key, value);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const cloudFileManager = new CloudFileManager();
