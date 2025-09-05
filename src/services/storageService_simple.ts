import { Employee, Assignment, DayPart } from '@/types';
import apiService from './apiService';

// Simple functional approach
export const saveSchedule = async (
  date: string,
  employees: Employee[],
  fileName?: string,
  replaceAll?: boolean
): Promise<void> => {
  console.log('🔄 Simple saveSchedule called:', { date, employeeCount: employees.length, fileName, replaceAll });
  
  try {
    await apiService.saveSchedule(date, employees, fileName);
    console.log('✅ Successfully saved schedule to server');
  } catch (error) {
    console.error('❌ Failed to save schedule:', error);
    throw error;
  }
};

export const getSchedule = async (date: string): Promise<{ employees: Employee[]; uploadedAt?: string; fileName?: string }> => {
  try {
    const result = await apiService.getSchedule(date);
    return result || { employees: [] };
  } catch (error) {
    console.error('❌ Failed to get schedule:', error);
    return { employees: [] };
  }
};

export const getLatestSchedule = async (): Promise<{ employees: Employee[]; uploadedAt?: string; fileName?: string; date?: string } | null> => {
  try {
    const result = await apiService.getLatestSchedule();
    return result;
  } catch (error) {
    console.error('❌ Failed to get latest schedule:', error);
    return null;
  }
};

export const getAssignments = async (date: string): Promise<{ assignments: Assignment; dayPart?: string }> => {
  try {
    console.log('📋 Getting assignments for date:', date);
    const result = await apiService.getAssignments(date);
    console.log('📋 Retrieved assignments:', result ? 'Found data' : 'No data');
    return result || { assignments: {} };
  } catch (error) {
    console.error('❌ Failed to get assignments:', error);
    return { assignments: {} };
  }
};

export const saveAssignments = async (date: string, assignments: Assignment, dayPart?: string): Promise<void> => {
  try {
    console.log('💾 Saving assignments for date:', date, 'dayPart:', dayPart);
    await apiService.saveAssignments(date, assignments, dayPart);
    console.log('✅ Successfully saved assignments');
  } catch (error) {
    console.error('❌ Failed to save assignments:', error);
    throw error;
  }
};

export const getDayPart = async (date: string): Promise<string> => {
  try {
    const result = await apiService.getDayPart(date);
    return result?.dayPart || 'breakfast';
  } catch (error) {
    console.error('❌ Failed to get day part:', error);
    return 'breakfast';
  }
};

export const saveDayPart = async (date: string, dayPart: string): Promise<void> => {
  try {
    await apiService.saveDayPart(date, dayPart);
  } catch (error) {
    console.error('❌ Failed to save day part:', error);
    throw error;
  }
};

export const isServerMode = (): boolean => true;

// Default export as object with all methods
const storageService = {
  saveSchedule,
  getSchedule,
  getLatestSchedule,
  getAssignments,
  saveAssignments,
  getDayPart,
  saveDayPart,
  isServerMode
};

export default storageService;
