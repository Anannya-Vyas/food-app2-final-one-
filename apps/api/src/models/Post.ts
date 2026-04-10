import { Schema, model, Document } from 'mongoose';

export interface IMediaItem {
  type: 'image' | 'video';
  url: string;
  size_bytes: number;
}

export interface IPost extends Document {
  author_id: string;
  caption: string;
  media: IMediaItem[];
  recipe_tags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  status: 'pending' | 'published' | 'removed';
  created_at: Date;
  updated_at: Date;
}

const MediaItemSchema = new Schema<IMediaItem>(
  {
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    size_bytes: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const PostSchema = new Schema<IPost>(
  {
    author_id: {
      type: String,
      required: true,
      index: true,
    },
    caption: {
      type: String,
      required: true,
      maxlength: 500,
    },
    media: {
      type: [MediaItemSchema],
      default: [],
    },
    recipe_tags: {
      type: [String],
      default: [],
    },
    likes_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    shares_count: {
      type: Number,
      default: 0,
      min: 0,
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
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export const Post = model<IPost>('Post', PostSchema);
