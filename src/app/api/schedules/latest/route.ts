import { NextResponse } from 'next/server';
import { fileManager } from '@/lib/fileManager';

export async function GET() {
  try {
    const scheduleFiles = await fileManager.listFiles('schedules');
    
    if (scheduleFiles.length === 0) {
      return NextResponse.json({ schedule: null });
    }

    // Sort dates and get the latest
    scheduleFiles.sort().reverse();
    const latestDate = scheduleFiles[0];
    
    const scheduleData = await fileManager.readJSON('schedules', latestDate);
    
    return NextResponse.json({
      schedule: scheduleData,
      date: latestDate
    });
  } catch (error) {
    console.error('Error getting latest schedule:', error);
    return NextResponse.json(
      { error: 'Failed to get latest schedule' },
      { status: 500 }
    );
  }
}
