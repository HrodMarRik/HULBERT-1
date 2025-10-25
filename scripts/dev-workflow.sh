#!/bin/bash
set -e

echo "🔄 Workflow de développement HULBERT-1"
echo "====================================="

# Fonction d'aide
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  dev       - Basculer sur la branche dev et faire un commit"
    echo "  test      - Lancer les tests locaux"
    echo "  build     - Construire les images Docker localement"
    echo "  deploy    - Déployer sur le VPS (uniquement depuis main)"
    echo "  merge     - Merger dev vers main et déployer"
    echo "  status    - Afficher le statut des branches"
    echo "  help      - Afficher cette aide"
    echo ""
    echo "Workflow recommandé:"
    echo "  1. git checkout dev"
    echo "  2. Faire vos modifications"
    echo "  3. $0 dev (commit et push sur dev)"
    echo "  4. Vérifier les tests sur GitHub"
    echo "  5. $0 merge (quand prêt pour production)"
}

# Fonction pour travailler sur dev
work_on_dev() {
    echo "🌿 Basculer sur la branche dev..."
    git checkout dev
    
    echo "📝 Ajouter tous les fichiers modifiés..."
    git add .
    
    echo "💬 Créer un commit..."
    read -p "Message de commit: " commit_message
    git commit -m "$commit_message"
    
    echo "📤 Pousser vers GitHub..."
    git push origin dev
    
    echo "✅ Modifications poussées sur dev"
    echo "🔍 Vérifiez les tests sur: https://github.com/HrodMarRik/HULBERT-1/actions"
}

# Fonction pour lancer les tests locaux
run_tests() {
    echo "🧪 Lancement des tests locaux..."
    
    # Tests backend
    echo "🐍 Tests backend..."
    cd backend
    python -m pytest --cov=app --cov-report=term-missing
    cd ..
    
    # Tests frontend
    echo "🅰️ Tests frontend..."
    cd domains/informatique/02-projects/portfolio/Portfolio/angular-portfolio
    npm test -- --no-watch --no-progress
    cd ../../../../../../..
    
    echo "✅ Tests locaux terminés"
}

# Fonction pour construire les images Docker
build_images() {
    echo "🐳 Construction des images Docker..."
    
    # Build backend
    echo "🔨 Construction backend..."
    docker build -t hulbert-backend:local ./backend
    
    # Build frontend
    echo "🔨 Construction frontend..."
    docker build -t hulbert-frontend:local ./domains/informatique/02-projects/portfolio/Portfolio/angular-portfolio
    
    echo "✅ Images construites localement"
    echo "📋 Images disponibles:"
    docker images | grep hulbert
}

# Fonction pour déployer (uniquement depuis main)
deploy_to_vps() {
    current_branch=$(git branch --show-current)
    
    if [ "$current_branch" != "main" ]; then
        echo "❌ Déploiement uniquement autorisé depuis la branche main"
        echo "💡 Utilisez '$0 merge' pour merger dev vers main et déployer"
        exit 1
    fi
    
    echo "🚀 Déploiement sur le VPS..."
    echo "⚠️  Cette action va déployer en production!"
    read -p "Êtes-vous sûr? (y/N): " confirm
    
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "❌ Déploiement annulé"
        exit 1
    fi
    
    # Push vers main pour déclencher le déploiement automatique
    git push origin main
    
    echo "✅ Push vers main effectué"
    echo "🔍 Suivez le déploiement sur: https://github.com/HrodMarRik/HULBERT-1/actions"
}

# Fonction pour merger dev vers main
merge_to_main() {
    echo "🔄 Merge dev vers main..."
    
    # S'assurer qu'on est sur dev
    git checkout dev
    
    # Vérifier que dev est à jour
    echo "📥 Récupération des dernières modifications..."
    git pull origin dev
    
    # Basculer sur main
    git checkout main
    git pull origin main
    
    # Merger dev dans main
    echo "🔀 Merge de dev vers main..."
    git merge dev --no-ff -m "Merge dev into main for production deployment"
    
    # Push vers main (déclenche le déploiement)
    echo "📤 Push vers main (déclenche le déploiement automatique)..."
    git push origin main
    
    echo "✅ Merge terminé et déploiement déclenché"
    echo "🔍 Suivez le déploiement sur: https://github.com/HrodMarRik/HULBERT-1/actions"
}

# Fonction pour afficher le statut
show_status() {
    echo "📊 Statut des branches:"
    echo "======================"
    
    echo "🌿 Branche actuelle: $(git branch --show-current)"
    echo ""
    
    echo "📋 Branches locales:"
    git branch -v
    
    echo ""
    echo "📋 Branches distantes:"
    git branch -r
    
    echo ""
    echo "📈 Derniers commits:"
    git log --oneline -5
    
    echo ""
    echo "🔄 Statut du working directory:"
    git status --short
}

# Menu principal
case "${1:-help}" in
    "dev")
        work_on_dev
        ;;
    "test")
        run_tests
        ;;
    "build")
        build_images
        ;;
    "deploy")
        deploy_to_vps
        ;;
    "merge")
        merge_to_main
        ;;
    "status")
        show_status
        ;;
    "help"|*)
        show_help
        ;;
esac
