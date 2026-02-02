# --- ETAPA 1: BUILD ---
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Esto crea la carpeta 'dist' con tu web optimizada
RUN npm run build

# --- ETAPA 2: PRODUCTION SERVER (NGINX) ---
FROM nginx:alpine
# Copiamos solo los archivos compilados de la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html
# Copiamos nuestra config de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]