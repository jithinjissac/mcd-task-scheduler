import { NextRequest, NextResponse } from 'next/server';
import { fileManager } from '@/services/fileManager';

interface RouteParams {
  params: Promise<{ date: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { date } = await params;
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const dayPartData = await fileManager.readJSON('dayparts', date);
    
    return NextResponse.json({
      dayPart: dayPartData?.dayPart || 'Breakfast',
      savedAt: dayPartData?.savedAt,
      date
    });
  } catch (error) {
    console.error('Error getting daypart:', error);
    return NextResponse.json(
      { error: 'Failed to get daypart' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { date } = await params;
    const { dayPart } = await request.json();
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate dayPart
    const validDayParts = ['Breakfast', 'Lunch'];
    if (!validDayParts.includes(dayPart)) {
      return NextResponse.json(
        { error: 'Invalid dayPart. Must be Breakfast or Lunch' },
        { status: 400 }
      );
    }

    const dayPartData = {
      dayPart,
      savedAt: new Date().toISOString(),
      date
    };

    // Save daypart
    const savedDayPart = await fileManager.writeJSON('dayparts', date, dayPartData);

    return NextResponse.json({
      success: true,
      dayPart: savedDayPart.dayPart,
      savedAt: savedDayPart.savedAt,
      date
    });
  } catch (error) {
    console.error('Error saving daypart:', error);
    return NextResponse.json(
      { error: 'Failed to save daypart' },
      { status: 500 }
    );
  }
}
