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

    const scheduleData = await fileManager.readJSON('schedules', date);
    
    return NextResponse.json({
      employees: scheduleData?.employees || [],
      uploadedAt: scheduleData?.uploadedAt,
      fileName: scheduleData?.fileName,
      date: scheduleData?.date || date
    });
  } catch (error) {
    console.error('Error getting schedule:', error);
    return NextResponse.json(
      { error: 'Failed to get schedule' },
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
    const { employees, fileName } = await request.json();
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate employees array
    if (!Array.isArray(employees)) {
      return NextResponse.json(
        { error: 'Employees must be an array' },
        { status: 400 }
      );
    }

    const scheduleData = {
      employees,
      uploadedAt: new Date().toISOString(),
      fileName: fileName || 'unknown.csv',
      date
    };

    // Save schedule
    const savedSchedule = await fileManager.writeJSON('schedules', date, scheduleData);

    return NextResponse.json({
      success: true,
      employees: savedSchedule.employees,
      uploadedAt: savedSchedule.uploadedAt,
      fileName: savedSchedule.fileName,
      date: savedSchedule.date
    });
  } catch (error) {
    console.error('Error saving schedule:', error);
    return NextResponse.json(
      { error: 'Failed to save schedule' },
      { status: 500 }
    );
  }
}
