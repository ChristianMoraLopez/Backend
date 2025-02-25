// src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, googleAuth, getUsers } from '../controllers/authController';

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
// Ruta para obtener usuarios (protegida si es necesario)
router.get('/users', getUsers);

export default router;