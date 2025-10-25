# Script de déploiement automatisé sur VPS (PowerShell)

param(
    [string]$Environment = "production",
    [string]$ServerIP = "",
    [string]$SSHUser = $env:SSH_USER ?? "root",
    [int]$SSHPort = $env:SSH_PORT ?? 22,
    [string]$AppName = $env:APP_NAME ?? "tuto-angular-ntier",
    [string]$Domain = $env:DOMAIN ?? ""
)

# Couleurs pour les messages
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Fonction pour afficher les messages
function Write-Log {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

# Configuration
$RemoteDir = "/opt/$AppName"
$BackupDir = "/opt/backups/$AppName"

# Fonction pour vérifier les prérequis
function Test-Prerequisites {
    Write-Log "Vérification des prérequis de déploiement..."
    
    # Vérifier SSH
    try {
        $null = Get-Command ssh -ErrorAction Stop
    } catch {
        Write-Error "SSH n'est pas installé"
        exit 1
    }
    
    # Vérifier Docker
    try {
        $null = Get-Command docker -ErrorAction Stop
    } catch {
        Write-Error "Docker n'est pas installé localement"
        exit 1
    }
    
    # Vérifier Docker Compose
    try {
        $null = Get-Command docker-compose -ErrorAction Stop
    } catch {
        Write-Error "Docker Compose n'est pas installé localement"
        exit 1
    }
    
    # Vérifier l'IP du serveur
    if ([string]::IsNullOrEmpty($ServerIP)) {
        Write-Error "Adresse IP du serveur non spécifiée"
        Write-Host "Usage: .\deploy-vps.ps1 -ServerIP <ip-address>"
        exit 1
    }
    
    Write-Success "Prérequis vérifiés!"
}

# Fonction pour tester la connexion SSH
function Test-SSHConnection {
    Write-Log "Test de la connexion SSH vers $ServerIP..."
    
    try {
        $result = ssh -o ConnectTimeout=10 -o BatchMode=yes -p $SSHPort $SSHUser@$ServerIP "echo 'Connexion SSH OK'" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Connexion SSH établie!"
        } else {
            throw "Connexion échouée"
        }
    } catch {
        Write-Error "Impossible de se connecter au serveur $ServerIP"
        Write-Host "Vérifiez :"
        Write-Host "  - L'adresse IP du serveur"
        Write-Host "  - Les clés SSH"
        Write-Host "  - Le port SSH ($SSHPort)"
        Write-Host "  - L'utilisateur SSH ($SSHUser)"
        exit 1
    }
}

# Fonction pour préparer le serveur distant
function Initialize-RemoteServer {
    Write-Log "Préparation du serveur distant..."
    
    $script = @"
        # Mise à jour du système
        apt update && apt upgrade -y
        
        # Installation des dépendances
        apt install -y curl wget git nginx certbot python3-certbot-nginx
        
        # Installation de Docker
        if ! command -v docker >/dev/null 2>&1; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            usermod -aG docker `$USER
        fi
        
        # Installation de Docker Compose
        if ! command -v docker-compose >/dev/null 2>&1; then
            curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-`$(uname -s)-`$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # Création des répertoires
        mkdir -p /opt/backups
        mkdir -p /opt/ssl
        mkdir -p /var/log/nginx
        
        # Configuration du pare-feu
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        
        echo "Serveur préparé avec succès!"
"@
    
    ssh -p $SSHPort $SSHUser@$ServerIP $script
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Serveur distant préparé!"
    } else {
        Write-Error "Échec de la préparation du serveur"
        exit 1
    }
}

# Fonction pour créer un backup
function New-Backup {
    Write-Log "Création d'un backup avant déploiement..."
    
    $script = @"
        if [ -d "$RemoteDir" ]; then
            BACKUP_NAME="backup_`$(date +%Y%m%d_%H%M%S)"
            tar -czf "$BackupDir/`$BACKUP_NAME.tar.gz" -C "$RemoteDir" .
            echo "Backup créé: `$BACKUP_NAME.tar.gz"
        else
            echo "Aucun déploiement précédent trouvé"
        fi
"@
    
    ssh -p $SSHPort $SSHUser@$ServerIP $script
    Write-Success "Backup créé!"
}

