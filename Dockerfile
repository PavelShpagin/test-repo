FROM node:20-alpine

WORKDIR /app

# Install dependencies (handle both lock/no-lock cases)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm i --omit=dev

# Copy app
COPY public ./public
COPY server.js ./server.js

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]

