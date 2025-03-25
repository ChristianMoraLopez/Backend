// src/routes/locationRoutes.ts

import express from 'express';
import multer from 'multer';
import { auth } from '../middleware/auth';
import { 
  createLocation, 
  getLocations, 
  getLocation, 
  updateLocation, 
  deleteLocation,
  commentLocation 
} from '../controllers/locationController';

// Configurar multer para almacenar archivos temporalmente
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Filtrar para aceptar solo imágenes
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Crear instancias de middleware de multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // límite de 5MB por archivo
});

const router = express.Router();

// Rutas existentes con middleware de carga de archivos
router.post('/', auth, upload.array('images', 5), createLocation);
router.get('/', getLocations);
router.get('/:id', getLocation);

// Nuevas rutas para las funciones adicionales
router.put('/:id', auth, upload.array('images', 5), updateLocation);
router.delete('/:id', auth, deleteLocation);
router.post('/:id/comments', auth, commentLocation);

export default router;