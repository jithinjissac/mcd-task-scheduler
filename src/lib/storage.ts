// File-based storage using localStorage as primary storage
// Implements multi-device synchronization without database or caching

interface DataStore {
  schedules: Record<string, any>;
  assignments: Record<string, any>;
  dayparts: Record<string, any>;
}

interface SyncData {
  data: any;
  timestamp: number;
  deviceId: string;
  version: number;
}

// Generate unique device ID for this browser/device
const getDeviceId = (): string => {
  if (typeof window !== 'undefined') {
    let deviceId = localStorage.getItem('mcd_device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('mcd_device_id', deviceId);
    }
    return deviceId;
  }
  return 'server';
};

// Global sync store for server-side coordination (temporary per function instance)
const globalSyncStore: Record<string, SyncData> = {};

// File-based storage using localStorage
const FileStorage = {
  save: (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      try {
        const syncData: SyncData = {
          data,
          timestamp: Date.now(),
          deviceId: getDeviceId(),
          version: Date.now()
        };
        localStorage.setItem(`mcd_${key}`, JSON.stringify(syncData));
        
        // Also trigger sync to server for multi-device coordination
        FileStorage.syncToServer(key, syncData);
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  },
  
  load: (key: string): any => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`mcd_${key}`);
        if (stored) {
          const syncData: SyncData = JSON.parse(stored);
          return syncData.data;
        }
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
    }
    return null;
  },

  loadWithMetadata: (key: string): SyncData | null => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`mcd_${key}`);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
      }
    }
    return null;
  },

  getAllStoredDates: (): string[] => {
    if (typeof window === 'undefined') return [];
    
    const dates = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mcd_')) {
        const match = key.match(/mcd_(schedule|assignment|daypart)_(.+)/);
        if (match) {
          dates.add(match[2]);
        }
      }
    }
    return Array.from(dates);
  },

  syncToServer: async (key: string, syncData: SyncData) => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mcd-task-scheduler.vercel.app'
        : 'http://localhost:3000';
      
      await fetch(`${apiUrl}/api/sync/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(syncData)
      });
    } catch (error) {
      console.warn('Failed to sync to server:', error);
    }
  },

  syncFromServer: async (key: string): Promise<boolean> => {
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mcd-task-scheduler.vercel.app'
        : 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/sync/${key}?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const serverData: SyncData = await response.json();
        const localData = FileStorage.loadWithMetadata(key);
        
        // Update if server has newer data from another device
        if (!localData || serverData.timestamp > localData.timestamp) {
          localStorage.setItem(`mcd_${key}`, JSON.stringify(serverData));
          return true; // Data was updated
        }
      }
    } catch (error) {
      console.warn('Failed to sync from server:', error);
    }
    return false; // No update
  }
};

export class MemoryStorage {
  static async saveSchedule(date: string, data: any): Promise<void> {
    const enrichedData = {
      ...data,
      savedAt: new Date().toISOString(),
      lastModified: Date.now()
    };
    
    // Save to localStorage (primary storage)
    FileStorage.save(`schedule_${date}`, enrichedData);
  }

  static async getSchedule(date: string): Promise<any> {
    // Check for updates from other devices first
    await FileStorage.syncFromServer(`schedule_${date}`);
    
    // Load from localStorage (primary storage)
    const data = FileStorage.load(`schedule_${date}`);
    return data || { employees: [] };
  }

  static async saveAssignment(date: string, data: any): Promise<void> {
    const enrichedData = {
      ...data,
      savedAt: new Date().toISOString(),
      lastModified: Date.now()
    };
    
    // Save to localStorage (primary storage)
    FileStorage.save(`assignment_${date}`, enrichedData);
  }

  static async getAssignment(date: string): Promise<any> {
    // Check for updates from other devices first
    await FileStorage.syncFromServer(`assignment_${date}`);
    
    // Load from localStorage (primary storage)
    const data = FileStorage.load(`assignment_${date}`);
    return data || { assignments: {} };
  }

  static async saveDayPart(date: string, data: any): Promise<void> {
    const enrichedData = {
      ...data,
      savedAt: new Date().toISOString(),
      lastModified: Date.now()
    };
    
    // Save to localStorage (primary storage)
    FileStorage.save(`daypart_${date}`, enrichedData);
  }

  static async getDayPart(date: string): Promise<any> {
    // Check for updates from other devices first
    await FileStorage.syncFromServer(`daypart_${date}`);
    
    // Load from localStorage (primary storage)
    const data = FileStorage.load(`daypart_${date}`);
    return data || { dayPart: 'breakfast' };
  }

  static async getAllData(): Promise<DataStore> {
    // Sync all data types from other devices
    const dates = FileStorage.getAllStoredDates();
    
    for (const date of dates) {
      await FileStorage.syncFromServer(`schedule_${date}`);
      await FileStorage.syncFromServer(`assignment_${date}`);
      await FileStorage.syncFromServer(`daypart_${date}`);
    }

    // Build the data store from localStorage
    const store: DataStore = {
      schedules: {},
      assignments: {},
      dayparts: {}
    };

    for (const date of dates) {
      const schedule = FileStorage.load(`schedule_${date}`);
      const assignment = FileStorage.load(`assignment_${date}`);
      const daypart = FileStorage.load(`daypart_${date}`);

      if (schedule) store.schedules[date] = schedule;
      if (assignment) store.assignments[date] = assignment;
      if (daypart) store.dayparts[date] = daypart;
    }

    return store;
  }

  // Server-side sync store access (for coordination)
  static getServerSyncData(key: string): SyncData | null {
    return globalSyncStore[key] || null;
  }

  static setServerSyncData(key: string, data: SyncData): void {
    globalSyncStore[key] = data;
  }
}
