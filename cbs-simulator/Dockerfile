# Use an official Node.js runtime as a parent image
FROM node:18-slim

ENV NODE_ENV=production

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install any needed packages
# Use npm ci for clean, reproducible builds and install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Bundle app source
COPY . .

# Create a non-root user for security and change ownership
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
RUN chown -R appuser:appgroup /usr/src/app

# Switch to the non-root user
USER appuser

# Make port 8080 available to the world outside this container
EXPOSE 8080

# Define the command to run your app
# Run the app directly with node for fewer processes
CMD ["node", "index.js"] 