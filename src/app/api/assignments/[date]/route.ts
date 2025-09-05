import { NextRequest, NextResponse } from 'next/server';
import { fileManager } from '@/lib/fileManager';

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const date = params.date;
    
    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const assignmentData = await fileManager.readJSON('assignments', date);
    
    return NextResponse.json({
      assignments: assignmentData?.assignments || {},
      savedAt: assignmentData?.savedAt,
      dayPart: assignmentData?.dayPart,
      lastUpdated: assignmentData?.lastUpdated
    });
  } catch (error) {
    console.error('Error getting assignments:', error);
    return NextResponse.json(
      { error: 'Failed to get assignments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const date = params.date;
    const { assignments, dayPart } = await request.json();
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate assignments structure
    if (typeof assignments !== 'object') {
      return NextResponse.json(
        { error: 'Assignments must be an object' },
        { status: 400 }
      );
    }

    const assignmentData = {
      assignments,
      savedAt: new Date().toISOString(),
      dayPart: dayPart || 'Breakfast'
    };

    // Save assignments
    const savedAssignments = await fileManager.writeJSON('assignments', date, assignmentData);

    return NextResponse.json({
      success: true,
      assignments: savedAssignments.assignments,
      dayPart: savedAssignments.dayPart,
      savedAt: savedAssignments.savedAt
    });
  } catch (error) {
    console.error('Error saving assignments:', error);
    return NextResponse.json(
      { error: 'Failed to save assignments' },
      { status: 500 }
    );
  }
}
