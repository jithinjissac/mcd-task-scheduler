// Simple in-memory storage for Vercel deployment
// In production, this should be replaced with a database

interface DataStore {
  schedules: Record<string, any>;
  assignments: Record<string, any>;
  dayparts: Record<string, any>;
}

// Global storage that persists during the serverless function lifecycle
const globalStore: DataStore = {
  schedules: {},
  assignments: {},
  dayparts: {}
};

export class MemoryStorage {
  static async saveSchedule(date: string, data: any): Promise<void> {
    globalStore.schedules[date] = {
      ...data,
      savedAt: new Date().toISOString()
    };
  }

  static async getSchedule(date: string): Promise<any> {
    return globalStore.schedules[date] || { employees: [] };
  }

  static async saveAssignment(date: string, data: any): Promise<void> {
    globalStore.assignments[date] = {
      ...data,
      savedAt: new Date().toISOString()
    };
  }

  static async getAssignment(date: string): Promise<any> {
    return globalStore.assignments[date] || { assignments: {} };
  }

  static async saveDayPart(date: string, data: any): Promise<void> {
    globalStore.dayparts[date] = {
      ...data,
      savedAt: new Date().toISOString()
    };
  }

  static async getDayPart(date: string): Promise<any> {
    return globalStore.dayparts[date] || { dayPart: 'breakfast' };
  }

  static async getAllData(): Promise<DataStore> {
    return globalStore;
  }
}
