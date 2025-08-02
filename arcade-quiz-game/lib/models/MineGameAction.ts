import mongoose, { Schema, Document } from 'mongoose';

export interface IMineGameAction extends Document {
  sessionId: mongoose.Types.ObjectId;
  cellX: number;
  cellY: number;
  cellType: 'mine' | 'pro' | 'blank';
  action: 'reveal' | 'flag';
  result: 'hit' | 'miss' | 'pro_found';
  actionAt: Date;
}

const MineGameActionSchema = new Schema<IMineGameAction>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'GameSession',
    required: true
  },
  cellX: {
    type: Number,
    required: true,
    min: 0,
    max: 2
  },
  cellY: {
    type: Number,
    required: true,
    min: 0,
    max: 2
  },
  cellType: {
    type: String,
    required: true,
    enum: ['mine', 'pro', 'blank']
  },
  action: {
    type: String,
    required: true,
    enum: ['reveal', 'flag'],
    default: 'reveal'
  },
  result: {
    type: String,
    required: true,
    enum: ['hit', 'miss', 'pro_found']
  },
  actionAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.MineGameAction || mongoose.model<IMineGameAction>('MineGameAction', MineGameActionSchema);