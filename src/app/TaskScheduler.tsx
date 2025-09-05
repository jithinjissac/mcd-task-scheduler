'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Upload, X } from 'lucide-react';
import { Employee, Assignment, DayPart, Layout } from '@/types';
import { defaultLayouts } from '@/data/layouts';
import { generatePDF, printSchedule } from '@/utils/pdfUtils';
import { parseEmployeeFile } from '@/utils/fileUtils';
import DayPartTabs from '@/components/DayPartTabs';
import HorizontalEmployeePool from '@/components/HorizontalEmployeePool';
import StationSelectionModal from '@/components/StationSelectionModal';
import PDFLayoutGrid from '@/components/PDFLayoutGrid';
import storageService from '@/services/storageService_simple';
import apiService from '@/services/apiService';
import { PersistenceService } from '@/services/persistenceService';
import '../styles/compact-layout.css';

const TaskScheduler: React.FC = () => {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignments, setAssignments] = useState<Assignment>({});
  const [currentDayPart, setCurrentDayPart] = useState<DayPart>('Breakfast');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null);
  const [modalEmployee, setModalEmployee] = useState<Employee | null>(null);
  const [showStationModal, setShowStationModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    employee: Employee;
    targetTableId: string;
    targetColumn: string;
    currentAssignments: Array<{ stationId: string; taskName: string }>;
    isBreakAssignment?: boolean;
  } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isServerMode, setIsServerMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'pending' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showStaffPool, setShowStaffPool] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'conflict' | 'offline'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Refs for change tracking and sync management
  const previousAssignmentsRef = useRef<Assignment>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  // Initialize assignments for empty structure
  const initializeAssignments = () => {
    const newAssignments: Assignment = {};
    const dayParts: DayPart[] = ['Breakfast', 'Lunch'];
    
    dayParts.forEach(dayPart => {
      newAssignments[dayPart] = {};
      const layout = dayPart === 'Breakfast' ? defaultLayouts.breakfast : defaultLayouts.dayPart;
      
      layout.tables.forEach(table => {
        newAssignments[dayPart][table.id] = {};
        table.columns.forEach(column => {
          newAssignments[dayPart][table.id][column] = [];
        });
      });
    });

    setAssignments(newAssignments);
  };

  // Save assignments using hybrid storage service
  const saveAssignmentsToStorage = useCallback(async (isManual = false) => {
    try {
      if (!isManual) setSaveStatus('saving');
      
      const dateKey = selectedDate.toISOString().split('T')[0];
      await storageService.saveAssignments(dateKey, assignments, currentDayPart);
      await storageService.saveDayPart(dateKey, currentDayPart);
      
      // Also save to localStorage for persistence across reloads
      PersistenceService.save(`assignment_${dateKey}`, { assignments, dayPart: currentDayPart });
      PersistenceService.save(`daypart_${dateKey}`, { dayPart: currentDayPart });
      
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      console.log(`Assignments ${isManual ? 'manually' : 'auto'}-saved for date:`, dateKey);
    } catch (error) {
      setSaveStatus('error');
      console.warn('Failed to save assignments:', error);
    }
  }, [selectedDate, assignments, currentDayPart]);

  // Manual save function for immediate saves
  const saveNow = useCallback(async () => {
    await saveAssignmentsToStorage(true);
  }, [saveAssignmentsToStorage]);

  // Load assignments using hybrid storage service
  const loadAssignmentsFromStorage = useCallback(async () => {
    try {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const result = await storageService.getAssignments(dateKey);
      
      if (result.assignments && Object.keys(result.assignments).length > 0) {
        setAssignments(result.assignments);
        
        // Load the last used day part for this date
        const dayPart = await storageService.getDayPart(dateKey);
        if (dayPart && (dayPart === 'Breakfast' || dayPart === 'Lunch')) {
          setCurrentDayPart(dayPart as DayPart);
          console.log('Restored last used day part for date:', dateKey, '→', dayPart);
        }
        
        console.log('Assignments loaded from storage for date:', dateKey);
        return; // Successfully loaded, don't initialize
      }
      
      // No saved assignments found, initialize empty structure
      console.log('No saved assignments found, initializing empty structure for date:', dateKey);
      initializeAssignments();
    } catch (error) {
      console.warn('Failed to load assignments:', error);
      // On error, initialize empty structure
      initializeAssignments();
    }
  }, [selectedDate]);

  // Load employees from server storage for the selected date
  const loadEmployeesFromStorage = useCallback(async () => {
    try {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const schedule = await storageService.getSchedule(dateKey);
      
      if (schedule && schedule.employees && Array.isArray(schedule.employees) && schedule.employees.length > 0) {
        setEmployees(schedule.employees);
        console.log('Employees loaded from storage for date:', dateKey, schedule.employees.length, 'employees');
        return true; // Successfully loaded
      }
      
      console.log('No saved employees found for date:', dateKey);
      // Clear employees if no schedule found for this date
      setEmployees([]);
      return false; // No employees found
    } catch (error) {
      console.warn('Failed to load employees from storage:', error);
      setEmployees([]);
      return false; // Failed to load
    }
  }, [selectedDate]);

  // Mount state for portal
  useEffect(() => { 
    setMounted(true); 
    return () => {
      setMounted(false);
      // Clean up save timeout on unmount
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    }; 
  }, []);

  // Sync localStorage data to server on mount (for persistence across page reloads)
  useEffect(() => {
    if (!mounted) return;
    
    const syncData = async () => {
      try {
        // In production mode, sync any localStorage data to server
        if (process.env.NODE_ENV === 'production') {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
          await PersistenceService.syncToServer(baseUrl);
          console.log('🔄 Data synced from localStorage to server');
        }
      } catch (error) {
        console.warn('⚠️ Failed to sync data on mount:', error);
      }
    };
    
    // Delay sync slightly to ensure everything is initialized
    setTimeout(syncData, 1000);
  }, [mounted]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S for manual save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNow();
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [saveNow]);

  // Save on page unload to prevent data loss
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'pending' || saveStatus === 'saving') {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Real-time connection and sync setup
  useEffect(() => {
    if (!mounted) return;

    // Check initial server mode with safety check
    if (storageService && typeof storageService.isServerMode === 'function') {
      setIsServerMode(storageService.isServerMode());
    }

    // Set up connection listener
    const unsubscribeConnection = apiService.onConnectionChange((connected) => {
      setIsConnected(connected);
      if (storageService && typeof storageService.isServerMode === 'function') {
        setIsServerMode(storageService.isServerMode());
      }
    });

    // Set up real-time update listeners
    const unsubscribeSchedule = apiService.onScheduleUpdate((data) => {
      const currentDateKey = selectedDate.toISOString().split('T')[0];
      if (data.date === currentDateKey) {
        setEmployees(data.employees || []);
        console.log('📅 Real-time schedule update received');
      }
    });

    const unsubscribeAssignments = apiService.onAssignmentsUpdate((data) => {
      const currentDateKey = selectedDate.toISOString().split('T')[0];
      if (data.date === currentDateKey) {
        // Only update if the received data has meaningful content
        if (data.assignments && Object.keys(data.assignments).length > 0) {
          setAssignments(data.assignments);
          console.log('📋 Real-time assignments update received and applied');
        } else {
          console.log('📋 Real-time assignments update received but empty - skipping');
        }
        if (data.dayPart) {
          setCurrentDayPart(data.dayPart);
        }
      }
    });

    const unsubscribeDayPart = apiService.onDayPartUpdate((data) => {
      const currentDateKey = selectedDate.toISOString().split('T')[0];
      if (data.date === currentDateKey) {
        setCurrentDayPart(data.dayPart);
        console.log('🌅 Real-time day part update received');
      }
    });

    // Join date room for targeted updates
    const currentDateKey = selectedDate.toISOString().split('T')[0];
    apiService.joinDate(currentDateKey);

    return () => {
      unsubscribeConnection();
      unsubscribeSchedule();
      unsubscribeAssignments();
      unsubscribeDayPart();
      apiService.leaveDate(currentDateKey);
    };
  }, [mounted, selectedDate]);

  // Real-time cross-device synchronization with polling
  useEffect(() => {
    if (!mounted) return;

    const startRealtimeSync = () => {
      // Clear any existing interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      // Set up polling interval for cross-device sync (every 10 seconds)
      syncIntervalRef.current = setInterval(async () => {
        if (isSyncingRef.current) return; // Skip if already syncing

        try {
          isSyncingRef.current = true;
          setSyncStatus('syncing');

          const currentDateKey = selectedDate.toISOString().split('T')[0];
          
          // Check for updates from other devices
          const apiUrl = process.env.NODE_ENV === 'production' 
            ? 'https://mcd-task-scheduler.vercel.app'
            : 'http://localhost:3000';

          const keys = [`schedule_${currentDateKey}`, `assignment_${currentDateKey}`, `daypart_${currentDateKey}`];
          let hasUpdates = false;

          for (const key of keys) {
            try {
              const response = await fetch(`${apiUrl}/api/sync?key=${encodeURIComponent(key)}&t=${Date.now()}`, {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              });

              // Skip sync if no data available
              if (response.status === 404) {
                continue;
              }

              if (response.ok) {
                const serverData = await response.json();
                
                // Check if we have this data locally
                const localData = localStorage.getItem(`mcd_${key}`);
                let shouldUpdate = false;

                if (!localData) {
                  shouldUpdate = true;
                } else {
                  const localSyncData = JSON.parse(localData);
                  if (serverData.timestamp > localSyncData.timestamp) {
                    shouldUpdate = true;
                  }
                }

                if (shouldUpdate) {
                  // Update localStorage with newer data from server
                  localStorage.setItem(`mcd_${key}`, JSON.stringify(serverData));
                  hasUpdates = true;

                  // Update state based on the data type
                  if (key.startsWith('schedule_')) {
                    setEmployees(serverData.data.employees || []);
                  } else if (key.startsWith('assignment_')) {
                    setAssignments(serverData.data.assignments || {});
                  } else if (key.startsWith('daypart_')) {
                    setCurrentDayPart(serverData.data.dayPart || 'Breakfast');
                  }
                }
              }
            } catch (error) {
              // Silently skip individual sync errors
              continue;
            }
          }

          setSyncStatus('synced');
          if (hasUpdates) {
            setLastSyncTime(new Date());
            console.log('🔄 Cross-device sync completed with updates');
          }

        } catch (error) {
          console.warn('Cross-device sync error:', error);
          setSyncStatus('offline');
        } finally {
          isSyncingRef.current = false;
        }
      }, 10000); // Poll every 10 seconds
    };

    startRealtimeSync();

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [mounted, selectedDate]);

  // Cleanup all intervals on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Manage body scroll when confirmation modal is open
  useEffect(() => {
    if (showConfirmDialog) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showConfirmDialog]);

  // Auto-save assignments with smart change detection and debouncing
  useEffect(() => {
    if (!mounted || Object.keys(assignments).length === 0) return;

    // Deep comparison to check if assignments actually changed
    const hasChanged = JSON.stringify(assignments) !== JSON.stringify(previousAssignmentsRef.current);
    
    if (!hasChanged) return; // No actual changes, skip save

    // Update the ref with current assignments
    previousAssignmentsRef.current = JSON.parse(JSON.stringify(assignments));

    // Set status to pending when real changes are detected
    setSaveStatus('pending');

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Instant auto-save - saves immediately on any change but with a small delay to avoid race conditions
    saveTimeoutRef.current = setTimeout(() => {
      saveAssignmentsToStorage();
      saveTimeoutRef.current = null;
    }, 100); // Small delay to avoid race conditions with real-time updates

    // Cleanup function
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [assignments, mounted, saveAssignmentsToStorage]);

  // Load assignments when date or day part changes
  useEffect(() => {
    const loadData = async () => {
      // Load employees for the new date - NO fallback, keep date-specific
      const employeesLoaded = await loadEmployeesFromStorage();
      if (!employeesLoaded) {
        // No employees for this specific date - show empty (don't fallback to other dates)
        console.log('No employees found for this specific date - showing empty employee pool');
        setEmployees([]);
      }
      
      // Load assignments for the new date and day part
      await loadAssignmentsFromStorage();
    };
    
    loadData();
  }, [selectedDate, currentDayPart, loadAssignmentsFromStorage, loadEmployeesFromStorage]);

  // Load assignments on component mount (for page reloads)
  useEffect(() => {
    if (mounted) {
      loadAssignmentsFromStorage();
    }
  }, [mounted, loadAssignmentsFromStorage]);

  // Load employees from server storage for a specific date
  const loadEmployeesFromStorageForDate = async (dateKey: string) => {
    try {
      const schedule = await storageService.getSchedule(dateKey);
      
      if (schedule && schedule.employees && Array.isArray(schedule.employees) && schedule.employees.length > 0) {
        setEmployees(schedule.employees);
        console.log('Employees loaded from storage for specific date:', dateKey, schedule.employees.length, 'employees');
        return true; // Successfully loaded
      }
      
      console.log('No saved employees found for specific date:', dateKey);
      // Clear employees if no schedule found for this date
      setEmployees([]);
      return false; // No employees found
    } catch (error) {
      console.warn('Failed to load employees from storage for date:', dateKey, error);
      setEmployees([]);
      return false; // Failed to load
    }
  };

  // Get the latest uploaded schedule (most recent across all dates)
  const getLatestSchedule = async () => {
    try {
      const latest = await storageService.getLatestSchedule();
      return latest;
    } catch (error) {
      console.warn('Failed to get latest schedule:', error);
      return null;
    }
  };

  // If a schedule was uploaded from the landing page, load it from sessionStorage once
  useEffect(() => {
    const loadInitialData = async () => {
      let hasNewUpload = false;
      
      try {
        const raw = sessionStorage.getItem('uploadedEmployees');
        if (raw) {
          const parsed: Employee[] = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setEmployees(parsed);
            hasNewUpload = true;
          }
          sessionStorage.removeItem('uploadedEmployees');
        }

        // Load selected date from sessionStorage first (before any date-dependent operations)
        let workingDate = selectedDate; // Default to current state
        const dateRaw = sessionStorage.getItem('selectedDate');
        if (dateRaw) {
          const parsedDate = new Date(dateRaw);
          if (!isNaN(parsedDate.getTime())) {
            setSelectedDate(parsedDate);
            workingDate = parsedDate; // Use the parsed date for immediate operations
          }
          sessionStorage.removeItem('selectedDate');
        }

        // Check if this is a pool-only update or replace all assignments
        const poolUpdateOnly = sessionStorage.getItem('poolUpdateOnly');
        const replaceAllAssignments = sessionStorage.getItem('replaceAllAssignments');
        
        if (poolUpdateOnly === 'true') {
          // For pool-only updates, don't clear assignments - just update the employee list
          console.log('Pool-only update: preserving existing assignments');
          sessionStorage.removeItem('poolUpdateOnly');
        } else if (replaceAllAssignments === 'true') {
          // For replace all assignments, clear existing assignments and reinitialize
          console.log('Replace all assignments: clearing existing assignments for date:', workingDate.toLocaleDateString());
          const dateKey = workingDate.toISOString().split('T')[0]; // Use workingDate instead of selectedDate
          await storageService.saveAssignments(dateKey, {});
          initializeAssignments();
          sessionStorage.removeItem('replaceAllAssignments');
        } else if (!hasNewUpload) {
          // If no new upload, try to load employees for the working date only
          const dateKey = workingDate.toISOString().split('T')[0];
          console.log('Loading employees for date:', workingDate.toLocaleDateString(), 'DateKey:', dateKey);
          const employeesLoaded = await loadEmployeesFromStorageForDate(dateKey);
          if (!employeesLoaded) {
            // No employees found for this specific date - show empty (don't fallback to other dates)
            console.log('No schedule data found for this specific date - empty employee pool');
            setEmployees([]);
          }
        }

        // Always try to load assignments after setting up employees
        // Use workingDate to ensure we load for the correct date
        const finalDateKey = workingDate.toISOString().split('T')[0];
        console.log('Loading assignments for final date:', workingDate.toLocaleDateString(), 'DateKey:', finalDateKey);
        
        // Small delay to ensure state updates are processed
        setTimeout(async () => {
          try {
            const result = await storageService.getAssignments(finalDateKey);
            
            if (result.assignments && Object.keys(result.assignments).length > 0) {
              setAssignments(result.assignments);
              
              // Load the last used day part for this date
              const dayPart = await storageService.getDayPart(finalDateKey);
              if (dayPart && (dayPart === 'Breakfast' || dayPart === 'Lunch')) {
                setCurrentDayPart(dayPart as DayPart);
                console.log('Restored last used day part for date:', finalDateKey, '→', dayPart);
              }
              
              console.log('Assignments loaded from storage for specific date:', finalDateKey);
            } else {
              // No saved assignments found, initialize empty structure
              console.log('No saved assignments found, initializing empty structure for date:', finalDateKey);
              initializeAssignments();
            }
          } catch (error) {
            console.warn('Failed to load assignments for date:', finalDateKey, error);
            initializeAssignments();
          }
        }, 100);

      } catch (err) {
        console.warn('Failed to load data from sessionStorage', err);
        // Fallback: try to load from server storage
        await loadEmployeesFromStorage();
        await loadAssignmentsFromStorage();
      }
    };
    
    loadInitialData();
  }, [loadAssignmentsFromStorage, loadEmployeesFromStorage, selectedDate]);

  // Initialize assignments structure when employees change (only for new uploads)
  useEffect(() => {
    // Only initialize if we have employees and this isn't a page reload
    const hasUploadedData = sessionStorage.getItem('uploadedEmployees');
    if (hasUploadedData && employees.length > 0) {
      initializeAssignments();
    }
  }, [employees]);

  const getCurrentLayout = (): Layout => {
    return currentDayPart === 'Breakfast' ? defaultLayouts.breakfast : defaultLayouts.dayPart;
  };

  const handleEmployeesUploaded = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
  };

  // Handle adding a new employee manually
  const handleAddEmployee = async (newEmployee: Employee) => {
    setEmployees(prev => [...prev, newEmployee]);
    
    // Save updated employee list using storage service
    try {
      const dateKey = selectedDate.toISOString().split('T')[0];
      const updatedEmployees = [...employees, newEmployee];
      
      await storageService.saveSchedule(dateKey, updatedEmployees);
      
      // Also save to localStorage for persistence
      PersistenceService.save(`schedule_${dateKey}`, { employees: updatedEmployees });
      
      console.log('New employee added and saved:', newEmployee.name);
    } catch (error) {
      console.warn('Failed to save employee to storage:', error);
    }
  };

  // Handle file upload for employee data
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if there are existing assignments for this date
    const dateKey = selectedDate.toISOString().split('T')[0];

    try {
      const existingData = await storageService.getAssignments(dateKey);
      const existingAssignments = existingData?.assignments;

      if (existingAssignments) {
        // Check if there are any actual assignments (not just empty structures)
        const hasAssignments = Object.values(existingAssignments).some((dayPartAssignments: any) =>
          Object.values(dayPartAssignments).some((tableAssignments: any) =>
            Object.values(tableAssignments).some((columnAssignments: any) =>
              Array.isArray(columnAssignments) && columnAssignments.length > 0
            )
          )
        );

        if (hasAssignments) {
          setPendingFile(file);
          setShowImportConfirm(true);
          e.target.value = ''; // Reset file input
          return;
        }
      }
    } catch (error) {
      console.warn('Error checking existing assignments:', error);
    }

    // No existing assignments, proceed with upload
    await processFileUpload(file);
    e.target.value = ''; // Reset file input
  };

  // Process file upload (complete replacement)
  const processFileUpload = async (file: File) => {
    try {
      const result = await parseEmployeeFile(file);
      if (result.success && result.employees) {
        setEmployees(result.employees);
        
        // Save using storage service with current date
        const dateKey = selectedDate.toISOString().split('T')[0];
        await storageService.saveSchedule(dateKey, result.employees, file.name, true); // replaceAll = true
        
        // Also save to localStorage for persistence
        PersistenceService.save(`schedule_${dateKey}`, { employees: result.employees });
        
        // Clear existing assignments since we're importing a new schedule
        setAssignments({});
        await storageService.saveAssignments(dateKey, {});
        
        // Also clear assignments in localStorage
        PersistenceService.save(`assignment_${dateKey}`, { assignments: {} });
        
        console.log('Schedule imported successfully:', result.employees.length, 'employees');
        alert(`Successfully imported ${result.employees.length} employees! All previous assignments have been cleared.`);
      } else {
        console.error('File upload failed:', result.error);
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the format and try again.');
    }
  };

  // Process file upload (pool update only, preserve assignments)
  const processFileUploadPoolOnly = async (file: File) => {
    try {
      const result = await parseEmployeeFile(file);
      if (result.success && result.employees) {
        setEmployees(result.employees);
        
        // Save using storage service with current date
        const dateKey = selectedDate.toISOString().split('T')[0];
        await storageService.saveSchedule(dateKey, result.employees, file.name);
        
        // Also save to localStorage for persistence
        PersistenceService.save(`schedule_${dateKey}`, { employees: result.employees });
        
        console.log('Employee pool updated:', result.employees.length, 'employees');
        alert(`Successfully updated employee pool with ${result.employees.length} employees! Existing assignments preserved.`);
      } else {
        console.error('File upload failed:', result.error);
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the format and try again.');
    }
  };

  // Confirmation handlers for import dialog
  const confirmReplaceAssignments = async () => {
    if (pendingFile) {
      await processFileUpload(pendingFile);
    }
    setShowImportConfirm(false);
    setPendingFile(null);
  };

  const confirmUpdatePoolOnly = async () => {
    if (pendingFile) {
      await processFileUploadPoolOnly(pendingFile);
    }
    setShowImportConfirm(false);
    setPendingFile(null);
  };

  const cancelImport = () => {
    setShowImportConfirm(false);
    setPendingFile(null);
  };

  const handleImportOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal if clicking on the overlay (not on the modal content)
    if (e.target === e.currentTarget) {
      cancelImport();
    }
  };

  const handleDragStart = (employee: Employee) => {
    setDraggedEmployee(employee);
  };

  const handleDrop = (employee: Employee, tableId: string, columnName: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      
      // Ensure the structure exists
      if (!newAssignments[currentDayPart]) {
        newAssignments[currentDayPart] = {};
      }
      if (!newAssignments[currentDayPart][tableId]) {
        newAssignments[currentDayPart][tableId] = {};
      }
      if (!newAssignments[currentDayPart][tableId][columnName]) {
        newAssignments[currentDayPart][tableId][columnName] = [];
      }

      // Check if employee is already assigned to this position
      const currentAssignments = newAssignments[currentDayPart][tableId][columnName];
      if (!currentAssignments.includes(employee.name)) {
        newAssignments[currentDayPart][tableId][columnName] = [
          ...currentAssignments,
          employee.name
        ];
      }

      return newAssignments;
    });

    setDraggedEmployee(null);
  };

  const handleRemove = (employeeName: string, tableId: string, columnName: string) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      
      if (newAssignments[currentDayPart]?.[tableId]?.[columnName]) {
        newAssignments[currentDayPart][tableId][columnName] = 
          newAssignments[currentDayPart][tableId][columnName].filter(
            name => name !== employeeName
          );
      }

      return newAssignments;
    });
  };

  // New function to handle station-to-station movement
  const handleMove = (
    employeeName: string, 
    fromTableId: string, 
    fromColumn: string, 
    toTableId: string, 
    toColumn: string
  ) => {
    setAssignments(prev => {
      const newAssignments = { ...prev };
      
      // Remove from source
      if (newAssignments[currentDayPart]?.[fromTableId]?.[fromColumn]) {
        newAssignments[currentDayPart][fromTableId][fromColumn] = 
          newAssignments[currentDayPart][fromTableId][fromColumn].filter(
            name => name !== employeeName
          );
      }

      // Ensure destination structure exists
      if (!newAssignments[currentDayPart]) {
        newAssignments[currentDayPart] = {};
      }
      if (!newAssignments[currentDayPart][toTableId]) {
        newAssignments[currentDayPart][toTableId] = {};
      }
      if (!newAssignments[currentDayPart][toTableId][toColumn]) {
        newAssignments[currentDayPart][toTableId][toColumn] = [];
      }

      // Add to destination if not already there
      const destAssignments = newAssignments[currentDayPart][toTableId][toColumn];
      if (!destAssignments.includes(employeeName)) {
        newAssignments[currentDayPart][toTableId][toColumn] = [
          ...destAssignments,
          employeeName
        ];
      }

      return newAssignments;
    });
  };

  const handleDayPartChange = async (dayPart: DayPart) => {
    setCurrentDayPart(dayPart);
    
    // Save the day part preference for this date
    try {
      const dateKey = selectedDate.toISOString().split('T')[0];
      await storageService.saveDayPart(dateKey, dayPart);
      console.log('Day part preference saved for date:', dateKey, '→', dayPart);
    } catch (error) {
      console.warn('Failed to save day part preference:', error);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Helper: find all assignments for an employee across current day part
  const findAllEmployeeAssignments = (employeeName: string) => {
    const all: Array<{ stationId: string; taskName: string }> = [];
    const curr = getCurrentAssignments();
    for (const stationId of Object.keys(curr || {})) {
      for (const taskName of Object.keys(curr[stationId] || {})) {
        const assigned = curr[stationId][taskName] || [];
        if (assigned.includes(employeeName)) {
          all.push({ stationId, taskName });
        }
      }
    }
    return all;
  };

  const requestAssignment = (employee: Employee, tableId: string, columnName: string) => {
    const allAssignments = findAllEmployeeAssignments(employee.name);
    const isBreakAssignment = columnName.toLowerCase() === 'breaks' || tableId.toLowerCase() === 'breaks';

    if (isBreakAssignment && allAssignments.length > 0) {
      setPendingAssignment({ employee, targetTableId: tableId, targetColumn: columnName, currentAssignments: allAssignments, isBreakAssignment: true });
      setShowConfirmDialog(true);
    } else if (allAssignments.length > 0) {
      setPendingAssignment({ employee, targetTableId: tableId, targetColumn: columnName, currentAssignments: allAssignments, isBreakAssignment: false });
      setShowConfirmDialog(true);
    } else {
      // No conflicts, assign directly
      handleDrop(employee, tableId, columnName);
    }
    setShowStationModal(false);
    setModalEmployee(null);
  };

  const confirmAssignment = () => {
    if (pendingAssignment) {
      // Remove from all current assignments then add to new location
      pendingAssignment.currentAssignments.forEach(a => {
        handleRemove(pendingAssignment.employee.name, a.stationId, a.taskName);
      });
      handleDrop(pendingAssignment.employee, pendingAssignment.targetTableId, pendingAssignment.targetColumn);
    }
    setShowConfirmDialog(false);
    setPendingAssignment(null);
  };

  const assignToBoth = () => {
    if (pendingAssignment && !pendingAssignment.isBreakAssignment) {
      handleDrop(pendingAssignment.employee, pendingAssignment.targetTableId, pendingAssignment.targetColumn);
    }
    setShowConfirmDialog(false);
    setPendingAssignment(null);
  };

  const cancelAssignment = () => {
    setShowConfirmDialog(false);
    setPendingAssignment(null);
  };

  const handleAssignmentOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal if clicking on the overlay (not on the modal content)
    if (e.target === e.currentTarget) {
      cancelAssignment();
    }
  };

  // Get current day part assignments, ensuring structure exists
  const getCurrentAssignments = () => {
    return assignments[currentDayPart] || {};
  };

  // Print PDF function
  const handlePrintPDF = () => {
    try {
      // Use the existing printSchedule function for HTML-based printing
      printSchedule(assignments, employees, defaultLayouts, selectedDate);
    } catch (error) {
      console.error('Error printing PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Download PDF function
  const handleDownloadPDF = () => {
    try {
      // Use the existing generatePDF function for jsPDF-based download
      generatePDF(assignments, employees, defaultLayouts, selectedDate);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Navigate to home
  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="app-container-responsive">
      <div className="flex items-center justify-between mb-4">
        <DayPartTabs
          currentDayPart={currentDayPart}
          onDayPartChange={handleDayPartChange}
        />
        
        {/* Save Status and Sync Status Indicators */}
        <div className="flex items-center gap-2">
          {/* Sync Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            syncStatus === 'synced' ? 'bg-green-50 text-green-700 border border-green-200' :
            syncStatus === 'syncing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
            syncStatus === 'conflict' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
            'bg-gray-50 text-gray-700 border border-gray-200'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              syncStatus === 'synced' ? 'bg-green-500' :
              syncStatus === 'syncing' ? 'bg-blue-500 animate-pulse' :
              syncStatus === 'conflict' ? 'bg-orange-500 animate-pulse' :
              'bg-gray-400'
            }`}></div>
            <span>
              {syncStatus === 'synced' && '🔄 Synced'}
              {syncStatus === 'syncing' && '🔄 Syncing...'}
              {syncStatus === 'conflict' && '⚠️ Conflict'}
              {syncStatus === 'offline' && '📶 Offline'}
            </span>
            {lastSyncTime && syncStatus === 'synced' && (
              <span className="text-xs opacity-70">
                {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Save Status Indicator */}
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            saveStatus === 'saved' ? 'bg-green-100 text-green-800' :
            saveStatus === 'saving' ? 'bg-blue-100 text-blue-800' :
            saveStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              saveStatus === 'saved' ? 'bg-green-500' :
              saveStatus === 'saving' ? 'bg-blue-500 animate-pulse' :
              saveStatus === 'pending' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500'
            }`}></div>
            <span>
              {saveStatus === 'saved' && 'All Changes Saved'}
              {saveStatus === 'saving' && 'Saving Changes...'}
              {saveStatus === 'pending' && 'Auto-save in 2s'}
              {saveStatus === 'error' && 'Save Failed'}
            </span>
            {lastSaved && saveStatus === 'saved' && (
              <span className="text-xs opacity-70">
                {lastSaved.toLocaleTimeString()}
              </span>
            )}
          </div>
          
          {/* Manual Save Button */}
          <button
            onClick={saveNow}
            disabled={saveStatus === 'saving'}
            className={`px-3 py-1 rounded text-sm ${
              saveStatus === 'saving' 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="Save changes immediately (Ctrl+S)"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save Now'}
          </button>
          
          {/* Staff Pool Toggle */}
          <div className="staff-pool-main-toggle">
            <label className="toggle-switch-main">
              <input
                type="checkbox"
                checked={showStaffPool}
                onChange={() => setShowStaffPool(!showStaffPool)}
                className="toggle-switch-checkbox-main"
                aria-label={showStaffPool ? 'Hide staff pool' : 'Show staff pool'}
              />
              <span className="toggle-switch-slider-main">
                <span className="toggle-switch-button-main"></span>
              </span>
            </label>
            <span className="toggle-label-main">
              Staff Pool
            </span>
          </div>
        </div>
      </div>
      
      {/* Main Layout Container - Side by Side */}
      <div className="main-layout-container">
        {/* Horizontal Employee Pool - Conditionally Rendered */}
        {showStaffPool && (
          <div className="employee-pool-sidebar">
            <HorizontalEmployeePool
              employees={employees}
              assignments={assignments}
              currentDayPart={currentDayPart}
              onDragStart={handleDragStart}
              onFileUpload={() => {
                const fileInput = document.getElementById('schedule-upload') as HTMLInputElement;
              if (fileInput) {
                fileInput.click();
              }
            }}
            onEmployeeClick={(emp) => {
              setModalEmployee(emp);
              setShowStationModal(true);
            }}
            onAddEmployee={handleAddEmployee}
          />
        </div>
        )}

        {/* Assignment Grid */}
        <div className="assignment-grid-main">
          <PDFLayoutGrid
            layout={getCurrentLayout()}
            assignments={getCurrentAssignments()}
            dayPart={currentDayPart}
            employees={employees}
            onDrop={handleDrop}
            onRemove={handleRemove}
            onMove={handleMove}
          />
        </div>
      </div>

      <StationSelectionModal
        isOpen={showStationModal}
        onClose={() => { setShowStationModal(false); setModalEmployee(null); }}
        layout={getCurrentLayout()}
        assignments={getCurrentAssignments()}
        employee={modalEmployee}
        onAssign={(employee, tableId, columnName) => {
          // Intercept assignment requests and run confirmation flow
          requestAssignment(employee, tableId, columnName);
        }}
      />

      {/* Confirmation dialog for assignments initiated from modal */}
      {showConfirmDialog && pendingAssignment && mounted && createPortal(
        <div className="modal-overlay" onClick={handleAssignmentOverlayClick}>
          <div className="modal-container">
            <div className="p-6">
              {pendingAssignment.isBreakAssignment ? (
                // Simple break confirmation
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign to Break</h3>
                  <p className="text-gray-600 mb-4">
                    <strong>{pendingAssignment.employee.name}</strong> is currently working at {pendingAssignment.currentAssignments.length} station(s).
                  </p>
                  <p className="text-gray-600 mb-6">Assigning to break will remove them from all current assignments. Are you sure?</p>
                  <div className="flex gap-3 justify-end">
                    <button onClick={cancelAssignment} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                    <button onClick={confirmAssignment} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Yes, Send to Break</button>
                  </div>
                </>
              ) : (
                // Regular assignment conflict
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Already Assigned</h3>
                  <p className="text-gray-600 mb-4">
                    <strong>{pendingAssignment.employee.name}</strong> is currently assigned to:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 mb-6">
                    {pendingAssignment.currentAssignments.map((assignment, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="font-medium text-gray-800">{assignment.stationId} - {assignment.taskName}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6">What would you like to do with the assignment to <strong>{pendingAssignment.targetTableId} - {pendingAssignment.targetColumn}</strong>?</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <button onClick={cancelAssignment} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg order-3 sm:order-1">Cancel</button>
                    <button onClick={assignToBoth} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg order-1 sm:order-2">Add to Current ({pendingAssignment.currentAssignments.length + 1} total)</button>
                    <button onClick={confirmAssignment} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg order-2 sm:order-3">Move Only</button>
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    <p><strong>Add to Current:</strong> Keep all current assignments and add this new one</p>
                    <p><strong>Move Only:</strong> Remove from all current stations and assign only to new one</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Import Confirmation Dialog */}
      {showImportConfirm && pendingFile && mounted && createPortal(
        <div className="modal-overlay" onClick={handleImportOverlayClick}>
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title">
                <Upload className="w-5 h-5" />
                <h2>Import Schedule Confirmation</h2>
              </div>
              <button 
                onClick={cancelImport}
                className="modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="add-employee-form">
              <div className="form-group">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-weight-600 text-yellow-800">Existing Assignments Detected</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        You have existing assignments for {selectedDate.toLocaleDateString()}. Choose how to handle the import of <strong>{pendingFile.name}</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Import Options</label>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmReplaceAssignments} 
                    className="btn-save bg-red-600 hover:bg-red-700 justify-start text-left p-4"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <div>
                      <div className="font-weight-600">🔄 Replace Everything</div>
                      <div className="text-sm opacity-90 mt-1">Import new schedule and clear all existing assignments</div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={confirmUpdatePoolOnly} 
                    className="btn-save bg-green-600 hover:bg-green-700 justify-start text-left p-4"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <div>
                      <div className="font-weight-600">👥 Update Pool Only</div>
                      <div className="text-sm opacity-90 mt-1">Import new employee list but keep existing assignments</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="form-buttons">
                <button 
                  onClick={cancelImport} 
                  className="btn-cancel"
                >
                  <X className="w-4 h-4" />
                  Cancel Import
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bottom Navigation Bar */}
      <div className="bottom-nav">
        <div className="bottom-nav-container">
          <button
            onClick={handleGoHome}
            className="bottom-nav-button"
          >
            <svg className="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="bottom-nav-label">Home</span>
          </button>
          
          <button
            onClick={handlePrintPDF}
            className="bottom-nav-button"
          >
            <svg className="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="bottom-nav-label">Print</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="bottom-nav-button"
          >
            <svg className="bottom-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="bottom-nav-label">Download</span>
          </button>
        </div>
      </div>

      {/* Hidden file input for CSV upload */}
      <input
        type="file"
        id="schedule-upload"
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default TaskScheduler;
