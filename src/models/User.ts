// src/models/User.ts
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // No obligatorio para usuarios de Google
  role: { 
    type: String, 
    enum: ['visitor', 'registered', 'subscriber', 'admin'],
    default: 'visitor'
  },
  avatar: { type: String },
  location: { type: String },
  authProvider: { 
    type: String, 
    enum: ['email', 'google'], 
    required: true 
  },
  googleId: { type: String }, // Se usará para Google OAuth
  createdAt: { type: Date, default: Date.now }
});

// Definir la interfaz para el documento de usuario
export interface UserDocument extends mongoose.Document {
  name: string;
  email: string;
  password?: string;
  role: 'visitor' | 'registered' | 'subscriber' | 'admin';
  avatar?: string;
  location?: string;
  authProvider: 'email' | 'google';
  googleId?: string;
  createdAt: Date;
}

// Crear el modelo
export const User = mongoose.model<UserDocument>('User', userSchema);