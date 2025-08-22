# Use the official Node.js LTS image

# Use a Debian-based Node.js image for better compatibility with Puppeteer/Chromium
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./


# Install Chromium dependencies for Puppeteer
RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		chromium \
		fonts-liberation \
		libasound2 \
		libatk-bridge2.0-0 \
		libatk1.0-0 \
		libc6 \
		libcairo2 \
		libcups2 \
		libdbus-1-3 \
		libdrm2 \
		libexpat1 \
		libgbm1 \
		libgtk-3-0 \
		libnspr4 \
		libnss3 \
		libpango-1.0-0 \
		libx11-xcb1 \
		libxcomposite1 \
		libxdamage1 \
		libxrandr2 \
		xdg-utils \
		wget \
	&& rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Ensure output directory exists and set permissions
RUN mkdir -p ./output \
	&& chown -R node:node ./output


# Use non-root user for security and write access
USER node

# Expose the port
EXPOSE 8080


# Set Puppeteer to use the installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Start the app
CMD ["node", "index.js"]
