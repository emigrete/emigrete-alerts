# --- ETAPA 1: BUILD (Vite/React) ---
FROM node:18-alpine AS builder
WORKDIR /app

# (Opcional pero recomendado) pasar envs de Vite en build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el resto y buildear
COPY . .
RUN npm run build


# --- ETAPA 2: PRODUCTION SERVER (NGINX) ---
FROM nginx:alpine

# Archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Template de config para usar $PORT de Railway
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Arranque: reemplaza ${PORT} y levanta Nginx
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
