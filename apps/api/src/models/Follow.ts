import { Schema, model, Document } from 'mongoose';

export interface IFollow extends Document {
  follower_id: string;
  following_id: string;
  created_at: Date;
}

const FollowSchema = new Schema<IFollow>(
  {
    follower_id: {
      type: String,
      required: true,
      index: true,
    },
    following_id: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

// Compound unique index to prevent duplicate follows
FollowSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });

export const Follow = model<IFollow>('Follow', FollowSchema);
