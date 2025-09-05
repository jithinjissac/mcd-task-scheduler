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

// GET endpoint - fetch latest data for a specific key
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
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

// POST endpoint - update data for a specific key
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    
    if (!key) {
      return NextResponse.json({ error: 'Key parameter required' }, { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const syncData: SyncData = await request.json();
    
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
  } catch (error) {
    console.error('Sync POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}
