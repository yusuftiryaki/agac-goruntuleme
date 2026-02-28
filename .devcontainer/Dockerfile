# See https://hub.docker.com/_/node for available versions
FROM node:20-bullseye

# Create app directory
WORKDIR /workspace

# Install dependencies (if any system dependencies are needed, add here)
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*


# Copy package files and install node modules early for caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .


# Set correct permissions for workspace directory
RUN chown -R node:node /workspace
USER node
