// JSON File-based storage system for McDonald's Task Scheduler
// Provides local JSON file storage with cross-device synchronization

interface JSONData {
  data: any;
  timestamp: number;
  deviceId: string;
  version: number;
  fileName: string;
}

interface DataStore {
  schedules: Record<string, any>;
  assignments: Record<string, any>;
  dayparts: Record<string, any>;
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
const globalSyncStore: Record<string, JSONData> = {};

// JSON File Storage Implementation
export class JSONStorage {
  private static fileSystemSupported = false;

  // Check if File System Access API is supported
  static {
    if (typeof window !== 'undefined') {
      JSONStorage.fileSystemSupported = 'showSaveFilePicker' in window;
    }
  }

  // Save data as JSON file to localStorage with JSON structure
  static async saveToJSON(key: string, data: any): Promise<void> {
    const jsonData: JSONData = {
      data,
      timestamp: Date.now(),
      deviceId: getDeviceId(),
      version: Date.now(),
      fileName: `${key}.json`
    };

    try {
      // Save to localStorage as JSON
      if (typeof window !== 'undefined') {
        localStorage.setItem(`mcd_json_${key}`, JSON.stringify(jsonData, null, 2));
        console.log(`💾 Saved ${key} to JSON storage`);
      }

      // Trigger sync to server for cross-device coordination
      await JSONStorage.syncToServer(key, jsonData);

    } catch (error) {
      console.warn('Failed to save to JSON storage:', error);
    }
  }

  // Load data from JSON storage
  static async loadFromJSON(key: string): Promise<any> {
    try {
      // Check for updates from other devices first
      await JSONStorage.syncFromServer(key);

      // Load from localStorage JSON storage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`mcd_json_${key}`);
        if (stored) {
          const jsonData: JSONData = JSON.parse(stored);
          console.log(`📖 Loaded ${key} from JSON storage`);
          return jsonData.data;
        }
      }
    } catch (error) {
      console.warn('Failed to load from JSON storage:', error);
    }
    return null;
  }

  // Export all data as a single JSON file for download
  static async exportAllAsJSON(): Promise<void> {
    try {
      const allData: DataStore = {
        schedules: {},
        assignments: {},
        dayparts: {}
      };

      // Collect all data from localStorage
      if (typeof window !== 'undefined') {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('mcd_json_')) {
            const cleanKey = key.replace('mcd_json_', '');
            const data = await JSONStorage.loadFromJSON(cleanKey);
            
            if (cleanKey.startsWith('schedule_')) {
              const date = cleanKey.replace('schedule_', '');
              allData.schedules[date] = data;
            } else if (cleanKey.startsWith('assignment_')) {
              const date = cleanKey.replace('assignment_', '');
              allData.assignments[date] = data;
            } else if (cleanKey.startsWith('daypart_')) {
              const date = cleanKey.replace('daypart_', '');
              allData.dayparts[date] = data;
            }
          }
        }

        // Create export data with metadata
        const exportData = {
          exportedAt: new Date().toISOString(),
          exportedBy: getDeviceId(),
          version: '1.0',
          data: allData
        };

        // Create and download JSON file
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mcdonalds-scheduler-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        console.log('📁 All data exported as JSON file');
      }
    } catch (error) {
      console.error('Failed to export JSON:', error);
    }
  }

  // Import data from JSON file
  static async importFromJSON(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (importData.data) {
        const { schedules, assignments, dayparts } = importData.data;

        // Import schedules
        if (schedules) {
          for (const [date, data] of Object.entries(schedules)) {
            await JSONStorage.saveToJSON(`schedule_${date}`, data);
          }
        }

        // Import assignments
        if (assignments) {
          for (const [date, data] of Object.entries(assignments)) {
            await JSONStorage.saveToJSON(`assignment_${date}`, data);
          }
        }

        // Import dayparts
        if (dayparts) {
          for (const [date, data] of Object.entries(dayparts)) {
            await JSONStorage.saveToJSON(`daypart_${date}`, data);
          }
        }

        console.log('📥 Successfully imported data from JSON file');
        return true;
      }
    } catch (error) {
      console.error('Failed to import JSON:', error);
    }
    return false;
  }

  // Get all stored dates from JSON storage
  static getAllStoredDates(): string[] {
    if (typeof window === 'undefined') return [];
    
    const dates = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mcd_json_')) {
        const match = key.match(/mcd_json_(schedule|assignment|daypart)_(.+)/);
        if (match) {
          dates.add(match[2]);
        }
      }
    }
    return Array.from(dates);
  }

  // Sync to server for cross-device coordination
  static async syncToServer(key: string, jsonData: JSONData): Promise<void> {
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mcd-task-scheduler.vercel.app'
        : 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ key, syncData: jsonData })
      });
      
      if (!response.ok) {
        console.log(`Server sync failed for ${key}, data saved locally only`);
      }
    } catch (error) {
      console.log('Server sync temporarily unavailable, data saved locally only');
    }
  }

  // Sync from server for cross-device updates
  static async syncFromServer(key: string): Promise<boolean> {
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mcd-task-scheduler.vercel.app'
        : 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/sync?key=${encodeURIComponent(key)}&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.status === 404) {
        return false;
      }
      
      if (response.ok) {
        const serverData: JSONData = await response.json();
        const localKey = `mcd_json_${key}`;
        const localData = localStorage.getItem(localKey);
        
        // Update if server has newer data from another device
        if (!localData) {
          localStorage.setItem(localKey, JSON.stringify(serverData, null, 2));
          return true;
        } else {
          const localJsonData: JSONData = JSON.parse(localData);
          if (serverData.timestamp > localJsonData.timestamp) {
            localStorage.setItem(localKey, JSON.stringify(serverData, null, 2));
            return true;
          }
        }
      }
    } catch (error) {
      console.log('Sync temporarily unavailable:', error instanceof Error ? error.message : 'Unknown error');
    }
    return false;
  }

  // Server-side sync store access (for coordination)
  static getServerSyncData(key: string): JSONData | null {
    return globalSyncStore[key] || null;
  }

  static setServerSyncData(key: string, data: JSONData): void {
    globalSyncStore[key] = data;
  }
}

