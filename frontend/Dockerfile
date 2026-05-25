# Stage 1: Build the React application
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Serve the application using a lightweight static server
FROM node:18-alpine
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/build ./build

# Expose the frontend port
EXPOSE 3001

# Start the static server
CMD ["serve", "-s", "build", "-l", "3001"]