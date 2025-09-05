import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'server', 'data', 'assignments');

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const { date } = params;
    const filePath = path.join(DATA_DIR, `${date}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return NextResponse.json(JSON.parse(data));
    } catch (error) {
      // File doesn't exist, return empty assignments
      return NextResponse.json({ assignments: {} });
    }
  } catch (error) {
    console.error('Error reading assignments:', error);
    return NextResponse.json({ error: 'Failed to read assignments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const { date } = params;
    const body = await request.json();
    const filePath = path.join(DATA_DIR, `${date}.json`);
    
    // Ensure directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Save the assignments
    await fs.writeFile(filePath, JSON.stringify(body, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving assignments:', error);
    return NextResponse.json({ error: 'Failed to save assignments' }, { status: 500 });
  }
}
