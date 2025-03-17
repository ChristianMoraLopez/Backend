//src\routes\authRoutes.ts
import { Router } from 'express';
import { register, login, verifyToken} from '../controllers/authController';
import { auth } from '../middleware/auth'; 
import { googleAuth } from '../controllers/googleAuthController'; 

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// Rutas protegidas (requieren autenticación)
router.get('/verify', auth, verifyToken);

export default router;