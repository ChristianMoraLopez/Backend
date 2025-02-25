// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { User, UserDocument } from '../models/User';

export interface AuthRequest extends Request {
  user?: UserDocument; // Usar UserDocument en lugar de any
}

export const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).send({ error: 'Token no proporcionado.' });
      return; // Detener la ejecución aquí
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { _id: string };
    const user = await User.findOne({ _id: decoded._id });

    if (!user) {
      res.status(404).send({ error: 'Usuario no encontrado.' });
      return; // Detener la ejecución aquí
    }

    req.user = user; // Adjuntar el usuario al objeto req
    next(); // Continuar con el siguiente middleware o controlador
  } catch (error) {
    console.error('Error en la autenticación:', error);
    res.status(401).send({ error: 'Error en la autenticación.' });
  }
};