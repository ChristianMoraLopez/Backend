import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'rolo-app-pictures', // Reemplaza con tu cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // Usa variables de entorno
  api_secret: process.env.CLOUDINARY_API_SECRET, // Usa variables de entorno
});

export default cloudinary;