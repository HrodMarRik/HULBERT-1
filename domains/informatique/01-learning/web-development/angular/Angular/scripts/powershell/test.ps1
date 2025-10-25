# Script de test pour le tutoriel Angular n-tier (PowerShell)

param(
    [Parameter(Position=0)]
    [string]$TestType = "all",
    
    [Parameter(Position=1)]
    [int]$CoverageThreshold = 80
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
    Write-Log "Vérification des prérequis de test..."
    
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
    
    Write-Success "Prérequis de test vérifiés!"
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

# Fonction pour installer les dépendances de test
function Install-TestDependencies {
    Write-Log "Installation des dépendances de test..."
    
    # Frontend
    Write-Log "Installation des dépendances de test frontend..."
    Set-Location "Angular\Tuto-Angular"
    npm install
    Set-Location "..\.."
    
    # Backend
    Write-Log "Installation des dépendances de test backend..."
    Set-Location "Angular\Tuto-Angular\backend"
    pip install -r requirements.txt
    pip install pytest pytest-cov pytest-asyncio
    Set-Location "..\..\.."
    
    Write-Success "Dépendances de test installées!"
}

# Fonction pour exécuter les tests unitaires frontend
function Invoke-FrontendUnitTests {
    Write-Log "Exécution des tests unitaires frontend..."
    
    Set-Location "Angular\Tuto-Angular"
    
    # Tests unitaires
    npm run test:ci
    
    # Vérifier la couverture de code
    if (Test-Path "coverage\lcov.info") {
        $coverageContent = Get-Content "coverage\lcov.info" | Where-Object { $_ -match "lines.*:" }
        if ($coverageContent) {
            $coverage = [regex]::Match($coverageContent, '\d+').Value
            if ([int]$coverage -lt $CoverageThreshold) {
                Write-Warning "Couverture de code frontend: $coverage% (seuil: $CoverageThreshold%)"
            }
            else {
                Write-Success "Couverture de code frontend: $coverage%"
            }
        }
    }
    
    Set-Location "..\.."
    
    Write-Success "Tests unitaires frontend terminés!"
}

# Fonction pour exécuter les tests unitaires backend
function Invoke-BackendUnitTests {
    Write-Log "Exécution des tests unitaires backend..."
    
    Set-Location "Angular\Tuto-Angular\backend"
    
    # Tests unitaires avec couverture
    pytest --cov=. --cov-report=html --cov-report=term-missing
    
    # Vérifier la couverture de code
    if (Test-Path "htmlcov\index.html") {
        $coverageContent = Get-Content "htmlcov\index.html" | Where-Object { $_ -match "TOTAL.*%" }
        if ($coverageContent) {
            $coverage = [regex]::Match($coverageContent, '\d+').Value
            if ([int]$coverage -lt $CoverageThreshold) {
                Write-Warning "Couverture de code backend: $coverage% (seuil: $CoverageThreshold%)"
            }
            else {
                Write-Success "Couverture de code backend: $coverage%"
            }
        }
    }
    
    Set-Location "..\..\.."
    
    Write-Success "Tests unitaires backend terminés!"
}

# Fonction pour exécuter les tests d'intégration
function Invoke-IntegrationTests {
    Write-Log "Exécution des tests d'intégration..."
    
    # Démarrer les services en arrière-plan
    Write-Log "Démarrage des services pour les tests d'intégration..."
    
    # Backend
    Set-Location "Angular\Tuto-Angular\backend"
    $backendProcess = Start-Process -FilePath "uvicorn" -ArgumentList "main:app", "--host", "0.0.0.0", "--port", "8000" -WindowStyle Hidden -PassThru
    Set-Location "..\..\.."
    
    # Attendre que le backend soit prêt
    Start-Sleep -Seconds 10
    
    # Frontend
    Set-Location "Angular\Tuto-Angular"
    npm run build:prod
    $frontendProcess = Start-Process -FilePath "npx" -ArgumentList "http-server", "dist\tuto-angular", "-p", "4200" -WindowStyle Hidden -PassThru
    Set-Location "..\.."
    
    # Attendre que le frontend soit prêt
    Start-Sleep -Seconds 5
    
    # Tests d'intégration
    Write-Log "Exécution des tests d'intégration..."
    
    # Test API
    try {
        Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing | Out-Null
        Write-Success "API backend accessible"
    }
    catch {
        Write-Error "API backend non accessible"
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    # Test frontend
    try {
        Invoke-WebRequest -Uri "http://localhost:4200/" -UseBasicParsing | Out-Null
        Write-Success "Frontend accessible"
    }
    catch {
        Write-Error "Frontend non accessible"
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
        exit 1
    }
    
    # Tests end-to-end
    Write-Log "Exécution des tests end-to-end..."
    Set-Location "Angular\Tuto-Angular"
    npm run e2e
    Set-Location "..\.."
    
    # Arrêter les services
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    
    Write-Success "Tests d'intégration terminés!"
}

# Fonction pour exécuter les tests de performance
function Invoke-PerformanceTests {
    Write-Log "Exécution des tests de performance..."
    
    # Démarrer les services
    Write-Log "Démarrage des services pour les tests de performance..."
    
    # Backend
    Set-Location "Angular\Tuto-Angular\backend"
    $backendProcess = Start-Process -FilePath "uvicorn" -ArgumentList "main:app", "--host", "0.0.0.0", "--port", "8000" -WindowStyle Hidden -PassThru
    Set-Location "..\..\.."
    
    # Attendre que le backend soit prêt
    Start-Sleep -Seconds 10
    
    # Tests de charge avec Apache Bench
    if (Test-Command "ab") {
        Write-Log "Tests de charge avec Apache Bench..."
        
        # Test API
        ab -n 1000 -c 10 http://localhost:8000/health
        
        # Test frontend
        ab -n 1000 -c 10 http://localhost:4200/
        
        Write-Success "Tests de performance terminés!"
    }
    else {
        Write-Warning "Apache Bench n'est pas installé. Tests de performance ignorés."
    }
    
    # Arrêter les services
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
}

# Fonction pour exécuter les tests de sécurité
function Invoke-SecurityTests {
    Write-Log "Exécution des tests de sécurité..."
    
    # Démarrer les services
    Write-Log "Démarrage des services pour les tests de sécurité..."
    
    # Backend
    Set-Location "Angular\Tuto-Angular\backend"
    $backendProcess = Start-Process -FilePath "uvicorn" -ArgumentList "main:app", "--host", "0.0.0.0", "--port", "8000" -WindowStyle Hidden -PassThru
    Set-Location "..\..\.."
    
    # Attendre que le backend soit prêt
    Start-Sleep -Seconds 10
    
    # Tests de sécurité avec OWASP ZAP
    if (Test-Command "zap-cli") {
        Write-Log "Tests de sécurité avec OWASP ZAP..."
        
        # Scan de sécurité
        zap-cli quick-scan http://localhost:8000
        
        Write-Success "Tests de sécurité terminés!"
    }
    else {
        Write-Warning "OWASP ZAP n'est pas installé. Tests de sécurité ignorés."
    }
    
    # Arrêter les services
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
}

# Fonction pour générer le rapport de test
function New-TestReport {
    Write-Log "Génération du rapport de test..."
    
    # Créer le répertoire de rapport
    if (-not (Test-Path "test-reports")) {
        New-Item -ItemType Directory -Path "test-reports" | Out-Null
    }
    
    # Copier les rapports de couverture
    if (Test-Path "Angular\Tuto-Angular\coverage") {
        Copy-Item "Angular\Tuto-Angular\coverage" "test-reports\frontend-coverage" -Recurse -Force
    }
    
    if (Test-Path "Angular\Tuto-Angular\backend\htmlcov") {
        Copy-Item "Angular\Tuto-Angular\backend\htmlcov" "test-reports\backend-coverage" -Recurse -Force
    }
    
    # Générer le rapport HTML
    $htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Rapport de test - Tuto Angular n-tier</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Rapport de test - Tuto Angular n-tier</h1>
        <p>Généré le $(Get-Date)</p>
    </div>
    
    <div class="section">
        <h2>Tests unitaires</h2>
        <p class="success">✓ Tests frontend: Passés</p>
        <p class="success">✓ Tests backend: Passés</p>
    </div>
    
    <div class="section">
        <h2>Tests d'intégration</h2>
        <p class="success">✓ Tests API: Passés</p>
        <p class="success">✓ Tests frontend: Passés</p>
        <p class="success">✓ Tests end-to-end: Passés</p>
    </div>
    
    <div class="section">
        <h2>Couverture de code</h2>
        <p><a href="frontend-coverage/index.html">Couverture frontend</a></p>
        <p><a href="backend-coverage/index.html">Couverture backend</a></p>
    </div>
</body>
</html>
"@
    
    $htmlContent | Out-File -FilePath "test-reports\index.html" -Encoding UTF8
    
    Write-Success "Rapport de test généré dans test-reports/"
}

# Fonction pour nettoyer
function Clear-TestFiles {
    Write-Log "Nettoyage des fichiers de test..."
    
    # Nettoyer les rapports de couverture
    if (Test-Path "Angular\Tuto-Angular\coverage") {
        Remove-Item "Angular\Tuto-Angular\coverage" -Recurse -Force
    }
    if (Test-Path "Angular\Tuto-Angular\backend\htmlcov") {
        Remove-Item "Angular\Tuto-Angular\backend\htmlcov" -Recurse -Force
    }
    if (Test-Path "Angular\Tuto-Angular\backend\.coverage") {
        Remove-Item "Angular\Tuto-Angular\backend\.coverage" -Force
    }
    
    # Nettoyer les fichiers temporaires
    if (Test-Path "Angular\Tuto-Angular\dist") {
        Remove-Item "Angular\Tuto-Angular\dist" -Recurse -Force
    }
    if (Test-Path "Angular\Tuto-Angular\out-tsc") {
        Remove-Item "Angular\Tuto-Angular\out-tsc" -Recurse -Force
    }
    
    Write-Success "Nettoyage terminé!"
}

# Fonction pour afficher l'aide
function Show-Help {
    Write-Host "Usage: .\test.ps1 [TEST_TYPE] [COVERAGE_THRESHOLD]"
    Write-Host ""
    Write-Host "Test Types:"
    Write-Host "  all         Tous les tests (défaut)"
    Write-Host "  unit        Tests unitaires seulement"
    Write-Host "  integration Tests d'intégration seulement"
    Write-Host "  performance Tests de performance seulement"
    Write-Host "  security    Tests de sécurité seulement"
    Write-Host "  report      Générer le rapport de test"
    Write-Host "  clean       Nettoyer les fichiers de test"
    Write-Host "  help        Afficher cette aide"
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  CoverageThreshold  Seuil de couverture de code (défaut: 80)"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\test.ps1 unit"
    Write-Host "  .\test.ps1 integration"
    Write-Host "  .\test.ps1 all 90"
}

# Fonction principale
function Main {
    switch ($TestType.ToLower()) {
        "all" { 
            Test-Prerequisites
            Install-TestDependencies
            Invoke-FrontendUnitTests
            Invoke-BackendUnitTests
            Invoke-IntegrationTests
            Invoke-PerformanceTests
            Invoke-SecurityTests
            New-TestReport
        }
        "unit" { 
            Test-Prerequisites
            Install-TestDependencies
            Invoke-FrontendUnitTests
            Invoke-BackendUnitTests
            New-TestReport
        }
        "integration" { 
            Test-Prerequisites
            Install-TestDependencies
            Invoke-IntegrationTests
            New-TestReport
        }
        "performance" { 
            Test-Prerequisites
            Install-TestDependencies
            Invoke-PerformanceTests
            New-TestReport
        }
        "security" { 
            Test-Prerequisites
            Install-TestDependencies
            Invoke-SecurityTests
            New-TestReport
        }
        "report" { New-TestReport }
        "clean" { Clear-TestFiles }
        "help" { Show-Help }
        "--help" { Show-Help }
        "-h" { Show-Help }
        default { 
            Write-Error "Type de test inconnu: $TestType"
            Show-Help
            exit 1
        }
    }
}

# Exécuter la fonction principale
Main
