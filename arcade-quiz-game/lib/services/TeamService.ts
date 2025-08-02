import Team, { ITeam } from '@/lib/models/Team';
import GameSession, { IGameSession } from '@/lib/models/GameSession';
import connectDB from '@/lib/mongodb';

export class TeamService {
  static async createTeam(teamData: {
    teamName: string;
    accessCode: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }): Promise<{ team: ITeam; session: IGameSession }> {
    await connectDB();

    // Check if team name already exists (case-insensitive)
    const existingTeam = await Team.findOne({
      teamName: { $regex: new RegExp(`^${teamData.teamName}$`, 'i') }
    });

    if (existingTeam) {
      throw new Error('Team name already exists');
    }

    // Create team
    const team = new Team(teamData);
    await team.save();

    // Create game session
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = new GameSession({
      teamId: team._id,
      sessionId,
      status: 'active'
    });
    await session.save();

    return { team, session };
  }

  static async validateTeamName(teamName: string): Promise<boolean> {
    await connectDB();

    const existingTeam = await Team.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') }
    });

    return !existingTeam;
  }

  static async getTeamByName(teamName: string): Promise<ITeam | null> {
    await connectDB();

    return await Team.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, 'i') }
    });
  }

  static async getTeamById(teamId: string): Promise<ITeam | null> {
    await connectDB();

    return await Team.findById(teamId);
  }

  static async getAllTeams(filters?: {
    difficulty?: 'easy' | 'medium' | 'hard';
    isActive?: boolean;
  }): Promise<ITeam[]> {
    await connectDB();

    const query: any = {};
    if (filters?.difficulty) {
      query.difficulty = filters.difficulty;
    }
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return await Team.find(query).sort({ createdAt: -1 });
  }

  static async deactivateTeam(teamId: string): Promise<ITeam | null> {
    await connectDB();

    return await Team.findByIdAndUpdate(
      teamId,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );
  }
}