# Fonction pour construire l'application
function Build-Application {
    Write-Log "Construction de l'application..."
    
    # Build Angular
    if (Test-Path "Angular\Tuto-Angular") {
        Write-Log "Construction du frontend Angular..."
        Set-Location "Angular\Tuto-Angular"
        npm install
        npm run build --prod
        Set-Location "..\.."
    }
    
    # Build Docker images
    Write-Log "Construction des images Docker..."
    docker-compose build
    
    Write-Success "Application construite!"
}

# Fonction pour déployer sur le serveur
function Deploy-ToServer {
    Write-Log "Déploiement sur le serveur $ServerIP..."
    
    # Créer le répertoire distant
    ssh -p $SSHPort $SSHUser@$ServerIP "mkdir -p $RemoteDir"
    
    # Synchroniser les fichiers avec rsync (si disponible) ou scp
    Write-Log "Synchronisation des fichiers..."
    
    # Exclure les fichiers/dossiers non nécessaires
    $excludePatterns = @(
        "node_modules",
        ".git",
        "*.log",
        "dist",
        "venv",
        "__pycache__"
    )
    
    # Utiliser robocopy pour Windows ou rsync si disponible
    if (Get-Command rsync -ErrorAction SilentlyContinue) {
        $excludeArgs = $excludePatterns | ForEach-Object { "--exclude=$_" }
        rsync -avz --delete $excludeArgs -e "ssh -p $SSHPort" .\ $SSHUser@$ServerIP`:$RemoteDir/
    } else {
        # Fallback avec scp
        Write-Warning "rsync non disponible, utilisation de scp (plus lent)"
        scp -r -P $SSHPort .\* $SSHUser@$ServerIP`:$RemoteDir/
    }
    
    Write-Success "Fichiers synchronisés!"
}

# Fonction pour configurer l'environnement de production
function Set-ProductionEnvironment {
    Write-Log "Configuration de l'environnement de production..."
    
    $envConfig = @"
# Configuration de production
NODE_ENV=production
API_URL=https://$Domain/api/v1
DATABASE_URL=postgresql://postgres:secure_password@db:5432/tuto_angular
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuration Docker
POSTGRES_DB=tuto_angular
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
"@
    
    $nginxConfig = @"
server {
    listen 80;
    server_name $Domain;
    
    # Redirection HTTPS
    return 301 https://`$server_name`$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $Domain;
    
    # Configuration SSL
    ssl_certificate /etc/letsencrypt/live/$Domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$Domain/privkey.pem;
    
    # Configuration SSL moderne
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Frontend Angular
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host `$host;
        proxy_set_header X-Real-IP `$remote_addr;
        proxy_set_header X-Forwarded-For `$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto `$scheme;
    }
    
    # Sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
"@
    
    $script = @"
        cd $RemoteDir
        
        # Configuration des variables d'environnement
        cat > .env << 'ENVEOF'
$envConfig
ENVEOF
        
        # Configuration Nginx
        cat > nginx.conf << 'NGINXEOF'
$nginxConfig
NGINXEOF
        
        echo "Configuration de production créée!"
"@
    
    ssh -p $SSHPort $SSHUser@$ServerIP $script
    Write-Success "Environnement de production configuré!"
}

# Fonction pour démarrer les services
function Start-Services {
    Write-Log "Démarrage des services..."
    
    $script = @"
        cd $RemoteDir
        
        # Arrêter les services existants
        docker-compose down || true
        
        # Démarrer les services
        docker-compose up -d
        
        # Attendre que les services soient prêts
        sleep 30
        
        # Vérifier le statut
        docker-compose ps
        
        echo "Services démarrés!"
"@
    
    ssh -p $SSHPort $SSHUser@$ServerIP $script
    Write-Success "Services démarrés!"
}

