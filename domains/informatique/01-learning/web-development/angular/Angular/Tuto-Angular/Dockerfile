# Dockerfile pour le Frontend Angular

# Stage 1: Build
FROM node:18-alpine AS build

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm ci --only=production

# Copie du code source
COPY . .

# Build de l'application
RUN npm run build --prod

# Stage 2: Serve
FROM nginx:alpine

# Copie de la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copie des fichiers buildés
COPY --from=build /app/dist/tuto-angular /usr/share/nginx/html

# Exposition du port
EXPOSE 80

# Commande de démarrage
CMD ["nginx", "-g", "daemon off;"]