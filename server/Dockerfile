# 1. Usamos una imagen de Node ligera
FROM node:18-alpine

# 2. Creamos la carpeta de trabajo adentro del contenedor
WORKDIR /app

# 3. Copiamos los archivos de dependencias primero (para aprovechar el caché)
COPY package*.json ./

# 4. Instalamos las dependencias
RUN npm install --production

# 5. Copiamos el resto del código
COPY . .

# 6. Exponemos el puerto que usa tu server
EXPOSE 3000

# 7. Comando para arrancar
CMD ["node", "src/index.js"]