import { Employee, Assignment } from '@/types';

// API URL configuration for Next.js API routes
const getApiBaseUrl = () => {
  // In production (Vercel), use the same origin for API calls
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  
  // In development, use localhost:3000 (Next.js dev server)
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Fallback for SSR
  return '';
};

const API_BASE_URL = getApiBaseUrl();

interface ScheduleData {
  employees: Employee[];
  uploadedAt?: string;
  fileName?: string;
  isLatest?: boolean;
  originalDate?: string;
}

interface AssignmentData {
  assignments: Assignment;
  savedAt?: string;
  dayPart?: string;
}

interface DayPartData {
  dayPart: string;
  savedAt?: string;
}

class ApiService {
  constructor() {
    console.log('🔧 ApiService initialized for serverless environment');
  }

  // API Helper method
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Schedule API methods
  async getSchedule(date: string): Promise<ScheduleData> {
    return this.apiCall(`/api/schedules/${date}`);
  }

  async saveSchedule(date: string, employees: Employee[], fileName?: string, replaceAll = false): Promise<ScheduleData> {
    return this.apiCall(`/api/schedules/${date}`, {
      method: 'POST',
      body: JSON.stringify({ employees, fileName, replaceAll }),
    });
  }

  async getAllSchedules(): Promise<Array<{date: string; employeeCount: number; uploadedAt?: string; fileName?: string}>> {
    return this.apiCall('/api/schedules');
  }

  async getLatestSchedule(): Promise<(ScheduleData & { date: string }) | null> {
    try {
      const response = await this.apiCall('/api/schedules/latest');
      return response.schedule || null;
    } catch (error) {
      console.warn('Failed to get latest schedule:', error);
      return null;
    }
  }

  async deleteSchedule(date: string): Promise<{success: boolean; message: string}> {
    return this.apiCall(`/api/schedules/${date}`, {
      method: 'DELETE',
    });
  }

  // Assignment API methods
  async getAssignments(date: string): Promise<AssignmentData> {
    return this.apiCall(`/api/assignments/${date}`);
  }

  async saveAssignments(date: string, assignments: Assignment, dayPart?: string): Promise<AssignmentData> {
    return this.apiCall(`/api/assignments/${date}`, {
      method: 'POST',
      body: JSON.stringify({ assignments, dayPart }),
    });
  }

  async assignEmployee(date: string, employeeName: string, tableId: string, columnName: string, dayPart: string): Promise<AssignmentData> {
    return this.apiCall(`/api/assignments/${date}/assign`, {
      method: 'POST',
      body: JSON.stringify({ employeeName, tableId, columnName, dayPart }),
    });
  }

  async removeEmployee(date: string, employeeName: string, tableId: string, columnName: string, dayPart: string): Promise<AssignmentData> {
    return this.apiCall(`/api/assignments/${date}/remove`, {
      method: 'POST',
      body: JSON.stringify({ employeeName, tableId, columnName, dayPart }),
    });
  }

  async getAllAssignments(): Promise<Array<{date: string; totalAssignments: number; dayPart?: string; savedAt?: string}>> {
    return this.apiCall('/api/assignments');
  }

  // Day Part API methods
  async getDayPart(date: string): Promise<DayPartData> {
    return this.apiCall(`/api/dayparts/${date}`);
  }

  async saveDayPart(date: string, dayPart: string): Promise<DayPartData> {
    return this.apiCall(`/api/dayparts/${date}`, {
      method: 'POST',
      body: JSON.stringify({ dayPart }),
    });
  }

  async getAllDayParts(): Promise<Array<{date: string; dayPart: string; savedAt?: string}>> {
    return this.apiCall('/api/dayparts');
  }

  // Utility methods
  async healthCheck(): Promise<{status: string; timestamp: string; uptime: number}> {
    return this.apiCall('/api/health');
  }

  async createBackup(): Promise<{success: boolean; message: string; backupPath: string}> {
    return this.apiCall('/api/backup', {
      method: 'POST',
    });
  }

  async importLocalStorageData(localStorageData: Record<string, any>): Promise<{success: boolean; message: string; results: any}> {
    return this.apiCall('/api/import-local-data', {
      method: 'POST',
      body: JSON.stringify({ localStorageData }),
    });
  }

  // Check if server is available
  async isServerAvailable(): Promise<boolean> {
    try {
      await this.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  // Legacy methods for compatibility (no-op for serverless)
  onConnectionChange(listener: (connected: boolean) => void) {
    // Always return "connected" for serverless
    setTimeout(() => listener(true), 0);
    return () => {}; // No-op cleanup
  }

  onScheduleUpdate(listener: (data: any) => void) {
    // No real-time updates in serverless, return no-op
    return () => {};
  }

  onAssignmentsUpdate(listener: (data: any) => void) {
    // No real-time updates in serverless, return no-op
    return () => {};
  }

  onDayPartUpdate(listener: (data: any) => void) {
    // No real-time updates in serverless, return no-op
    return () => {};
  }

  joinDate(date: string) {
    // No-op for serverless
  }

  leaveDate(date: string) {
    // No-op for serverless
  }

  disconnect() {
    // No-op for serverless
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
