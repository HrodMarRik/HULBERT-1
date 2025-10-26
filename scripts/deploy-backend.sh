#!/bin/bash
set -e

echo "🚀 Déploiement Backend HULBERT-1"

# Variables
VPS_HOST="51.178.24.242"
VPS_USER="debian"

# Pull latest changes
echo "📥 Pull latest changes..."
git pull origin main

# Deploy to VPS
echo "🚀 Déploiement sur VPS..."
rsync -avz --progress -e "ssh -i ~/.ssh/hulbert_ovh_key" \
    backend/ \
    nginx/backend.conf \
    docker-compose.backend.yml \
    $VPS_USER@$VPS_HOST:/opt/hulbert-backend/

# Start services on VPS
echo "▶️ Démarrage des services..."
ssh -i ~/.ssh/hulbert_ovh_key $VPS_USER@$VPS_HOST << 'ENDSSH'
cd /opt/hulbert-backend

# Load environment variables
export $(cat .env | xargs)

# Start services
docker-compose -f docker-compose.backend.yml down
docker-compose -f docker-compose.backend.yml build
docker-compose -f docker-compose.backend.yml up -d

# Run migrations
echo "🔄 Exécution des migrations..."
docker-compose -f docker-compose.backend.yml exec backend alembic upgrade head

# Health check
sleep 10
curl -f http://localhost/api/health || exit 1

echo "✅ Backend déployé !"
ENDSSH

echo "✅ Déploiement backend terminé !"
echo "📍 API: http://51.178.24.242:8000"

