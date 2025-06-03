FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN chmod +x node_modules/.bin/tsc
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]