# Fonction pour configurer SSL
function Set-SSL {
    if (![string]::IsNullOrEmpty($Domain)) {
        Write-Log "Configuration SSL avec Let's Encrypt..."
        
        $script = @"
            # Arrêter temporairement Nginx
            docker-compose stop nginx
            
            # Obtenir le certificat SSL
            certbot certonly --standalone -d $Domain --non-interactive --agree-tos --email admin@$Domain
            
            # Redémarrer Nginx avec SSL
            docker-compose up -d nginx
            
            # Configurer le renouvellement automatique
            echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
            
            echo "SSL configuré pour $Domain!"
"@
        
        ssh -p $SSHPort $SSHUser@$ServerIP $script
        Write-Success "SSL configuré!"
    } else {
        Write-Warning "Domaine non spécifié, SSL ignoré"
    }
}

# Fonction pour vérifier le déploiement
function Test-Deployment {
    Write-Log "Vérification du déploiement..."
    
    # Vérifier les conteneurs
    ssh -p $SSHPort $SSHUser@$ServerIP "cd $RemoteDir && docker-compose ps"
    
    # Vérifier les logs
    ssh -p $SSHPort $SSHUser@$ServerIP "cd $RemoteDir && docker-compose logs --tail=20"
    
    # Test de connectivité
    if (![string]::IsNullOrEmpty($Domain)) {
        Write-Log "Test de connectivité sur https://$Domain"
        try {
            $response = Invoke-WebRequest -Uri "https://$Domain" -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Success "Application accessible sur https://$Domain"
            }
        } catch {
            Write-Warning "Application non accessible, vérifiez les logs"
        }
    }
    
    Write-Success "Vérification terminée!"
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\deploy-vps.ps1 [options]" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Parameters:" -ForegroundColor $Colors.White
    Write-Host "  -Environment    Environnement de déploiement (défaut: production)" -ForegroundColor $Colors.White
    Write-Host "  -ServerIP       Adresse IP du serveur VPS (requis)" -ForegroundColor $Colors.White
    Write-Host "  -SSHUser        Utilisateur SSH (défaut: root)" -ForegroundColor $Colors.White
    Write-Host "  -SSHPort        Port SSH (défaut: 22)" -ForegroundColor $Colors.White
    Write-Host "  -AppName        Nom de l'application (défaut: tuto-angular-ntier)" -ForegroundColor $Colors.White
    Write-Host "  -Domain         Domaine pour SSL (optionnel)" -ForegroundColor $Colors.White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Colors.White
    Write-Host "  .\deploy-vps.ps1 -ServerIP 192.168.1.100" -ForegroundColor $Colors.White
    Write-Host "  .\deploy-vps.ps1 -ServerIP 192.168.1.100 -Domain monapp.com" -ForegroundColor $Colors.White
    Write-Host "  .\deploy-vps.ps1 -ServerIP 192.168.1.100 -SSHUser ubuntu" -ForegroundColor $Colors.White
}

# Fonction principale
function Main {
    if ([string]::IsNullOrEmpty($ServerIP)) {
        Show-Help
        return
    }
    
    Test-Prerequisites
    Test-SSHConnection
    Initialize-RemoteServer
    New-Backup
    Build-Application
    Deploy-ToServer
    Set-ProductionEnvironment
    Start-Services
    Set-SSL
    Test-Deployment
    
    Write-Success "Déploiement terminé avec succès!"
    Write-Host ""
    Write-Host "🌐 Application accessible sur:" -ForegroundColor $Colors.Green
    if (![string]::IsNullOrEmpty($Domain)) {
        Write-Host "   https://$Domain" -ForegroundColor $Colors.Green
    } else {
        Write-Host "   http://$ServerIP" -ForegroundColor $Colors.Green
    }
    Write-Host ""
    Write-Host "📊 Monitoring:" -ForegroundColor $Colors.Green
    Write-Host "   ssh $SSHUser@$ServerIP 'cd $RemoteDir && docker-compose logs -f'" -ForegroundColor $Colors.Green
}

# Exécuter la fonction principale
Main
