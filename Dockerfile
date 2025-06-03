<<<<<<< HEAD
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN chmod +x node_modules/.bin/tsc
RUN npm run build
EXPOSE 3000
=======
# Use the official Node.js 18 Alpine image
FROM node:18-alpine

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies, including devDependencies
RUN npm ci --include=dev

# Copy the rest of the application code
COPY . .

# Ensure node_modules/.bin is in PATH
ENV PATH=/app/node_modules/.bin:$PATH

# Verify tsc is installed and executable
RUN tsc --version || { echo "TypeScript not found"; exit 1; }

# Compile TypeScript
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to start the server
>>>>>>> 5f226bdf4a9bae927738f3a7531e44c84f4d115a
CMD ["npm", "run", "start"]