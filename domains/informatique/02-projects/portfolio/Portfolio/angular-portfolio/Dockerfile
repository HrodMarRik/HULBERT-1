# Multi-stage build for HULBERT-1 Frontend
FROM node:20-alpine as base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base as development

# Install all dependencies (including dev)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Expose port
EXPOSE 4200

# Start development server
CMD ["npm", "start"]

# Build stage
FROM base as build

# Install all dependencies for build
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build -- --configuration production

# Production stage
FROM nginx:alpine as production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=build /app/dist/angular-portfolio /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1000 -S hulbert && \
    adduser -u 1000 -S hulbert -G hulbert

# Change ownership
RUN chown -R hulbert:hulbert /usr/share/nginx/html && \
    chown -R hulbert:hulbert /var/cache/nginx && \
    chown -R hulbert:hulbert /var/log/nginx && \
    chown -R hulbert:hulbert /etc/nginx/conf.d

# Switch to non-root user
USER hulbert

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
