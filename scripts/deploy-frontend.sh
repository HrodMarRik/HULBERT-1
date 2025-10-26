#!/bin/bash
set -e

echo "🚀 Déploiement Frontend HULBERT-1"

# Variables
VPS_HOST="51.210.6.15"
VPS_USER="root"

# Pull latest changes
echo "📥 Pull latest changes..."
git pull origin main

# Build Angular production
echo "🏗️ Build Angular..."
cd domains/informatique/02-projects/portfolio/Portfolio/angular-portfolio
npm ci
npm run build -- --configuration production

# Prepare files
echo "📦 Préparation des fichiers..."
cd ../../../../../
mkdir -p dist
cp -r domains/informatique/02-projects/portfolio/Portfolio/angular-portfolio/dist/angular-portfolio/* dist/

# Deploy to VPS
echo "🚀 Déploiement sur VPS..."
rsync -avz --progress -e "ssh -i ~/.ssh/hulbert_frontend_key" \
    dist/ \
    nginx/ \
    docker-compose.frontend.yml \
    $VPS_USER@$VPS_HOST:/opt/hulbert/

# Start services on VPS
echo "▶️ Démarrage des services..."
ssh -i ~/.ssh/hulbert_frontend_key $VPS_USER@$VPS_HOST << 'ENDSSH'
cd /opt/hulbert
docker-compose -f docker-compose.frontend.yml down
docker-compose -f docker-compose.frontend.yml up -d
docker-compose -f docker-compose.frontend.yml logs -f &
ENDSSH

echo "✅ Déploiement frontend terminé !"
echo "📍 URL: http://51.210.6.15"

