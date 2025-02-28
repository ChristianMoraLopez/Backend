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
  // Crear instancia de Socket.io con opciones CORS
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  // Configurar namespace principal
  io.on('connection', (socket) => {
    console.log('Usuario conectado al namespace principal:', socket.id);
    
    // Unir al usuario a una sala para recibir actualizaciones de posts
    socket.join('posts');
    
    // Eventos personalizados
    socket.on('client_message', (data) => {
      console.log('Mensaje del cliente:', data);
      // Responder al cliente que envió el mensaje
      socket.emit('server_response', { message: 'Mensaje recibido en el servidor' });
      // Enviar a todos los clientes excepto al remitente
      socket.broadcast.emit('broadcast_message', { message: 'Nuevo mensaje de un usuario' });
    });

    socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
    });
  });

  // Crear namespace específico para posts
  const postsNamespace = io.of('/posts');
  postsNamespace.on('connection', (socket) => {
    console.log('Usuario conectado al namespace de posts:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Usuario desconectado del namespace de posts:', socket.id);
    });
  });

  return io;
}