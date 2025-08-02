import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion extends Document {
  difficulty: 'easy' | 'medium' | 'hard';
  questionId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  difficulty: {
    type: String,
    required: true,
    enum: ['easy', 'medium', 'hard']
  },
  questionId: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length === 4;
      },
      message: 'Options array must contain exactly 4 items'
    }
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

QuizQuestionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Compound index for difficulty and questionId
QuizQuestionSchema.index({ difficulty: 1, questionId: 1 }, { unique: true });

export default mongoose.models.QuizQuestion || mongoose.model<IQuizQuestion>('QuizQuestion', QuizQuestionSchema);