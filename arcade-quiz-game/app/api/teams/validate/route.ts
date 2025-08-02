import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import GameSession from '@/lib/models/GameSession';
import { z } from 'zod';

const validateSchema = z.object({
  teamName: z.string().min(1).max(50).trim(),
  accessCode: z.enum(['EASY123', 'MED456', 'HARD789', 'techteammode'])
});

const ACCESS_CODE_DIFFICULTY_MAP = {
  'EASY123': 'easy',
  'MED456': 'medium',
  'HARD789': 'hard',
  'techteammode': 'admin'
} as const;

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = validateSchema.parse(body);

    const { teamName, accessCode } = validatedData;

    // Handle admin access code
    if (accessCode === 'techteammode') {
      return NextResponse.json({
        success: true,
        data: {
          isValid: true,
          difficulty: 'admin',
          message: 'Admin access code validated'
        }
      });
    }

    const difficulty = ACCESS_CODE_DIFFICULTY_MAP[accessCode] as 'easy' | 'medium' | 'hard';

    // Check if team name already exists
    const existingTeam = await Team.findOne({ 
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') } 
    });

    if (existingTeam) {
      return NextResponse.json({
        success: false,
        error: 'TEAM_EXISTS',
        message: 'This team name has already been used! Please choose a different team name.'
      }, { status: 400 });
    }

    // Validate access code format (already done by Zod, but double-check)
    const validAccessCodes = ['EASY123', 'MED456', 'HARD789'];
    if (!validAccessCodes.includes(accessCode)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_ACCESS_CODE',
        message: 'Invalid access code! Try again.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        isValid: true,
        difficulty,
        message: 'Team name and access code are valid'
      }
    });

  } catch (error) {
    console.error('Team validation error:', error);

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
      message: 'Failed to validate team credentials'
    }, { status: 500 });
  }
}