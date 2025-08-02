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
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'totalScore'; // totalScore, quizScore, mineScore, createdAt

    // Build query
    let matchQuery: any = {};
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      matchQuery = { 'team.difficulty': difficulty };
    }

    // Aggregate pipeline to get leaderboard data
    const pipeline = [
      {
        $lookup: {
          from: 'teams',
          localField: 'teamId',
          foreignField: '_id',
          as: 'team'
        }
      },
      {
        $unwind: '$team'
      },
      {
        $match: matchQuery
      },
      {
        $lookup: {
          from: 'quizresponses',
          localField: '_id',
          foreignField: 'sessionId',
          as: 'quizResponses'
        }
      },
      {
        $lookup: {
          from: 'minegameactions',
          localField: '_id',
          foreignField: 'sessionId',
          as: 'mineActions'
        }
      },
      {
        $addFields: {
          correctAnswers: {
            $size: {
              $filter: {
                input: '$quizResponses',
                cond: { $eq: ['$$this.isCorrect', true] }
              }
            }
          },
          totalQuestions: { $size: '$quizResponses' },
          minesFound: {
            $size: {
              $filter: {
                input: '$mineActions',
                cond: { $eq: ['$$this.result', 'hit'] }
              }
            }
          },
          prosFound: {
            $size: {
              $filter: {
                input: '$mineActions',
                cond: { $eq: ['$$this.result', 'pro_found'] }
              }
            }
          },
          totalMineActions: { $size: '$mineActions' },
          grandTotal: {
            $add: [
              { $multiply: ['$quizScore', 10] },
              '$mineScore',
              '$proScore'
            ]
          }
        }
      },
      {
        $project: {
          teamName: '$team.teamName',
          difficulty: '$team.difficulty',
          sessionId: 1,
          status: 1,
          startedAt: 1,
          completedAt: 1,
          quizScore: 1,
          mineScore: 1,
          proScore: 1,
          totalScore: 1,
          grandTotal: 1,
          canPlayMine: 1,
          correctAnswers: 1,
          totalQuestions: 1,
          quizAccuracy: {
            $cond: {
              if: { $gt: ['$totalQuestions', 0] },
              then: { $multiply: [{ $divide: ['$correctAnswers', '$totalQuestions'] }, 100] },
              else: 0
            }
          },
          minesFound: 1,
          prosFound: 1,
          totalMineActions: 1,
          mineSuccessRate: {
            $cond: {
              if: { $gt: ['$totalMineActions', 0] },
              then: { $multiply: [{ $divide: [{ $add: ['$minesFound', '$prosFound'] }, '$totalMineActions'] }, 100] },
              else: 0
            }
          }
        }
      },
      {
        $sort: {
          [sortBy]: -1,
          startedAt: -1
        }
      },
      {
        $limit: limit
      }
    ];

    const leaderboard = await GameSession.aggregate(pipeline);

    // Get summary statistics
    const totalTeams = await Team.countDocuments();
    const totalSessions = await GameSession.countDocuments();
    const completedSessions = await GameSession.countDocuments({ 
      status: { $in: ['mine_completed', 'finished'] } 
    });

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        summary: {
          totalTeams,
          totalSessions,
          completedSessions,
          completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
        },
        filters: {
          difficulty,
          sortBy,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Leaderboard fetch error:', error);

    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch leaderboard data'
    }, { status: 500 });
  }
}