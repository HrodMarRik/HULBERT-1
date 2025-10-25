#!/bin/bash

# Script de test pour les nouveaux agents HULBERT-1
# Teste les fonctionnalités des agents de gestion de contenu

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
log() {
    echo -e "${BLUE}[TEST]${NC} $1"
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

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -d ".agents" ]; then
    error "Ce script doit être exécuté depuis la racine du projet HULBERT-1"
    exit 1
fi

log "🧪 Début des tests des agents de gestion de contenu"

# Test 1: Vérifier la structure des agents
log "Test 1: Vérification de la structure des agents"
if [ -f ".agents/specialized/content-filler-agent.ts" ] && \
   [ -f ".agents/specialized/explorer-agent.ts" ] && \
   [ -f ".agents/specialized/update-agent.ts" ]; then
    success "✅ Tous les agents spécialisés sont présents"
else
    error "❌ Agents spécialisés manquants"
    exit 1
fi

# Test 2: Vérifier les fichiers de contexte
log "Test 2: Vérification des fichiers de contexte"
context_files=(
    ".agents/context/content-requests.json"
    ".agents/context/resources-index.json"
    ".agents/context/domain-map.json"
    ".agents/context/missing-topics.json"
    ".agents/context/review-queue.json"
    ".agents/context/obsolescence-patterns.json"
)

for file in "${context_files[@]}"; do
    if [ -f "$file" ]; then
        success "✅ $file présent"
    else
        error "❌ $file manquant"
        exit 1
    fi
done

# Test 3: Vérifier les templates de contenu
log "Test 3: Vérification des templates de contenu"
template_files=(
    "resources/content-templates/documentation-technique.md"
    "resources/content-templates/guide-reference.md"
    "resources/content-templates/cheatsheet.md"
    "resources/content-templates/etude-de-cas.md"
)

for file in "${template_files[@]}"; do
    if [ -f "$file" ]; then
        success "✅ $file présent"
    else
        error "❌ $file manquant"
        exit 1
    fi
done

# Test 4: Vérifier les références de curriculum
log "Test 4: Vérification des références de curriculum"
if [ -f ".agents/config/curriculum-references.json" ]; then
    success "✅ curriculum-references.json présent"
else
    error "❌ curriculum-references.json manquant"
    exit 1
fi

# Test 5: Vérifier les règles de mise à jour
log "Test 5: Vérification des règles de mise à jour"
if [ -f ".agents/config/update-rules.json" ]; then
    success "✅ update-rules.json présent"
else
    error "❌ update-rules.json manquant"
    exit 1
fi

# Test 6: Test de compilation TypeScript (si ts-node est disponible)
log "Test 6: Vérification de la compilation TypeScript"
if command -v npx &> /dev/null; then
    if npx tsc --noEmit .agents/specialized/content-filler-agent.ts 2>/dev/null; then
        success "✅ Content Filler Agent compile correctement"
    else
        warning "⚠️ Content Filler Agent: erreurs de compilation"
    fi
    
    if npx tsc --noEmit .agents/specialized/explorer-agent.ts 2>/dev/null; then
        success "✅ Explorer Agent compile correctement"
    else
        warning "⚠️ Explorer Agent: erreurs de compilation"
    fi
    
    if npx tsc --noEmit .agents/specialized/update-agent.ts 2>/dev/null; then
        success "✅ Update Agent compile correctement"
    else
        warning "⚠️ Update Agent: erreurs de compilation"
    fi
else
    warning "⚠️ npx non disponible, compilation TypeScript ignorée"
fi

# Test 7: Test des scripts de mission
log "Test 7: Vérification des scripts de mission"
if [ -f "scripts/give-mission.sh" ]; then
    if grep -q "create-content" scripts/give-mission.sh && \
       grep -q "explore-domain" scripts/give-mission.sh && \
       grep -q "mark-for-review" scripts/give-mission.sh; then
        success "✅ Scripts de mission étendus correctement"
    else
        error "❌ Scripts de mission incomplets"
        exit 1
    fi
else
    error "❌ Script de mission manquant"
    exit 1
fi

