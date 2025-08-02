import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import GameSession from '@/lib/models/GameSession';
import Team from '@/lib/models/Team';
import QuizResponse from '@/lib/models/QuizResponse';
import MineGameAction from '@/lib/models/MineGameAction';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h'; // 1h, 24h, 7d, 30d, all
    const difficulty = searchParams.get('difficulty');

    // Calculate time filter
    let timeFilter: any = {};
    const now = new Date();
    
    switch (timeRange) {
      case '1h':
        timeFilter = { createdAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) } };
        break;
      case '24h':
        timeFilter = { createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } };
        break;
      case '7d':
        timeFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case '30d':
        timeFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
        break;
      default:
        timeFilter = {};
    }

    // Add difficulty filter if specified
    let difficultyFilter: any = {};
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      difficultyFilter = { difficulty };
    }

    // Get basic statistics
    const [
      totalTeams,
      totalSessions,
      completedQuizzes,
      completedMineGames,
      avgQuizScore,
      difficultyStats,
      recentActivity,
      questionStats,
      mineGameStats
    ] = await Promise.all([
      // Total teams
      Team.countDocuments({ ...timeFilter, ...difficultyFilter }),
      
      // Total game sessions
      GameSession.countDocuments({ 
        startedAt: timeFilter.createdAt || { $exists: true },
        ...(difficulty ? {} : {}) // We'll filter by team difficulty in aggregation
      }),
      
      // Completed quizzes
      GameSession.countDocuments({ 
        status: { $in: ['quiz_completed', 'mine_completed', 'finished'] },
        startedAt: timeFilter.createdAt || { $exists: true }
      }),
      
      // Completed mine games
      GameSession.countDocuments({ 
        status: { $in: ['mine_completed', 'finished'] },
        startedAt: timeFilter.createdAt || { $exists: true }
      }),
      
      // Average quiz score
      GameSession.aggregate([
        {
          $match: {
            quizScore: { $gt: 0 },
            startedAt: timeFilter.createdAt || { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$quizScore' },
            maxScore: { $max: '$quizScore' },
            minScore: { $min: '$quizScore' }
          }
        }
      ]),
      
      // Difficulty distribution
      Team.aggregate([
        { $match: { ...timeFilter, ...difficultyFilter } },
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent activity (last 10 sessions)
      GameSession.aggregate([
        {
          $lookup: {
            from: 'teams',
            localField: 'teamId',
            foreignField: '_id',
            as: 'team'
          }
        },
        { $unwind: '$team' },
        {
          $match: {
            startedAt: timeFilter.createdAt || { $exists: true },
            ...(difficulty ? { 'team.difficulty': difficulty } : {})
          }
        },
        {
          $project: {
            teamName: '$team.teamName',
            difficulty: '$team.difficulty',
            status: 1,
            quizScore: 1,
            mineScore: 1,
            proScore: 1,
            startedAt: 1,
            completedAt: 1
          }
        },
        { $sort: { startedAt: -1 } },
        { $limit: 10 }
      ]),
      
      // Question statistics
      QuizResponse.aggregate([
        {
          $lookup: {
            from: 'gamesessions',
            localField: 'sessionId',
            foreignField: '_id',
            as: 'session'
          }
        },
        { $unwind: '$session' },
        {
          $lookup: {
            from: 'teams',
            localField: 'session.teamId',
            foreignField: '_id',
            as: 'team'
          }
        },
        { $unwind: '$team' },
        {
          $match: {
            answeredAt: timeFilter.createdAt || { $exists: true },
            ...(difficulty ? { 'team.difficulty': difficulty } : {})
          }
        },
        {
          $group: {
            _id: {
              questionId: '$questionId',
              difficulty: '$team.difficulty'
            },
            totalAnswers: { $sum: 1 },
            correctAnswers: {
              $sum: { $cond: ['$isCorrect', 1, 0] }
            },
            question: { $first: '$question' }
          }
        },
        {
          $addFields: {
            accuracy: {
              $multiply: [
                { $divide: ['$correctAnswers', '$totalAnswers'] },
                100
              ]
            }
          }
        },
        { $sort: { '_id.difficulty': 1, '_id.questionId': 1 } }
      ]),
      
      // Mine game statistics
      MineGameAction.aggregate([
        {
          $lookup: {
            from: 'gamesessions',
            localField: 'sessionId',
            foreignField: '_id',
            as: 'session'
          }
        },
        { $unwind: '$session' },
        {
          $lookup: {
            from: 'teams',
            localField: 'session.teamId',
            foreignField: '_id',
            as: 'team'
          }
        },
        { $unwind: '$team' },
        {
          $match: {
            actionAt: timeFilter.createdAt || { $exists: true },
            ...(difficulty ? { 'team.difficulty': difficulty } : {})
          }
        },
        {
          $group: {
            _id: '$result',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Process results
    const quizStats = avgQuizScore[0] || { avgScore: 0, maxScore: 0, minScore: 0 };
    
    const difficultyDistribution = difficultyStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {});

    const mineResults = mineGameStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, { hit: 0, miss: 0, pro_found: 0 });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalTeams,
          totalSessions,
          completedQuizzes,
          completedMineGames,
          quizCompletionRate: totalSessions > 0 ? (completedQuizzes / totalSessions) * 100 : 0,
          mineGameCompletionRate: completedQuizzes > 0 ? (completedMineGames / completedQuizzes) * 100 : 0
        },
        quizStatistics: {
          averageScore: Math.round(quizStats.avgScore * 100) / 100,
          highestScore: quizStats.maxScore,
          lowestScore: quizStats.minScore,
          questionAccuracy: questionStats
        },
        mineGameStatistics: {
          totalActions: mineResults.hit + mineResults.miss + mineResults.pro_found,
          minesHit: mineResults.hit,
          prosFound: mineResults.pro_found,
          misses: mineResults.miss,
          successRate: (mineResults.hit + mineResults.pro_found) > 0 ? 
            ((mineResults.hit + mineResults.pro_found) / (mineResults.hit + mineResults.miss + mineResults.pro_found)) * 100 : 0
        },
        difficultyDistribution,
        recentActivity,
        filters: {
          timeRange,
          difficulty
        }
      }
    });

  } catch (error) {
    console.error('Analytics fetch error:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch analytics data'
    }, { status: 500 });
  }
}