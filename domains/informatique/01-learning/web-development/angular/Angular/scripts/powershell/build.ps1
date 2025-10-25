# Script de build pour le tutoriel Angular n-tier (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$BuildType = "all",
    
    [Parameter(Position=1)]
    [string]$BuildEnv = "production",
    
    [Parameter(Position=2)]
    [string]$DockerRegistry = "your-registry.com",
    
    [Parameter(Position=3)]
    [string]$ImageTag = "latest"
)

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
    Write-Log "Vérification des prérequis de build..."
    
    if (-not (Test-Command "node")) {
        Write-Error "Node.js n'est pas installé. Veuillez l'installer."
        exit 1
    }
    
    if (-not (Test-Command "npm")) {
        Write-Error "npm n'est pas installé. Veuillez installer Node.js qui inclut npm."
        exit 1
    }
    
    if (-not (Test-Command "python")) {
        Write-Error "Python n'est pas installé. Veuillez l'installer."
        exit 1
    }
    
    if (-not (Test-Command "pip")) {
        Write-Error "pip n'est pas installé. Veuillez installer pip pour Python."
        exit 1
    }
    
    if (-not (Test-Command "docker")) {
        Write-Warning "Docker n'est pas installé. Le build Docker sera ignoré."
    }
    
    Write-Success "Prérequis de build vérifiés!"
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

# Fonction pour installer les dépendances
function Install-Dependencies {
    Write-Log "Installation des dépendances..."
    
    # Frontend
    Write-Log "Installation des dépendances frontend..."
    Set-Location "Angular\Tuto-Angular"
    npm ci --only=production
    Set-Location "..\.."
    
    # Backend
    Write-Log "Installation des dépendances backend..."
    Set-Location "Angular\Tuto-Angular\backend"
    pip install -r requirements.txt
    Set-Location "..\..\.."
    
    Write-Success "Dépendances installées!"
}

# Fonction pour construire le frontend
function Build-Frontend {
    Write-Log "Construction du frontend..."
    
    Set-Location "Angular\Tuto-Angular"
    
    # Nettoyer le build précédent
    if (Test-Path "dist") {
        Remove-Item "dist" -Recurse -Force
    }
    
    # Build selon l'environnement
    switch ($BuildEnv.ToLower()) {
        "development" { npm run build }
        "production" { npm run build:prod }
        "staging" { npm run build:prod }
        default { 
            Write-Error "Environnement de build inconnu: $BuildEnv"
            exit 1
        }
    }
    
    # Vérifier que le build a réussi
    if (-not (Test-Path "dist\tuto-angular")) {
        Write-Error "Build frontend échoué"
        exit 1
    }
    
    Set-Location "..\.."
    
    Write-Success "Frontend construit avec succès!"
}

# Fonction pour construire le backend
function Build-Backend {
    Write-Log "Construction du backend..."
    
    Set-Location "Angular\Tuto-Angular\backend"
    
    # Nettoyer les fichiers Python compilés
    Get-ChildItem -Path . -Recurse -Directory -Name "__pycache__" | Remove-Item -Recurse -Force
    Get-ChildItem -Path . -Recurse -Filter "*.pyc" | Remove-Item -Force
    
    # Vérifier la syntaxe Python
    python -m py_compile main.py
    
    # Vérifier que les dépendances sont installées
    python -c "import fastapi, uvicorn, sqlalchemy, psycopg2"
    
    Set-Location "..\..\.."
    
    Write-Success "Backend construit avec succès!"
}

# Fonction pour construire les images Docker
function Build-DockerImages {
    Write-Log "Construction des images Docker..."
    
    if (-not (Test-Command "docker")) {
        Write-Warning "Docker n'est pas installé. Construction des images ignorée."
        return
    }
    
    # Frontend
    Write-Log "Construction de l'image Docker frontend..."
    docker build -t "${DockerRegistry}/tuto-angular-frontend:${ImageTag}" .
    
    # Backend
    Write-Log "Construction de l'image Docker backend..."
    docker build -t "${DockerRegistry}/tuto-angular-backend:${ImageTag}" ./backend
    
    Write-Success "Images Docker construites avec succès!"
}

