import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database';

// Rutas
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/authRoutes';
import locationRoutes from './routes/locationRoutes';
import postRoutes from './routes/postRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = ["https://rolo-app.vercel.app", "http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// **💡 Configurar Socket.io**
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// **💡 Manejo de conexión Socket.io**
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  // Unir al usuario a una sala
  socket.join('posts');

  socket.on('message', (data) => {
    console.log('Mensaje recibido:', data);
    io.to('posts').emit('newMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Exportar io para usarlo en otros módulos
export { io };

// Conectar DB
connectDB();

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/posts', postRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
