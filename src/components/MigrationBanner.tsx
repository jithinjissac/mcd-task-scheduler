'use client';

import React, { useState, useEffect } from 'react';
import { CloudUpload, Database, Wifi, WifiOff, CheckCircle, AlertCircle, X, Users, Calendar } from 'lucide-react';
import apiService from '@/services/apiService_nextjs';

interface MigrationBannerProps {
  onMigrationComplete?: () => void;
  onDismiss?: () => void;
}

const MigrationBanner: React.FC<MigrationBannerProps> = ({ onMigrationComplete, onDismiss }) => {
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'checking' | 'migrating' | 'success' | 'error'>('idle');
  const [migrationResults, setMigrationResults] = useState<any>(null);
  const [localDataCount, setLocalDataCount] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if migration banner was previously dismissed
    const dismissed = localStorage.getItem('migrationBannerDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
      return;
    }

    // Check server connection
    const checkConnection = async () => {
      try {
        const serverAvailable = await apiService.isServerAvailable();
        setIsServerConnected(serverAvailable);
      } catch (error) {
        setIsServerConnected(false);
      }
    };

    checkConnection();

    // Set up connection listener
    const unsubscribe = apiService.onConnectionChange((connected) => {
      setIsServerConnected(connected);
    });

    // Check for local data that can be migrated
    checkLocalData();

    return unsubscribe;
  }, []);

  const checkLocalData = () => {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('schedule_') || key.startsWith('assignments_') || key.startsWith('lastDayPart_'))) {
        count++;
      }
    }
    setLocalDataCount(count);
  };

  const getLocalStorageData = () => {
    const localData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('schedule_') || key.startsWith('assignments_') || key.startsWith('lastDayPart_'))) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            localData[key] = value;
          }
        } catch (error) {
          console.warn(`Failed to read localStorage key ${key}:`, error);
        }
      }
    }
    return localData;
  };

  const handleMigration = async () => {
    if (!isServerConnected) {
      setError('Server is not available. Please check your connection.');
      return;
    }

    setIsMigrating(true);
    setMigrationStatus('checking');
    setError(null);

    try {
      // Get all localStorage data
      const localData = getLocalStorageData();
      
      if (Object.keys(localData).length === 0) {
        setMigrationStatus('success');
        setMigrationResults({ message: 'No local data found to migrate.' });
        return;
      }

      setMigrationStatus('migrating');

      // Send data to server for import
      const result = await apiService.importLocalStorageData(localData);
      
      if (result.success) {
        setMigrationStatus('success');
        setMigrationResults(result);
        
        // Optionally clear localStorage after successful migration
        // (Commented out for safety - users can manually clear if they want)
        // Object.keys(localData).forEach(key => localStorage.removeItem(key));
        
        onMigrationComplete?.();
      } else {
        setMigrationStatus('error');
        setError(result.message || 'Migration failed');
      }
    } catch (error) {
      setMigrationStatus('error');
      setError(error instanceof Error ? error.message : 'Migration failed');
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('migrationBannerDismissed', 'true');
    onDismiss?.();
  };

  const resetMigration = () => {
    setMigrationStatus('idle');
    setMigrationResults(null);
    setError(null);
  };

  if (isDismissed || localDataCount === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6" />
              <div>
                <h3 className="font-semibold text-lg">Server-Based Storage Available!</h3>
                <p className="text-blue-100 text-sm">
                  Sync your data across all devices with real-time updates
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                {isServerConnected ? (
                  <Wifi className="w-4 h-4 text-green-300" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-300" />
                )}
                <span className={isServerConnected ? 'text-green-300' : 'text-red-300'}>
                  {isServerConnected ? 'Server Connected' : 'Server Offline'}
                </span>
              </div>

              {localDataCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-yellow-300" />
                  <span className="text-yellow-300">
                    {localDataCount} local items found
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {migrationStatus === 'idle' && (
              <button
                onClick={handleMigration}
                disabled={!isServerConnected || isMigrating}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Migrate Data</span>
              </button>
            )}

            {migrationStatus === 'checking' && (
              <div className="flex items-center space-x-2 text-blue-200">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-transparent"></div>
                <span>Checking data...</span>
              </div>
            )}

            {migrationStatus === 'migrating' && (
              <div className="flex items-center space-x-2 text-blue-200">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-transparent"></div>
                <span>Migrating...</span>
              </div>
            )}

            {migrationStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-300">
                <CheckCircle className="w-4 h-4" />
                <span>
                  {migrationResults?.results ? 
                    `Migrated: ${migrationResults.results.schedules || 0} schedules, ${migrationResults.results.assignments || 0} assignments` :
                    'Migration complete'
                  }
                </span>
                <button
                  onClick={resetMigration}
                  className="text-green-300 hover:text-green-100 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {migrationStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-300">
                <AlertCircle className="w-4 h-4" />
                <span>{error || 'Migration failed'}</span>
                <button
                  onClick={resetMigration}
                  className="text-red-300 hover:text-red-100 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleDismiss}
              className="text-blue-200 hover:text-white p-1"
              title="Dismiss this banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Additional info section */}
        {isServerConnected && migrationStatus === 'idle' && (
          <div className="mt-3 pt-3 border-t border-blue-400 border-opacity-30">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-6 text-blue-200">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Multi-device sync</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Wifi className="w-4 h-4" />
                  <span>Real-time updates</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Database className="w-4 h-4" />
                  <span>Centralized storage</span>
                </div>
              </div>
              <p className="text-blue-200 text-xs">
                Your existing data will be preserved and synced to the server
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MigrationBanner;
