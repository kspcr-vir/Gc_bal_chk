FROM node:20

# Install dependencies needed by Playwright/Chromium
RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install Playwright Chromium specifically to avoid downloading unnecessary browsers
RUN npx playwright install chromium --with-deps

COPY . .

# Build the react production frontend
RUN npm run build

EXPOSE 3000

# Start command according to package.json
CMD ["npm", "start"]