// JSON-based Memory Storage wrapper
export class JSONMemoryStorage {
  static async saveSchedule(date: string, data: any): Promise<void> {
    const enrichedData = {
      ...data,
      savedAt: new Date().toISOString(),
      lastModified: Date.now(),
      type: 'schedule'
    };
    
    await JSONStorage.saveToJSON(`schedule_${date}`, enrichedData);
  }

  static async getSchedule(date: string): Promise<any> {
    const data = await JSONStorage.loadFromJSON(`schedule_${date}`);
    return data || { employees: [] };
  }

  static async saveAssignment(date: string, data: any): Promise<void> {
    const enrichedData = {
      ...data,
      savedAt: new Date().toISOString(),
      lastModified: Date.now(),
      type: 'assignment'
    };
    
    await JSONStorage.saveToJSON(`assignment_${date}`, enrichedData);
  }

  static async getAssignment(date: string): Promise<any> {
    const data = await JSONStorage.loadFromJSON(`assignment_${date}`);
    return data || { assignments: {} };
  }

  static async saveDayPart(date: string, data: any): Promise<void> {
    const enrichedData = {
      ...data,
      savedAt: new Date().toISOString(),
      lastModified: Date.now(),
      type: 'daypart'
    };
    
    await JSONStorage.saveToJSON(`daypart_${date}`, enrichedData);
  }

  static async getDayPart(date: string): Promise<any> {
    const data = await JSONStorage.loadFromJSON(`daypart_${date}`);
    return data || { dayPart: 'Breakfast' };
  }

  static async getAllData(): Promise<DataStore> {
    const dates = JSONStorage.getAllStoredDates();
    const store: DataStore = {
      schedules: {},
      assignments: {},
      dayparts: {}
    };

    // Sync all data from other devices
    for (const date of dates) {
      await JSONStorage.syncFromServer(`schedule_${date}`);
      await JSONStorage.syncFromServer(`assignment_${date}`);
      await JSONStorage.syncFromServer(`daypart_${date}`);
    }

    // Build the data store from JSON storage
    for (const date of dates) {
      const schedule = await JSONStorage.loadFromJSON(`schedule_${date}`);
      const assignment = await JSONStorage.loadFromJSON(`assignment_${date}`);
      const daypart = await JSONStorage.loadFromJSON(`daypart_${date}`);

      if (schedule) store.schedules[date] = schedule;
      if (assignment) store.assignments[date] = assignment;
      if (daypart) store.dayparts[date] = daypart;
    }

    return store;
  }

  // Server-side sync store access (for coordination)
  static getServerSyncData(key: string): JSONData | null {
    return JSONStorage.getServerSyncData(key);
  }

  static setServerSyncData(key: string, data: JSONData): void {
    JSONStorage.setServerSyncData(key, data);
  }
}
