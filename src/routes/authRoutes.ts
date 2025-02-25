// src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, googleAuth, verifyToken, getUsers, getProfile } from '../controllers/authController';
import { auth } from '../middleware/auth'; // Importar el middleware de autenticación

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// Rutas protegidas (requieren autenticación)
router.get('/verify', auth, verifyToken);
router.get('/profile', auth, getProfile);

// Ruta para obtener usuarios (protegida si es necesario)
router.get('/users', getUsers);

export default router;