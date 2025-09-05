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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const data = await MemoryStorage.getDayPart(date);
    return NextResponse.json(data, { headers: corsHeaders });
  } catch (error) {
    console.error('Error reading dayparts:', error);
    return NextResponse.json({ error: 'Failed to read dayparts' }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const body = await request.json();
    
    await MemoryStorage.saveDayPart(date, body);
    
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error saving dayparts:', error);
    return NextResponse.json({ error: 'Failed to save dayparts' }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}
