import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameSession from '@/lib/models/GameSession';
import QuizResponse from '@/lib/models/QuizResponse';
import Team from '@/lib/models/Team';
import { z } from 'zod';

const completeQuizSchema = z.object({
  sessionId: z.string(),
  score: z.number().min(0).max(8),
  totalQuestions: z.number().min(1).max(8)
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = completeQuizSchema.parse(body);

    const { sessionId, score, totalQuestions } = validatedData;

    // Find the game session
    const gameSession = await GameSession.findOne({ sessionId }).populate('teamId');
    if (!gameSession) {
      return NextResponse.json({
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Game session not found'
      }, { status: 404 });
    }

    // Get team difficulty
    const team = gameSession.teamId as any;
    const difficulty = team.difficulty;

    // Calculate mine game eligibility based on difficulty requirements
    const requirements = { easy: 6, medium: 5, hard: 4 };
    const canPlayMine = score >= requirements[difficulty as keyof typeof requirements];

    // Update game session
    gameSession.quizScore = score;
    gameSession.canPlayMine = canPlayMine;
    gameSession.status = 'quiz_completed';
    await gameSession.save();

    // Verify score by counting correct answers
    const correctAnswers = await QuizResponse.countDocuments({
      sessionId: gameSession._id,
      isCorrect: true
    });

    // Update team with quiz completion data
    await Team.findByIdAndUpdate(team._id, {
      questionsCorrect: correctAnswers,
      totalQuestions: totalQuestions,
      quizScore: score,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      data: {
        score,
        totalQuestions,
        canPlayMine,
        difficulty,
        verifiedScore: correctAnswers,
        requirements: requirements[difficulty as keyof typeof requirements],
        message: canPlayMine ? 'Quiz completed! Mine game unlocked!' : 'Quiz completed! Score not sufficient for mine game.'
      }
    });

  } catch (error) {
    console.error('Complete quiz error:', error);

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
      message: 'Failed to complete quiz'
    }, { status: 500 });
  }
}