import { Schema, model, Document, Types } from 'mongoose';

export interface IComment extends Document {
  post_id: Types.ObjectId;
  recipe_id?: string;
  author_id: string;
  text: string;
  video_url?: string;
  status: 'pending' | 'published' | 'removed';
  created_at: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    post_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Post',
      index: true,
    },
    recipe_id: {
      type: String,
      default: undefined,
    },
    author_id: {
      type: String,
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    video_url: {
      type: String,
      default: undefined,
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'removed'],
      default: 'pending',
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

export const Comment = model<IComment>('Comment', CommentSchema);
