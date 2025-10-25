#!/bin/bash

# Script pour donner des missions aux agents HULBERT-1

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[MISSION]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Fonction pour créer un nouveau projet
create_project() {
    local domain=$1
    local level=$2
    local name=$3
    local description=$4
    local technologies=$5
    
    log "Création du projet: $name dans $domain/$level"
    
    # Créer le projet via Master Agent
    node -e "
    const { MasterAgent } = require('./.agents/core/master-agent.ts');
    const master = new MasterAgent();
    
    master.createProject('$domain', '$level', '$name', {
        description: '$description',
        technologies: '$technologies'.split(','),
        status: 'created',
        mission: 'Projet créé via script de mission',
        created_at: new Date().toISOString()
    }).then(() => {
        console.log('✅ Projet $name créé avec succès');
    }).catch(err => {
        console.error('❌ Erreur:', err);
    });
    "
    
    success "Mission de création de projet assignée!"
}

# Fonction pour synchroniser avec Notion
sync_notion() {
    log "Mission de synchronisation Notion assignée"
    
    node -e "
    const { NotionSyncAgent } = require('./.agents/core/notion-sync-agent.ts');
    const agent = new NotionSyncAgent();
    
    agent.manualSync().then(() => {
        console.log('✅ Synchronisation Notion terminée');
    }).catch(err => {
        console.error('❌ Erreur synchronisation:', err);
    });
    "
    
    success "Mission de synchronisation terminée!"
}

# Fonction pour analyser un challenge Root-Me
analyze_challenge() {
    local challenge_id=$1
    local challenge_title=$2
    
    log "Mission d'analyse du challenge: $challenge_title"
    
    # Mettre à jour le contexte pour le Security Agent
    node -e "
    const fs = require('fs');
    const contextPath = '.agents/context/rootme-challenges.json';
    
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
    
    // Ajouter le nouveau challenge
    const newChallenge = {
        id: '$challenge_id',
        title: '$challenge_title',
        category: 'App-Script',
        difficulty: 'Facile',
        status: 'En cours',
        description: 'Challenge analysé via script de mission',
        techniques: [],
        progress: {
            steps_completed: 0,
            total_steps: 10,
            last_attempt: new Date().toISOString(),
            notes: 'Mission assignée pour analyse'
        }
    };
    
    context.challenges.push(newChallenge);
    context.last_updated = new Date().toISOString();
    
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
    console.log('✅ Challenge ajouté au contexte');
    "
    
    success "Mission d'analyse de challenge assignée!"
}

# Fonction pour suivre la progression d'apprentissage
track_learning() {
    local domain=$1
    local skill=$2
    local hours=$3
    
    log "Mission de suivi d'apprentissage: $skill dans $domain"
    
    node -e "
    const fs = require('fs');
    const contextPath = '.agents/context/learning-progress.json';
    
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
    
    if (!context.domains['$domain']) {
        context.domains['$domain'] = {
            level: 'beginner',
            progress_percentage: 0,
            skills_acquired: [],
            skills_in_progress: ['$skill'],
            skills_planned: [],
            time_invested: { total_hours: 0, this_month: 0, this_week: 0 },
            achievements: [],
            goals: { short_term: [], medium_term: [], long_term: [] }
        };
    }
    
    // Ajouter le temps investi
    context.domains['$domain'].time_invested.total_hours += $hours;
    context.domains['$domain'].time_invested.this_month += $hours;
    context.domains['$domain'].time_invested.this_week += $hours;
    
    // Ajouter la compétence en cours
    if (!context.domains['$domain'].skills_in_progress.includes('$skill')) {
        context.domains['$domain'].skills_in_progress.push('$skill');
    }
    
    context.last_updated = new Date().toISOString();
    
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2));
    console.log('✅ Progression d\\'apprentissage mise à jour');
    "
    
    success "Mission de suivi d'apprentissage assignée!"
}

