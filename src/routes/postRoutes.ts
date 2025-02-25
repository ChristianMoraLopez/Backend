// src/routes/postRoutes.ts

import express from 'express';
import { auth } from '../middleware/auth';
import { createPost, getPosts, getPost } from '../controllers/postController';
import upload from '../middleware/multer';

const router = express.Router();

// Crear un nuevo post (protegido por autenticación)
router.post('/', auth, upload.single('image'), createPost);

// Obtener todos los posts
router.get('/', getPosts);

// Obtener un post por ID
router.get('/:id', getPost);

export default router;