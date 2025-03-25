
// src/models/Location.ts
import mongoose, { Schema, Document } from 'mongoose';
import { UserDocument } from './User'; 

interface LocationCommentInterface {
  author: mongoose.Types.ObjectId | UserDocument; // Can be either ObjectId or populated UserDocument
  content: string;
  createdAt: Date;
}
export interface LocationDocument extends Document {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  sensations: string[];
  address?: string;
  smells: string[];
  images: {
    _id?: mongoose.Types.ObjectId;
    src: string;
    width: number;
    height: number;
  }[];
  createdAt: Date;
  createdBy: mongoose.Types.ObjectId;
  commentsCount?: number;
  commentsList: LocationCommentInterface[];
}

const LocationCommentSchema = new Schema({
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

const LocationSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  latitude: { 
    type: Number, 
    required: true 
  },
  longitude: { 
    type: Number, 
    required: true 
  },
  sensations: [String],
  smells: [String],
  images: [{
    src: String,
    width: Number,
    height: Number
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  commentsList: [LocationCommentSchema]
});

export const Location = mongoose.model<LocationDocument>('Location', LocationSchema);