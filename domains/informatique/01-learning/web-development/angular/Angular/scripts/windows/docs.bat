@echo off
setlocal enabledelayedexpansion

REM Script de documentation pour le tutoriel Angular n-tier (Windows)

set "DOC_TYPE=%~1"
if "%DOC_TYPE%"=="" set "DOC_TYPE=all"

set "DOC_DIR=%DOC_DIR%"
if "%DOC_DIR%"=="" set "DOC_DIR=docs"

set "OUTPUT_DIR=%OUTPUT_DIR%"
if "%OUTPUT_DIR%"=="" set "OUTPUT_DIR=output"

REM Fonction pour afficher les messages
:log
echo [INFO] %~1
goto :eof

:success
echo [SUCCESS] %~1
goto :eof

:warn
echo [WARNING] %~1
goto :eof

:error
echo [ERROR] %~1
goto :eof

REM Fonction pour vérifier les prérequis
:check_prerequisites
call :log "Vérification des prérequis de documentation..."

where pandoc >nul 2>&1
if %errorlevel% neq 0 (
    call :warn "pandoc n'est pas installé. Certaines conversions de documentation seront limitées."
)

where git >nul 2>&1
if %errorlevel% neq 0 (
    call :warn "Git n'est pas installé. Certaines fonctionnalités de documentation seront limitées."
)

call :success "Prérequis de documentation vérifiés!"
goto :eof

REM Fonction pour créer les répertoires nécessaires
:create_directories
call :log "Création des répertoires nécessaires..."

if not exist "%DOC_DIR%" mkdir "%DOC_DIR%"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
if not exist "%OUTPUT_DIR%\html" mkdir "%OUTPUT_DIR%\html"
if not exist "%OUTPUT_DIR%\pdf" mkdir "%OUTPUT_DIR%\pdf"
if not exist "%OUTPUT_DIR%\epub" mkdir "%OUTPUT_DIR%\epub"
if not exist "%OUTPUT_DIR%\mobi" mkdir "%OUTPUT_DIR%\mobi"

call :success "Répertoires créés!"
goto :eof

REM Fonction pour générer la documentation HTML
:generate_html
call :log "Génération de la documentation HTML..."

set "html_file=%OUTPUT_DIR%\html\index.html"

