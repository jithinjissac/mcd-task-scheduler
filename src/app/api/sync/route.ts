import { NextRequest, NextResponse } from 'next/server';
import { MemoryStorage } from '@/lib/storage';

interface SyncData {
  data: any;
  timestamp: number;
  deviceId: string;
  version: number;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET endpoint for fetching sync data by key
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'Key parameter required' }, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    // Get data from server sync store
    const data = MemoryStorage.getServerSyncData(key);
    
    if (!data) {
      return NextResponse.json({ error: 'No data found' }, { 
        status: 404,
        headers: corsHeaders 
      });
    }

    return NextResponse.json(data, {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Sync GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle individual key sync (new format)
    if (body.key && body.syncData) {
      const { key, syncData } = body;
      
      // Validate sync data structure
      if (!syncData || typeof syncData.timestamp !== 'number' || !syncData.deviceId) {
        return NextResponse.json({ error: 'Invalid sync data format' }, { 
          status: 400,
          headers: corsHeaders 
        });
      }

      // Get existing data from server
      const existingData = MemoryStorage.getServerSyncData(key);
      
      // Update if this is newer data (last write wins based on timestamp)
      let updated = false;
      if (!existingData || syncData.timestamp > existingData.timestamp) {
        MemoryStorage.setServerSyncData(key, syncData);
        updated = true;
      }

      return NextResponse.json({ 
        success: true, 
        updated,
        timestamp: syncData.timestamp,
        serverTimestamp: existingData?.timestamp || 0
      }, {
        headers: corsHeaders
      });
    }
    
    // Handle bulk sync (legacy format)
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