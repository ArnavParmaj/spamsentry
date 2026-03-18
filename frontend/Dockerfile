# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the development port
EXPOSE 5173

# Command to run the application in development mode
# Note: For production, we would build and serve with nginx, but for now dev mode is fine.
CMD ["npm", "run", "dev", "--", "--host"]
