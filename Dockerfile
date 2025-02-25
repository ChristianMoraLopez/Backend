# Usa la imagen oficial de Node.js
FROM node:18-alpine

# Crea y usa el directorio de la app
WORKDIR /app

# Copia los archivos necesarios
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm ci

# Copia todo el código de la app
COPY . .

# Da permisos de ejecución a tsc
RUN chmod +x node_modules/.bin/tsc

# Compila TypeScript
RUN npm run build

# Expone el puerto en el que corre la app
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["npm", "run", "start"]
