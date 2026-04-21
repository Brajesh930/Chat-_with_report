# Use Node.js 18 LTS Alpine as base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for the build)
RUN npm install

# Copy the rest of the application
COPY . .

# Build the frontend assets (Vite)
RUN npm run build

# Expose the application port (Logicapt Default)
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the full-stack server
CMD ["npm", "start"]
