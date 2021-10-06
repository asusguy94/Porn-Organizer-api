FROM node:14-alpine

# Install FFMPEG
RUN apk add ffmpeg

# Set user
RUN adduser user -D
USER user

# Set working DIR
WORKDIR /app

# Copy config-files
COPY package.json .

# Install Packages
RUN npm install
#--production

# Copy All Packages
COPY . .

# Compile Typescript
RUN npm run build

# Start Server
EXPOSE 8080
CMD ["npm", "run", "start"]