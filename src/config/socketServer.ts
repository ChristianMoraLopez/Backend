// socketServer.js
import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http'; // Importa el tipo de servidor HTTP

/**
 * Configura y devuelve una instancia de Socket.io para el servidor HTTP
 * @param {Object} server - Servidor HTTP de Node.js
 * @param {Array} allowedOrigins - Orígenes permitidos para CORS
 * @returns {Server} - Instancia de Socket.io
 */



export function setupSocketServer(server: HttpServer, allowedOrigins = ["https://rolo-app.vercel.app", "http://localhost:3000"]) {
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
      },
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });
  
    // Log when a client connects to the main namespace
    io.on('connection', (socket) => {
      console.log('Usuario conectado al namespace principal:', socket.id);
      socket.join('posts'); // Join the 'posts' room
  
      socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
      });
    });
  

    return io;
  }