FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Create non-root user first (better layer caching)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs

# Copy package files first for better dependency caching
COPY package*.json ./

# Install dependencies with security improvements and network resilience
# Use --prefer-offline to use cache if available
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm ci --only=production --ignore-scripts --prefer-offline && \
    npm cache clean --force

# Copy application code (this layer changes most often)
COPY . .

# Set ownership after copying
RUN chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose the application port (corrected to match code)
EXPOSE 4000

# Set environment variables
ENV PORT=4000
ENV NODE_ENV=production

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "index.js"]