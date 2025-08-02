import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/lib/models/Team';
import { ResponseHelper } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get all teams with their completion data
    const teams = await Team.find({})
      .sort({ completedAt: -1, createdAt: -1 })
      .select({
        teamName: 1,
        difficulty: 1,
        accessCode: 1,
        questionsCorrect: 1,
        totalQuestions: 1,
        quizScore: 1,
        mineScore: 1,
        proScore: 1,
        totalScore: 1,
        gameCompleted: 1,
        createdAt: 1,
        completedAt: 1
      });

    // Format the data for easy viewing
    const formattedTeams = teams.map(team => ({
      teamName: team.teamName,
      difficulty: team.difficulty,
      accessCode: team.accessCode,
      questionsCorrect: team.questionsCorrect,
      totalQuestions: team.totalQuestions,
      quizScore: team.quizScore,
      mineScore: team.mineScore,
      proScore: team.proScore,
      totalScore: team.totalScore,
      gameCompleted: team.gameCompleted,
      registeredAt: team.createdAt,
      completedAt: team.completedAt || null,
      // Additional calculated fields
      quizAccuracy: team.totalQuestions > 0 ? 
        Math.round((team.questionsCorrect / team.totalQuestions) * 100) : 0,
      status: team.gameCompleted ? 'Completed' : 'In Progress'
    }));

    // Separate completed and in-progress teams
    const completedTeams = formattedTeams.filter(team => team.gameCompleted);
    const inProgressTeams = formattedTeams.filter(team => !team.gameCompleted);

    return ResponseHelper.success({
      totalTeams: teams.length,
      completedTeams: completedTeams.length,
      inProgressTeams: inProgressTeams.length,
      teams: formattedTeams,
      completedOnly: completedTeams,
      inProgressOnly: inProgressTeams
    });

  } catch (error) {
    console.error('Get teams error:', error);
    return ResponseHelper.error(
      'FETCH_TEAMS_FAILED',
      'Failed to fetch teams data',
      500
    );
  }
}

// Get specific team by name or ID
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { teamName, teamId } = await request.json();

    let team;
    if (teamId) {
      team = await Team.findById(teamId);
    } else if (teamName) {
      team = await Team.findOne({ teamName });
    } else {
      return ResponseHelper.error(
        'INVALID_REQUEST',
        'Please provide either teamName or teamId',
        400
      );
    }

    if (!team) {
      return ResponseHelper.error(
        'TEAM_NOT_FOUND',
        'Team not found',
        404
      );
    }

    const formattedTeam = {
      teamName: team.teamName,
      difficulty: team.difficulty,
      accessCode: team.accessCode,
      questionsCorrect: team.questionsCorrect,
      totalQuestions: team.totalQuestions,
      quizScore: team.quizScore,
      mineScore: team.mineScore,
      proScore: team.proScore,
      totalScore: team.totalScore,
      gameCompleted: team.gameCompleted,
      registeredAt: team.createdAt,
      completedAt: team.completedAt || null,
      quizAccuracy: team.totalQuestions > 0 ? 
        Math.round((team.questionsCorrect / team.totalQuestions) * 100) : 0,
      status: team.gameCompleted ? 'Completed' : 'In Progress'
    };

    return ResponseHelper.success(formattedTeam);

  } catch (error) {
    console.error('Get specific team error:', error);
    return ResponseHelper.error(
      'FETCH_TEAM_FAILED',
      'Failed to fetch team data',
      500
    );
  }
}