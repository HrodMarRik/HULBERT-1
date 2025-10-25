#!/bin/bash

# Script de configuration HULBERT-1
# Crée la structure complète et configure l'environnement

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Fonction pour vérifier les prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé. Veuillez l'installer depuis https://nodejs.org/"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        error "npm n'est pas installé. Veuillez installer Node.js qui inclut npm."
        exit 1
    fi
    
    # Vérifier Python
    if ! command -v python3 &> /dev/null; then
        warning "Python 3 n'est pas installé. Recommandé pour les projets Python."
    fi
    
    success "Prérequis vérifiés!"
}

# Fonction pour créer la structure de base
create_structure() {
    log "Création de la structure de base..."
    
    # Créer les dossiers principaux
    mkdir -p .agents/{core,specialized,context,config,scripts}
    mkdir -p domains/{informatique,economie,finance,entrepreneuriat,politique,sciences}
    mkdir -p tools/{scripts,widgets,libraries}
    mkdir -p resources/{documentation,datasets,templates,media}
    mkdir -p archive/{old-projects,deprecated}
    mkdir -p config/{environments,credentials}
    mkdir -p docs
    mkdir -p scripts
    
    # Créer les sous-structures pour chaque domaine
    for domain in informatique economie finance entrepreneuriat politique sciences; do
        mkdir -p "domains/$domain/01-learning"
        mkdir -p "domains/$domain/02-projects"
        mkdir -p "domains/$domain/03-production"
    done
    
    # Créer les sous-structures spécifiques
    mkdir -p domains/informatique/01-learning/{cybersecurity,web-development,backend,data-science,devops,blockchain}
    mkdir -p domains/informatique/01-learning/cybersecurity/ctf-writeups
    mkdir -p domains/informatique/01-learning/web-development/{angular,react,vue}
    mkdir -p domains/informatique/01-learning/backend/{python,nodejs,php}
    
    mkdir -p domains/economie/01-learning/{microeconomie,macroeconomie,econometrie}
    mkdir -p domains/economie/02-projects/{analyses,simulations}
    
    mkdir -p domains/finance/01-learning/{finance-personnelle,investissement,fiscalite}
    mkdir -p domains/finance/02-projects/{budget-tracker,portfolio-manager,trading-bots}
    
    mkdir -p domains/entrepreneuriat/01-learning/{auto-entrepreneur,business-models,marketing}
    mkdir -p domains/entrepreneuriat/02-projects/{business-plans,mvp}
    
    mkdir -p domains/politique/01-learning/{systemes-politiques,relations-internationales,histoire-politique}
    mkdir -p domains/politique/02-analyses/{actualites,etudes-de-cas}
    
    mkdir -p domains/sciences/{mathematiques,physique,mecanique}
    mkdir -p domains/sciences/mathematiques/01-learning/{algebre,analyse,geometrie,statistiques}
    mkdir -p domains/sciences/physique/01-learning/{mecanique,thermodynamique,electromagnetisme}
    mkdir -p domains/sciences/mecanique/01-learning/{mecanique-classique,mecanique-fluides}
    
    # Créer les templates
    mkdir -p domains/_templates/{domain-structure,project-template}
    
    success "Structure créée!"
}

# Fonction pour installer les dépendances
install_dependencies() {
    log "Installation des dépendances..."
    
    # Créer package.json pour les agents
    cat > .agents/package.json << EOF
{
  "name": "hulbert-agents",
  "version": "1.0.0",
  "description": "Système multi-agents HULBERT-1",
  "main": "core/master-agent.ts",
  "scripts": {
    "start": "ts-node core/master-agent.ts",
    "dev": "ts-node --watch core/master-agent.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@notionhq/client": "^2.2.13",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.0"
  }
}
EOF
    
    # Installer les dépendances
    cd .agents
    npm install
    cd ..
    
    success "Dépendances installées!"
}

