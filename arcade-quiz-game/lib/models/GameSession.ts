import mongoose, { Schema, Document } from 'mongoose';

export interface IGameSession extends Document {
  teamId: mongoose.Types.ObjectId;
  sessionId: string;
  status: 'active' | 'quiz_completed' | 'mine_completed' | 'finished';
  startedAt: Date;
  completedAt?: Date;
  quizScore: number;
  mineScore: number;
  proScore: number;
  totalScore: number;
  canPlayMine: boolean;
}

const GameSessionSchema = new Schema<IGameSession>({
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'quiz_completed', 'mine_completed', 'finished'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  quizScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 8
  },
  mineScore: {
    type: Number,
    default: 0,
    min: 0
  },
  proScore: {
    type: Number,
    default: 0,
    min: 0
  },
  totalScore: {
    type: Number,
    default: 0,
    min: 0
  },
  canPlayMine: {
    type: Boolean,
    default: false
  }
});

GameSessionSchema.pre('save', function(next) {
  this.totalScore = this.quizScore * 10 + this.mineScore + this.proScore;
  next();
});

export default mongoose.models.GameSession || mongoose.model<IGameSession>('GameSession', GameSessionSchema);