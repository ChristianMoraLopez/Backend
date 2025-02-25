// Importaciones
import express from 'express';
import cors from 'cors';  // <--- Importar cors
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/database';

// Rutas
import authRoutes  from './routes/authRoutes';
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

// Middleware
app.use(express.json());

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
