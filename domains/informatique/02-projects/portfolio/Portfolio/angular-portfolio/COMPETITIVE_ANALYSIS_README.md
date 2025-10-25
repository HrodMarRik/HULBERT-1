# Analyse Concurrentielle - Documentation

## Vue d'ensemble

Le module d'Analyse Concurrentielle est un système complet de questionnaire qui guide l'utilisateur à travers 70+ questions organisées en 7 étapes pour générer un rapport d'analyse concurrentielle détaillé avec des recommandations stratégiques automatiques.

## Fonctionnalités Principales

### 1. Questionnaire Multi-Étapes (Wizard)

Le questionnaire est divisé en 7 étapes thématiques :

1. **Contexte Marché** (10 questions)
   - Secteur d'activité
   - Taille et croissance du marché
   - Tendances et segments
   - Barrières à l'entrée
   - Facteurs clés de succès

2. **Identification Concurrents** (8 questions)
   - Nombre et liste des concurrents
   - Leader du marché
   - Nouveaux entrants
   - Intensité concurrentielle

3. **Analyse Produits/Services** (12 questions)
   - Description de l'offre
   - Proposition de valeur unique
   - Fonctionnalités clés
   - Qualité et innovation
   - Stratégie de prix
   - Gaps fonctionnels

4. **Positionnement & Marketing** (10 questions)
   - Message marketing
   - Canaux d'acquisition
   - Budget marketing
   - Notoriété de marque
   - Taux de conversion

5. **Analyse Financière** (8 questions)
   - Chiffre d'affaires
   - Croissance
   - Part de marché
   - Modèle économique
   - CAC et LTV
   - Rentabilité

6. **Forces & Faiblesses** (10 questions)
   - SWOT complet
   - Avantages concurrentiels
   - Durabilité de la différenciation
   - Capacité d'innovation
   - Taux de rétention

7. **Stratégie & Opportunités** (12 questions)
   - Stratégie concurrentielle actuelle et cible
   - Objectifs de croissance
   - Nouveaux marchés
   - Priorités stratégiques
   - Obstacles et risques
   - Vision à 5 ans

### 2. Types de Questions

Le système supporte plusieurs types de questions :

- **Text** : Réponses textuelles courtes
- **Textarea** : Réponses textuelles longues
- **Number** : Valeurs numériques avec min/max
- **Currency** : Montants en euros
- **Select** : Choix unique parmi des options
- **Multiselect** : Choix multiples
- **Scale** : Échelle de notation (1-10)

### 3. Sauvegarde et Persistance

- **Auto-save** : Sauvegarde automatique toutes les 30 secondes
- **Sauvegarde locale** : Stockage dans localStorage pour les brouillons
- **Sauvegarde backend** : Synchronisation avec la base de données
- **Reprise** : Possibilité de reprendre une analyse en cours
- **Historique** : Liste de toutes les analyses (brouillons et complétées)

### 4. Génération de Rapport

Le rapport généré inclut :

#### Scores Globaux
- Innovation (1-10)
- Prix (1-10)
- Qualité (1-10)
- Marketing (1-10)
- Score Global (moyenne)

#### Insights Stratégiques
- **Position sur le Marché** : Analyse de votre positionnement (leader, challenger, niche, etc.)
- **Avantage Concurrentiel** : Évaluation de votre différenciation
- **Menaces Principales** : Top 5 des menaces identifiées
- **Opportunités Clés** : Top 5 des opportunités à saisir

#### Recommandations Stratégiques
Recommandations automatiques classées par priorité (haute/moyenne/basse) dans 4 catégories :

1. **Produit** : Amélioration qualité, innovation, gaps fonctionnels
2. **Marketing** : Notoriété, budget, conversion
3. **Prix** : Stratégie tarifaire, ratio LTV/CAC
4. **Stratégie** : Direction stratégique, croissance, financement

Chaque recommandation inclut :
- Titre et description
- Actions concrètes à entreprendre
- Impact estimé
- Effort nécessaire

### 5. Export et Partage

- **Export JSON** : Téléchargement des données brutes
- **Duplication** : Créer une copie d'une analyse existante
- **Suppression** : Supprimer une analyse
- **PDF** (à venir) : Génération d'un rapport PDF professionnel

## Architecture Technique

### Frontend (Angular)

#### Composants
- `CompetitiveAnalysisComponent` : Composant principal avec 3 vues (liste, wizard, rapport)
- `questions.data.ts` : Définition des 70+ questions

#### Services
- `AnalysisStorageService` : Gestion de la persistance (localStorage + API)
- `RecommendationEngineService` : Moteur de génération de recommandations

#### Modèles
```typescript
interface CompetitiveAnalysisReport {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'completed';
  currentStep: number;
  responses: AnalysisResponse[];
  metadata?: {
    sector?: string;
    marketSize?: number;
    mainCompetitor?: string;
  };
}
```

### Backend (FastAPI + SQLAlchemy)

