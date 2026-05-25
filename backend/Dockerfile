FROM node:18-alpine

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy the rest of the backend source code (including wallet, .env, etc.)
COPY . .

# Expose the API port
EXPOSE 3000

# Start the backend server
CMD ["node", "src/app.js"]