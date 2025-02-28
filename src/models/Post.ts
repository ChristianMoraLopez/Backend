import mongoose, { Schema, Document } from 'mongoose';

interface CommentInterface {
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface PostDocument extends Document {
  title: string;
  content: string;
  image?: string;
  author: mongoose.Types.ObjectId;
  location?: mongoose.Types.ObjectId;
  likes?: number;
  likedBy?: mongoose.Types.ObjectId[];
  comments?: number;
  commentsList?: CommentInterface[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    image: {
      type: String
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location'
    },
    likes: {
      type: Number,
      default: 0
    },
    likedBy: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    comments: {
      type: Number,
      default: 0
    },
    commentsList: [CommentSchema]
  },
  {
    timestamps: true
  }
);

export const Post = mongoose.model<PostDocument>('Post', PostSchema);