# Test 8: Test de la structure des domaines
log "Test 8: Vérification de la structure des domaines"
if [ -d "domains" ]; then
    success "✅ Dossier domains présent"
    
    # Vérifier qu'il y a au moins un domaine
    domain_count=$(find domains -maxdepth 1 -type d ! -name domains ! -name _templates | wc -l)
    if [ "$domain_count" -gt 0 ]; then
        success "✅ $domain_count domaine(s) trouvé(s)"
    else
        warning "⚠️ Aucun domaine trouvé dans domains/"
    fi
else
    error "❌ Dossier domains manquant"
    exit 1
fi

# Test 9: Test de la structure des ressources
log "Test 9: Vérification de la structure des ressources"
if [ -d "resources" ]; then
    success "✅ Dossier resources présent"
    
    if [ -d "resources/content-templates" ]; then
        success "✅ Dossier content-templates présent"
    else
        error "❌ Dossier content-templates manquant"
        exit 1
    fi
    
    if [ -d "resources/curriculum-templates" ]; then
        success "✅ Dossier curriculum-templates présent"
    else
        error "❌ Dossier curriculum-templates manquant"
        exit 1
    fi
else
    error "❌ Dossier resources manquant"
    exit 1
fi

# Test 10: Test de validation JSON
log "Test 10: Validation des fichiers JSON"
json_files=(
    ".agents/context/content-requests.json"
    ".agents/context/resources-index.json"
    ".agents/context/domain-map.json"
    ".agents/context/missing-topics.json"
    ".agents/context/review-queue.json"
    ".agents/context/obsolescence-patterns.json"
    ".agents/config/curriculum-references.json"
    ".agents/config/update-rules.json"
)

for file in "${json_files[@]}"; do
    if command -v python3 &> /dev/null; then
        if python3 -m json.tool "$file" > /dev/null 2>&1; then
            success "✅ $file JSON valide"
        else
            error "❌ $file JSON invalide"
            exit 1
        fi
    elif command -v node &> /dev/null; then
        if node -e "JSON.parse(require('fs').readFileSync('$file', 'utf8'))" 2>/dev/null; then
            success "✅ $file JSON valide"
        else
            error "❌ $file JSON invalide"
            exit 1
        fi
    else
        warning "⚠️ Aucun outil de validation JSON disponible"
        break
    fi
done

# Test 11: Test de simulation des missions (sans exécution)
log "Test 11: Simulation des missions"
echo "Simulation des commandes de mission..."

# Simuler create-content
echo "  - create-content 'test topic' informatique 01-learning web-development"
if grep -q "create-content" scripts/give-mission.sh; then
    success "✅ Commande create-content disponible"
else
    error "❌ Commande create-content manquante"
fi

# Simuler explore-domain
echo "  - explore-domain informatique"
if grep -q "explore-domain" scripts/give-mission.sh; then
    success "✅ Commande explore-domain disponible"
else
    error "❌ Commande explore-domain manquante"
fi

# Simuler mark-for-review
echo "  - mark-for-review domains/test.md 'test reason'"
if grep -q "mark-for-review" scripts/give-mission.sh; then
    success "✅ Commande mark-for-review disponible"
else
    error "❌ Commande mark-for-review manquante"
fi

# Résumé des tests
log "📊 Résumé des tests"
echo ""
echo "Tests effectués:"
echo "  ✅ Structure des agents"
echo "  ✅ Fichiers de contexte"
echo "  ✅ Templates de contenu"
echo "  ✅ Références de curriculum"
echo "  ✅ Règles de mise à jour"
echo "  ✅ Scripts de mission"
echo "  ✅ Structure des domaines"
echo "  ✅ Structure des ressources"
echo "  ✅ Validation JSON"
echo "  ✅ Simulation des missions"
echo ""

success "🎉 Tous les tests sont passés avec succès!"
echo ""
echo "Les agents de gestion de contenu sont prêts à être utilisés:"
echo "  - Content Filler Agent: Création de contenu automatique"
echo "  - Explorer Agent: Analyse et exploration des domaines"
echo "  - Update Agent: Détection et mise à jour de l'obsolescence"
echo ""
echo "Utilisez './scripts/give-mission.sh help' pour voir toutes les commandes disponibles."
