# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy all application files
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx configuration if you have one
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 30004
EXPOSE 30004

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:30004/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]