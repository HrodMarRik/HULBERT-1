#!/bin/bash
set -e

echo "🚀 Déploiement complet HULBERT-1 (Frontend + Backend)"

# Deploy backend first
echo "📦 Déploiement Backend..."
bash scripts/deploy-backend.sh

# Wait for backend to be ready
echo "⏳ Attente du backend..."
sleep 30

# Deploy frontend
echo "📦 Déploiement Frontend..."
bash scripts/deploy-frontend.sh

echo "✅ Déploiement complet terminé !"
echo "📍 Frontend: http://51.210.6.15"
echo "📍 Backend: http://51.178.24.242:8000"

