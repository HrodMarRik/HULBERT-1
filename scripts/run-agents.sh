#!/bin/bash

# Script de démarrage des agents HULBERT-1

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log "🚀 Démarrage du système multi-agents HULBERT-1..."

# Vérifier que la configuration existe
if [ ! -f "config/project-config.json" ]; then
    error "Configuration non trouvée. Exécutez d'abord ./scripts/setup.sh"
    exit 1
fi

# Vérifier que les agents existent
if [ ! -d ".agents" ]; then
    error "Dossier .agents non trouvé. Exécutez d'abord ./scripts/setup.sh"
    exit 1
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d ".agents/node_modules" ]; then
    log "Installation des dépendances des agents..."
    cd .agents
    npm install
    cd ..
fi

# Démarrer les agents
log "Démarrage des agents..."
cd .agents

# Démarrer le Master Agent
node -e "
const { MasterAgent } = require('./core/master-agent.ts');
const masterAgent = new MasterAgent();

masterAgent.on('initialized', () => {
    console.log('✅ Master Agent initialisé');
});

masterAgent.on('error', (error) => {
    console.error('❌ Erreur Master Agent:', error);
    process.exit(1);
});

masterAgent.initialize().then(() => {
    console.log('🎉 Système multi-agents HULBERT-1 démarré!');
}).catch(err => {
    console.error('❌ Erreur lors du démarrage:', err);
    process.exit(1);
});

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
    console.log('\\n🛑 Arrêt des agents...');
    await masterAgent.shutdown();
    process.exit(0);
});
" &
AGENTS_PID=$!

cd ..

success "Agents démarrés (PID: $AGENTS_PID)"
log "Système multi-agents actif!"
log "Appuyez sur Ctrl+C pour arrêter les agents"

# Attendre l'interruption
trap "kill $AGENTS_PID 2>/dev/null; success 'Agents arrêtés'; exit" INT
wait
