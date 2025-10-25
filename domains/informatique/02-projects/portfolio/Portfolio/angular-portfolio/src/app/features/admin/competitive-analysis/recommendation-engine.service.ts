import { Injectable } from '@angular/core';
import { AnalysisResponse } from './analysis-storage.service';

export interface Recommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actions: string[];
  impact: string;
  effort: string;
  timeframe: string;
  cost: string;
  successMetrics: string[];
  riskLevel: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

export interface CompetitiveInsights {
  marketPosition: string;
  competitiveAdvantage: string;
  mainThreats: string[];
  keyOpportunities: string[];
  strategicRecommendations: Recommendation[];
  scores: {
    innovation: number;
    pricing: number;
    quality: number;
    marketing: number;
    financial: number;
    operational: number;
    overall: number;
  };
  marketAnalysis: {
    maturity: string;
    concentration: string;
    growthStage: string;
    barriers: string[];
    opportunities: string[];
  };
  competitorAnalysis: {
    directCompetitors: number;
    indirectCompetitors: number;
    marketLeader: string;
    competitiveIntensity: number;
    threatLevel: 'low' | 'medium' | 'high';
  };
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationEngineService {

  generateInsights(responses: AnalysisResponse[]): CompetitiveInsights {
    const responseMap = this.createResponseMap(responses);
    
    return {
      marketPosition: this.analyzeMarketPosition(responseMap),
      competitiveAdvantage: this.analyzeCompetitiveAdvantage(responseMap),
      mainThreats: this.identifyThreats(responseMap),
      keyOpportunities: this.identifyOpportunities(responseMap),
      strategicRecommendations: this.generateRecommendations(responseMap),
      scores: this.calculateDetailedScores(responseMap),
      marketAnalysis: this.analyzeMarketConditions(responseMap),
      competitorAnalysis: this.analyzeCompetitiveLandscape(responseMap)
    };
  }

  private createResponseMap(responses: AnalysisResponse[]): Map<string, any> {
    const map = new Map<string, any>();
    responses.forEach(r => map.set(r.questionId, r.answer));
    return map;
  }

  private analyzeMarketPosition(responses: Map<string, any>): string {
    const marketShare = responses.get('q5_3') || 0;
    const growth = responses.get('q5_2') || 0;
    const maturity = responses.get('q1_7') || '';
    const revenue = responses.get('q5_1') || 0;
    const competitorCount = responses.get('q2_1') || 0;

    // Analyse multi-dimensionnelle de la position
    if (marketShare > 30 && growth > 20) {
      return 'Leader dominant en forte croissance - Position très favorable';
    } else if (marketShare > 20 && growth > 15) {
      return 'Leader établi avec croissance soutenue - Position forte';
    } else if (marketShare > 15 && growth > 10) {
      return 'Acteur majeur en croissance modérée - Position solide';
    } else if (marketShare > 10 && growth > 5) {
      return 'Acteur établi avec croissance limitée - Position stable';
    } else if (marketShare > 5 && growth > 20) {
      return 'Challenger en forte croissance - Position dynamique';
    } else if (marketShare > 5 && growth > 10) {
      return 'Challenger en croissance - Position prometteuse';
    } else if (marketShare > 2 && growth > 5) {
      return 'Acteur de niche en croissance - Position spécialisée';
    } else if (marketShare < 2 && growth > 30) {
      return 'Nouvel entrant disruptif - Position émergente';
    } else if (marketShare < 5 && growth < 5) {
      return 'Acteur marginal - Position fragile nécessitant une stratégie de redressement';
    } else {
      return 'Position indéterminée - Analyse approfondie nécessaire';
    }
  }

  private analyzeCompetitiveAdvantage(responses: Map<string, any>): string {
    const advantage = responses.get('q6_5') || '';
    const durability = responses.get('q6_6') || '';
    const innovation = responses.get('q6_8') || 5;
    const quality = responses.get('q3_4') || 5;
    const pricing = responses.get('q3_8') || '';
    const satisfaction = responses.get('q3_11') || 5;

    // Analyse combinée de plusieurs facteurs
    const advantageScore = this.calculateAdvantageScore(innovation, quality, satisfaction, pricing, durability);
    
    if (advantageScore >= 8) {
      return 'Avantage concurrentiel très fort et durable - Différenciation claire et défendable';
    } else if (advantageScore >= 6) {
      return 'Avantage concurrentiel solide - Position différenciée mais à surveiller';
    } else if (advantageScore >= 4) {
      return 'Avantage concurrentiel modéré - Nécessite un renforcement stratégique';
    } else {
      return 'Avantage concurrentiel faible - Urgence à développer une différenciation claire';
    }
  }

  private calculateAdvantageScore(innovation: number, quality: number, satisfaction: number, pricing: string, durability: string): number {
    let score = (innovation + quality + satisfaction) / 3;
    
    // Bonus pour positionnement prix premium
    if (pricing.includes('plus cher')) {
      score += 1;
    } else if (pricing.includes('moins cher')) {
      score -= 0.5;
    }
    
    // Bonus pour durabilité
    if (durability.includes('très durable')) {
      score += 1.5;
    } else if (durability.includes('durable')) {
      score += 1;
    } else if (durability.includes('facilement copiable')) {
      score -= 1;
    }
    
    return Math.min(10, Math.max(0, score));
  }

  private identifyThreats(responses: Map<string, any>): string[] {
    const threats: string[] = [];
    const threatsText = responses.get('q6_4') || '';
    const competition = responses.get('q2_8') || 5;
    const newEntrants = responses.get('q2_6') || '';
    const pricing = responses.get('q3_8') || '';
    const marketGrowth = responses.get('q1_3') || 0;
    const barriers = responses.get('q1_8') || [];
    const maturity = responses.get('q1_7') || '';

    // Analyse systématique des menaces
    if (competition >= 8) {
      threats.push('Concurrence très intense avec guerre des prix et saturation du marché');
    } else if (competition >= 6) {
      threats.push('Concurrence forte nécessitant une différenciation constante');
    }

    if (newEntrants.includes('plusieurs')) {
      threats.push('Arrivée massive de nouveaux concurrents menaçant les parts de marché');
    } else if (newEntrants.includes('quelques')) {
      threats.push('Nouveaux entrants créant une pression concurrentielle supplémentaire');
    }

    if (pricing.includes('plus cher') && marketGrowth < 5) {
      threats.push('Positionnement prix élevé sur un marché en faible croissance');
    }

    if (maturity.includes('Déclin')) {
      threats.push('Marché en déclin nécessitant une diversification urgente');
    }

    if (Array.isArray(barriers) && barriers.includes('Faibles barrières')) {
      threats.push('Barrières à l\'entrée faibles facilitant l\'arrivée de nouveaux concurrents');
    }

    // Parse threats from text
    if (threatsText) {
      const lines = threatsText.split('\n').filter((l: string) => l.trim());
      threats.push(...lines.slice(0, 3));
    }

    return threats.slice(0, 6);
  }

  private identifyOpportunities(responses: Map<string, any>): string[] {
    const opportunities: string[] = [];
    const opportunitiesText = responses.get('q6_3') || '';
    const marketGrowth = responses.get('q1_3') || 0;
    const newMarkets = responses.get('q7_4') || '';
    const trends = responses.get('q1_4') || [];
    const maturity = responses.get('q1_7') || '';
    const segments = responses.get('q1_5') || '';
    const gaps = responses.get('q3_9') || '';

    // Analyse systématique des opportunités
    if (marketGrowth > 20) {
      opportunities.push('Marché en forte croissance offrant des opportunités d\'expansion rapide');
    } else if (marketGrowth > 10) {
      opportunities.push('Marché en croissance soutenue permettant une expansion progressive');
    }

    if (maturity.includes('Émergent')) {
      opportunities.push('Marché émergent avec potentiel de leadership précoce');
    }

    if (newMarkets && newMarkets.trim()) {
      opportunities.push(`Expansion vers de nouveaux segments/marchés : ${newMarkets.substring(0, 100)}...`);
    }

    if (Array.isArray(trends) && trends.length > 0) {
      const topTrends = trends.slice(0, 3);
      opportunities.push(`Capitaliser sur les tendances émergentes : ${topTrends.join(', ')}`);
    }

    if (gaps && gaps.trim()) {
      opportunities.push('Combler les gaps fonctionnels identifiés chez les concurrents');
    }

    // Parse opportunities from text
    if (opportunitiesText) {
      const lines = opportunitiesText.split('\n').filter((l: string) => l.trim());
      opportunities.push(...lines.slice(0, 3));
    }

    return opportunities.slice(0, 6);
  }

  private generateRecommendations(responses: Map<string, any>): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Product Recommendations (plus détaillées)
    recommendations.push(...this.generateDetailedProductRecommendations(responses));

    // Marketing Recommendations (plus précises)
    recommendations.push(...this.generateDetailedMarketingRecommendations(responses));

    // Pricing Recommendations (plus sophistiquées)
    recommendations.push(...this.generateDetailedPricingRecommendations(responses));

    // Strategic Recommendations (plus complètes)
    recommendations.push(...this.generateDetailedStrategicRecommendations(responses));

    // Financial Recommendations (nouvelles)
    recommendations.push(...this.generateFinancialRecommendations(responses));

    // Operational Recommendations (nouvelles)
    recommendations.push(...this.generateOperationalRecommendations(responses));

    // Sort by priority and impact
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Si même priorité, trier par impact
      const impactOrder = { 'Critique': 0, 'Élevé': 1, 'Moyen': 2, 'Faible': 3 };
      return impactOrder[a.impact as keyof typeof impactOrder] - impactOrder[b.impact as keyof typeof impactOrder];
    });
  }

  private generateDetailedProductRecommendations(responses: Map<string, any>): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const quality = responses.get('q3_4') || 5;
    const innovation = responses.get('q6_8') || 5;
    const gaps = responses.get('q3_9') || '';
    const updateFrequency = responses.get('q3_12') || '';
    const satisfaction = responses.get('q3_11') || 5;
    const features = responses.get('q3_3') || '';
    const uniqueFeatures = responses.get('q3_10') || '';

    // Recommandation qualité détaillée
    if (quality < 7) {
      const severity = quality < 5 ? 'high' : 'medium';
      recommendations.push({
        category: 'Produit',
        priority: severity,
        title: 'Programme d\'amélioration qualité urgent',
        description: `Votre qualité perçue (${quality}/10) est inférieure aux standards concurrentiels. Cette faiblesse impacte directement la rétention client et la réputation.`,
        actions: [
          'Audit qualité complet avec analyse des points de défaillance',
          'Mise en place d\'un système de contrôle qualité rigoureux',
          'Formation des équipes aux standards qualité élevés',
          'Implémentation d\'un processus de feedback client continu',
          'Certification qualité (ISO, etc.) pour crédibiliser l\'offre',
          'Communication proactive sur les améliorations qualité'
        ],
        impact: quality < 5 ? 'Critique' : 'Élevé',
        effort: 'Élevé',
        timeframe: '3-6 mois',
        cost: 'Élevé (50-100k€)',
        successMetrics: ['Score qualité client > 8/10', 'Taux de défaut < 2%', 'Certification obtenue'],
        riskLevel: 'medium',
        dependencies: ['Budget R&D', 'Formation équipes', 'Processus qualité']
      });
    }

    // Recommandation innovation détaillée
    if (innovation < 6) {
      recommendations.push({
        category: 'Produit',
        priority: 'high',
        title: 'Accélération innovation produit stratégique',
        description: `Votre capacité d'innovation (${innovation}/10) est insuffisante face à la concurrence. Risque de décrochage technologique.`,
        actions: [
          'Augmentation du budget R&D de 30-50%',
          'Recrutement d\'experts innovation et R&D',
          'Mise en place d\'une veille technologique systématique',
          'Partenariats avec centres de recherche/universités',
          'Création d\'un laboratoire d\'innovation interne',
          'Processus d\'innovation ouverte (open innovation)',
          'Roadmap produit ambitieuse avec jalons clairs'
        ],
        impact: 'Critique',
        effort: 'Très élevé',
        timeframe: '6-12 mois',
        cost: 'Très élevé (100-300k€)',
        successMetrics: ['Nombre de brevets déposés', 'Temps de mise sur marché', 'Innovation index'],
        riskLevel: 'high',
        dependencies: ['Budget significatif', 'Expertise technique', 'Partenaires externes']
      });
    }

    // Recommandation gaps fonctionnels
    if (gaps && gaps.trim()) {
      recommendations.push({
        category: 'Produit',
        priority: 'medium',
        title: 'Plan de comblement des gaps fonctionnels critiques',
        description: 'Des fonctionnalités clés de la concurrence vous manquent, créant un désavantage concurrentiel.',
        actions: [
          'Priorisation des gaps selon l\'impact client',
          'Évaluation de la faisabilité technique et financière',
          'Développement en mode agile avec MVP',
          'Tests utilisateurs pour valider les fonctionnalités',
          'Communication marketing sur les nouvelles capacités',
          'Formation des équipes commerciales'
        ],
        impact: 'Moyen',
        effort: 'Moyen',
        timeframe: '2-4 mois',
        cost: 'Moyen (20-50k€)',
        successMetrics: ['Gaps critiques comblés', 'Adoption client', 'Impact sur les ventes'],
        riskLevel: 'low',
        dependencies: ['Équipe développement', 'Budget développement']
      });
    }

    return recommendations;
  }

  private generateDetailedMarketingRecommendations(responses: Map<string, any>): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const awareness = responses.get('q4_5') || 5;
    const competitorAwareness = responses.get('q4_6') || 5;
    const marketingBudget = responses.get('q4_4') || 0;
    const conversionRate = responses.get('q4_10') || 0;
    const channels = responses.get('q4_2') || [];
    const message = responses.get('q4_1') || '';

    // Recommandation notoriété détaillée
    if (awareness < competitorAwareness - 2) {
      const gap = competitorAwareness - awareness;
      recommendations.push({
        category: 'Marketing',
        priority: 'high',
        title: 'Campagne de brand awareness intensive',
        description: `Votre notoriété (${awareness}/10) est significativement inférieure à vos concurrents (${competitorAwareness}/10). Gap de ${gap} points critique.`,
        actions: [
          'Augmentation du budget marketing de 50-100%',
          'Campagne média multi-canaux (digital + traditionnel)',
          'Partenariats avec influenceurs sectoriels',
          'Content marketing intensif avec SEO',
          'Relations presse et communication corporate',
          'Participation aux événements sectoriels majeurs',
          'Programme de parrainage/recommandation client'
        ],
        impact: 'Critique',
        effort: 'Très élevé',
        timeframe: '6-12 mois',
        cost: 'Très élevé (100-500k€)',
        successMetrics: ['Notoriété assistée +3 points', 'Mentions médias', 'Trafic organique'],
        riskLevel: 'medium',
        dependencies: ['Budget marketing', 'Équipe marketing', 'Agences externes']
      });
    }

    // Recommandation budget marketing
    if (marketingBudget < 10) {
      recommendations.push({
        category: 'Marketing',
        priority: 'high',
        title: 'Réallocation budgétaire marketing stratégique',
        description: `Votre budget marketing (${marketingBudget}% du CA) est insuffisant pour la croissance. Standard sectoriel : 15-25%.`,
        actions: [
          'Réévaluation de l\'allocation budgétaire globale',
          'Identification des canaux les plus ROIstes',
          'Tests A/B sur nouveaux canaux d\'acquisition',
          'Optimisation des campagnes existantes',
          'Mise en place d\'un système de tracking ROI',
          'Formation équipe marketing aux nouvelles techniques'
        ],
        impact: 'Élevé',
        effort: 'Moyen',
        timeframe: '1-3 mois',
        cost: 'Variable selon budget',
        successMetrics: ['ROI marketing > 300%', 'CAC réduit', 'Croissance acquisition'],
        riskLevel: 'low',
        dependencies: ['Budget disponible', 'Équipe marketing']
      });
    }

    // Recommandation conversion
    if (conversionRate > 0 && conversionRate < 10) {
      recommendations.push({
        category: 'Marketing',
        priority: 'high',
        title: 'Optimisation tunnel de conversion critique',
        description: `Votre taux de conversion (${conversionRate}%) est très faible. Standard sectoriel : 15-25%. Perte de revenus significative.`,
        actions: [
          'Audit complet du tunnel de conversion',
          'Analyse des points de friction et abandons',
          'Amélioration du nurturing des leads',
          'Optimisation des landing pages',
          'Formation équipe commerciale',
          'Mise en place d\'un CRM efficace',
          'Tests de différents arguments de vente'
        ],
        impact: 'Critique',
        effort: 'Moyen',
        timeframe: '2-4 mois',
        cost: 'Moyen (10-30k€)',
        successMetrics: ['Taux conversion > 15%', 'Temps de cycle réduit', 'Taux de closing'],
        riskLevel: 'low',
        dependencies: ['Équipe commerciale', 'Outils CRM', 'Formation']
      });
    }

    return recommendations;
  }

  private generateDetailedPricingRecommendations(responses: Map<string, any>): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const pricingPosition = responses.get('q3_8') || '';
    const pricingStrategy = responses.get('q3_6') || '';
    const ltv = responses.get('q5_6') || 0;
    const cac = responses.get('q5_5') || 0;
    const revenue = responses.get('q5_1') || 0;
    const margin = responses.get('q5_7') || 0;

    // Recommandation positionnement prix sophistiquée
    if (pricingPosition.includes('moins cher')) {
      recommendations.push({
        category: 'Prix',
        priority: 'medium',
        title: 'Stratégie de valorisation et montée en gamme',
        description: 'Vos prix bas limitent votre marge et peuvent nuire à votre perception de valeur. Opportunité de valorisation.',
        actions: [
          'Analyse de la sensibilité prix des clients',
          'Tests de prix progressifs sur segments cibles',
          'Création d\'une offre premium différenciée',
          'Amélioration de la communication de valeur',
          'Segmentation tarifaire par valeur perçue',
          'Formation équipe commerciale à la vente de valeur',
          'Packaging et bundling intelligent'
        ],
        impact: 'Élevé',
        effort: 'Moyen',
        timeframe: '3-6 mois',
        cost: 'Faible (5-15k€)',
        successMetrics: ['Marge brute +20%', 'Panier moyen +30%', 'Satisfaction client maintenue'],
        riskLevel: 'medium',
        dependencies: ['Données clients', 'Équipe commerciale']
      });
    }

    // Recommandation ratio LTV/CAC détaillée
    if (ltv > 0 && cac > 0 && ltv / cac < 3) {
      const ratio = ltv / cac;
      recommendations.push({
        category: 'Prix',
        priority: 'high',
        title: 'Optimisation modèle économique critique',
        description: `Votre ratio LTV/CAC (${ratio.toFixed(1)}:1) est dangereusement faible. Minimum viable : 3:1. Risque de non-rentabilité.`,
        actions: [
          'Augmentation de la rétention client (programme fidélité)',
          'Développement de l\'upsell et cross-sell',
          'Optimisation des coûts d\'acquisition',
          'Allongement de la durée de vie client',
          'Amélioration de la satisfaction client',
          'Pricing basé sur la valeur',
          'Modèle freemium pour réduire le CAC'
        ],
        impact: 'Critique',
        effort: 'Élevé',
        timeframe: '6-12 mois',
        cost: 'Élevé (50-150k€)',
        successMetrics: ['Ratio LTV/CAC > 3:1', 'Rétention client +20%', 'CAC réduit de 30%'],
        riskLevel: 'high',
        dependencies: ['Données clients', 'Budget marketing', 'Équipe produit']
      });
    }

    return recommendations;
  }

  private generateDetailedStrategicRecommendations(responses: Map<string, any>): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const currentStrategy = responses.get('q7_1') || '';
    const targetStrategy = responses.get('q7_2') || '';
    const mainObstacle = responses.get('q7_7') || '';
    const marketShare = responses.get('q5_3') || 0;
    const revenue = responses.get('q5_1') || 0;
    const growth = responses.get('q5_2') || 0;

    // Recommandation stratégie claire
    if (currentStrategy.includes('Pas de stratégie')) {
      recommendations.push({
        category: 'Stratégie',
        priority: 'high',
        title: 'Définition stratégique urgente et structurante',
        description: 'L\'absence de stratégie claire limite votre efficacité et votre capacité à prendre des décisions cohérentes.',
        actions: [
          'Séminaire stratégique avec direction et équipes clés',
          'Analyse SWOT approfondie et partagée',
          'Définition de la vision et mission à 5 ans',
          'Choix du positionnement stratégique cible',
          'Déclinaison en objectifs SMART par département',
          'Communication stratégique à toute l\'organisation',
          'Mise en place d\'un tableau de bord stratégique'
        ],
        impact: 'Critique',
        effort: 'Élevé',
        timeframe: '2-3 mois',
        cost: 'Moyen (20-50k€)',
        successMetrics: ['Stratégie documentée', 'Alignement équipes', 'Décisions cohérentes'],
        riskLevel: 'low',
        dependencies: ['Direction', 'Consultant externe', 'Équipes']
      });
    }

    // Recommandation croissance parts de marché
    if (marketShare < 5) {
      recommendations.push({
        category: 'Stratégie',
        priority: 'high',
        title: 'Plan d\'accélération croissance agressif',
        description: `Votre part de marché (${marketShare}%) est critique. Nécessité d'une stratégie de croissance offensive.`,
        actions: [
          'Identification des segments à fort potentiel',
          'Investissement massif dans l\'acquisition client',
          'Développement de partenariats stratégiques',
          'Considération d\'acquisitions ciblées',
          'Expansion géographique ou sectorielle',
          'Innovation produit disruptive',
          'Guerre des prix temporaire pour gagner des parts'
        ],
        impact: 'Critique',
        effort: 'Très élevé',
        timeframe: '12-18 mois',
        cost: 'Très élevé (200-500k€)',
        successMetrics: ['Part de marché +5%', 'CA +50%', 'Position concurrentielle'],
        riskLevel: 'high',
        dependencies: ['Budget significatif', 'Équipe commerciale', 'Partenaires']
      });
    }

    // Recommandation financement
    if (mainObstacle.includes('Manque de ressources financières')) {
      recommendations.push({
        category: 'Stratégie',
        priority: 'high',
        title: 'Levée de fonds stratégique et structurée',
        description: 'Le manque de financement freine votre croissance et votre capacité d\'investissement.',
        actions: [
          'Préparation d\'un business plan solide et chiffré',
          'Identification des sources de financement adaptées',
          'Préparation des documents d\'investissement',
          'Amélioration de la rentabilité court terme',
          'Recherche de partenaires financiers stratégiques',
          'Négociation de conditions de financement optimales',
          'Plan d\'utilisation des fonds détaillé'
        ],
        impact: 'Critique',
        effort: 'Très élevé',
        timeframe: '6-12 mois',
        cost: 'Variable (5-10% des fonds levés)',
        successMetrics: ['Fonds levés', 'Valuation', 'Partenaires stratégiques'],
        riskLevel: 'high',
        dependencies: ['Business plan', 'Conseils externes', 'Réseau']
      });
    }

    return recommendations;
  }

  private generateFinancialRecommendations(responses: Map<string, any>): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const revenue = responses.get('q5_1') || 0;
    const growth = responses.get('q5_2') || 0;
    const margin = responses.get('q5_7') || 0;
    const profitability = responses.get('q5_8') || '';

    // Recommandation croissance revenue
    if (growth < 10 && revenue > 0) {
      recommendations.push({
        category: 'Finance',
        priority: 'medium',
        title: 'Plan d\'accélération croissance revenue',
        description: `Votre croissance (${growth}%) est insuffisante pour maintenir votre position concurrentielle.`,
        actions: [
          'Diversification des sources de revenus',
          'Optimisation du pricing et des marges',
          'Expansion sur de nouveaux segments',
          'Amélioration de la rétention client',
          'Développement de revenus récurrents',
          'Partenariats générateurs de revenus'
        ],
        impact: 'Élevé',
        effort: 'Moyen',
        timeframe: '6-12 mois',
        cost: 'Moyen (30-80k€)',
        successMetrics: ['Croissance revenue > 20%', 'Diversification revenus', 'Marge améliorée'],
        riskLevel: 'medium',
        dependencies: ['Équipe commerciale', 'Budget marketing']
      });
    }

    // Recommandation rentabilité
    if (profitability.includes('en perte') || profitability.includes('en phase d\'investissement')) {
      recommendations.push({
        category: 'Finance',
        priority: 'high',
        title: 'Plan de retour à l\'équilibre financier',
        description: 'La situation financière nécessite un plan de redressement urgent.',
        actions: [
          'Audit financier complet et identification des fuites',
          'Réduction des coûts non essentiels',
          'Optimisation des processus opérationnels',
          'Augmentation des prix si possible',
          'Amélioration de la trésorerie',
          'Renégociation des conditions avec fournisseurs',
          'Plan de financement de transition'
        ],
        impact: 'Critique',
        effort: 'Élevé',
        timeframe: '3-6 mois',
        cost: 'Faible (5-20k€)',
        successMetrics: ['Retour à l\'équilibre', 'Trésorerie positive', 'Coûts réduits'],
        riskLevel: 'high',
        dependencies: ['Direction financière', 'Audit externe']
      });
    }

    return recommendations;
  }

  private generateOperationalRecommendations(responses: Map<string, any>): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const satisfaction = responses.get('q3_11') || 5;
    const retention = responses.get('q6_10') || 0;
    const updateFrequency = responses.get('q3_12') || '';

    // Recommandation satisfaction client
    if (satisfaction < 7) {
      recommendations.push({
        category: 'Opérationnel',
        priority: 'high',
        title: 'Programme d\'excellence client',
        description: `Votre satisfaction client (${satisfaction}/10) nécessite une amélioration urgente.`,
        actions: [
          'Mise en place d\'un système de feedback continu',
          'Formation des équipes au service client',
          'Amélioration des processus de support',
          'Création d\'un programme de fidélisation',
          'Personnalisation de l\'expérience client',
          'Réduction des temps de réponse',
          'Mise en place d\'un CRM client'
        ],
        impact: 'Élevé',
        effort: 'Moyen',
        timeframe: '3-6 mois',
        cost: 'Moyen (20-50k€)',
        successMetrics: ['Satisfaction > 8/10', 'NPS positif', 'Rétention améliorée'],
        riskLevel: 'low',
        dependencies: ['Équipe support', 'Outils CRM', 'Formation']
      });
    }

    // Recommandation rétention
    if (retention > 0 && retention < 70) {
      recommendations.push({
        category: 'Opérationnel',
        priority: 'medium',
        title: 'Stratégie de rétention client renforcée',
        description: `Votre taux de rétention (${retention}%) est faible. Standard sectoriel : 80-90%.`,
        actions: [
          'Analyse des causes de départ des clients',
          'Programme de fidélisation avec avantages',
          'Amélioration continue du produit/service',
          'Communication proactive avec les clients',
          'Offres de réactivation pour clients inactifs',
          'Programme de parrainage client'
        ],
        impact: 'Élevé',
        effort: 'Moyen',
        timeframe: '6-12 mois',
        cost: 'Moyen (15-40k€)',
        successMetrics: ['Rétention > 80%', 'LTV améliorée', 'Réduction churn'],
        riskLevel: 'low',
        dependencies: ['Données clients', 'Équipe marketing']
      });
    }

    return recommendations;
  }

  private calculateDetailedScores(responses: Map<string, any>): any {
    const innovation = responses.get('q6_8') || 5;
    const quality = responses.get('q3_4') || 5;
    const pricingPosition = responses.get('q3_8') || '';
    const awareness = responses.get('q4_5') || 5;
    const satisfaction = responses.get('q3_11') || 5;
    const revenue = responses.get('q5_1') || 0;
    const growth = responses.get('q5_2') || 0;
    const margin = responses.get('q5_7') || 0;

    // Pricing score (plus sophistiqué)
    let pricingScore = 5;
    if (pricingPosition.includes('moins cher')) {
      pricingScore = 3; // Risque de commoditisation
    } else if (pricingPosition.includes('plus cher')) {
      pricingScore = 8; // Position premium
    } else {
      pricingScore = 6; // Position équilibrée
    }

    // Financial score (nouveau)
    let financialScore = 5;
    if (growth > 20 && margin > 20) {
      financialScore = 9;
    } else if (growth > 10 && margin > 10) {
      financialScore = 7;
    } else if (growth < 0 || margin < 0) {
      financialScore = 2;
    }

    // Operational score (nouveau)
    const operationalScore = (satisfaction + (responses.get('q6_10') || 50) / 10) / 2;

    const overall = (innovation + quality + pricingScore + awareness + financialScore + operationalScore) / 6;

    return {
      innovation: innovation,
      pricing: pricingScore,
      quality: quality,
      marketing: awareness,
      financial: financialScore,
      operational: operationalScore,
      overall: Math.round(overall * 10) / 10
    };
  }

  private analyzeMarketConditions(responses: Map<string, any>): any {
    const maturity = responses.get('q1_7') || '';
    const concentration = responses.get('q2_7') || '';
    const growth = responses.get('q1_3') || 0;
    const barriers = responses.get('q1_8') || [];
    const trends = responses.get('q1_4') || [];

    return {
      maturity: maturity,
      concentration: concentration,
      growthStage: growth > 15 ? 'Forte croissance' : growth > 5 ? 'Croissance modérée' : 'Maturité',
      barriers: Array.isArray(barriers) ? barriers : [],
      opportunities: Array.isArray(trends) ? trends.slice(0, 3) : []
    };
  }

  private analyzeCompetitiveLandscape(responses: Map<string, any>): any {
    const directCompetitors = responses.get('q2_1') || 0;
    const indirectCompetitors = responses.get('q2_5') || '';
    const leader = responses.get('q2_3') || '';
    const intensity = responses.get('q2_8') || 5;
    const newEntrants = responses.get('q2_6') || '';

    let threatLevel: 'low' | 'medium' | 'high' = 'low';
    if (intensity >= 8 || newEntrants.includes('plusieurs')) {
      threatLevel = 'high';
    } else if (intensity >= 6 || directCompetitors > 10) {
      threatLevel = 'medium';
    }

    return {
      directCompetitors: directCompetitors,
      indirectCompetitors: indirectCompetitors ? indirectCompetitors.split('\n').length : 0,
      marketLeader: leader,
      competitiveIntensity: intensity,
      threatLevel: threatLevel
    };
  }
}

