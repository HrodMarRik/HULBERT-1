export interface Question {
  id: string;
  category: string;
  text: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'scale' | 'currency';
  options?: string[];
  required: boolean;
  helpText?: string;
  placeholder?: string;
  dependsOn?: { questionId: string; value: any };
  min?: number;
  max?: number;
}

export interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  questions: Question[];
}

export const COMPETITIVE_ANALYSIS_QUESTIONS: QuestionnaireStep[] = [
  {
    id: 'step1',
    title: 'Contexte Marché',
    description: 'Analysons d\'abord votre marché et son environnement',
    icon: '🌍',
    questions: [
      {
        id: 'q1_1',
        category: 'market',
        text: 'Quel est votre secteur d\'activité principal ?',
        type: 'text',
        required: true,
        helpText: 'Définissez précisément votre secteur d\'activité. Exemples : SaaS B2B, E-commerce B2C, Conseil en transformation digitale, Fintech, EdTech, etc. Cette information permettra d\'identifier les concurrents pertinents et les tendances du marché.',
        placeholder: 'Entrez votre secteur'
      },
      {
        id: 'q1_2',
        category: 'market',
        text: 'Quelle est la taille estimée de votre marché (en valeur) ?',
        type: 'currency',
        required: true,
        helpText: 'Estimez la taille totale du marché adressable (TAM - Total Addressable Market) en euros. Vous pouvez vous baser sur des études sectorielles, des rapports d\'analystes ou des données publiques. Cette métrique est cruciale pour évaluer le potentiel de croissance.',
        placeholder: '0'
      },
      {
        id: 'q1_3',
        category: 'market',
        text: 'Quel est le taux de croissance annuel de votre marché ?',
        type: 'number',
        required: true,
        helpText: 'Indiquez le taux de croissance annuel moyen de votre marché en pourcentage. Un marché en croissance (>5%) offre plus d\'opportunités, tandis qu\'un marché mature (<2%) nécessite une stratégie différenciante. Sources : études sectorielles, rapports d\'analystes.',
        placeholder: '0',
        min: -50,
        max: 200
      },
      {
        id: 'q1_4',
        category: 'market',
        text: 'Quelles sont les principales tendances de votre marché ?',
        type: 'multiselect',
        required: true,
        options: [
          'Digitalisation',
          'Automatisation',
          'Intelligence Artificielle',
          'Développement durable',
          'Personnalisation',
          'Économie collaborative',
          'Mondialisation',
          'Réglementation accrue',
          'Consolidation du marché',
          'Nouveaux entrants'
        ],
        helpText: 'Sélectionnez toutes les tendances pertinentes'
      },
      {
        id: 'q1_5',
        category: 'market',
        text: 'Quels sont les principaux segments de votre marché ?',
        type: 'textarea',
        required: true,
        helpText: 'Décrivez les différents segments (PME, Grandes entreprises, Particuliers, etc.)',
        placeholder: 'Listez les segments principaux...'
      },
      {
        id: 'q1_6',
        category: 'market',
        text: 'Quel segment ciblez-vous prioritairement ?',
        type: 'text',
        required: true,
        helpText: 'Votre cible principale',
        placeholder: 'Ex: PME de 10-50 employés'
      },
      {
        id: 'q1_7',
        category: 'market',
        text: 'Quelle est la maturité de votre marché ?',
        type: 'select',
        required: true,
        options: [
          'Émergent (nouveau marché)',
          'Croissance (adoption rapide)',
          'Mature (croissance stable)',
          'Déclin (saturation)'
        ],
        helpText: 'Stade de développement du marché'
      },
      {
        id: 'q1_8',
        category: 'market',
        text: 'Quelles sont les barrières à l\'entrée sur votre marché ?',
        type: 'multiselect',
        required: true,
        options: [
          'Investissement initial élevé',
          'Réglementation stricte',
          'Brevets et propriété intellectuelle',
          'Réseau de distribution établi',
          'Économies d\'échelle',
          'Fidélité à la marque',
          'Expertise technique',
          'Accès aux ressources',
          'Coûts de changement élevés',
          'Faibles barrières'
        ],
        helpText: 'Obstacles pour les nouveaux entrants'
      },
      {
        id: 'q1_9',
        category: 'market',
        text: 'Quelle est la saisonnalité de votre activité ?',
        type: 'select',
        required: true,
        options: [
          'Aucune saisonnalité',
          'Légère saisonnalité',
          'Forte saisonnalité',
          'Très forte saisonnalité'
        ],
        helpText: 'Impact des saisons sur votre activité'
      },
      {
        id: 'q1_10',
        category: 'market',
        text: 'Quels sont les principaux facteurs de succès sur votre marché ?',
        type: 'multiselect',
        required: true,
        options: [
          'Innovation produit',
          'Prix compétitif',
          'Qualité supérieure',
          'Service client',
          'Rapidité de livraison',
          'Réseau de distribution',
          'Notoriété de marque',
          'Expertise technique',
          'Personnalisation',
          'Expérience utilisateur'
        ],
        helpText: 'Facteurs clés de différenciation'
      }
    ]
  },
  {
    id: 'step2',
    title: 'Identification Concurrents',
    description: 'Identifions vos principaux concurrents et nouveaux entrants',
    icon: '🎯',
    questions: [
      {
        id: 'q2_1',
        category: 'competitors',
        text: 'Combien de concurrents directs avez-vous ?',
        type: 'number',
        required: true,
        helpText: 'Comptez uniquement les concurrents qui offrent des produits ou services similaires à votre offre principale. Les concurrents directs sont ceux qui ciblent le même segment de clientèle avec une proposition de valeur comparable. Excluez les substituts indirects.',
        placeholder: '0',
        min: 0,
        max: 100
      },
      {
        id: 'q2_2',
        category: 'competitors',
        text: 'Listez vos 3 principaux concurrents directs',
        type: 'textarea',
        required: true,
        helpText: 'Un concurrent par ligne avec son nom et site web',
        placeholder: 'Ex:\nConcurrent A - www.concurrent-a.com\nConcurrent B - www.concurrent-b.com'
      },
      {
        id: 'q2_3',
        category: 'competitors',
        text: 'Qui est le leader du marché ?',
        type: 'text',
        required: true,
        helpText: 'Nom de l\'entreprise dominante',
        placeholder: 'Nom du leader'
      },
      {
        id: 'q2_4',
        category: 'competitors',
        text: 'Quelle est la part de marché du leader ?',
        type: 'number',
        required: true,
        helpText: 'Pourcentage approximatif',
        placeholder: '0',
        min: 0,
        max: 100
      },
      {
        id: 'q2_5',
        category: 'competitors',
        text: 'Avez-vous des concurrents indirects significatifs ?',
        type: 'textarea',
        required: false,
        helpText: 'Entreprises offrant des solutions alternatives',
        placeholder: 'Listez les concurrents indirects...'
      },
      {
        id: 'q2_6',
        category: 'competitors',
        text: 'Y a-t-il de nouveaux entrants récents sur le marché ?',
        type: 'select',
        required: true,
        options: [
          'Oui, plusieurs nouveaux entrants',
          'Oui, quelques nouveaux entrants',
          'Non, marché stable',
          'Non, barrières élevées'
        ],
        helpText: 'Dynamique concurrentielle récente'
      },
      {
        id: 'q2_7',
        category: 'competitors',
        text: 'Quel est le niveau de concentration du marché ?',
        type: 'select',
        required: true,
        options: [
          'Très concentré (1-3 acteurs dominants)',
          'Concentré (4-8 acteurs principaux)',
          'Fragmenté (nombreux petits acteurs)',
          'Très fragmenté (atomisé)'
        ],
        helpText: 'Structure concurrentielle du marché'
      },
      {
        id: 'q2_8',
        category: 'competitors',
        text: 'Quelle est l\'intensité de la concurrence ?',
        type: 'scale',
        required: true,
        min: 1,
        max: 10,
        helpText: '1 = Faible, 10 = Très intense'
      }
    ]
  },
  {
    id: 'step3',
    title: 'Analyse Produits/Services',
    description: 'Comparons les offres et positionnements produits',
    icon: '📦',
    questions: [
      {
        id: 'q3_1',
        category: 'product',
        text: 'Décrivez brièvement votre produit/service principal',
        type: 'textarea',
        required: true,
        helpText: 'Fournissez une description claire et concise de votre offre principale. Incluez les fonctionnalités clés, le public cible et la proposition de valeur unique. Cette description servira de base pour comparer votre offre avec celle de vos concurrents.',
        placeholder: 'Décrivez votre produit/service...'
      },
      {
        id: 'q3_2',
        category: 'product',
        text: 'Quelle est votre proposition de valeur unique ?',
        type: 'textarea',
        required: true,
        helpText: 'Ce qui vous différencie de la concurrence',
        placeholder: 'Votre différenciation...'
      },
      {
        id: 'q3_3',
        category: 'product',
        text: 'Quelles sont vos fonctionnalités clés ?',
        type: 'textarea',
        required: true,
        helpText: 'Listez les 5-10 fonctionnalités principales',
        placeholder: 'Une fonctionnalité par ligne...'
      },
      {
        id: 'q3_4',
        category: 'product',
        text: 'Comment évaluez-vous la qualité de votre produit vs concurrents ?',
        type: 'scale',
        required: true,
        min: 1,
        max: 10,
        helpText: '1 = Inférieure, 5 = Équivalente, 10 = Supérieure'
      },
      {
        id: 'q3_5',
        category: 'product',
        text: 'Quel est votre niveau d\'innovation produit ?',
        type: 'select',
        required: true,
        options: [
          'Très innovant (disruptif)',
          'Innovant (améliorations significatives)',
          'Modérément innovant',
          'Peu innovant (me-too)',
          'Suiveur'
        ],
        helpText: 'Positionnement innovation'
      },
      {
        id: 'q3_6',
        category: 'product',
        text: 'Quelle est votre stratégie de prix ?',
        type: 'select',
        required: true,
        options: [
          'Premium (prix élevés)',
          'Milieu de gamme',
          'Économique (prix bas)',
          'Freemium',
          'Abonnement',
          'Usage-based',
          'Autre'
        ],
        helpText: 'Positionnement tarifaire'
      },
      {
        id: 'q3_7',
        category: 'product',
        text: 'Quel est votre prix moyen par client/an ?',
        type: 'currency',
        required: true,
        helpText: 'Revenu annuel moyen par client',
        placeholder: '0'
      },
      {
        id: 'q3_8',
        category: 'product',
        text: 'Comment se positionnent vos prix vs concurrents ?',
        type: 'select',
        required: true,
        options: [
          'Beaucoup plus cher (+30% ou plus)',
          'Plus cher (+10% à +30%)',
          'Prix similaires (±10%)',
          'Moins cher (-10% à -30%)',
          'Beaucoup moins cher (-30% ou plus)'
        ],
        helpText: 'Positionnement prix relatif'
      },
      {
        id: 'q3_9',
        category: 'product',
        text: 'Quelles fonctionnalités vos concurrents ont-ils que vous n\'avez pas ?',
        type: 'textarea',
        required: false,
        helpText: 'Gaps fonctionnels identifiés',
        placeholder: 'Listez les fonctionnalités manquantes...'
      },
      {
        id: 'q3_10',
        category: 'product',
        text: 'Quelles fonctionnalités avez-vous que vos concurrents n\'ont pas ?',
        type: 'textarea',
        required: false,
        helpText: 'Vos avantages fonctionnels',
        placeholder: 'Listez vos fonctionnalités uniques...'
      },
      {
        id: 'q3_11',
        category: 'product',
        text: 'Quel est votre taux de satisfaction client ?',
        type: 'scale',
        required: true,
        min: 1,
        max: 10,
        helpText: '1 = Très insatisfaits, 10 = Très satisfaits'
      },
      {
        id: 'q3_12',
        category: 'product',
        text: 'Quelle est votre fréquence d\'innovation/mise à jour produit ?',
        type: 'select',
        required: true,
        options: [
          'Hebdomadaire',
          'Mensuelle',
          'Trimestrielle',
          'Semestrielle',
          'Annuelle',
          'Moins d\'une fois par an'
        ],
        helpText: 'Rythme de développement produit'
      }
    ]
  },
  {
    id: 'step4',
    title: 'Positionnement & Marketing',
    description: 'Analysons les stratégies marketing et de communication',
    icon: '📢',
    questions: [
      {
        id: 'q4_1',
        category: 'marketing',
        text: 'Quel est votre message marketing principal ?',
        type: 'textarea',
        required: true,
        helpText: 'Votre tagline ou message clé',
        placeholder: 'Votre message principal...'
      },
      {
        id: 'q4_2',
        category: 'marketing',
        text: 'Quels sont vos principaux canaux d\'acquisition ?',
        type: 'multiselect',
        required: true,
        options: [
          'SEO/Référencement naturel',
          'SEA/Google Ads',
          'Réseaux sociaux organiques',
          'Publicité réseaux sociaux',
          'Content Marketing',
          'Email Marketing',
          'Partenariats',
          'Affiliation',
          'Événements/Salons',
          'Bouche-à-oreille',
          'Force de vente directe',
          'Marketplace'
        ],
        helpText: 'Canaux utilisés pour acquérir des clients'
      },
      {
        id: 'q4_3',
        category: 'marketing',
        text: 'Quel est votre budget marketing annuel ?',
        type: 'currency',
        required: true,
        helpText: 'Budget total marketing/communication',
        placeholder: '0'
      },
      {
        id: 'q4_4',
        category: 'marketing',
        text: 'Quel pourcentage de votre CA investissez-vous en marketing ?',
        type: 'number',
        required: true,
        helpText: 'Ratio budget marketing / CA',
        placeholder: '0',
        min: 0,
        max: 100
      },
      {
        id: 'q4_5',
        category: 'marketing',
        text: 'Comment évaluez-vous votre notoriété de marque ?',
        type: 'scale',
        required: true,
        min: 1,
        max: 10,
        helpText: '1 = Inconnue, 10 = Très connue'
      },
      {
        id: 'q4_6',
        category: 'marketing',
        text: 'Quelle est la notoriété de votre principal concurrent ?',
        type: 'scale',
        required: true,
        min: 1,
        max: 10,
        helpText: '1 = Inconnue, 10 = Très connue'
      },
      {
        id: 'q4_7',
        category: 'marketing',
        text: 'Utilisez-vous des influenceurs ou ambassadeurs ?',
        type: 'select',
        required: true,
        options: [
          'Oui, régulièrement',
          'Oui, occasionnellement',
          'Non, mais prévu',
          'Non, pas pertinent'
        ],
        helpText: 'Stratégie d\'influence'
      },
      {
        id: 'q4_8',
        category: 'marketing',
        text: 'Quelle est votre présence sur les réseaux sociaux ?',
        type: 'multiselect',
        required: true,
        options: [
          'LinkedIn',
          'Twitter/X',
          'Facebook',
          'Instagram',
          'TikTok',
          'YouTube',
          'Pinterest',
          'Aucune présence'
        ],
        helpText: 'Plateformes où vous êtes actifs'
      },
      {
        id: 'q4_9',
        category: 'marketing',
        text: 'Quel est votre taux de conversion visiteur → lead ?',
        type: 'number',
        required: false,
        helpText: 'Pourcentage de visiteurs qui deviennent leads',
        placeholder: '0',
        min: 0,
        max: 100
      },
      {
        id: 'q4_10',
        category: 'marketing',
        text: 'Quel est votre taux de conversion lead → client ?',
        type: 'number',
        required: false,
        helpText: 'Pourcentage de leads qui deviennent clients',
        placeholder: '0',
        min: 0,
        max: 100
      }
    ]
  },
  {
    id: 'step5',
    title: 'Analyse Financière',
    description: 'Évaluons les performances financières et parts de marché',
    icon: '💰',
    questions: [
      {
        id: 'q5_1',
        category: 'financial',
        text: 'Quel est votre chiffre d\'affaires annuel actuel ?',
        type: 'currency',
        required: true,
        helpText: 'Indiquez votre chiffre d\'affaires pour l\'année en cours ou la dernière année complète. Cette métrique permet d\'évaluer votre taille relative sur le marché et de calculer votre part de marché potentielle. Incluez tous les revenus générés par votre activité principale.',
        placeholder: '0'
      },
      {
        id: 'q5_2',
        category: 'financial',
        text: 'Quelle est votre croissance du CA (année N vs N-1) ?',
        type: 'number',
        required: true,
        helpText: 'Pourcentage de croissance',
        placeholder: '0',
        min: -100,
        max: 1000
      },
      {
        id: 'q5_3',
        category: 'financial',
        text: 'Quelle est votre part de marché estimée ?',
        type: 'number',
        required: true,
        helpText: 'Pourcentage du marché total',
        placeholder: '0',
        min: 0,
        max: 100
      },
      {
        id: 'q5_4',
        category: 'financial',
        text: 'Quel est votre modèle économique principal ?',
        type: 'select',
        required: true,
        options: [
          'Abonnement récurrent (SaaS)',
          'Vente unique',
          'Freemium',
          'Commission/Marketplace',
          'Publicité',
          'Licence',
          'Consulting/Services',
          'Mixte'
        ],
        helpText: 'Source principale de revenus'
      },
      {
        id: 'q5_5',
        category: 'financial',
        text: 'Quel est votre coût d\'acquisition client (CAC) ?',
        type: 'currency',
        required: false,
        helpText: 'Coût moyen pour acquérir un nouveau client',
        placeholder: '0'
      },
      {
        id: 'q5_6',
        category: 'financial',
        text: 'Quelle est la valeur vie client (LTV) ?',
        type: 'currency',
        required: false,
        helpText: 'Revenu total moyen généré par un client',
        placeholder: '0'
      },
      {
        id: 'q5_7',
        category: 'financial',
        text: 'Quel est votre taux de marge brute ?',
        type: 'number',
        required: false,
        helpText: 'Pourcentage de marge sur le CA',
        placeholder: '0',
        min: -100,
        max: 100
      },
      {
        id: 'q5_8',
        category: 'financial',
        text: 'Êtes-vous rentable ?',
        type: 'select',
        required: true,
        options: [
          'Oui, fortement rentable',
          'Oui, légèrement rentable',
          'À l\'équilibre',
          'Non, en perte',
          'Non, en phase d\'investissement'
        ],
        helpText: 'Situation de rentabilité actuelle'
      }
    ]
  },
  {
    id: 'step6',
    title: 'Forces & Faiblesses',
    description: 'Identifions vos forces, faiblesses et avantages concurrentiels',
    icon: '⚖️',
    questions: [
      {
        id: 'q6_1',
        category: 'swot',
        text: 'Quelles sont vos 3 principales forces ?',
        type: 'textarea',
        required: true,
        helpText: 'Ce que vous faites mieux que vos concurrents',
        placeholder: 'Listez vos forces...'
      },
      {
        id: 'q6_2',
        category: 'swot',
        text: 'Quelles sont vos 3 principales faiblesses ?',
        type: 'textarea',
        required: true,
        helpText: 'Points à améliorer ou désavantages',
        placeholder: 'Listez vos faiblesses...'
      },
      {
        id: 'q6_3',
        category: 'swot',
        text: 'Quelles opportunités voyez-vous sur votre marché ?',
        type: 'textarea',
        required: true,
        helpText: 'Tendances ou évolutions favorables',
        placeholder: 'Listez les opportunités...'
      },
      {
        id: 'q6_4',
        category: 'swot',
        text: 'Quelles menaces identifiez-vous ?',
        type: 'textarea',
        required: true,
        helpText: 'Risques ou évolutions défavorables',
        placeholder: 'Listez les menaces...'
      },
      {
        id: 'q6_5',
        category: 'swot',
        text: 'Quel est votre principal avantage concurrentiel ?',
        type: 'textarea',
        required: true,
        helpText: 'Ce qui vous rend unique et difficile à copier',
        placeholder: 'Décrivez votre avantage concurrentiel...'
      },
      {
        id: 'q6_6',
        category: 'swot',
        text: 'Cet avantage est-il durable ?',
        type: 'select',
        required: true,
        options: [
          'Oui, très durable (5+ ans)',
          'Oui, durable (2-5 ans)',
          'Modérément durable (1-2 ans)',
          'Peu durable (< 1 an)',
          'Facilement copiable'
        ],
        helpText: 'Durabilité de votre différenciation'
      },
      {
        id: 'q6_7',
        category: 'swot',
        text: 'Quel est le principal avantage de votre concurrent principal ?',
        type: 'textarea',
        required: true,
        helpText: 'Ce qui fait leur force',
        placeholder: 'Décrivez leur avantage...'
      },
      {
        id: 'q6_8',
        category: 'swot',
        text: 'Quelle est votre capacité d\'innovation ?',
        type: 'scale',
        required: true,
        min: 1,
        max: 10,
        helpText: '1 = Très faible, 10 = Très forte'
      },
      {
        id: 'q6_9',
        category: 'swot',
        text: 'Quelle est la qualité de votre service client ?',
        type: 'scale',
        required: true,
        min: 1,
        max: 10,
        helpText: '1 = Très faible, 10 = Excellente'
      },
      {
        id: 'q6_10',
        category: 'swot',
        text: 'Quel est votre taux de rétention client ?',
        type: 'number',
        required: false,
        helpText: 'Pourcentage de clients qui restent après 1 an',
        placeholder: '0',
        min: 0,
        max: 100
      }
    ]
  },
  {
    id: 'step7',
    title: 'Stratégie & Opportunités',
    description: 'Définissons votre stratégie et identifions les opportunités',
    icon: '🚀',
    questions: [
      {
        id: 'q7_1',
        category: 'strategy',
        text: 'Quelle est votre stratégie concurrentielle actuelle ?',
        type: 'select',
        required: true,
        options: [
          'Différenciation (qualité/innovation)',
          'Leadership par les coûts (prix bas)',
          'Niche/Spécialisation',
          'Mixte',
          'Pas de stratégie claire'
        ],
        helpText: 'Votre positionnement stratégique'
      },
      {
        id: 'q7_2',
        category: 'strategy',
        text: 'Quelle stratégie souhaitez-vous adopter ?',
        type: 'select',
        required: true,
        options: [
          'Différenciation (qualité/innovation)',
          'Leadership par les coûts (prix bas)',
          'Niche/Spécialisation',
          'Croissance rapide (part de marché)',
          'Rentabilité (optimisation)',
          'Mixte'
        ],
        helpText: 'Stratégie cible'
      },
      {
        id: 'q7_3',
        category: 'strategy',
        text: 'Quels sont vos objectifs de croissance à 3 ans ?',
        type: 'textarea',
        required: true,
        helpText: 'Objectifs chiffrés (CA, clients, part de marché)',
        placeholder: 'Décrivez vos objectifs...'
      },
      {
        id: 'q7_4',
        category: 'strategy',
        text: 'Quels nouveaux marchés/segments envisagez-vous ?',
        type: 'textarea',
        required: false,
        helpText: 'Opportunités d\'expansion',
        placeholder: 'Listez les nouveaux marchés...'
      },
      {
        id: 'q7_5',
        category: 'strategy',
        text: 'Prévoyez-vous de lancer de nouveaux produits/services ?',
        type: 'select',
        required: true,
        options: [
          'Oui, dans les 6 mois',
          'Oui, dans l\'année',
          'Oui, à moyen terme (1-2 ans)',
          'Non, focus sur l\'existant',
          'Incertain'
        ],
        helpText: 'Roadmap produit'
      },
      {
        id: 'q7_6',
        category: 'strategy',
        text: 'Quelles sont vos priorités stratégiques ?',
        type: 'multiselect',
        required: true,
        options: [
          'Acquisition de nouveaux clients',
          'Rétention clients existants',
          'Augmentation du panier moyen',
          'Innovation produit',
          'Expansion géographique',
          'Partenariats stratégiques',
          'Amélioration de la rentabilité',
          'Levée de fonds',
          'Recrutement/équipe',
          'Optimisation opérationnelle'
        ],
        helpText: 'Top 3-5 priorités'
      },
      {
        id: 'q7_7',
        category: 'strategy',
        text: 'Quel est votre principal obstacle à la croissance ?',
        type: 'select',
        required: true,
        options: [
          'Manque de ressources financières',
          'Manque de ressources humaines',
          'Concurrence intense',
          'Notoriété insuffisante',
          'Produit pas assez mature',
          'Marché trop petit',
          'Réglementation',
          'Autre'
        ],
        helpText: 'Frein principal identifié'
      },
      {
        id: 'q7_8',
        category: 'strategy',
        text: 'Envisagez-vous des acquisitions ou partenariats ?',
        type: 'select',
        required: true,
        options: [
          'Oui, acquisitions prévues',
          'Oui, partenariats prévus',
          'Oui, les deux',
          'Non, croissance organique',
          'Pas encore réfléchi'
        ],
        helpText: 'Stratégie de croissance externe'
      },
      {
        id: 'q7_9',
        category: 'strategy',
        text: 'Quelle est votre capacité d\'investissement annuelle ?',
        type: 'currency',
        required: false,
        helpText: 'Budget disponible pour investissements',
        placeholder: '0'
      },
      {
        id: 'q7_10',
        category: 'strategy',
        text: 'Quel est votre horizon de rentabilité ?',
        type: 'select',
        required: true,
        options: [
          'Déjà rentable',
          'Rentable dans 6 mois',
          'Rentable dans 1 an',
          'Rentable dans 2-3 ans',
          'Rentable dans 3+ ans',
          'Pas de contrainte de rentabilité'
        ],
        helpText: 'Objectif de rentabilité'
      },
      {
        id: 'q7_11',
        category: 'strategy',
        text: 'Quels risques majeurs identifiez-vous ?',
        type: 'textarea',
        required: true,
        helpText: 'Risques stratégiques, opérationnels, financiers',
        placeholder: 'Listez les risques principaux...'
      },
      {
        id: 'q7_12',
        category: 'strategy',
        text: 'Quelle est votre vision à 5 ans ?',
        type: 'textarea',
        required: true,
        helpText: 'Où voulez-vous être dans 5 ans ?',
        placeholder: 'Décrivez votre vision...'
      }
    ]
  }
];

