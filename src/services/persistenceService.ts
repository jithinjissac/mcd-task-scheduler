// Client-side persistence service for McDonald's Task Scheduler

export class PersistenceService {
  private static readonly PREFIX = 'mcd_';

  // Save data to localStorage
  static save(key: string, data: any): void {
    if (typeof window === 'undefined') return;
    
    try {
      const storageKey = `${this.PREFIX}${key}`;
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // Load data from localStorage
  static load(key: string): any {
    if (typeof window === 'undefined') return null;
    
    try {
      const storageKey = `${this.PREFIX}${key}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.data;
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
    return null;
  }

  // Get all stored data for sync
  static getAllData(): any {
    if (typeof window === 'undefined') return {};
    
    const data: any = {
      schedules: {},
      assignments: {},
      dayparts: {}
    };

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            const cleanKey = key.replace(this.PREFIX, '');
            
            if (cleanKey.startsWith('schedule_')) {
              const date = cleanKey.replace('schedule_', '');
              data.schedules[date] = parsed.data;
            } else if (cleanKey.startsWith('assignment_')) {
              const date = cleanKey.replace('assignment_', '');
              data.assignments[date] = parsed.data;
            } else if (cleanKey.startsWith('daypart_')) {
              const date = cleanKey.replace('daypart_', '');
              data.dayparts[date] = parsed.data;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get all data from localStorage:', error);
    }

    return data;
  }

  // Sync local data to server
  static async syncToServer(apiBaseUrl: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      const allData = this.getAllData();
      
      // Only sync if we have data
      const hasData = Object.keys(allData.schedules).length > 0 ||
                     Object.keys(allData.assignments).length > 0 ||
                     Object.keys(allData.dayparts).length > 0;
      
      if (!hasData) {
        return true; // Nothing to sync
      }

      const response = await fetch(`${apiBaseUrl}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(allData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Data synced to server:', result.synced);
        return true;
      } else {
        console.error('❌ Failed to sync data to server:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('❌ Error syncing data to server:', error);
      return false;
    }
  }

  // Clear all stored data
  static clearAll(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('🗑️ Cleared all McDonald\'s Task Scheduler data');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
}
