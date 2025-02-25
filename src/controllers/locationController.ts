// src/controllers/locationController.ts

import { Request, Response } from 'express';
import { Location } from '../models/Location';

// Crear una nueva locación
export const createLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, latitude, longitude, sensations, smells, images } = req.body;
    const createdBy = req.user._id; // Asumiendo que el usuario está autenticado y su ID está disponible en req.user

    const newLocation = new Location({
      name,
      description,
      latitude,
      longitude,
      sensations,
      smells,
      images,
      createdBy,
    });

    await newLocation.save();

    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error al crear la locación:', error);
    res.status(500).json({ message: 'Error al crear la locación' });
  }
};

// Obtener todas las locaciones
export const getLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const locations = await Location.find().populate('createdBy', 'name email'); // Populate para obtener información del creador
    res.status(200).json(locations);
  } catch (error) {
    console.error('Error al obtener las locaciones:', error);
    res.status(500).json({ message: 'Error al obtener las locaciones' });
  }
};

// Obtener una locación por ID
export const getLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const location = await Location.findById(req.params.id).populate('createdBy', 'name email');
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