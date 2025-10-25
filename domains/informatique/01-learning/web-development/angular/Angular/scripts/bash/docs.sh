#!/bin/bash

# Script de documentation pour le tutoriel Angular n-tier

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOC_TYPE=${1:-all}
DOC_DIR=${DOC_DIR:-"docs"}
OUTPUT_DIR=${OUTPUT_DIR:-"output"}

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
    log "Vérification des prérequis de documentation..."
    
    if ! command -v pandoc >/dev/null 2>&1; then
        warning "pandoc n'est pas installé. Certaines conversions de documentation seront limitées."
    fi
    
    if ! command -v git >/dev/null 2>&1; then
        warning "Git n'est pas installé. Certaines fonctionnalités de documentation seront limitées."
    fi
    
    success "Prérequis de documentation vérifiés!"
}

# Fonction pour créer les répertoires nécessaires
create_directories() {
    log "Création des répertoires nécessaires..."
    
    mkdir -p "$DOC_DIR"
    mkdir -p "$OUTPUT_DIR"
    mkdir -p "$OUTPUT_DIR/html"
    mkdir -p "$OUTPUT_DIR/pdf"
    mkdir -p "$OUTPUT_DIR/epub"
    mkdir -p "$OUTPUT_DIR/mobi"
    
    success "Répertoires créés!"
}

# Fonction pour générer la documentation HTML
generate_html() {
    log "Génération de la documentation HTML..."
    
    local html_file="$OUTPUT_DIR/html/index.html"
    
    cat > "$html_file" << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tutoriel Angular n-tier</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1, h2, h3 { color: #333; }
        code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .toc { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
        .toc ul { list-style-type: none; padding-left: 0; }
        .toc li { margin: 5px 0; }
        .toc a { text-decoration: none; color: #0066cc; }
        .toc a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Tutoriel Angular n-tier</h1>
    
    <div class="toc">
        <h2>Table des matières</h2>
        <ul>
            <li><a href="#introduction">Introduction</a></li>
            <li><a href="#architecture">Architecture n-tier</a></li>
            <li><a href="#frontend">Frontend Angular</a></li>
            <li><a href="#backend">Backend Python/FastAPI</a></li>
            <li><a href="#database">Base de données PostgreSQL</a></li>
            <li><a href="#deployment">Déploiement</a></li>
            <li><a href="#exercises">Exercices</a></li>
        </ul>
    </div>
    
    <h2 id="introduction">Introduction</h2>
    <p>Ce tutoriel vous guide à travers la création d'une application web complète utilisant Angular, TypeScript, Python/FastAPI et PostgreSQL dans une architecture n-tier.</p>
    
    <h2 id="architecture">Architecture n-tier</h2>
    <p>L'architecture n-tier sépare l'application en plusieurs couches logiques :</p>
    <ul>
        <li><strong>Présentation</strong> : Interface utilisateur Angular</li>
        <li><strong>Application</strong> : Logique métier FastAPI</li>
        <li><strong>Données</strong> : Base de données PostgreSQL</li>
    </ul>
    
    <h2 id="frontend">Frontend Angular</h2>
    <p>Le frontend Angular utilise TypeScript et suit les meilleures pratiques de développement.</p>
    
    <h2 id="backend">Backend Python/FastAPI</h2>
    <p>Le backend FastAPI fournit une API REST moderne et performante.</p>
    
    <h2 id="database">Base de données PostgreSQL</h2>
    <p>PostgreSQL est utilisé comme base de données relationnelle robuste.</p>
    
    <h2 id="deployment">Déploiement</h2>
    <p>Le déploiement utilise Docker et Docker Compose pour la containerisation.</p>
    
    <h2 id="exercises">Exercices</h2>
    <p>Des exercices pratiques sont fournis pour renforcer l'apprentissage.</p>
</body>
</html>
EOF
    
    success "Documentation HTML générée: $html_file"
}

# Fonction pour générer la documentation PDF
generate_pdf() {
    log "Génération de la documentation PDF..."
    
    if command -v pandoc >/dev/null 2>&1; then
        local pdf_file="$OUTPUT_DIR/pdf/tutorial.pdf"
        
        pandoc "$DOC_DIR"/*.md -o "$pdf_file" --pdf-engine=pdflatex --toc --toc-depth=3 || {
            error "Échec de la génération PDF"
            return 1
        }
        
        success "Documentation PDF générée: $pdf_file"
    else
        warning "pandoc n'est pas installé. Génération PDF ignorée."
    fi
}

# Fonction pour générer la documentation EPUB
generate_epub() {
    log "Génération de la documentation EPUB..."
    
    if command -v pandoc >/dev/null 2>&1; then
        local epub_file="$OUTPUT_DIR/epub/tutorial.epub"
        
        pandoc "$DOC_DIR"/*.md -o "$epub_file" --toc --toc-depth=3 || {
            error "Échec de la génération EPUB"
            return 1
        }
        
        success "Documentation EPUB générée: $epub_file"
    else
        warning "pandoc n'est pas installé. Génération EPUB ignorée."
    fi
}

# Fonction pour générer la documentation MOBI
generate_mobi() {
    log "Génération de la documentation MOBI..."
    
    if command -v pandoc >/dev/null 2>&1; then
        local mobi_file="$OUTPUT_DIR/mobi/tutorial.mobi"
        
        pandoc "$DOC_DIR"/*.md -o "$mobi_file" --toc --toc-depth=3 || {
            error "Échec de la génération MOBI"
            return 1
        }
        
        success "Documentation MOBI générée: $mobi_file"
    else
        warning "pandoc n'est pas installé. Génération MOBI ignorée."
    fi
}

# Fonction pour générer la documentation complète
generate_all() {
    log "Génération de la documentation complète..."
    
    generate_html
    generate_pdf
    generate_epub
    generate_mobi
    
    success "Documentation complète générée!"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [DOC_TYPE] [OPTIONS]"
    echo ""
    echo "Documentation Types:"
    echo "  all         Tous les types de documentation (défaut)"
    echo "  html        Documentation HTML seulement"
    echo "  pdf         Documentation PDF seulement"
    echo "  epub        Documentation EPUB seulement"
    echo "  mobi        Documentation MOBI seulement"
    echo "  help        Afficher cette aide"
    echo ""
    echo "Options:"
    echo "  DOC_DIR     Répertoire de documentation (défaut: docs)"
    echo "  OUTPUT_DIR  Répertoire de sortie (défaut: output)"
    echo ""
    echo "Examples:"
    echo "  $0 all"
    echo "  $0 html"
    echo "  DOC_DIR=/custom/docs $0 all"
}

# Fonction principale
main() {
    case "$DOC_TYPE" in
        all)
            check_prerequisites
            create_directories
            generate_all
            ;;
        html)
            check_prerequisites
            create_directories
            generate_html
            ;;
        pdf)
            check_prerequisites
            create_directories
            generate_pdf
            ;;
        epub)
            check_prerequisites
            create_directories
            generate_epub
            ;;
        mobi)
            check_prerequisites
            create_directories
            generate_mobi
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Type de documentation inconnu: $DOC_TYPE"
            show_help
            exit 1
            ;;
    esac
}

# Exécuter la fonction principale
main "$@"
