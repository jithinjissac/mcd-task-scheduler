import { NextRequest, NextResponse } from 'next/server';
import { fileManager } from '@/lib/fileManager';

export async function POST(request: NextRequest) {
  try {
    const backupPath = await fileManager.backup();
    
    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backupPath
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
