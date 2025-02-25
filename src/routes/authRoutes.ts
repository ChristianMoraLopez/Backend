// src/routes/authRoutes.ts
import { Router } from 'express';
import { register, login, googleAuth, verifyToken, getUsers, getProfile } from '../controllers/authController';
import { auth } from '../middleware/auth'; // Importar el middleware de autenticación

const router = Router();



// Rutas protegidas (requieren autenticación)
router.get('/verify', auth, verifyToken);
router.get('/profile', auth, getProfile);



export default router;