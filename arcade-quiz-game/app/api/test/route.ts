import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'API is working!',
      env: {
        mongoUri: process.env.MONGODB_URI ? 'configured' : 'not configured',
        mongoDb: process.env.MONGODB_DB_NAME ? 'configured' : 'not configured',
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}