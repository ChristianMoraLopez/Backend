import { Request, Response } from 'express';
import { Location } from '../models/Location';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary';
import { io } from '../index';
import fs from 'fs';
import path from 'path';

// Crear una nueva locación
export const createLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, latitude, longitude, address,sensations, smells } = req.body;
    const createdBy = req.user?._id;

    if (!createdBy) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    // Procesar imágenes para Cloudinary
    const images: { src: string; width: number; height: number }[] = [];
    
    // Si hay un solo archivo
    if (req.file) {
      console.log('Uploading single location image to Cloudinary:', req.file);
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'locations',
      });
      images.push({
        src: result.secure_url,
        width: result.width,
        height: result.height
      });
      console.log('Location image uploaded successfully:', result.secure_url);
    }
    
    // Si hay múltiples archivos (usando multer array)
    if (req.files && Array.isArray(req.files)) {
      console.log(`Uploading ${req.files.length} location images to Cloudinary`);
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'locations',
        });
        images.push({
          src: result.secure_url,
          width: result.width,
          height: result.height
        });
        
        // Eliminar archivo temporal después de subir a Cloudinary
        fs.unlinkSync(file.path);
      }
      console.log('All location images uploaded successfully');
    }

    const newLocation = new Location({
      name,
      description,
      latitude,
      longitude,
      address,
      sensations,
      smells,
      images, // Guardamos el array de imágenes
      createdBy,
    });

    await newLocation.save();
    console.log('Location saved to database:', newLocation);

    // Emitir evento de nueva ubicación
    const populatedLocation = await Location.findById(newLocation._id)
      .populate('createdBy', 'name email avatar');

    io.to('locations').emit('new_location', populatedLocation);
    console.log('New location emitted via WebSocket');

    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error al crear la locación:', (error as Error).message);
    res.status(500).json({ message: 'Error al crear la locación', error: (error as Error).message });
  }
};

// Obtener todas las locaciones
export const getLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Request body:', req.body);
    console.log('Uploaded files:', req.files);
    
    const locations = await Location.find()
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 }); // Ordenar por fecha de creación descendente
    
    res.status(200).json(locations);
  } catch (error) {
    console.error('Error al obtener las locaciones:', error);
    res.status(500).json({ message: 'Error al obtener las locaciones' });
  }
};

// Obtener una locación por ID
export const getLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const location = await Location.findById(req.params.id)
      .populate('createdBy', 'name email avatar');
      
    if (!location) {
      res.status(404).json({ message: 'Locación no encontrada' });
      return;
    }
    
    res.status(200).json(location);
  } catch (error) {
    console.error('Error al obtener la locación:', error);
    res.status(500).json({ message: 'Error al obtener la locación' });
  }
};

// Actualizar una locación
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, latitude, longitude, sensations, smells, keepImages } = req.body;
    const locationId = req.params.id;
    const userId = req.user?._id;
    
    // Array con IDs o URLs de imágenes a mantener
    const imagesToKeep = keepImages ? 
      (Array.isArray(keepImages) ? keepImages : [keepImages]) : 
      [];

    // Verificar si el usuario está autenticado
    if (!userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    // Buscar la locación en la base de datos
    const location = await Location.findById(locationId);
    if (!location) {
      res.status(404).json({ message: 'Locación no encontrada' });
      return;
    }

    // Verificar si el usuario es el creador de la locación
    if (location.createdBy?.toString() !== userId.toString()) {
      res.status(403).json({ message: 'No autorizado para editar esta locación' });
      return;
    }

    // Mantener solo las imágenes especificadas
    const remainingImages = location.images.filter(image => 
      imagesToKeep.includes(image.src) || imagesToKeep.includes(image._id?.toString())
    );

    // Procesar nuevas imágenes
    const newImages: { src: string; width: number; height: number }[] = [];
    
    // Si hay un solo archivo nuevo
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'locations',
      });
      newImages.push({
        src: result.secure_url,
        width: result.width,
        height: result.height
      });
      
      // Eliminar archivo temporal
      fs.unlinkSync(req.file.path);
    }
    
    // Si hay múltiples archivos nuevos
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'locations',
        });
        newImages.push({
          src: result.secure_url,
          width: result.width,
          height: result.height
        });
        
        // Eliminar archivo temporal
        fs.unlinkSync(file.path);
      }
    }

    // Combinar imágenes existentes con nuevas
    const allImages = [...remainingImages, ...newImages];

    // Actualizar la locación
    const updatedLocation = await Location.findByIdAndUpdate(
      locationId,
      {
        name,
        description,
        latitude,
        longitude,
        sensations,
        smells,
        images: allImages,
      },
      { new: true }
    ).populate('createdBy', 'name email avatar');

    // Emitir la actualización de la locación a todos los clientes
    io.to('locations').emit('update_location', updatedLocation);

    res.status(200).json(updatedLocation);
  } catch (error) {
    console.error('Error al actualizar la locación:', error);
    res.status(500).json({ message: 'Error al actualizar la locación' });
  }
};

