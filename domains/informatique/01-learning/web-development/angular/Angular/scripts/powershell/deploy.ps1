# Script de déploiement pour le tutoriel Angular n-tier (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$Environment = "staging",
    
    [Parameter(Position=1)]
    [string]$Command = "deploy"
)

# Configuration
$DockerRegistry = "your-registry.com"
$ImageTag = "latest"

# Couleurs pour les messages
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Fonction pour afficher les messages
function Write-Log {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Log "Vérification des prérequis de déploiement..."
    
    if (-not (Test-Command "docker")) {
        Write-Error "Docker n'est pas installé. Veuillez l'installer."
        exit 1
    }
    
    if (-not (Test-Command "docker-compose")) {
        Write-Error "Docker Compose n'est pas installé. Veuillez l'installer."
        exit 1
    }
    
    if (-not (Test-Command "kubectl")) {
        Write-Warning "kubectl n'est pas installé. Le déploiement Kubernetes sera ignoré."
    }
    
    Write-Success "Prérequis de déploiement vérifiés!"
}

# Fonction pour vérifier si une commande existe
function Test-Command {
    param([string]$CommandName)
    try {
        Get-Command $CommandName -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Fonction pour construire les images Docker
function Build-Images {
    Write-Log "Construction des images Docker..."
    
    # Frontend
    Write-Log "Construction de l'image frontend..."
    docker build -t "${DockerRegistry}/tuto-angular-frontend:${ImageTag}" .
    
    # Backend
    Write-Log "Construction de l'image backend..."
    docker build -t "${DockerRegistry}/tuto-angular-backend:${ImageTag}" ./backend
    
    Write-Success "Images Docker construites avec succès!"
}

# Fonction pour pousser les images
function Push-Images {
    Write-Log "Poussée des images vers le registry..."
    
    docker push "${DockerRegistry}/tuto-angular-frontend:${ImageTag}"
    docker push "${DockerRegistry}/tuto-angular-backend:${ImageTag}"
    
    Write-Success "Images poussées vers le registry!"
}

# Fonction pour déployer avec Docker Compose
function Deploy-DockerCompose {
    Write-Log "Déploiement avec Docker Compose..."
    
    # Arrêter les services existants
    docker-compose down 2>$null
    
    # Démarrer les nouveaux services
    docker-compose up -d
    
    # Attendre que les services soient prêts
    Write-Log "Attente du démarrage des services..."
    Start-Sleep -Seconds 30
    
    # Vérifier la santé des services
    Test-Health
    
    Write-Success "Déploiement Docker Compose terminé!"
}

# Fonction pour déployer avec Kubernetes
function Deploy-Kubernetes {
    Write-Log "Déploiement avec Kubernetes..."
    
    if (-not (Test-Command "kubectl")) {
        Write-Warning "kubectl n'est pas installé. Déploiement Kubernetes ignoré."
        return
    }
    
    # Appliquer les configurations Kubernetes
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secret.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/ingress.yaml
    
    # Attendre que les pods soient prêts
    kubectl wait --for=condition=ready pod -l app=tuto-angular-frontend --timeout=300s
    kubectl wait --for=condition=ready pod -l app=tuto-angular-backend --timeout=300s
    
    Write-Success "Déploiement Kubernetes terminé!"
}

# Fonction pour vérifier la santé des services
function Test-Health {
    Write-Log "Vérification de la santé des services..."
    
    # Vérifier le frontend
    try {
        Invoke-WebRequest -Uri "http://localhost:80/health" -UseBasicParsing | Out-Null
        Write-Success "Frontend est en ligne"
    }
    catch {
        Write-Error "Frontend n'est pas accessible"
        exit 1
    }
    
    # Vérifier le backend
    try {
        Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing | Out-Null
        Write-Success "Backend est en ligne"
    }
    catch {
        Write-Error "Backend n'est pas accessible"
        exit 1
    }
    
    Write-Success "Tous les services sont en ligne!"
}

# Fonction pour effectuer des tests de régression
function Invoke-RegressionTests {
    Write-Log "Exécution des tests de régression..."
    
    # Tests API
    Write-Log "Tests API..."
    try {
        Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -UseBasicParsing | Out-Null
    }
    catch {
        Write-Error "Tests API échoués"
        exit 1
    }
    
    # Tests frontend
    Write-Log "Tests frontend..."
    try {
        Invoke-WebRequest -Uri "http://localhost:80/" -UseBasicParsing | Out-Null
    }
    catch {
        Write-Error "Tests frontend échoués"
        exit 1
    }
    
    Write-Success "Tests de régression passés!"
}

# Fonction pour effectuer un rollback
function Invoke-Rollback {
    Write-Log "Rollback vers la version précédente..."
    
    # Rollback Docker Compose
    docker-compose down
    docker-compose -f docker-compose.previous.yml up -d
    
    # Rollback Kubernetes
    if (Test-Command "kubectl") {
        kubectl rollout undo deployment/tuto-angular-frontend
        kubectl rollout undo deployment/tuto-angular-backend
    }
    
    Write-Success "Rollback terminé!"
}

# Fonction pour nettoyer
function Clear-Resources {
    Write-Log "Nettoyage des ressources..."
    
    # Nettoyer les images Docker non utilisées
    docker image prune -f
    
    # Nettoyer les volumes Docker non utilisés
    docker volume prune -f
    
    Write-Success "Nettoyage terminé!"
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\deploy.ps1 [ENVIRONMENT] [COMMAND]"
    Write-Host ""
    Write-Host "Environments:"
    Write-Host "  staging     Environnement de staging (défaut)"
    Write-Host "  production  Environnement de production"
    Write-Host ""
    Write-Host "Commands:"
    Write-Host "  build       Construire les images Docker"
    Write-Host "  push        Pousser les images vers le registry"
    Write-Host "  deploy      Déployer l'application"
    Write-Host "  health      Vérifier la santé des services"
    Write-Host "  test        Exécuter les tests de régression"
    Write-Host "  rollback    Effectuer un rollback"
    Write-Host "  cleanup     Nettoyer les ressources"
    Write-Host "  help        Afficher cette aide"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\deploy.ps1 staging build"
    Write-Host "  .\deploy.ps1 production deploy"
    Write-Host "  .\deploy.ps1 staging health"
}

# Fonction principale
function Main {
    switch ($Command.ToLower()) {
        "build" { 
            Test-Prerequisites
            Build-Images 
        }
        "push" { 
            Test-Prerequisites
            Push-Images 
        }
        "deploy" { 
            Test-Prerequisites
            Build-Images
            Push-Images
            Deploy-DockerCompose
            Deploy-Kubernetes
            Test-Health
        }
        "health" { Test-Health }
        "test" { Invoke-RegressionTests }
        "rollback" { Invoke-Rollback }
        "cleanup" { Clear-Resources }
        "help" { Show-Help }
        "--help" { Show-Help }
        "-h" { Show-Help }
        default { 
            Write-Error "Commande inconnue: $Command"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
