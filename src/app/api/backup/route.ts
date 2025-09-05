import { NextRequest, NextResponse } from 'next/server';
import { cloudFileManager } from '@/services/cloudFileManager';

export async function POST(request: NextRequest) {
  try {
    const backupData = await cloudFileManager.backup();
    
    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backupData
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      { error: 'Failed to create backup' },
      { status: 500 }
    );
  }
}
