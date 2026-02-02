FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Railway define PORT automáticamente
EXPOSE 3000

CMD ["node", "src/index.js"]
