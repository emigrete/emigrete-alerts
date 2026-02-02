# --- ETAPA 1: BUILD ---
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# --- MAGIA AQUÍ ---
# Declaramos que vamos a recibir estas variables
ARG VITE_API_URL
ARG VITE_REDIRECT_URI

# Las convertimos en variables de entorno para que Vite las vea
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_REDIRECT_URI=$VITE_REDIRECT_URI
# ------------------

# Ahora sí, construimos con las variables adentro
RUN npm run build

# --- ETAPA 2: PRODUCTION SERVER (NGINX) ---
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]