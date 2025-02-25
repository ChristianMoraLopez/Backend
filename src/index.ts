// src/app.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/authRoutes';
import locationRoutes from './routes/locationRoutes';
import postRoutes from './routes/postRoutes'; // Importa las rutas de posts

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conectar a la base de datos
connectDB();

// Montar las rutas de autenticación en "/api/auth"
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);

// Montar las rutas de locaciones en "/api/locations"
app.use('/api/locations', locationRoutes);

// Montar las rutas de posts en "/api/posts"
app.use('/api/posts', postRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});