# Fonction pour créer les fichiers de configuration
create_config_files() {
    log "Création des fichiers de configuration..."
    
    # Créer le fichier de configuration principal s'il n'existe pas
    if [ ! -f "config/project-config.json" ]; then
        cat > config/project-config.json << EOF
{
  "project": {
    "name": "HULBERT-1",
    "version": "2.0.0",
    "description": "Écosystème de développement personnel multi-domaines",
    "domains": [
      "informatique",
      "economie", 
      "finance",
      "entrepreneuriat",
      "politique",
      "sciences"
    ]
  },
  "notion": {
    "syncEnabled": true,
    "syncInterval": 3600,
    "workspaceId": "",
    "configPath": "config/notion.env"
  },
  "agents": {
    "autoStart": true,
    "masterAgent": {
      "enabled": true,
      "port": 3000,
      "logLevel": "info"
    },
    "notionSyncAgent": {
      "enabled": true,
      "interval": 3600,
      "autoSync": true
    },
    "securityAgent": {
      "enabled": true,
      "monitorRootMe": true,
      "challengePath": ".agents/context/challenges/"
    },
    "devAgent": {
      "enabled": true,
      "monitorProjects": true,
      "autoDeploy": false
    },
    "learningAgent": {
      "enabled": true,
      "trackProgress": true,
      "progressPath": ".agents/context/learning-progress.json"
    }
  },
  "paths": {
    "domains": "domains/",
    "tools": "tools/",
    "resources": "resources/",
    "agents": ".agents/",
    "config": "config/",
    "docs": "docs/"
  },
  "features": {
    "multiAgentSystem": true,
    "notionSync": true,
    "projectTracking": true,
    "learningProgress": true,
    "automation": true
  }
}
EOF
    fi
    
    # Créer le fichier .env pour Notion s'il n'existe pas
    if [ ! -f "config/notion.env" ]; then
        cat > config/notion.env << EOF
# Configuration Notion
NOTION_TOKEN=your_notion_token_here
BUREAU_DATABASE_ID=your_database_id_here
NOTION_PARENT_PAGE_ID=your_parent_page_id_here
NOTION_SYNC_INTERVAL=3600
EOF
        warning "Fichier config/notion.env créé. Veuillez le configurer avec vos tokens Notion."
    fi
    
    success "Fichiers de configuration créés!"
}

# Fonction pour créer les scripts de gestion
create_management_scripts() {
    log "Création des scripts de gestion..."
    
    # Script de démarrage des agents
    cat > scripts/run-agents.sh << 'EOF'
#!/bin/bash

# Script de démarrage des agents HULBERT-1

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log "🚀 Démarrage du système multi-agents HULBERT-1..."

# Vérifier que la configuration existe
if [ ! -f "config/project-config.json" ]; then
    echo "❌ Configuration non trouvée. Exécutez d'abord ./scripts/setup.sh"
    exit 1
fi

# Démarrer les agents
cd .agents
npm run start &
AGENTS_PID=$!

success "Agents démarrés (PID: $AGENTS_PID)"
log "Appuyez sur Ctrl+C pour arrêter les agents"

# Attendre l'interruption
trap "kill $AGENTS_PID; success 'Agents arrêtés'; exit" INT
wait
EOF
    
    # Script de synchronisation Notion
    cat > scripts/sync-notion.sh << 'EOF'
#!/bin/bash

# Script de synchronisation manuelle avec Notion

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log "🔄 Synchronisation avec Notion..."

# Vérifier la configuration Notion
if [ ! -f "config/notion.env" ]; then
    echo "❌ Configuration Notion non trouvée. Veuillez configurer config/notion.env"
    exit 1
fi

# Exécuter la synchronisation
cd .agents
node -e "
const { NotionSyncAgent } = require('./core/notion-sync-agent.ts');
const agent = new NotionSyncAgent();
agent.manualSync().then(() => {
    console.log('✅ Synchronisation terminée');
    process.exit(0);
}).catch(err => {
    console.error('❌ Erreur de synchronisation:', err);
    process.exit(1);
});
"

success "Synchronisation Notion terminée!"
EOF
    
    # Rendre les scripts exécutables
    chmod +x scripts/run-agents.sh
    chmod +x scripts/sync-notion.sh
    
    success "Scripts de gestion créés!"
}