# Fonction pour optimiser les assets
function Optimize-Assets {
    Write-Log "Optimisation des assets..."
    
    Set-Location "Angular\Tuto-Angular\dist\tuto-angular"
    
    # Optimiser les images
    if (Test-Command "imagemin") {
        Write-Log "Optimisation des images..."
        Get-ChildItem -Path . -Recurse -Include "*.png", "*.jpg", "*.jpeg" | ForEach-Object {
            imagemin $_.FullName --out-dir=$_.DirectoryName --plugin=pngquant --plugin=mozjpeg
        }
    }
    else {
        Write-Warning "imagemin n'est pas installé. Optimisation des images ignorée."
    }
    
    # Minifier les CSS et JS
    if (Test-Command "uglifyjs") {
        Write-Log "Minification des fichiers JavaScript..."
        Get-ChildItem -Path . -Recurse -Filter "*.js" | ForEach-Object {
            uglifyjs $_.FullName -o $_.FullName -c -m
        }
    }
    else {
        Write-Warning "uglifyjs n'est pas installé. Minification JavaScript ignorée."
    }
    
    if (Test-Command "cleancss") {
        Write-Log "Minification des fichiers CSS..."
        Get-ChildItem -Path . -Recurse -Filter "*.css" | ForEach-Object {
            cleancss -o $_.FullName $_.FullName
        }
    }
    else {
        Write-Warning "cleancss n'est pas installé. Minification CSS ignorée."
    }
    
    Set-Location "..\..\.."
    
    Write-Success "Assets optimisés!"
}

# Fonction pour générer les manifestes
function New-Manifests {
    Write-Log "Génération des manifestes..."
    
    # Manifeste Docker Compose
    $dockerComposeContent = @"
version: '3.8'

services:
  frontend:
    image: ${DockerRegistry}/tuto-angular-frontend:${ImageTag}
    ports:
      - "80:80"
    environment:
      - NODE_ENV=${BuildEnv}
    depends_on:
      - backend

  backend:
    image: ${DockerRegistry}/tuto-angular-backend:${ImageTag}
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=${BuildEnv}
      - DATABASE_URL=postgresql://user:password@postgres:5432/tuto_angular
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=tuto_angular
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
"@
    
    $dockerComposeContent | Out-File -FilePath "docker-compose.${BuildEnv}.yml" -Encoding UTF8
    
    # Manifeste Kubernetes
    if (-not (Test-Path "k8s")) {
        New-Item -ItemType Directory -Path "k8s" | Out-Null
    }
    
    $kubernetesContent = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tuto-angular-frontend
  namespace: tuto-angular
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tuto-angular-frontend
  template:
    metadata:
      labels:
        app: tuto-angular-frontend
    spec:
      containers:
      - name: frontend
        image: ${DockerRegistry}/tuto-angular-frontend:${ImageTag}
        ports:
        - containerPort: 80
        env:
        - name: NODE_ENV
          value: "${BuildEnv}"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tuto-angular-backend
  namespace: tuto-angular
spec:
  replicas: 2
  selector:
    matchLabels:
      app: tuto-angular-backend
  template:
    metadata:
      labels:
        app: tuto-angular-backend
    spec:
      containers:
      - name: backend
        image: ${DockerRegistry}/tuto-angular-backend:${ImageTag}
        ports:
        - containerPort: 8000
        env:
        - name: NODE_ENV
          value: "${BuildEnv}"
        - name: DATABASE_URL
          value: "postgresql://user:password@postgres:5432/tuto_angular"
"@
    
    $kubernetesContent | Out-File -FilePath "k8s\deployment.${BuildEnv}.yaml" -Encoding UTF8
    
    Write-Success "Manifestes générés!"
}

