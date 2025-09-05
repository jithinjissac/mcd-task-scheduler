import { NextRequest, NextResponse } from 'next/server';

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

// In-memory store for real-time updates (in production, use Redis or similar)
let connections: Map<string, any> = new Map();
let lastUpdate: string = Date.now().toString();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lastKnownUpdate = searchParams.get('lastUpdate') || '0';
  
  // Simple polling mechanism
  if (lastKnownUpdate === lastUpdate) {
    // No updates, wait a bit (simulate long polling)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return NextResponse.json({
    lastUpdate,
    hasUpdates: lastKnownUpdate !== lastUpdate,
    connectedUsers: connections.size
  }, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, userId } = body;
    
    // Update last update timestamp
    lastUpdate = Date.now().toString();
    
    // Store connection info
    if (userId) {
      connections.set(userId, {
        userId,
        lastSeen: Date.now(),
        type
      });
    }
    
    // Clean up old connections (older than 30 seconds)
    const cutoff = Date.now() - 30000;
    for (const [id, conn] of connections.entries()) {
      if (conn.lastSeen < cutoff) {
        connections.delete(id);
      }
    }
    
    return NextResponse.json({
      success: true,
      lastUpdate,
      connectedUsers: connections.size,
      message: `${type} update received`
    }, { headers: corsHeaders });
    
  } catch (error) {
    console.error('WebSocket API error:', error);
    return NextResponse.json(
      { error: 'Failed to process update' },
      { status: 500, headers: corsHeaders }
    );
  }
}
