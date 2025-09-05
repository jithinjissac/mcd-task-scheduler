import { Employee, Assignment } from '@/types';

// Use Next.js API routes - no need for external base URL
const API_BASE_URL = '';

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
  // Schedule Management
  async getSchedule(date: string): Promise<ScheduleData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules/${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return { employees: [] };
    }
  }

  async saveSchedule(date: string, employees: Employee[], fileName?: string, force = false): Promise<{ success: boolean; message?: string; requiresConfirmation?: boolean }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/schedules/${date}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employees, fileName, force }),
      });

      const result = await response.json();
      
      if (response.status === 409) {
        return { success: false, requiresConfirmation: true, message: result.error };
      }
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save schedule');
      }
      
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error saving schedule:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Assignment Management
  async getAssignments(date: string): Promise<AssignmentData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assignments/${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching assignments:', error);
      return { assignments: {} };
    }
  }

  async saveAssignments(date: string, assignments: Assignment, dayPart?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/assignments/${date}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments, dayPart }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save assignments');
      }
      
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error saving assignments:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Day Part Management
  async getDayPart(date: string): Promise<DayPartData> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dayparts/${date}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching day part:', error);
      return { dayPart: 'Breakfast' };
    }
  }

  async saveDayPart(date: string, dayPart: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dayparts/${date}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dayPart }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save day part');
      }
      
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error saving day part:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Utility Methods
  async testConnection(): Promise<boolean> {
    try {
      // Test with a simple daypart request
      const today = new Date().toISOString().split('T')[0];
      await this.getDayPart(today);
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Simplified connection status (always true for API routes)
  isConnected(): boolean {
    return true;
  }

  // No-op methods for compatibility (real-time features removed)
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    // Call immediately with true since API routes don't need connection
    callback(true);
    return () => {}; // Return empty cleanup function
  }

  onScheduleUpdate(callback: (data: any) => void): () => void {
    return () => {}; // Return empty cleanup function
  }

  onAssignmentsUpdate(callback: (data: any) => void): () => void {
    return () => {}; // Return empty cleanup function
  }

  onDayPartChange(callback: (data: any) => void): () => void {
    return () => {}; // Return empty cleanup function
  }

  disconnect(): void {
    // No-op for API routes
  }
}

export default new ApiService();
