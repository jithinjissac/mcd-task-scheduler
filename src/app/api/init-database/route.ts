import { NextResponse } from 'next/server';
import initializeDatabase from '@/lib/initDatabase';

export async function POST() {
  try {
    const success = await initializeDatabase();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Database initialized successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Database initialization failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Database init error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database initialization error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
