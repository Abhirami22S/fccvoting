# Use the official Node.js 18 LTS image as the base
FROM node:18-slim

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on (matching the .env or server.js)
EXPOSE 3000

# Command to run the application
CMD ["node", "server.js"]
