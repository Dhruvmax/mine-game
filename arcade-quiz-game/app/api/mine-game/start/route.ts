import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameSession from '@/lib/models/GameSession';
import { z } from 'zod';

const startMineGameSchema = z.object({
  sessionId: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard'])
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = startMineGameSchema.parse(body);

    const { sessionId, difficulty } = validatedData;

    // Find the game session
    const gameSession = await GameSession.findOne({ sessionId });
    if (!gameSession) {
      return NextResponse.json({
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Game session not found'
      }, { status: 404 });
    }

    // Check if user is eligible for mine game
    if (!gameSession.canPlayMine) {
      return NextResponse.json({
        success: false,
        error: 'NOT_ELIGIBLE',
        message: 'Quiz score not sufficient for mine game'
      }, { status: 403 });
    }

    // Get game configuration based on difficulty
    const gameConfig = {
      easy: { attempts: 2, mines: 5, pros: 2, blanks: 2 },
      medium: { attempts: 3, mines: 4, pros: 3, blanks: 2 },
      hard: { attempts: 4, mines: 3, pros: 4, blanks: 2 }
    };

    const config = gameConfig[difficulty];

    // Update game session status
    if (gameSession.status === 'quiz_completed') {
      gameSession.status = 'active';
      await gameSession.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        config,
        difficulty,
        message: 'Mine game started successfully'
      }
    });

  } catch (error) {
    console.error('Start mine game error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to start mine game'
    }, { status: 500 });
  }
}