# Fonction pour créer la documentation de base
create_documentation() {
    log "Création de la documentation..."
    
    # README principal
    cat > docs/README.md << 'EOF'
# HULBERT-1 - Projet Personnel Multi-Domaines

## Vision
Écosystème complet de développement personnel couvrant:
- **Informatique** (développement, cybersécurité, data science)
- **Économie** et Finance
- **Entrepreneuriat**
- **Politique**
- **Sciences** (maths, physique, mécanique)

## Organisation
- **Hybride**: Par domaine (informatique, économie, etc.) et par niveau (learning, projects, production)
- **Multi-agents**: Système d'agents autonomes pour automation
- **Notion Sync**: Synchronisation automatique avec Notion

## Démarrage Rapide
```bash
# Setup initial
./scripts/setup.sh

# Lancer les agents
./scripts/run-agents.sh

# Synchroniser avec Notion
./scripts/sync-notion.sh
```

## Structure
```
HULBERT-1/
├── .agents/          # Système multi-agents
├── domains/          # Projets organisés par domaine
├── tools/            # Outils et utilitaires
├── resources/        # Ressources partagées
├── config/           # Configuration globale
└── docs/             # Documentation
```

## Agents Disponibles
- **Master Agent**: Orchestrateur principal
- **Notion Sync Agent**: Synchronisation avec Notion
- **Security Agent**: Gestion challenges CTF et Root-Me
- **Dev Agent**: Projets de développement
- **Learning Agent**: Suivi progression

## Prochaines Étapes
1. Configurer `config/notion.env` avec vos tokens
2. Lancer `./scripts/run-agents.sh`
3. Commencer vos projets dans `domains/`
EOF
    
    # Documentation du système d'agents
    cat > docs/AGENT_SYSTEM.md << 'EOF'
# Système Multi-Agents HULBERT-1

## Architecture
- **Master Agent**: Orchestrateur principal qui gère tous les autres agents
- **Notion Sync Agent**: Synchronise automatiquement avec votre workspace Notion
- **Security Agent**: Surveille et analyse les challenges Root-Me
- **Dev Agent**: Gère les projets de développement (build, tests, déploiement)
- **Learning Agent**: Suit la progression d'apprentissage dans tous les domaines

## Contexte Partagé
Les agents partagent leur contexte via `.agents/context/`:
- `rootme-challenges.json`: Tous les défis Root-Me avec progression
- `project-state.json`: État de tous les projets
- `learning-progress.json`: Progression globale d'apprentissage

## Utilisation
```bash
# Démarrer tous les agents
./scripts/run-agents.sh

# Synchronisation manuelle Notion
./scripts/sync-notion.sh

# Agent spécifique (via Master Agent)
node .agents/core/master-agent.ts start-agent security
```

## Configuration
Modifiez `config/project-config.json` pour:
- Activer/désactiver des agents
- Configurer les intervalles de monitoring
- Personnaliser les chemins

## Monitoring
Les agents génèrent des métriques et logs:
- Santé des projets
- Progression d'apprentissage
- Synchronisation Notion
- Challenges CTF
EOF
    
    success "Documentation créée!"
}

# Fonction pour créer les templates
create_templates() {
    log "Création des templates..."
    
    # Template de domaine
    cat > domains/_templates/domain-structure/README.md << 'EOF'
# Template de Domaine

## Structure Standard
```
domaine/
├── 01-learning/          # Apprentissage et cours
│   ├── cours/
│   ├── exercices/
│   └── ressources/
├── 02-projects/          # Projets en cours
│   ├── projet-1/
│   └── projet-2/
└── 03-production/        # Projets terminés/production
    ├── projet-complet-1/
    └── projet-complet-2/
```

## Niveaux
- **01-learning**: Apprentissage, cours, exercices
- **02-projects**: Projets en cours de développement
- **03-production**: Projets terminés ou en production

## Bonnes Pratiques
- Un README.md dans chaque projet
- Documentation des technologies utilisées
- Suivi de progression dans les projets
EOF
    
    # Template de projet
    cat > domains/_templates/project-template/README.md << 'EOF'
# Template de Projet

## Informations Générales
- **Nom**: [Nom du projet]
- **Domaine**: [Domaine parent]
- **Niveau**: [learning/projects/production]
- **Technologies**: [Liste des technologies]
- **Statut**: [En cours/Terminé/En pause]

## Description
[Description détaillée du projet]

## Objectifs
- [ ] Objectif 1
- [ ] Objectif 2
- [ ] Objectif 3

## Technologies Utilisées
- [Technologie 1]
- [Technologie 2]
- [Technologie 3]

## Installation
```bash
# Instructions d'installation
```

## Utilisation
```bash
# Instructions d'utilisation
```

## Progression
- [ ] Étape 1
- [ ] Étape 2
- [ ] Étape 3

## Notes
[Notes et observations]

---
*Créé le: [Date]*
*Dernière mise à jour: [Date]*
EOF
    
    success "Templates créés!"
}

# Fonction principale
main() {
    echo "🚀 Configuration HULBERT-1..."
    echo ""
    
    check_prerequisites
    create_structure
    install_dependencies
    create_config_files
    create_management_scripts
    create_documentation
    create_templates
    
    echo ""
    success "🎉 Configuration HULBERT-1 terminée!"
    echo ""
    echo "Prochaines étapes:"
    echo "1. Configurez config/notion.env avec vos tokens Notion"
    echo "2. Lancez ./scripts/run-agents.sh pour démarrer les agents"
    echo "3. Commencez vos projets dans domains/"
    echo ""
    echo "Documentation disponible dans docs/"
}

# Exécuter la fonction principale
main "$@"
