import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QuizQuestion from '@/lib/models/QuizQuestion';
import { z } from 'zod';

const createQuestionSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionId: z.number().min(1).max(8),
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3)
});

const updateQuestionSchema = z.object({
  _id: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questionId: z.number().min(1).max(8),
  question: z.string().min(1),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3)
});

// GET - Fetch all questions or by difficulty
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const difficulty = searchParams.get('difficulty');

    let query = {};
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = { difficulty };
    }

    const questions = await QuizQuestion.find(query).sort({ difficulty: 1, questionId: 1 });

    return NextResponse.json({
      success: true,
      data: {
        questions,
        total: questions.length
      }
    });

  } catch (error) {
    console.error('Fetch questions error:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch questions'
    }, { status: 500 });
  }
}

// POST - Create new question
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = createQuestionSchema.parse(body);

    // Check if question with same difficulty and questionId already exists
    const existingQuestion = await QuizQuestion.findOne({
      difficulty: validatedData.difficulty,
      questionId: validatedData.questionId
    });

    if (existingQuestion) {
      return NextResponse.json({
        success: false,
        error: 'QUESTION_EXISTS',
        message: `Question ${validatedData.questionId} already exists for ${validatedData.difficulty} difficulty`
      }, { status: 400 });
    }

    const question = new QuizQuestion(validatedData);
    await question.save();

    return NextResponse.json({
      success: true,
      data: {
        question,
        message: 'Question created successfully'
      }
    });

  } catch (error) {
    console.error('Create question error:', error);

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
      message: 'Failed to create question'
    }, { status: 500 });
  }
}

// PUT - Update existing question
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = updateQuestionSchema.parse(body);

    const { _id, ...updateData } = validatedData;

    const question = await QuizQuestion.findByIdAndUpdate(
      _id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'QUESTION_NOT_FOUND',
        message: 'Question not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        question,
        message: 'Question updated successfully'
      }
    });

  } catch (error) {
    console.error('Update question error:', error);

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
      message: 'Failed to update question'
    }, { status: 500 });
  }
}

// DELETE - Delete question
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_ID',
        message: 'Question ID is required'
      }, { status: 400 });
    }

    const question = await QuizQuestion.findByIdAndDelete(questionId);

    if (!question) {
      return NextResponse.json({
        success: false,
        error: 'QUESTION_NOT_FOUND',
        message: 'Question not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Question deleted successfully'
      }
    });

  } catch (error) {
    console.error('Delete question error:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete question'
    }, { status: 500 });
  }
}