import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameSession from '@/lib/models/GameSession';
import MineGameAction from '@/lib/models/MineGameAction';
import { z } from 'zod';

const mineGameActionSchema = z.object({
  sessionId: z.string(),
  cellX: z.number().min(0).max(2),
  cellY: z.number().min(0).max(2),
  cellType: z.enum(['mine', 'pro', 'blank']),
  action: z.enum(['reveal', 'flag']).default('reveal')
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = mineGameActionSchema.parse(body);

    const { sessionId, cellX, cellY, cellType, action } = validatedData;

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
        message: 'Not eligible for mine game'
      }, { status: 403 });
    }

    // Determine result based on cell type
    let result: 'hit' | 'miss' | 'pro_found';
    let scoreIncrease = 0;

    if (cellType === 'mine') {
      result = 'hit';
      scoreIncrease = 100;
      gameSession.mineScore += scoreIncrease;
    } else if (cellType === 'pro') {
      result = 'pro_found';
      scoreIncrease = 200;
      gameSession.proScore += scoreIncrease;
    } else {
      result = 'miss';
      scoreIncrease = 0;
    }

    // Save the action
    const mineGameAction = new MineGameAction({
      sessionId: gameSession._id,
      cellX,
      cellY,
      cellType,
      action,
      result
    });

    await mineGameAction.save();

    // Update game session scores
    await gameSession.save();

    return NextResponse.json({
      success: true,
      data: {
        cellX,
        cellY,
        cellType,
        result,
        scoreIncrease,
        currentMineScore: gameSession.mineScore,
        currentProScore: gameSession.proScore,
        totalScore: gameSession.mineScore + gameSession.proScore,
        message: `Cell revealed: ${cellType}`
      }
    });

  } catch (error) {
    console.error('Mine game action error:', error);

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
      message: 'Failed to record mine game action'
    }, { status: 500 });
  }
}