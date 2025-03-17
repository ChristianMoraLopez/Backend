import { Router } from 'express';
import { getUsers, getProfile } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = Router();

// Ruta para obtener todos los usuarios
router.get('/', getUsers);

// Ruta para obtener el perfil del usuario autenticado
router.get('/profile', auth, getProfile);

// Aquí puedes añadir más rutas específicas de usuarios
// router.put('/:id', auth, updateUser);
// router.delete('/:id', auth, deleteUser);

export default router;