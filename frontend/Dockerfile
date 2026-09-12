# Multi-stage build for production-grade React App
# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app
# Install dependencies first (layer caching)
COPY package.json yarn.lock* ./
RUN npm install

COPY . .
# Build the app (optimized production build)
RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration if needed (e.g., for React Router HTML5 History API)
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
