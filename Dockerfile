FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .


RUN npx prisma generate
RUN npm run build

# Expose the application port (change if needed)
EXPOSE 3001

# Set the command to start the app
CMD [ "node", "dist/index.js"]