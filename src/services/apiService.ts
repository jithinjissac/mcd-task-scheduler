import { io, Socket } from 'socket.io-client';
import { Employee, Assignment } from '@/types';

// Dynamic API URL configuration for both development and production
const getApiBaseUrl = () => {
  // In production (Vercel), use the Next.js API routes
  if (process.env.NODE_ENV === 'production') {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : '');
    console.log('🌐 Using production API URL:', baseUrl);
    return baseUrl;
  }
  
  // In development, check if we have an environment variable first
  if (process.env.NEXT_PUBLIC_API_URL) {
    console.log('🌐 Using environment API URL:', process.env.NEXT_PUBLIC_API_URL);
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // If running in browser, use the current host with port 3002 for dev server
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    const apiUrl = `http://${currentHost}:3002`;
    console.log('🌐 Using dynamic API URL based on current host:', apiUrl);
    return apiUrl;
  }
  
  // Fallback to localhost for SSR
  console.log('🌐 Using localhost fallback for SSR');
  return 'http://localhost:3002';
};

const API_BASE_URL = getApiBaseUrl();
const USE_NEXT_API = process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_USE_NEXT_API === 'true';
console.log('🔗 Final API_BASE_URL:', API_BASE_URL, 'Using Next.js API:', USE_NEXT_API);

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
  private socket: Socket | null = null;
  private connectionListeners: Array<(connected: boolean) => void> = [];
  private updateListeners: {
    schedule: Array<(data: any) => void>;
    assignments: Array<(data: any) => void>;
    daypart: Array<(data: any) => void>;
  } = {
    schedule: [],
    assignments: [],
    daypart: []
  };

  constructor() {
    // Only initialize Socket.IO in development mode
    if (!USE_NEXT_API) {
      this.initializeSocket();
    } else {
      console.log('🔄 Running in production mode - using polling instead of Socket.IO');
      this.initializePolling();
    }
  }

  private initializeSocket() {
    try {
      this.socket = io(API_BASE_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        timeout: 20000
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to server');
        this.connectionListeners.forEach(listener => listener(true));
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
        this.connectionListeners.forEach(listener => listener(false));
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.connectionListeners.forEach(listener => listener(false));
      });

      // Real-time update listeners
      this.socket.on('schedule-updated', (data) => {
        console.log('📅 Schedule updated:', data);
        this.updateListeners.schedule.forEach(listener => listener(data));
      });

      this.socket.on('assignments-updated', (data) => {
        console.log('📋 Assignments updated:', data);
        this.updateListeners.assignments.forEach(listener => listener(data));
      });

      this.socket.on('daypart-changed', (data) => {
        console.log('🌅 Day part changed:', data);
        this.updateListeners.daypart.forEach(listener => listener(data));
      });

      this.socket.on('employee-assigned', (data) => {
        console.log('👤 Employee assigned:', data);
        this.updateListeners.assignments.forEach(listener => listener(data));
      });

      this.socket.on('employee-removed', (data) => {
        console.log('👤 Employee removed:', data);
        this.updateListeners.assignments.forEach(listener => listener(data));
      });

      this.socket.on('connection-count', (count) => {
        console.log(`👥 Connected users: ${count}`);
      });

    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  }

  private initializePolling() {
    // For production mode, we use polling instead of Socket.IO
    // Start polling for updates every 5 seconds
    this.startPolling();
    
    // Simulate connection event
    setTimeout(() => {
      this.connectionListeners.forEach(listener => listener(true));
    }, 100);
  }

  private pollingInterval: NodeJS.Timeout | null = null;
  private lastPollTime = 0;

  private startPolling() {
    if (this.pollingInterval) return;
    
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/realtime?lastPoll=${this.lastPollTime}`);
        const data = await response.json();
        
        if (data.hasUpdates) {
          // Notify listeners of potential updates
          this.updateListeners.schedule.forEach(listener => listener({}));
          this.updateListeners.assignments.forEach(listener => listener({}));
          this.updateListeners.daypart.forEach(listener => listener({}));
        }
        
        this.lastPollTime = data.timestamp || Date.now();
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Connection management
  onConnectionChange(listener: (connected: boolean) => void) {
    this.connectionListeners.push(listener);
    return () => {
      this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    };
  }

  // Subscribe to real-time updates
  onScheduleUpdate(listener: (data: any) => void) {
    this.updateListeners.schedule.push(listener);
    return () => {
      this.updateListeners.schedule = this.updateListeners.schedule.filter(l => l !== listener);
    };
  }

  onAssignmentsUpdate(listener: (data: any) => void) {
    this.updateListeners.assignments.push(listener);
    return () => {
      this.updateListeners.assignments = this.updateListeners.assignments.filter(l => l !== listener);
    };
  }

  onDayPartUpdate(listener: (data: any) => void) {
    this.updateListeners.daypart.push(listener);
    return () => {
      this.updateListeners.daypart = this.updateListeners.daypart.filter(l => l !== listener);
    };
  }

  // Join/leave date-specific rooms for targeted updates
  joinDate(date: string) {
    if (this.socket) {
      this.socket.emit('join-date', date);
    }
  }

  leaveDate(date: string) {
    if (this.socket) {
      this.socket.emit('leave-date', date);
    }
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
      const allSchedules = await this.getAllSchedules();
      if (allSchedules.length === 0) return null;
      
      // Sort by uploadedAt (if available) or date and get the most recent
      const sortedSchedules = allSchedules.sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt) : new Date(a.date);
        const dateB = b.uploadedAt ? new Date(b.uploadedAt) : new Date(b.date);
        return dateB.getTime() - dateA.getTime(); // Most recent first
      });
      
      // Get the full schedule data for the most recent one
      const latestScheduleDate = sortedSchedules[0].date;
      const scheduleData = await this.getSchedule(latestScheduleDate);
      
      // Return the schedule data with the date included
      return {
        ...scheduleData,
        date: latestScheduleDate
      };
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

  // Disconnect socket (for cleanup)
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopPolling();
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;
