import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameSession from '@/lib/models/GameSession';
import QuizResponse from '@/lib/models/QuizResponse';
import { z } from 'zod';

const submitAnswerSchema = z.object({
  sessionId: z.string(),
  questionId: z.number().min(1).max(8),
  question: z.string(),
  options: z.array(z.string()).length(4),
  selectedAnswer: z.number().min(0).max(3),
  correctAnswer: z.number().min(0).max(3)
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = submitAnswerSchema.parse(body);

    const { sessionId, questionId, question, options, selectedAnswer, correctAnswer } = validatedData;

    // Find the game session
    const gameSession = await GameSession.findOne({ sessionId });
    if (!gameSession) {
      return NextResponse.json({
        success: false,
        error: 'SESSION_NOT_FOUND',
        message: 'Game session not found'
      }, { status: 404 });
    }

    // Check if answer already exists for this question
    const existingResponse = await QuizResponse.findOne({ 
      sessionId: gameSession._id, 
      questionId 
    });

    if (existingResponse) {
      // Update existing response
      existingResponse.selectedAnswer = selectedAnswer;
      existingResponse.isCorrect = selectedAnswer === correctAnswer;
      existingResponse.answeredAt = new Date();
      await existingResponse.save();
    } else {
      // Create new response
      const quizResponse = new QuizResponse({
        sessionId: gameSession._id,
        questionId,
        question,
        options,
        selectedAnswer,
        correctAnswer,
        isCorrect: selectedAnswer === correctAnswer
      });

      await quizResponse.save();
    }

    return NextResponse.json({
      success: true,
      data: {
        questionId,
        isCorrect: selectedAnswer === correctAnswer,
        message: 'Answer submitted successfully'
      }
    });

  } catch (error) {
    console.error('Submit answer error:', error);

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
      message: 'Failed to submit answer'
    }, { status: 500 });
  }
}