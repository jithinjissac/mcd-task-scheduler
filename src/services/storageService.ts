import { Employee, Assignment, DayPart } from '@/types';
import apiService from './apiService';

export interface StorageService {
  // Schedule methods
  getSchedule(date: string): Promise<{ employees: Employee[]; uploadedAt?: string; fileName?: string }>;
  saveSchedule(date: string, employees: Employee[], fileName?: string, replaceAll?: boolean): Promise<void>;
  
  // Assignment methods
  getAssignments(date: string): Promise<{ assignments: Assignment; dayPart?: string }>;
  saveAssignments(date: string, assignments: Assignment, dayPart?: string): Promise<void>;
  
  // Day part methods
  getDayPart(date: string): Promise<string>;
  saveDayPart(date: string, dayPart: string): Promise<void>;
  
  // Utility methods
  isServerMode(): boolean;
  getLatestSchedule(): Promise<{ employees: Employee[]; date?: string } | null>;
}

class ServerStorageService implements StorageService {
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.checkServerConnection();
    this.startConnectionMonitoring();
    this.migrateLocalDataOnStartup();
  }

  private async checkServerConnection() {
    try {
      console.log('🔍 Checking server availability...');
      const isAvailable = await apiService.isServerAvailable();
      console.log(`📡 Server availability check result: ${isAvailable}`);
      this.isConnected = isAvailable;
      if (isAvailable) {
        console.log('✅ Server storage connected');
      } else {
        console.warn('❌ Server storage unavailable');
      }
    } catch (error) {
      this.isConnected = false;
      console.warn('❌ Server storage connection failed:', error);
    }
  }

  private startConnectionMonitoring() {
    // Check server connection every 10 seconds for faster recovery
    this.connectionCheckInterval = setInterval(() => {
      this.checkServerConnection();
    }, 10000);

    // Also listen to online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        setTimeout(() => this.checkServerConnection(), 1000);
      });
    }
  }

  // Auto-migrate localStorage data to server on startup
  private async migrateLocalDataOnStartup() {
    if (typeof window === 'undefined') return;
    
    try {
      // Wait for server connection
      await this.waitForConnection();
      
      let migratedData = false;
      
      // Migrate all localStorage data to server
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        if (key.startsWith('schedule_')) {
          const dateKey = key.replace('schedule_', '');
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const scheduleData = JSON.parse(data);
              await apiService.saveSchedule(dateKey, scheduleData.employees, scheduleData.fileName);
              console.log(`✅ Migrated schedule for ${dateKey}`);
              migratedData = true;
            } catch (error) {
              console.warn(`Failed to migrate schedule for ${dateKey}:`, error);
            }
          }
        } else if (key.startsWith('assignments_')) {
          const dateKey = key.replace('assignments_', '');
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const assignmentData = JSON.parse(data);
              await apiService.saveAssignments(dateKey, assignmentData.assignments, assignmentData.dayPart);
              console.log(`✅ Migrated assignments for ${dateKey}`);
              migratedData = true;
            } catch (error) {
              console.warn(`Failed to migrate assignments for ${dateKey}:`, error);
            }
          }
        } else if (key.startsWith('lastDayPart_')) {
          const dateKey = key.replace('lastDayPart_', '');
          const dayPart = localStorage.getItem(key);
          if (dayPart) {
            try {
              await apiService.saveDayPart(dateKey, dayPart);
              console.log(`✅ Migrated day part for ${dateKey}`);
              migratedData = true;
            } catch (error) {
              console.warn(`Failed to migrate day part for ${dateKey}:`, error);
            }
          }
        }
      }
      
      // Clear localStorage after successful migration
      if (migratedData) {
        console.log('🧹 Clearing localStorage after successful migration');
        // Only clear McDonald's app data, not all localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('schedule_') || key.startsWith('assignments_') || key.startsWith('lastDayPart_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('✅ Migration completed and localStorage cleaned');
      }
    } catch (error) {
      console.warn('Migration failed:', error);
    }
  }

  private async waitForConnection(maxWaitTime = 30000): Promise<void> {
    console.log(`⏳ Waiting for server connection (timeout: ${maxWaitTime}ms)...`);
    const startTime = Date.now();
    let attempts = 0;
    while (!this.isConnected && (Date.now() - startTime) < maxWaitTime) {
      attempts++;
      console.log(`🔄 Connection attempt ${attempts}, isConnected: ${this.isConnected}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.checkServerConnection();
    }
    if (!this.isConnected) {
      console.error(`❌ Server connection timeout after ${maxWaitTime}ms and ${attempts} attempts`);
      throw new Error('Server connection timeout');
    }
    console.log(`✅ Server connection established after ${attempts} attempts`);
  }

  isServerMode(): boolean {
    return true; // Always server mode
  }

  // Schedule methods
  async getSchedule(date: string): Promise<{ employees: Employee[]; uploadedAt?: string; fileName?: string }> {
    try {
      await this.waitForConnection(5000); // Short timeout for reads
      const result = await apiService.getSchedule(date);
      return {
        employees: result.employees || [],
        uploadedAt: result.uploadedAt,
        fileName: result.fileName
      };
    } catch (error) {
      console.error('Failed to get schedule from server:', error);
      throw new Error(`Unable to load schedule: ${error instanceof Error ? error.message : 'Server unavailable'}`);
    }
  }

  // Test comment to trigger recompilation
  async saveSchedule(date: string, employees: Employee[], fileName?: string, replaceAll?: boolean): Promise<void> {
    try {
      console.log('🔄 StorageService.saveSchedule called:', { date, employeeCount: employees.length, fileName, replaceAll });
      
      // Temporary: Skip connection check to test direct API call
      console.log('⚠️ TESTING: Skipping connection check, calling API directly...');
      await apiService.saveSchedule(date, employees, fileName);
      console.log(`✅ Schedule saved to server for ${date}`);
    } catch (error) {
      console.error('❌ Failed to save schedule to server:', error);
      if (error instanceof Error) {
        console.error('❌ Error details:', { message: error.message, stack: error.stack });
      }
      throw new Error(`Unable to save schedule: ${error instanceof Error ? error.message : 'Server unavailable'}`);
    }
  }

  // Assignment methods
  async getAssignments(date: string): Promise<{ assignments: Assignment; dayPart?: string }> {
    try {
      await this.waitForConnection(5000);
      const result = await apiService.getAssignments(date);
      return {
        assignments: result.assignments || {},
        dayPart: result.dayPart
      };
    } catch (error) {
      console.error('Failed to get assignments from server:', error);
      throw new Error(`Unable to load assignments: ${error instanceof Error ? error.message : 'Server unavailable'}`);
    }
  }

  async saveAssignments(date: string, assignments: Assignment, dayPart?: string): Promise<void> {
    try {
      await this.waitForConnection(5000);
      await apiService.saveAssignments(date, assignments, dayPart);
      console.log(`✅ Assignments saved to server for ${date}`);
    } catch (error) {
      console.error('Failed to save assignments to server:', error);
      throw new Error(`Unable to save assignments: ${error instanceof Error ? error.message : 'Server unavailable'}`);
    }
  }

  // Day part methods
  async getDayPart(date: string): Promise<string> {
    try {
      await this.waitForConnection(5000);
      const result = await apiService.getDayPart(date);
      return result.dayPart || 'Breakfast';
    } catch (error) {
      console.warn('Failed to get day part from server, using default:', error);
      return 'Breakfast';
    }
  }

  async saveDayPart(date: string, dayPart: string): Promise<void> {
    try {
      await this.waitForConnection(5000);
      await apiService.saveDayPart(date, dayPart);
      console.log(`✅ Day part saved to server for ${date}`);
    } catch (error) {
      console.error('Failed to save day part to server:', error);
      throw new Error(`Unable to save day part: ${error instanceof Error ? error.message : 'Server unavailable'}`);
    }
  }

  // Utility methods
  async getLatestSchedule(): Promise<{ employees: Employee[]; date?: string } | null> {
    try {
      await this.waitForConnection(5000);
      const result = await apiService.getSchedule('latest');
      if (result.employees && result.employees.length > 0) {
        return {
          employees: result.employees,
          date: result.originalDate
        };
      }
      return null;
    } catch (error) {
      console.warn('Failed to get latest schedule from server:', error);
      return null;
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }
}

// Create and export directly
const storageService = new ServerStorageService();
export default storageService;
