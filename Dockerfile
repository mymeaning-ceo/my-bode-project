FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --production

# Bundle app source
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
