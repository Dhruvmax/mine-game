import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import GameSession from '@/lib/models/GameSession';
import { z } from 'zod';

const registerSchema = z.object({
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
    const validatedData = registerSchema.parse(body);

    const { teamName, accessCode } = validatedData;

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

    // Handle admin access code
    if (accessCode === 'techteammode') {
      return NextResponse.json({
        success: true,
        data: {
          teamId: 'admin',
          sessionId: 'admin',
          difficulty: 'admin',
          message: 'Admin access granted'
        }
      });
    }

    const difficulty = ACCESS_CODE_DIFFICULTY_MAP[accessCode] as 'easy' | 'medium' | 'hard';

    // Create new team
    const team = new Team({
      teamName,
      accessCode,
      difficulty
    });

    await team.save();

    // Create game session
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const gameSession = new GameSession({
      teamId: team._id,
      sessionId,
      status: 'active'
    });

    await gameSession.save();

    return NextResponse.json({
      success: true,
      data: {
        teamId: team._id.toString(),
        sessionId,
        difficulty,
        message: 'Team registered successfully'
      }
    });

  } catch (error) {
    console.error('Team registration error:', error);

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
      message: 'Failed to register team'
    }, { status: 500 });
  }
}