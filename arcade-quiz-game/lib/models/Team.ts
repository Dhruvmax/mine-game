import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  teamName: string;
  accessCode: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  // Game completion data
  gameCompleted: boolean;
  questionsCorrect: number;
  totalQuestions: number;
  quizScore: number;
  mineScore: number;
  proScore: number;
  totalScore: number;
  completedAt?: Date;
}

const TeamSchema = new Schema<ITeam>({
  teamName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  accessCode: {
    type: String,
    required: true,
    enum: ['EASY123', 'MED456', 'HARD789', 'techteammode']
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Game completion data
  gameCompleted: {
    type: Boolean,
    default: false
  },
  questionsCorrect: {
    type: Number,
    default: 0,
    min: 0,
    max: 8
  },
  totalQuestions: {
    type: Number,
    default: 8,
    min: 1,
    max: 8
  },
  quizScore: {
    type: Number,
    default: 0,
    min: 0
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
  completedAt: {
    type: Date
  }
});

TeamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);