# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with security improvements and network resilience
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy all app files
COPY . .

# Build-time argument for API URL
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build React app
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Copy built files from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Set proper ownership
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose HTTP port 80 (must match containerPort in k8s)
EXPOSE 80

# Healthcheck using curl (available in nginx:alpine)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl --fail --silent --show-error http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
