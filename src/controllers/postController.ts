import { Request, Response } from 'express';
import { Post } from '../models/Post';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary';
import { io } from '../index';

// Crear un nuevo post
export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, location } = req.body;
    const author = req.user?._id;
    const authorName = req.user?.name || 'Usuario desconocido';

    if (!author) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    if (location && !mongoose.Types.ObjectId.isValid(location)) {
      res.status(400).json({ message: 'Invalid location ID' });
      return;
    }

    let imageUrl = '';
    if (req.file) {
      console.log('Uploading file to Cloudinary:', req.file);
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'posts',
      });
      imageUrl = result.secure_url;
      console.log('File uploaded successfully:', imageUrl);
    }

    // Obtener el nombre de la ubicación si existe
    let locationName = '';
    if (location) {
      const locationDoc = await mongoose.model('Location').findById(location);
      if (locationDoc) {
        locationName = locationDoc.name;
      }
    }

    const newPost = new Post({
      title,
      content,
      image: imageUrl,
      author,
      authorName, // Añadir el nombre del autor
      location,
      locationName, // Añadir el nombre de la ubicación
    });

    await newPost.save();
    console.log('Post saved to database:', newPost);

    const populatedPost = await Post.findById(newPost._id)
      .populate('author', 'name email avatar location')
      .populate('location', 'name');

    io.to('posts').emit('new_post', populatedPost);
    console.log('New post emitted via WebSocket');

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error al crear el post:', (error as Error).message);
    res.status(500).json({ message: 'Error al crear el post', error: (error as Error).message });
  }
};

// Obtener todos los posts
export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Request body:', req.body);
console.log('Uploaded file:', req.file);
    const posts = await Post.find()
      .populate('author', 'name email avatar location')
      .populate('location', 'name')
      .sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente
      
    res.status(200).json(posts);
  } catch (error) {
    console.error('Error al obtener los posts:', error);
    res.status(500).json({ message: 'Error al obtener los posts' });
  }
};

// Obtener un post por ID
export const getPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name email avatar location')
      .populate('location', 'name');
      
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

// Dar "like" a un post
// Dar "like" a un post
export const likePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user?._id;

    // Verificar si el usuario está autenticado
    if (!userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    // Buscar el post en la base de datos
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: 'Post no encontrado' });
      return;
    }

    // Verificar si el usuario ya dio like al post
    const likedIndex = post.likedBy?.findIndex((id) => id.toString() === userId.toString());

    if (likedIndex === -1 || likedIndex === undefined) {
      // Si no ha dado like, añadir el usuario a likedBy y aumentar el contador
      post.likedBy = [...(post.likedBy || []), userId];
      post.likes = (post.likes || 0) + 1;
    } else {
      // Si ya dio like, quitar al usuario de likedBy y decrementar el contador
      post.likedBy = post.likedBy?.filter((id) => id.toString() !== userId.toString());
      post.likes = Math.max(0, (post.likes || 0) - 1);
    }

    // Guardar los cambios en la base de datos
    await post.save();

    // Obtener el post actualizado con referencias pobladas
    const updatedPost = await Post.findById(postId)
      .populate('author', 'name email avatar location')
      .populate('location', 'name');

    // Emitir la actualización del post a todos los clientes
    io.to('posts').emit('update_post', updatedPost);

    // Responder con el estado del like y el número de likes
    res.status(200).json({
      liked: likedIndex === -1 || likedIndex === undefined,
      likes: post.likes,
    });
  } catch (error) {
    console.error('Error al dar like al post:', error);
    res.status(500).json({ message: 'Error al actualizar el post' });
  }
};
// Añadir un comentario a un post
export const commentPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    const postId = req.params.id;
    const userId = req.user?._id;
    const userName = req.user?.name || 'Usuario desconocido'; // Obtener el nombre del usuario

    // Verificar si el usuario está autenticado
    if (!userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    // Validar que el contenido del comentario no esté vacío
    if (!content || content.trim() === '') {
      res.status(400).json({ message: 'El contenido del comentario no puede estar vacío' });
      return;
    }

    // Buscar el post en la base de datos
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ message: 'Post no encontrado' });
      return;
    }

    // Crear un nuevo comentario
    const newComment = {
      author: userId,
      authorName: userName, // Guardar el nombre del autor del comentario
      content,
      createdAt: new Date(),
    };

    // Añadir el comentario a la lista de comentarios del post
    post.commentsList = [...(post.commentsList || []), newComment];
    post.comments = (post.comments || 0) + 1;

    // Guardar los cambios en la base de datos
    await post.save();

    // Obtener el post actualizado con referencias pobladas
    const updatedPost = await Post.findById(postId)
      .populate('author', 'name email avatar location')
      .populate('location', 'name');

    // Emitir la actualización del post a todos los clientes
    io.to('posts').emit('update_post', updatedPost);

    // Responder con el post actualizado
    res.status(200).json(updatedPost);
  } catch (error) {
    console.error('Error al comentar el post:', error);
    res.status(500).json({ message: 'Error al comentar el post', error: (error as Error).message });
  }
};