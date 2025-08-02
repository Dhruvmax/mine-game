import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameSession from '@/lib/models/GameSession';
import MineGameAction from '@/lib/models/MineGameAction';
import Team from '@/lib/models/Team';
import { z } from 'zod';

const completeMineGameSchema = z.object({
  sessionId: z.string(),
  finalMineScore: z.number().min(0),
  finalProScore: z.number().min(0)
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = completeMineGameSchema.parse(body);

    const { sessionId, finalMineScore, finalProScore } = validatedData;

    // Find the game session
    const gameSession = await GameSession.findOne({ sessionId }).populate('teamId');
    if (!gameSession) {
      return NextResponse.json({
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Game session not found'
      }, { status: 404 });
    }

    // Update final scores (use the provided scores as they might be more accurate)
    gameSession.mineScore = finalMineScore;
    gameSession.proScore = finalProScore;
    gameSession.status = 'mine_completed';
    gameSession.completedAt = new Date();

    await gameSession.save();

    // Update team with final completion data
    const team = gameSession.teamId as any;
    const totalScore = (gameSession.quizScore * 10) + finalMineScore + finalProScore;
    
    await Team.findByIdAndUpdate(team._id, {
      gameCompleted: true,
      mineScore: finalMineScore,
      proScore: finalProScore,
      totalScore: totalScore,
      completedAt: new Date(),
      updatedAt: new Date()
    });

    // Get mine game statistics
    const mineActions = await MineGameAction.find({ sessionId: gameSession._id });
    const minesFound = mineActions.filter(action => action.result === 'hit').length;
    const prosFound = mineActions.filter(action => action.result === 'pro_found').length;
    const totalActions = mineActions.length;

    return NextResponse.json({
      success: true,
      data: {
        finalMineScore,
        finalProScore,
        totalScore: finalMineScore + finalProScore,
        quizScore: gameSession.quizScore,
        grandTotal: (gameSession.quizScore * 10) + finalMineScore + finalProScore,
        statistics: {
          minesFound,
          prosFound,
          totalActions,
          completedAt: gameSession.completedAt
        },
        message: 'Mine game completed successfully'
      }
    });

  } catch (error) {
    console.error('Complete mine game error:', error);

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
      message: 'Failed to complete mine game'
    }, { status: 500 });
  }
}