#### Modèle de Données
```python
class CompetitiveAnalysis(Base):
    __tablename__ = "competitive_analyses"
    
    id: int
    user_id: int
    title: str
    status: str  # draft, completed
    current_step: int
    responses: JSON  # Question responses
    analysis_metadata: JSON  # Sector, market size, etc.
    created_at: datetime
    updated_at: datetime
```

#### API Endpoints

- `POST /api/competitive-analysis` : Créer une nouvelle analyse
- `GET /api/competitive-analysis` : Liste des analyses de l'utilisateur
- `GET /api/competitive-analysis/{id}` : Récupérer une analyse
- `PUT /api/competitive-analysis/{id}` : Mettre à jour une analyse
- `DELETE /api/competitive-analysis/{id}` : Supprimer une analyse
- `GET /api/competitive-analysis/{id}/export` : Exporter les données

## Utilisation

### 1. Créer une Nouvelle Analyse

1. Cliquer sur "Nouvelle Analyse"
2. Entrer un titre pour l'analyse
3. Répondre aux questions étape par étape
4. Utiliser les boutons "Précédent" / "Suivant" pour naviguer
5. Cliquer sur "Sauvegarder et quitter" pour reprendre plus tard
6. Compléter toutes les étapes et cliquer sur "Générer le rapport"

### 2. Reprendre une Analyse

1. Depuis la liste, cliquer sur "Continuer" sur un brouillon
2. L'analyse reprend à l'étape où vous vous étiez arrêté
3. Compléter les questions restantes

### 3. Consulter un Rapport

1. Depuis la liste, cliquer sur "Voir" sur une analyse complétée
2. Consulter les scores, insights et recommandations
3. Télécharger le PDF (à venir)
4. Cliquer sur "Modifier l'analyse" pour ajuster les réponses

### 4. Dupliquer une Analyse

1. Cliquer sur l'icône de duplication
2. Une copie est créée avec le suffixe "(Copie)"
3. Modifier le titre et les réponses selon vos besoins

## Algorithme de Recommandations

Le moteur de recommandations analyse les réponses pour générer des insights :

### Calcul des Scores
- **Innovation** : Basé sur la question q6_8 (capacité d'innovation)
- **Qualité** : Basé sur la question q3_4 (qualité vs concurrents)
- **Prix** : Calculé selon le positionnement prix (q3_8)
- **Marketing** : Basé sur la question q4_5 (notoriété de marque)
- **Global** : Moyenne des 4 scores

### Génération des Recommandations

#### Produit
- Si qualité < 7 → Recommandation haute priorité d'amélioration qualité
- Si innovation < 6 → Recommandation haute priorité d'accélération innovation
- Si gaps fonctionnels → Recommandation moyenne priorité de comblement

#### Marketing
- Si notoriété < concurrent -2 → Recommandation haute priorité d'augmentation notoriété
- Si budget marketing < 10% → Recommandation moyenne priorité d'augmentation budget
- Si taux de conversion < 10% → Recommandation haute priorité d'optimisation tunnel

#### Prix
- Si prix bas → Recommandation moyenne priorité de réévaluation prix
- Si LTV/CAC < 3 → Recommandation haute priorité d'amélioration ratio

#### Stratégie
- Si pas de stratégie claire → Recommandation haute priorité de définition stratégie
- Si part de marché < 5% → Recommandation haute priorité de croissance
- Si manque de financement → Recommandation haute priorité de sécurisation financement

## Améliorations Futures

### Court Terme
- [ ] Génération de PDF professionnel
- [ ] Graphiques interactifs (radar, matrice, etc.)
- [ ] Comparaison entre analyses
- [ ] Templates d'analyse par secteur

### Moyen Terme
- [ ] Import de données concurrents (web scraping)
- [ ] Intégration avec des sources de données externes (Crunchbase, etc.)
- [ ] Analyse de sentiment des avis clients
- [ ] Benchmarking automatique

### Long Terme
- [ ] IA pour recommandations personnalisées
- [ ] Prédictions de tendances marché
- [ ] Simulation de scénarios stratégiques
- [ ] Collaboration multi-utilisateurs

## Maintenance

### Ajouter une Question

1. Éditer `questions.data.ts`
2. Ajouter la question dans l'étape appropriée
3. Mettre à jour le moteur de recommandations si nécessaire

### Modifier l'Algorithme de Recommandations

1. Éditer `recommendation-engine.service.ts`
2. Modifier les méthodes `generate*Recommendations()`
3. Ajuster les seuils et conditions selon les besoins

### Migration de Base de Données

Si vous modifiez le modèle `CompetitiveAnalysis` :

1. Créer un script de migration Alembic
2. Ou exécuter `python backend/create_competitive_analysis_table.py`

## Support

Pour toute question ou problème :
- Consulter les logs du backend : `backend/logs/`
- Vérifier la console du navigateur pour les erreurs frontend
- Consulter la documentation de l'API : `http://localhost:8000/docs`

