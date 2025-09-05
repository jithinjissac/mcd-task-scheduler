import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'server', 'data', 'schedules');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const filePath = path.join(DATA_DIR, `${date}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return NextResponse.json(JSON.parse(data));
    } catch (error) {
      // File doesn't exist, return empty schedule
      return NextResponse.json({ employees: [] });
    }
  } catch (error) {
    console.error('Error reading schedules:', error);
    return NextResponse.json({ error: 'Failed to read schedules' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const body = await request.json();
    const filePath = path.join(DATA_DIR, `${date}.json`);
    
    // Ensure directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Save the schedule
    await fs.writeFile(filePath, JSON.stringify(body, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving schedules:', error);
    return NextResponse.json({ error: 'Failed to save schedules' }, { status: 500 });
  }
}
