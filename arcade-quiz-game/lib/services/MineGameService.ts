import MineGameAction, { IMineGameAction } from '@/lib/models/MineGameAction';
import GameSession, { IGameSession } from '@/lib/models/GameSession';
import connectDB from '@/lib/mongodb';

export class MineGameService {
  static async startMineGame(sessionId: string): Promise<{
    session: IGameSession;
    config: {
      attempts: number;
      mines: number;
      pros: number;
      blanks: number;
    };
  }> {
    await connectDB();

    const session = await GameSession.findOne({ sessionId }).populate('teamId');
    if (!session) {
      throw new Error('Game session not found');
    }

    if (!session.canPlayMine) {
      throw new Error('Not eligible for mine game');
    }

    const team = session.teamId as any;
    const difficulty = team.difficulty;

    // Get game configuration
    const gameConfigs = {
      easy: { attempts: 2, mines: 5, pros: 2, blanks: 2 },
      medium: { attempts: 3, mines: 4, pros: 3, blanks: 2 },
      hard: { attempts: 4, mines: 3, pros: 4, blanks: 2 }
    };

    const config = gameConfigs[difficulty as keyof typeof gameConfigs];

    return { session, config };
  }

  static async recordAction(actionData: {
    sessionId: string;
    cellX: number;
    cellY: number;
    cellType: 'mine' | 'pro' | 'blank';
    action?: 'reveal' | 'flag';
  }): Promise<{
    action: IMineGameAction;
    scoreIncrease: number;
    currentMineScore: number;
    currentProScore: number;
  }> {
    await connectDB();

    const session = await GameSession.findOne({ sessionId: actionData.sessionId });
    if (!session) {
      throw new Error('Game session not found');
    }

    if (!session.canPlayMine) {
      throw new Error('Not eligible for mine game');
    }

    // Determine result and score
    let result: 'hit' | 'miss' | 'pro_found';
    let scoreIncrease = 0;

    if (actionData.cellType === 'mine') {
      result = 'hit';
      scoreIncrease = 100;
      session.mineScore += scoreIncrease;
    } else if (actionData.cellType === 'pro') {
      result = 'pro_found';
      scoreIncrease = 200;
      session.proScore += scoreIncrease;
    } else {
      result = 'miss';
      scoreIncrease = 0;
    }

    // Save action
    const action = new MineGameAction({
      sessionId: session._id,
      cellX: actionData.cellX,
      cellY: actionData.cellY,
      cellType: actionData.cellType,
      action: actionData.action || 'reveal',
      result
    });

    await action.save();
    await session.save();

    return {
      action,
      scoreIncrease,
      currentMineScore: session.mineScore,
      currentProScore: session.proScore
    };
  }

  static async completeMineGame(sessionId: string, finalScores: {
    mineScore: number;
    proScore: number;
  }): Promise<{
    session: IGameSession;
    statistics: {
      minesFound: number;
      prosFound: number;
      totalActions: number;
      completedAt: Date;
    };
  }> {
    await connectDB();

    const session = await GameSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Game session not found');
    }

    // Update final scores
    session.mineScore = finalScores.mineScore;
    session.proScore = finalScores.proScore;
    session.status = 'mine_completed';
    session.completedAt = new Date();

    await session.save();

    // Get statistics
    const actions = await MineGameAction.find({ sessionId: session._id });
    const minesFound = actions.filter(action => action.result === 'hit').length;
    const prosFound = actions.filter(action => action.result === 'pro_found').length;

    return {
      session,
      statistics: {
        minesFound,
        prosFound,
        totalActions: actions.length,
        completedAt: session.completedAt!
      }
    };
  }

  static async getMineGameActions(sessionId: string): Promise<IMineGameAction[]> {
    await connectDB();

    const session = await GameSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Game session not found');
    }

    return await MineGameAction.find({ sessionId: session._id }).sort({ actionAt: 1 });
  }

  static async getMineGameStatistics(difficulty?: 'easy' | 'medium' | 'hard'): Promise<{
    totalActions: number;
    minesHit: number;
    prosFound: number;
    misses: number;
    successRate: number;
    averageMineScore: number;
    averageProScore: number;
  }> {
    await connectDB();

    let pipeline: any[] = [];

    if (difficulty) {
      pipeline = [
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
        { $match: { 'team.difficulty': difficulty } }
      ];
    }

    const [actionStats, scoreStats] = await Promise.all([
      // Action statistics
      MineGameAction.aggregate([
        ...pipeline,
        {
          $group: {
            _id: '$result',
            count: { $sum: 1 }
          }
        }
      ]),

      // Score statistics
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
            status: { $in: ['mine_completed', 'finished'] },
            ...(difficulty ? { 'team.difficulty': difficulty } : {})
          }
        },
        {
          $group: {
            _id: null,
            avgMineScore: { $avg: '$mineScore' },
            avgProScore: { $avg: '$proScore' }
          }
        }
      ])
    ]);

    const results = actionStats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, { hit: 0, miss: 0, pro_found: 0 });

    const scores = scoreStats[0] || { avgMineScore: 0, avgProScore: 0 };

    const totalActions = results.hit + results.miss + results.pro_found;
    const successfulActions = results.hit + results.pro_found;

    return {
      totalActions,
      minesHit: results.hit,
      prosFound: results.pro_found,
      misses: results.miss,
      successRate: totalActions > 0 ? (successfulActions / totalActions) * 100 : 0,
      averageMineScore: Math.round(scores.avgMineScore * 100) / 100,
      averageProScore: Math.round(scores.avgProScore * 100) / 100
    };
  }
}