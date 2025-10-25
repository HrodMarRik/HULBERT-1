#!/bin/bash
set -e

echo "🚀 Déploiement HULBERT-1"

# Variables
PROJECT_DIR="/home/debian/HULBERT-1"
BACKUP_DIR="/home/debian/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Fonction de backup
backup_database() {
    echo "💾 Création du backup..."
    mkdir -p $BACKUP_DIR
    
    # Backup de la base de données
    docker-compose -f $PROJECT_DIR/docker-compose.prod.yml exec -T postgres pg_dump -U hulbert hulbert_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz
    
    # Garder seulement les 7 derniers jours
    find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete
    
    echo "✅ Backup créé: db_$DATE.sql.gz"
}

# Fonction de rollback
rollback() {
    echo "🔄 Rollback en cours..."
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/db_*.sql.gz | head -n1)
    
    if [ -f "$LATEST_BACKUP" ]; then
        echo "Restauration depuis: $LATEST_BACKUP"
        gunzip -c $LATEST_BACKUP | docker-compose -f $PROJECT_DIR/docker-compose.prod.yml exec -T postgres psql -U hulbert hulbert_db
        echo "✅ Rollback terminé"
    else
        echo "❌ Aucun backup trouvé"
        exit 1
    fi
}

# Fonction de health check
health_check() {
    echo "🏥 Vérification de la santé des services..."
    
    # Attendre que les services soient prêts
    sleep 30
    
    # Vérifier l'API
    if curl -f http://localhost/api/health; then
        echo "✅ API accessible"
    else
        echo "❌ API non accessible"
        return 1
    fi
    
    # Vérifier les services Docker
    if docker-compose -f $PROJECT_DIR/docker-compose.prod.yml ps | grep -q "Up"; then
        echo "✅ Services Docker en cours d'exécution"
    else
        echo "❌ Problème avec les services Docker"
        return 1
    fi
}

# Fonction principale de déploiement
deploy() {
    echo "📥 Récupération des dernières modifications..."
    cd $PROJECT_DIR
    git pull origin main
    
    echo "🔨 Construction et déploiement..."
    
    # Pull des dernières images Docker
    docker-compose -f docker-compose.prod.yml pull
    
    # Déploiement avec zéro downtime
    echo "🔄 Déploiement backend..."
    docker-compose -f docker-compose.prod.yml up -d --build --no-deps backend
    
    echo "⏳ Attente du démarrage backend..."
    sleep 15
    
    echo "🔄 Déploiement frontend..."
    docker-compose -f docker-compose.prod.yml up -d --build --no-deps frontend
    
    echo "⏳ Attente du démarrage frontend..."
    sleep 15
    
    echo "🔄 Déploiement nginx..."
    docker-compose -f docker-compose.prod.yml up -d --build --no-deps nginx
    
    echo "🗄️ Exécution des migrations de base de données..."
    docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
    
    echo "🧹 Nettoyage des anciennes images..."
    docker image prune -f
    
    echo "✅ Déploiement terminé"
}

# Fonction de monitoring
monitor() {
    echo "📊 État des services HULBERT-1"
    echo "================================"
    
    # Services Docker
    echo "🐳 Services Docker:"
    docker-compose -f $PROJECT_DIR/docker-compose.prod.yml ps
    
    echo ""
    echo "💾 Utilisation des volumes:"
    docker system df -v
    
    echo ""
    echo "📈 Ressources système:"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
    echo "RAM: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
    echo "Disk: $(df -h / | awk 'NR==2{print $5}')"
    
    echo ""
    echo "🌐 Santé de l'application:"
    if curl -s -f http://localhost/api/health > /dev/null; then
        echo "✅ Application accessible"
    else
        echo "❌ Application non accessible"
    fi
}

# Fonction de logs
show_logs() {
    echo "📋 Logs des services:"
    docker-compose -f $PROJECT_DIR/docker-compose.prod.yml logs --tail=50
}

# Menu principal
case "${1:-deploy}" in
    "deploy")
        backup_database
        deploy
        health_check
        ;;
    "rollback")
        rollback
        ;;
    "monitor")
        monitor
        ;;
    "logs")
        show_logs
        ;;
    "health")
        health_check
        ;;
    "backup")
        backup_database
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|monitor|logs|health|backup}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Déployer l'application (défaut)"
        echo "  rollback - Restaurer depuis le dernier backup"
        echo "  monitor  - Afficher l'état des services"
        echo "  logs     - Afficher les logs"
        echo "  health   - Vérifier la santé de l'application"
        echo "  backup   - Créer un backup de la base de données"
        exit 1
        ;;
esac