# Fonction pour générer un rapport
generate_report() {
    local report_type=$1
    
    log "Mission de génération de rapport: $report_type"
    
    node -e "
    const fs = require('fs');
    const path = require('path');
    
    // Lire le contexte
    const projectState = JSON.parse(fs.readFileSync('.agents/context/project-state.json', 'utf8'));
    const learningProgress = JSON.parse(fs.readFileSync('.agents/context/learning-progress.json', 'utf8'));
    const rootMeChallenges = JSON.parse(fs.readFileSync('.agents/context/rootme-challenges.json', 'utf8'));
    
    // Générer le rapport
    const report = \`# Rapport HULBERT-1 - \${new Date().toLocaleDateString()}

## Projets Actifs
\${Object.keys(projectState.projects.domains).length} domaines avec projets

## Progression d'Apprentissage
\${Object.keys(learningProgress.domains).length} domaines en cours d'apprentissage

## Challenges Root-Me
\${rootMeChallenges.challenges.length} challenges suivis

## Recommandations
- Continuer les projets en cours
- Synchroniser régulièrement avec Notion
- Analyser les nouveaux challenges
\`;
    
    // Sauvegarder le rapport
    const reportPath = \`resources/documentation/reports/rapport-\${new Date().toISOString().split('T')[0]}.md\`;
    fs.writeFileSync(reportPath, report);
    
    console.log('✅ Rapport généré:', reportPath);
    "
    
    success "Mission de génération de rapport terminée!"
}

# Fonction pour créer du contenu
create_content() {
    local topic=$1
    local domain=$2
    local level=$3
    local subcategory=$4
    local depth=${5:-intermediate}
    local template=${6:-documentation-technique}
    
    log "Mission de création de contenu: $topic dans $domain/$level"
    
    node -e "
    const { MasterAgent } = require('./.agents/core/master-agent.ts');
    const master = new MasterAgent();
    
    master.createContent({
        topic: '$topic',
        domain: '$domain',
        level: '$level',
        subcategory: '$subcategory',
        depth: '$depth',
        template: '$template'
    }).then((outputPath) => {
        console.log('✅ Contenu créé:', outputPath);
    }).catch(err => {
        console.error('❌ Erreur:', err);
    });
    "
    
    success "Mission de création de contenu assignée!"
}

# Fonction pour explorer un domaine
explore_domain() {
    local domain=$1
    
    log "Mission d'exploration du domaine: $domain"
    
    node -e "
    const { MasterAgent } = require('./.agents/core/master-agent.ts');
    const master = new MasterAgent();
    
    master.exploreDomain('$domain').then((analysis) => {
        console.log('✅ Analyse terminée:', analysis);
    }).catch(err => {
        console.error('❌ Erreur:', err);
    });
    "
    
    success "Mission d'exploration assignée!"
}

# Fonction pour explorer tous les domaines
explore_all() {
    log "Mission d'exploration de tous les domaines"
    
    node -e "
    const { MasterAgent } = require('./.agents/core/master-agent.ts');
    const master = new MasterAgent();
    
    master.exploreAll().then((analyses) => {
        console.log('✅ Exploration terminée:', analyses.length, 'domaines analysés');
    }).catch(err => {
        console.error('❌ Erreur:', err);
    });
    "
    
    success "Mission d'exploration globale assignée!"
}

# Fonction pour marquer un fichier pour révision
mark_for_review() {
    local file_path=$1
    local reason=$2
    
    log "Mission de marquage pour révision: $file_path"
    
    node -e "
    const { MasterAgent } = require('./.agents/core/master-agent.ts');
    const master = new MasterAgent();
    
    master.markForReview('$file_path', '$reason').then(() => {
        console.log('✅ Fichier marqué pour révision');
    }).catch(err => {
        console.error('❌ Erreur:', err);
    });
    "
    
    success "Mission de marquage assignée!"
}

# Fonction pour réviser le contenu ancien
review_old_content() {
    local days_threshold=${1:-90}
    
    log "Mission de révision du contenu ancien ($days_threshold jours)"
    
    node -e "
    const { MasterAgent } = require('./.agents/core/master-agent.ts');
    const master = new MasterAgent();
    
    master.reviewOldContent($days_threshold).then(() => {
        console.log('✅ Révision du contenu ancien terminée');
    }).catch(err => {
        console.error('❌ Erreur:', err);
    });
    "
    
    success "Mission de révision assignée!"
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [COMMAND] [ARGS...]"
    echo ""
    echo "Commands:"
    echo "  create-project <domain> <level> <name> <description> <technologies>"
    echo "  sync-notion"
    echo "  analyze-challenge <id> <title>"
    echo "  track-learning <domain> <skill> <hours>"
    echo "  generate-report <type>"
    echo ""
    echo "Content Management Commands:"
    echo "  create-content <topic> <domain> <level> [subcategory] [depth] [template]"
    echo "  explore-domain <domain>"
    echo "  explore-all"
    echo "  mark-for-review <file_path> <reason>"
    echo "  review-old-content [days_threshold]"
    echo ""
    echo "  help"
    echo ""
    echo "Examples:"
    echo "  $0 create-project informatique 02-projects budget-app 'Application de budget' 'Angular,TypeScript'"
    echo "  $0 create-content 'gestion portefeuille crypto' finance 01-learning investissement comprehensive"
    echo "  $0 explore-domain informatique"
    echo "  $0 explore-all"
    echo "  $0 mark-for-review domains/finance/guide.md 'contenu obsolète'"
    echo "  $0 review-old-content 90"
}

# Main
case "$1" in
    "create-project")
        if [ $# -ne 6 ]; then
            echo "Usage: $0 create-project <domain> <level> <name> <description> <technologies>"
            exit 1
        fi
        create_project "$2" "$3" "$4" "$5" "$6"
        ;;
    "sync-notion")
        sync_notion
        ;;
    "analyze-challenge")
        if [ $# -ne 3 ]; then
            echo "Usage: $0 analyze-challenge <id> <title>"
            exit 1
        fi
        analyze_challenge "$2" "$3"
        ;;
    "track-learning")
        if [ $# -ne 4 ]; then
            echo "Usage: $0 track-learning <domain> <skill> <hours>"
            exit 1
        fi
        track_learning "$2" "$3" "$4"
        ;;
    "generate-report")
        if [ $# -ne 2 ]; then
            echo "Usage: $0 generate-report <type>"
            exit 1
        fi
        generate_report "$2"
        ;;
    "create-content")
        if [ $# -lt 4 ]; then
            error "Usage: $0 create-content <topic> <domain> <level> [subcategory] [depth] [template]"
            exit 1
        fi
        create_content "$2" "$3" "$4" "$5" "$6" "$7"
        ;;
    "explore-domain")
        if [ $# -ne 2 ]; then
            error "Usage: $0 explore-domain <domain>"
            exit 1
        fi
        explore_domain "$2"
        ;;
    "explore-all")
        explore_all
        ;;
    "mark-for-review")
        if [ $# -ne 3 ]; then
            error "Usage: $0 mark-for-review <file_path> <reason>"
            exit 1
        fi
        mark_for_review "$2" "$3"
        ;;
    "review-old-content")
        review_old_content "$2"
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "Commande inconnue: $1"
        show_help
        exit 1
        ;;
esac