// Eliminar una locación
export const deleteLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const locationId = req.params.id;
    const userId = req.user?._id;

    // Verificar si el usuario está autenticado
    if (!userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    // Buscar la locación en la base de datos
    const location = await Location.findById(locationId);
    if (!location) {
      res.status(404).json({ message: 'Locación no encontrada' });
      return;
    }

    // Verificar si el usuario es el creador de la locación
    if (location.createdBy?.toString() !== userId.toString()) {
      res.status(403).json({ message: 'No autorizado para eliminar esta locación' });
      return;
    }

    // Eliminar todas las imágenes de Cloudinary
    if (location.images && location.images.length > 0) {
      for (const image of location.images) {
        if (image.src) {
          // Extraer el public_id de la URL de Cloudinary
          const urlParts = image.src.split('/');
          const filenameWithExt = urlParts[urlParts.length - 1];
          const publicId = `locations/${filenameWithExt.split('.')[0]}`;
          
          try {
            await cloudinary.uploader.destroy(publicId);
            console.log('Image deleted from Cloudinary:', publicId);
          } catch (cloudinaryError) {
            console.error('Error deleting image from Cloudinary:', cloudinaryError);
            // Continuamos con la eliminación incluso si falla la eliminación de alguna imagen
          }
        }
      }
    }

    // Eliminar la locación
    await Location.findByIdAndDelete(locationId);

    // Emitir el evento de eliminación
    io.to('locations').emit('delete_location', { _id: locationId });

    res.status(200).json({ message: 'Locación eliminada con éxito' });
  } catch (error) {
    console.error('Error al eliminar la locación:', error);
    res.status(500).json({ message: 'Error al eliminar la locación' });
  }
};

// Añadir un comentario a una locación
export const commentLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    const locationId = req.params.id;
    const userId = req.user?._id;
    const userName = req.user?.name || 'Usuario desconocido';

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

    // Buscar la locación en la base de datos
    const location = await Location.findById(locationId);
    if (!location) {
      res.status(404).json({ message: 'Locación no encontrada' });
      return;
    }

    // Crear un nuevo comentario
    const newComment = {
      author: userId,
      authorName: userName,
      content,
      createdAt: new Date(),
    };

    // Añadir el comentario a la lista de comentarios de la locación
    location.commentsList = [...(location.commentsList || []), newComment];
    location.commentsCount = (location.commentsCount || 0) + 1;

    // Guardar los cambios en la base de datos
    await location.save();

    // Obtener la locación actualizada con referencias pobladas
    const updatedLocation = await Location.findById(locationId)
      .populate('createdBy', 'name email avatar');

    // Emitir la actualización de la locación a todos los clientes
    io.to('locations').emit('update_location', updatedLocation);

    // Responder con la locación actualizada
    res.status(200).json(updatedLocation);
  } catch (error) {
    console.error('Error al comentar la locación:', error);
    res.status(500).json({ 
      message: 'Error al comentar la locación', 
      error: (error as Error).message,
      stack: (error as Error).stack
    });
  }
};