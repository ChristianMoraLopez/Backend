//src\types\express.d.ts

import { User } from '../models/User'; // Asegúrate de importar el modelo de User

declare module 'express' {
  interface Request {
    user?: User; // Define la propiedad `user` como opcional
    file?: Express.Multer.File; // Define la propiedad `file` como opcional
    
  }
}