# Fonction pour créer l'archive de déploiement
function New-DeploymentArchive {
    Write-Log "Création de l'archive de déploiement..."
    
    # Créer le répertoire de déploiement
    $deployPath = "deploy\${BuildEnv}"
    if (-not (Test-Path $deployPath)) {
        New-Item -ItemType Directory -Path $deployPath | Out-Null
    }
    
    # Copier les fichiers nécessaires
    Copy-Item "Angular\Tuto-Angular\dist\tuto-angular" "$deployPath\frontend" -Recurse -Force
    Copy-Item "Angular\Tuto-Angular\backend" "$deployPath\backend" -Recurse -Force
    Copy-Item "docker-compose.${BuildEnv}.yml" $deployPath
    Copy-Item "k8s\deployment.${BuildEnv}.yaml" $deployPath
    Copy-Item "nginx.conf" $deployPath
    
    # Créer l'archive
    $archivePath = "deploy\tuto-angular-${BuildEnv}-${ImageTag}.zip"
    Compress-Archive -Path "$deployPath\*" -DestinationPath $archivePath -Force
    
    Write-Success "Archive de déploiement créée: $archivePath"
}

# Fonction pour nettoyer
function Clear-BuildFiles {
    Write-Log "Nettoyage des fichiers temporaires..."
    
    # Nettoyer le frontend
    if (Test-Path "Angular\Tuto-Angular\dist") {
        Remove-Item "Angular\Tuto-Angular\dist" -Recurse -Force
    }
    if (Test-Path "Angular\Tuto-Angular\out-tsc") {
        Remove-Item "Angular\Tuto-Angular\out-tsc" -Recurse -Force
    }
    if (Test-Path "Angular\Tuto-Angular\node_modules") {
        Remove-Item "Angular\Tuto-Angular\node_modules" -Recurse -Force
    }
    
    # Nettoyer le backend
    Get-ChildItem -Path "Angular\Tuto-Angular\backend" -Recurse -Directory -Name "__pycache__" | Remove-Item -Recurse -Force
    Get-ChildItem -Path "Angular\Tuto-Angular\backend" -Recurse -Filter "*.pyc" | Remove-Item -Force
    
    # Nettoyer les images Docker
    if (Test-Command "docker") {
        docker image prune -f
    }
    
    Write-Success "Nettoyage terminé!"
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\build.ps1 [BUILD_TYPE] [BUILD_ENV] [DOCKER_REGISTRY] [IMAGE_TAG]"
    Write-Host ""
    Write-Host "Build Types:"
    Write-Host "  all         Tout construire (défaut)"
    Write-Host "  frontend    Frontend seulement"
    Write-Host "  backend     Backend seulement"
    Write-Host "  docker      Images Docker seulement"
    Write-Host "  optimize    Optimisation des assets seulement"
    Write-Host "  manifest    Génération des manifestes seulement"
    Write-Host "  archive     Création de l'archive de déploiement seulement"
    Write-Host "  clean       Nettoyage seulement"
    Write-Host "  help        Afficher cette aide"
    Write-Host ""
    Write-Host "Build Environments:"
    Write-Host "  production  Environnement de production (défaut)"
    Write-Host "  staging     Environnement de staging"
    Write-Host "  development Environnement de développement"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  DockerRegistry  Registry Docker (défaut: your-registry.com)"
    Write-Host "  ImageTag        Tag de l'image Docker (défaut: latest)"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\build.ps1 all production"
    Write-Host "  .\build.ps1 frontend staging"
    Write-Host "  .\build.ps1 docker my-registry.com v1.0.0"
}

# Fonction principale
function Main {
    switch ($BuildType.ToLower()) {
        "all" { 
            Test-Prerequisites
            Install-Dependencies
            Build-Frontend
            Build-Backend
            Build-DockerImages
            Optimize-Assets
            New-Manifests
            New-DeploymentArchive
        }
        "frontend" { 
            Test-Prerequisites
            Install-Dependencies
            Build-Frontend
        }
        "backend" { 
            Test-Prerequisites
            Install-Dependencies
            Build-Backend
        }
        "docker" { 
            Test-Prerequisites
            Build-DockerImages
        }
        "optimize" { Optimize-Assets }
        "manifest" { New-Manifests }
        "archive" { New-DeploymentArchive }
        "clean" { Clear-BuildFiles }
        "help" { Show-Help }
        "--help" { Show-Help }
        "-h" { Show-Help }
        default { 
            Write-Error "Type de build inconnu: $BuildType"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
