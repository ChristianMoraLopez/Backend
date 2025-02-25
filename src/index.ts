// src/app.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database';
import authRoutes  from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import locationRoutes from './routes/locationRoutes';
import postRoutes from './routes/postRoutes'; // Importa las rutas de posts

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Ajustar según tu configuración de seguridad
    methods: ["GET", "POST"]
  }
});

// Configurar Socket.io
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  // Unir al usuario a la sala de 'posts'
  socket.join('posts');
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Exportar io para usarlo en otros módulos
export { io };

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

// Importante: usar 'server' en lugar de 'app' para iniciar el servidor
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;