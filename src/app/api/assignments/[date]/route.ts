import { NextRequest, NextResponse } from 'next/server';
import { MemoryStorage } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const data = await MemoryStorage.getAssignment(date);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading assignments:', error);
    return NextResponse.json({ error: 'Failed to read assignments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const body = await request.json();
    
    await MemoryStorage.saveAssignment(date, body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving assignments:', error);
    return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 });
  }
}
