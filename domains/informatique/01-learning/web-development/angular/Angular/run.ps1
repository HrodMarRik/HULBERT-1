# Script de raccourci pour les scripts PowerShell
# Usage: .\run.ps1 [script-name] [arguments]

param(
    [string]$ScriptName = "help",
    [string[]]$Arguments = @()
)

$ScriptDir = "scripts\powershell"

switch ($ScriptName.ToLower()) {
    { $_ -in @("dev", "development") } {
        & "$ScriptDir\dev.ps1" @Arguments
    }
    { $_ -in @("test", "testing") } {
        & "$ScriptDir\test.ps1" @Arguments
    }
    { $_ -in @("build", "building") } {
        & "$ScriptDir\build.ps1" @Arguments
    }
    { $_ -in @("deploy", "deployment") } {
        & "$ScriptDir\deploy.ps1" @Arguments
    }
    { $_ -in @("config", "configuration") } {
        & "$ScriptDir\config.ps1" @Arguments
    }
    "backup" {
        & "$ScriptDir\backup.ps1" @Arguments
    }
    "security" {
        & "$ScriptDir\security.ps1" @Arguments
    }
    { $_ -in @("docs", "documentation") } {
        & "$ScriptDir\docs.ps1" @Arguments
    }
    "monitoring" {
        & "$ScriptDir\monitoring.ps1" @Arguments
    }
    "maintenance" {
        & "$ScriptDir\maintenance.ps1" @Arguments
    }
    { $_ -in @("help", "--help", "-h") } {
        Write-Host "Usage: .\run.ps1 [script-name] [arguments]" -ForegroundColor Green
        Write-Host ""
        Write-Host "Available scripts:" -ForegroundColor Green
        Write-Host "  dev          Development environment" -ForegroundColor White
        Write-Host "  test         Run tests" -ForegroundColor White
        Write-Host "  build        Build application" -ForegroundColor White
        Write-Host "  deploy       Deploy application" -ForegroundColor White
        Write-Host "  config       Configure environment" -ForegroundColor White
        Write-Host "  backup       Backup data" -ForegroundColor White
        Write-Host "  security     Security checks" -ForegroundColor White
        Write-Host "  docs         Generate documentation" -ForegroundColor White
        Write-Host "  monitoring   System monitoring" -ForegroundColor White
        Write-Host "  maintenance  Maintenance tasks" -ForegroundColor White
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor Green
        Write-Host "  .\run.ps1 dev" -ForegroundColor White
        Write-Host "  .\run.ps1 test all" -ForegroundColor White
        Write-Host "  .\run.ps1 deploy production" -ForegroundColor White
    }
    default {
        Write-Host "Unknown script: $ScriptName" -ForegroundColor Red
        Write-Host "Use '.\run.ps1 help' to see available scripts" -ForegroundColor Yellow
        exit 1
    }
}
