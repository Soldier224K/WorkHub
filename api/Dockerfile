FROM node:22-alpine

WORKDIR /app

# Enforce security rules and install dependencies
COPY .npmrc package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

EXPOSE 4000

CMD ["node", "src/server.js"]
