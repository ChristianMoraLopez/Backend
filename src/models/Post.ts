import mongoose, { Schema, Document } from 'mongoose';

interface CommentInterface {
  author: mongoose.Types.ObjectId;
  authorName: string; // Nombre del autor como string
  content: string;
  createdAt: Date;
}

export interface PostDocument extends Document {
  title: string;
  content: string;
  image?: string;
  author: mongoose.Types.ObjectId;
  authorName?: string; // Cambiado a opcional para compatibilidad con posts existentes
  location?: mongoose.Types.ObjectId;
  locationName?: string; 
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
    required: true,
  },
  authorName: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorName: {
      type: String,
      required: false, // Cambiado a opcional para compatibilidad con posts existentes
    },
    location: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    locationName: {
      type: String,
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: {
      type: Number,
      default: 0,
    },
    commentsList: [CommentSchema],
  },
  {
    timestamps: true,
  }
);

export const Post = mongoose.model<PostDocument>('Post', PostSchema);