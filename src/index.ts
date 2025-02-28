// index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { connectDB } from './config/database';
import { setupSocketServer } from './config/socketServer';

// Rutas
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/authRoutes';
import locationRoutes from './routes/locationRoutes';
import postRoutes from './routes/postRoutes';

dotenv.config();

// Configuración de Express
const app = express();
const server = http.createServer(app);
const allowedOrigins = ["https://rolo-app.vercel.app", "http://localhost:3000"];

// Configuración de CORS
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

// Configurar Socket.io y exportarlo para usarlo en otros módulos
const io = setupSocketServer(server, allowedOrigins);

export { io };

// Conectar a la base de datos
connectDB();

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/posts', postRoutes);

// Iniciar el servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;