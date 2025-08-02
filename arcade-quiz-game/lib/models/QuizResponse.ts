import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizResponse extends Document {
  sessionId: mongoose.Types.ObjectId;
  questionId: number;
  question: string;
  options: string[];
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  answeredAt: Date;
}

const QuizResponseSchema = new Schema<IQuizResponse>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'GameSession',
    required: true
  },
  questionId: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  question: {
    type: String,
    required: true
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
  selectedAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  correctAnswer: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
});

QuizResponseSchema.pre('save', function(next) {
  this.isCorrect = this.selectedAnswer === this.correctAnswer;
  next();
});

export default mongoose.models.QuizResponse || mongoose.model<IQuizResponse>('QuizResponse', QuizResponseSchema);