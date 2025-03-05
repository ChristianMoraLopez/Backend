import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error('MONGODB_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Detailed MongoDB connection error:', error);
    
    // Log the specific connection string (without sensitive parts)
    const sanitizedURI = mongoURI.replace(/:[^:]*@/, ':****@');
    console.error(`Attempted to connect to: ${sanitizedURI}`);
    
    process.exit(1);
  }
};