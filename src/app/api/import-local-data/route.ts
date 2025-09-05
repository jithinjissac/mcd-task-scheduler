import { NextRequest, NextResponse } from 'next/server';
import { fileManager } from '@/lib/fileManager';

export async function POST(request: NextRequest) {
  try {
    const { localStorageData } = await request.json();
    
    if (!localStorageData || typeof localStorageData !== 'object') {
      return NextResponse.json(
        { error: 'Invalid localStorage data' },
        { status: 400 }
      );
    }

    let importedCount = 0;
    const results = {
      schedules: 0,
      assignments: 0,
      dayparts: 0
    };

    // Process each localStorage key
    for (const [key, value] of Object.entries(localStorageData)) {
      try {
        if (key.startsWith('schedule_')) {
          const date = key.replace('schedule_', '');
          const data = typeof value === 'string' ? JSON.parse(value as string) : value;
          await fileManager.writeJSON('schedules', date, data);
          results.schedules++;
        } else if (key.startsWith('assignments_')) {
          const date = key.replace('assignments_', '');
          const data = typeof value === 'string' ? JSON.parse(value as string) : value;
          await fileManager.writeJSON('assignments', date, data);
          results.assignments++;
        } else if (key.startsWith('lastDayPart_')) {
          const date = key.replace('lastDayPart_', '');
          const dayPart = typeof value === 'string' ? value : value?.toString();
          await fileManager.writeJSON('dayparts', date, { 
            dayPart, 
            savedAt: new Date().toISOString(),
            importedFromLocal: true 
          });
          results.dayparts++;
        }
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import ${key}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importedCount} items`,
      results
    });
  } catch (error) {
    console.error('Error importing localStorage data:', error);
    return NextResponse.json(
      { error: 'Failed to import localStorage data' },
      { status: 500 }
    );
  }
}
