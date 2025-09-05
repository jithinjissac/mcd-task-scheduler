import { NextRequest, NextResponse } from 'next/server';
import { MemoryStorage } from '@/lib/storage';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { schedules, assignments, dayparts } = body;
    
    // Sync all client data back to server storage
    if (schedules) {
      for (const [date, data] of Object.entries(schedules)) {
        await MemoryStorage.saveSchedule(date, data);
      }
    }
    
    if (assignments) {
      for (const [date, data] of Object.entries(assignments)) {
        await MemoryStorage.saveAssignment(date, data);
      }
    }
    
    if (dayparts) {
      for (const [date, data] of Object.entries(dayparts)) {
        await MemoryStorage.saveDayPart(date, data);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Data synchronized successfully',
      synced: {
        schedules: schedules ? Object.keys(schedules).length : 0,
        assignments: assignments ? Object.keys(assignments).length : 0,
        dayparts: dayparts ? Object.keys(dayparts).length : 0
      }
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('Error syncing data:', error);
    return NextResponse.json({ 
      error: 'Failed to sync data' 
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}