(
echo ^<!DOCTYPE html^>
echo ^<html lang="fr"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Tutoriel Angular n-tier^</title^>
echo     ^<style^>
echo         body { font-family: Arial, sans-serif; margin: 40px; }
echo         h1, h2, h3 { color: #333; }
echo         code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
echo         pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
echo         .toc { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
echo         .toc ul { list-style-type: none; padding-left: 0; }
echo         .toc li { margin: 5px 0; }
echo         .toc a { text-decoration: none; color: #0066cc; }
echo         .toc a:hover { text-decoration: underline; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>Tutoriel Angular n-tier^</h1^>
echo     
echo     ^<div class="toc"^>
echo         ^<h2^>Table des matières^</h2^>
echo         ^<ul^>
echo             ^<li^>^<a href="#introduction"^>Introduction^</a^>^</li^>
echo             ^<li^>^<a href="#architecture"^>Architecture n-tier^</a^>^</li^>
echo             ^<li^>^<a href="#frontend"^>Frontend Angular^</a^>^</li^>
echo             ^<li^>^<a href="#backend"^>Backend Python/FastAPI^</a^>^</li^>
echo             ^<li^>^<a href="#database"^>Base de données PostgreSQL^</a^>^</li^>
echo             ^<li^>^<a href="#deployment"^>Déploiement^</a^>^</li^>
echo             ^<li^>^<a href="#exercises"^>Exercices^</a^>^</li^>
echo         ^</ul^>
echo     ^</div^>
echo     
echo     ^<h2 id="introduction"^>Introduction^</h2^>
echo     ^<p^>Ce tutoriel vous guide à travers la création d'une application web complète utilisant Angular, TypeScript, Python/FastAPI et PostgreSQL dans une architecture n-tier.^</p^>
echo     
echo     ^<h2 id="architecture"^>Architecture n-tier^</h2^>
echo     ^<p^>L'architecture n-tier sépare l'application en plusieurs couches logiques :^</p^>
echo     ^<ul^>
echo         ^<li^>^<strong^>Présentation^</strong^> : Interface utilisateur Angular^</li^>
echo         ^<li^>^<strong^>Application^</strong^> : Logique métier FastAPI^</li^>
echo         ^<li^>^<strong^>Données^</strong^> : Base de données PostgreSQL^</li^>
echo     ^</ul^>
echo     
echo     ^<h2 id="frontend"^>Frontend Angular^</h2^>
echo     ^<p^>Le frontend Angular utilise TypeScript et suit les meilleures pratiques de développement.^</p^>
echo     
echo     ^<h2 id="backend"^>Backend Python/FastAPI^</h2^>
echo     ^<p^>Le backend FastAPI fournit une API REST moderne et performante.^</p^>
echo     
echo     ^<h2 id="database"^>Base de données PostgreSQL^</h2^>
echo     ^<p^>PostgreSQL est utilisé comme base de données relationnelle robuste.^</p^>
echo     
echo     ^<h2 id="deployment"^>Déploiement^</h2^>
echo     ^<p^>Le déploiement utilise Docker et Docker Compose pour la containerisation.^</p^>
echo     
echo     ^<h2 id="exercises"^>Exercices^</h2^>
echo     ^<p^>Des exercices pratiques sont fournis pour renforcer l'apprentissage.^</p^>
echo ^</body^>
echo ^</html^>
) > "%html_file%"

call :success "Documentation HTML générée: %html_file%"
goto :eof

REM Fonction pour générer la documentation PDF
:generate_pdf
call :log "Génération de la documentation PDF..."

where pandoc >nul 2>&1
if %errorlevel% equ 0 (
    set "pdf_file=%OUTPUT_DIR%\pdf\tutorial.pdf"
    
    pandoc "%DOC_DIR%\*.md" -o "%pdf_file%" --pdf-engine=pdflatex --toc --toc-depth=3
    if %errorlevel% equ 0 (
        call :success "Documentation PDF générée: %pdf_file%"
    ) else (
        call :error "Échec de la génération PDF"
        exit /b 1
    )
) else (
    call :warn "pandoc n'est pas installé. Génération PDF ignorée."
)
goto :eof

REM Fonction pour générer la documentation EPUB
:generate_epub
call :log "Génération de la documentation EPUB..."

where pandoc >nul 2>&1
if %errorlevel% equ 0 (
    set "epub_file=%OUTPUT_DIR%\epub\tutorial.epub"
    
    pandoc "%DOC_DIR%\*.md" -o "%epub_file%" --toc --toc-depth=3
    if %errorlevel% equ 0 (
        call :success "Documentation EPUB générée: %epub_file%"
    ) else (
        call :error "Échec de la génération EPUB"
        exit /b 1
    )
) else (
    call :warn "pandoc n'est pas installé. Génération EPUB ignorée."
)
goto :eof

REM Fonction pour générer la documentation MOBI
:generate_mobi
call :log "Génération de la documentation MOBI..."

where pandoc >nul 2>&1
if %errorlevel% equ 0 (
    set "mobi_file=%OUTPUT_DIR%\mobi\tutorial.mobi"
    
    pandoc "%DOC_DIR%\*.md" -o "%mobi_file%" --toc --toc-depth=3
    if %errorlevel% equ 0 (
        call :success "Documentation MOBI générée: %mobi_file%"
    ) else (
        call :error "Échec de la génération MOBI"
        exit /b 1
    )
) else (
    call :warn "pandoc n'est pas installé. Génération MOBI ignorée."
)
goto :eof

REM Fonction pour générer la documentation complète
:generate_all
call :log "Génération de la documentation complète..."

call :generate_html
call :generate_pdf
call :generate_epub
call :generate_mobi

call :success "Documentation complète générée!"
goto :eof

REM Fonction pour afficher l'aide
:show_help
echo Usage: %~nx0 [DOC_TYPE] [OPTIONS]
echo.
echo Documentation Types:
echo   all         Tous les types de documentation (défaut)
echo   html        Documentation HTML seulement
echo   pdf         Documentation PDF seulement
echo   epub        Documentation EPUB seulement
echo   mobi        Documentation MOBI seulement
echo   help        Afficher cette aide
echo.
echo Options:
echo   DOC_DIR     Répertoire de documentation (défaut: docs)
echo   OUTPUT_DIR  Répertoire de sortie (défaut: output)
echo.
echo Examples:
echo   %~nx0 all
echo   %~nx0 html
echo   set DOC_DIR=/custom/docs && %~nx0 all
goto :eof

REM Fonction principale
:main
if "%DOC_TYPE%"=="all" (
    call :check_prerequisites
    call :create_directories
    call :generate_all
) else if "%DOC_TYPE%"=="html" (
    call :check_prerequisites
    call :create_directories
    call :generate_html
) else if "%DOC_TYPE%"=="pdf" (
    call :check_prerequisites
    call :create_directories
    call :generate_pdf
) else if "%DOC_TYPE%"=="epub" (
    call :check_prerequisites
    call :create_directories
    call :generate_epub
) else if "%DOC_TYPE%"=="mobi" (
    call :check_prerequisites
    call :create_directories
    call :generate_mobi
) else if "%DOC_TYPE%"=="help" (
    call :show_help
) else if "%DOC_TYPE%"=="--help" (
    call :show_help
) else if "%DOC_TYPE%"=="-h" (
    call :show_help
) else (
    call :error "Type de documentation inconnu: %DOC_TYPE%"
    call :show_help
    exit /b 1
)
goto :eof

REM Exécuter la fonction principale
call :main
