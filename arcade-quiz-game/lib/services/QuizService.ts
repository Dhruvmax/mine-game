import QuizQuestion, { IQuizQuestion } from '@/lib/models/QuizQuestion';
import QuizResponse, { IQuizResponse } from '@/lib/models/QuizResponse';
import GameSession, { IGameSession } from '@/lib/models/GameSession';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

export class QuizService {
  static async getQuestionsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<IQuizQuestion[]> {
    await connectDB();

    return await QuizQuestion.find({ difficulty }).sort({ questionId: 1 });
  }

  static async submitAnswer(answerData: {
    sessionId: string;
    questionId: number;
    question: string;
    options: string[];
    selectedAnswer: number;
    correctAnswer: number;
  }): Promise<{ response: IQuizResponse; isCorrect: boolean }> {
    await connectDB();

    const session = await GameSession.findOne({ sessionId: answerData.sessionId });
    if (!session) {
      throw new Error('Game session not found');
    }

    // Check if answer already exists
    let response = await QuizResponse.findOne({
      sessionId: session._id,
      questionId: answerData.questionId
    });

    const isCorrect = answerData.selectedAnswer === answerData.correctAnswer;

    if (response) {
      // Update existing response
      response.selectedAnswer = answerData.selectedAnswer;
      response.isCorrect = isCorrect;
      response.answeredAt = new Date();
      await response.save();
    } else {
      // Create new response
      response = new QuizResponse({
        sessionId: session._id,
        questionId: answerData.questionId,
        question: answerData.question,
        options: answerData.options,
        selectedAnswer: answerData.selectedAnswer,
        correctAnswer: answerData.correctAnswer,
        isCorrect
      });
      await response.save();
    }

    return { response, isCorrect };
  }

  static async completeQuiz(sessionId: string, score: number): Promise<{
    session: IGameSession;
    canPlayMine: boolean;
    difficulty: string;
  }> {
    await connectDB();

    const session = await GameSession.findOne({ sessionId }).populate('teamId');
    if (!session) {
      throw new Error('Game session not found');
    }

    const team = session.teamId as any;
    const difficulty = team.difficulty;

    // Calculate mine game eligibility
    const requirements = { easy: 6, medium: 5, hard: 4 };
    const canPlayMine = score >= requirements[difficulty as keyof typeof requirements];

    // Update session
    session.quizScore = score;
    session.canPlayMine = canPlayMine;
    session.status = 'quiz_completed';
    await session.save();

    return { session, canPlayMine, difficulty };
  }

  static async getQuizResponses(sessionId: string): Promise<IQuizResponse[]> {
    await connectDB();

    const session = await GameSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Game session not found');
    }

    return await QuizResponse.find({ sessionId: session._id }).sort({ questionId: 1 });
  }

  static async calculateQuizScore(sessionId: string): Promise<number> {
    await connectDB();

    const session = await GameSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Game session not found');
    }

    const correctAnswers = await QuizResponse.countDocuments({
      sessionId: session._id,
      isCorrect: true
    });

    return correctAnswers;
  }

  static async getQuizStatistics(difficulty?: 'easy' | 'medium' | 'hard'): Promise<{
    totalQuestions: number;
    totalResponses: number;
    averageScore: number;
    questionAccuracy: Array<{
      questionId: number;
      question: string;
      totalAnswers: number;
      correctAnswers: number;
      accuracy: number;
    }>;
  }> {
    await connectDB();

    const matchStage: any = {};
    if (difficulty) {
      // We need to join with sessions and teams to filter by difficulty
      const pipeline = [
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

      const responses = await QuizResponse.aggregate(pipeline);
      const totalResponses = responses.length;
      const correctResponses = responses.filter((r: any) => r.isCorrect).length;

      // Get question accuracy
      const questionStats = await QuizResponse.aggregate([
        ...pipeline,
        {
          $group: {
            _id: '$questionId',
            question: { $first: '$question' },
            totalAnswers: { $sum: 1 },
            correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } }
          }
        },
        {
          $addFields: {
            accuracy: { $multiply: [{ $divide: ['$correctAnswers', '$totalAnswers'] }, 100] }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      return {
        totalQuestions: 8,
        totalResponses,
        averageScore: totalResponses > 0 ? (correctResponses / totalResponses) * 8 : 0,
        questionAccuracy: questionStats.map((stat: any) => ({
          questionId: stat._id,
          question: stat.question,
          totalAnswers: stat.totalAnswers,
          correctAnswers: stat.correctAnswers,
          accuracy: stat.accuracy
        }))
      };
    }

    // General statistics without difficulty filter
    const totalResponses = await QuizResponse.countDocuments();
    const correctResponses = await QuizResponse.countDocuments({ isCorrect: true });

    const questionStats = await QuizResponse.aggregate([
      {
        $group: {
          _id: '$questionId',
          question: { $first: '$question' },
          totalAnswers: { $sum: 1 },
          correctAnswers: { $sum: { $cond: ['$isCorrect', 1, 0] } }
        }
      },
      {
        $addFields: {
          accuracy: { $multiply: [{ $divide: ['$correctAnswers', '$totalAnswers'] }, 100] }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      totalQuestions: 8,
      totalResponses,
      averageScore: totalResponses > 0 ? (correctResponses / totalResponses) * 8 : 0,
      questionAccuracy: questionStats.map((stat: any) => ({
        questionId: stat._id,
        question: stat.question,
        totalAnswers: stat.totalAnswers,
        correctAnswers: stat.correctAnswers,
        accuracy: stat.accuracy
      }))
    };
  }
}