FROM node:14-alpine

# Set working DIR
WORKDIR /app

# Copy config-files
COPY package.json ./

# Install Packages
RUN npm install --production

# Copy All Packages
COPY . .

# Install SHARP
RUN npm install sharp

# Install FFMPEG
RUN apk add ffmpeg --no-cache

# Compile Typescript
RUN npm run build

# Start Server
EXPOSE 8080
CMD ["npm", "run", "start"]