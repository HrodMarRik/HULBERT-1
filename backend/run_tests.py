#!/usr/bin/env python3
"""
Script de test principal pour HULBERT-1
Exécute tous les tests et génère un rapport de couverture
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Exécute une commande et affiche le résultat"""
    print(f"\n{'='*60}")
    print(f"🔍 {description}")
    print(f"{'='*60}")
    
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Erreur lors de l'exécution: {e}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False

def main():
    """Fonction principale"""
    print("🚀 Démarrage des tests HULBERT-1")
    print("="*60)
    
    # Vérifier que nous sommes dans le bon répertoire
    if not os.path.exists("backend"):
        print("❌ Erreur: Ce script doit être exécuté depuis la racine du projet")
        sys.exit(1)
    
    # Changer vers le répertoire backend
    os.chdir("backend")
    
    # Tests unitaires
    success = run_command(
        "python -m pytest tests/modules/test_auth.py -v",
        "Tests d'authentification"
    )
    
    success &= run_command(
        "python -m pytest tests/modules/test_accounting.py -v",
        "Tests de comptabilité"
    )
    
    success &= run_command(
        "python -m pytest tests/modules/test_invoicing.py -v",
        "Tests de facturation"
    )
    
    success &= run_command(
        "python -m pytest tests/modules/test_payroll.py -v",
        "Tests de paie"
    )
    
    success &= run_command(
        "python -m pytest tests/modules/test_tickets.py -v",
        "Tests de tickets"
    )
    
    success &= run_command(
        "python -m pytest tests/modules/test_dashboard.py -v",
        "Tests du dashboard"
    )
    
    success &= run_command(
        "python -m pytest tests/modules/test_competitive_analysis.py -v",
        "Tests d'analyse concurrentielle"
    )
    
    # Tests avec couverture
    success &= run_command(
        "python -m pytest tests/ --cov=app --cov-report=html --cov-report=term-missing",
        "Tests avec rapport de couverture"
    )
    
    # Tests d'intégration
    success &= run_command(
        "python -m pytest tests/ -m integration -v",
        "Tests d'intégration"
    )
    
    # Résumé
    print(f"\n{'='*60}")
    if success:
        print("✅ Tous les tests sont passés avec succès!")
        print("📊 Rapport de couverture généré dans backend/htmlcov/index.html")
    else:
        print("❌ Certains tests ont échoué")
        sys.exit(1)
    
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
