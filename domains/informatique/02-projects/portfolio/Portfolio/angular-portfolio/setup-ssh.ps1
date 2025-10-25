# Script pour configurer SSH sans mot de passe
$password = "POURRIS333?"
$username = "Hulbert"
$hostname = "51.178.24.242"
$publicKey = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCsicngm36aVHBSpVcL/ysQ/gBr9bgBfLTGq7iBeNScnZzvmMt2xDVCcJGcMkDqbHumBo57KlIH9P9quCyQOT+yhj87ASwXHFjd0Lq0dl4TzYkwHcTDTicyJSC9tIrYD5d6hK7sk87z2zUJlWpZycc0Z6gh+Dae3YZq1aFss2Aan/kW2A3DBa1BAYLef66QJGtCtQP8WVhR2kcQWdEJq2mX/PpPVSCI332pbCSrSkdpn6CKC3V2CdvIADGt0BhE7+wTaQapEHB9+P/T0Vt4oJ/O4Qifc0LR3oENkRtuWRPkhldl+9AstePMX3Ekd5A/T0cgrvIYVTb1nvA/G3sBFJo3c8SBmSB8gGTec51woj7UgWlTSw9rccqe/aY0SnH++Gg/n//IygIuhBzrQ2TkP98jEixQLCa498RcV4pI+Kk3npMlim7mxT5St5pQf/WoKaAZ+Z7vnJiBYR6c1LbMTY1Ziu7+dQNKMXT87WGnTHes5z1Go0p93iZ6WCmcA94dUS0Df17HiQvgobZxldAf5KZsLdDACIWvNxKgfP7ODK0zbDUjqoYg17B+GqmA5gXiIYxaT150MWQu/WdaLRLwZZeLwYBADtN9odXXvbjrFiv1c2tdwPV61SKbsEjfgma0l1GiZGE8Dzl0EH0YfYaJGEkRRCXulFhXZH90vNXaMOGmqQ== hulbert@vps"

Write-Host "Configuration SSH automatique en cours..." -ForegroundColor Green

# Créer le répertoire .ssh et ajouter la clé publique
$commands = @(
    "mkdir -p ~/.ssh",
    "chmod 700 ~/.ssh", 
    "echo '$publicKey' >> ~/.ssh/authorized_keys",
    "chmod 600 ~/.ssh/authorized_keys",
    "chown Hulbert:Hulbert ~/.ssh/authorized_keys"
)

$commandString = $commands -join " && "

Write-Host "Exécution des commandes sur le VPS..." -ForegroundColor Yellow

# Utiliser plink (PuTTY) si disponible, sinon ssh
try {
    $plinkPath = Get-Command plink -ErrorAction SilentlyContinue
    if ($plinkPath) {
        Write-Host "Utilisation de PuTTY plink..." -ForegroundColor Cyan
        & plink -ssh -l $username -pw $password $hostname $commandString
    } else {
        Write-Host "Utilisation de SSH standard..." -ForegroundColor Cyan
        # Créer un fichier temporaire avec le mot de passe
        $tempFile = [System.IO.Path]::GetTempFileName()
        $password | Out-File -FilePath $tempFile -Encoding ASCII
        
        # Utiliser expect-like functionality avec PowerShell
        $process = Start-Process -FilePath "ssh" -ArgumentList "$username@$hostname", $commandString -PassThru -NoNewWindow -Wait
    }
} catch {
    Write-Host "Erreur lors de l'exécution: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Configuration terminée !" -ForegroundColor Green
Write-Host "Test de la connexion..." -ForegroundColor Yellow

# Tester la connexion
try {
    ssh hrodmarrik "echo 'Connexion SSH réussie sans mot de passe !'"
} catch {
    Write-Host "Test échoué. Vérifiez manuellement la configuration." -ForegroundColor Red
}
