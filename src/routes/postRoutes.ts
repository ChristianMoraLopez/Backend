import express from 'express';
import { auth } from '../middleware/auth';
import { createPost, getPosts, getPost, likePost, commentPost } from '../controllers/postController';
import upload from '../middleware/multer';

const router = express.Router();

router.post('/', auth, upload.single('image'), createPost);
router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/:id/like', auth, likePost);
router.post('/:id/comment', auth, commentPost);

export default router;
