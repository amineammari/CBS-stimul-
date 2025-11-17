## Multi-stage Dockerfile for the dashboard (React app)
## - Builder: node (deb-based) with npm@11 for lockfile compatibility
## - Production: nginx (alpine) to serve the static build

# Builder stage: build the React app
FROM node:20-bullseye-slim AS builder

# Working directory
WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json ./

# Upgrade npm to match the version used to generate package-lock.json
# and set some npm configuration to improve registry resilience
RUN npm install -g npm@11.4.2 && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5

# Install dependencies (including devDependencies required for build)
# Use npm ci for deterministic installs; ignore lifecycle scripts until source copied
RUN NPM_CONFIG_PRODUCTION=false npm ci --include=dev --ignore-scripts && npm cache clean --force

# Copy application source
COPY . .

# Build-time argument for API URL (injected into build via env)
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the app (produces ./build)
RUN npm run build

# Production stage: serve static files with nginx
FROM nginx:1.25-alpine AS production

# Remove default nginx content and copy our build
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/build /usr/share/nginx/html

# Ensure nginx user owns the files
RUN chown -R nginx:nginx /usr/share/nginx/html

# Expose port and provide a simple healthcheck
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qS --spider http://localhost/ || exit 1

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]