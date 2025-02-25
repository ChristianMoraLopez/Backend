import { Request, Response } from 'express';
import { Post } from '../models/Post';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary';

// Crear un nuevo post
export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, location } = req.body;
    const author = req.user?._id; // Asumiendo que el usuario está autenticado y su ID está disponible en req.user

    if (!author) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    // Validar location si se proporciona
    if (location && !mongoose.Types.ObjectId.isValid(location)) {
      res.status(400).json({ message: 'Invalid location ID' });
      return;
    }

    let imageUrl = '';
    if (req.file) {
      // Subir la imagen a Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'posts', // Carpeta en Cloudinary donde se guardarán las imágenes
      });
      imageUrl = result.secure_url; // URL de la imagen en Cloudinary
    }

    const newPost = new Post({
      title,
      content,
      image: imageUrl, // Guardar la URL de la imagen
      author,
      location,
    });

    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error al crear el post:', error);
    res.status(500).json({ message: 'Error al crear el post' });
  }
};

// Obtener todos los posts
export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await Post.find().populate('author', 'name email').populate('location', 'name');
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error al obtener los posts:', error);
    res.status(500).json({ message: 'Error al obtener los posts' });
  }
};

// Obtener un post por ID
export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'name email').populate('location', 'name');
    if (!post) {
      res.status(404).json({ message: 'Post no encontrado' });
      return;
    }
    res.status(200).json(post);
  } catch (error) {
    console.error('Error al obtener el post:', error);
    res.status(500).json({ message: 'Error al obtener el post' });
  }
};