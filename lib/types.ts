// CRM Types and Interfaces

export interface Contact {
  identifiant: number
  id?: number
  civilite?: string
  prenom?: string
  nom?: string
  raison_sociale?: string
  siret?: string
  adresse?: string
  code_postal?: string
  ville?: string
  telephone?: string
  email?: string
  created_at?: string
  updated_at?: string
  // Additional optional fields used by UI
  statut?: string
  type?: string
  notes?: string
  date_creation?: string
  // Computed fields
  projets?: Projet[]
  contrats?: Contrat[]
  interactions?: Interaction[]
  revenue?: number
  lastInteraction?: string
}

export interface Projet {
  id?: string | number
  projet_id: number
  contact_id?: number
  date_creation?: string
  origine?: string
  statut?: string
  commercial?: string
  date_souscription?: string
  contrat?: boolean
  created_at?: string
  updated_at?: string
  contact?: Contact
  type?: string
  notes?: string
}

export interface Contrat {
  id: string
  projet_id?: number
  contact_civilite?: string
  contact_prenom?: string
  contact_nom?: string
  contact_raison_sociale?: string
  contact_adresse?: string
  contact_complement_adresse?: string
  contact_code_postal?: string
  contact_ville?: string
  contact_id?: number
  projet_type?: string
  projet_origine?: string
  projet_provenance?: string
  projet_auteur?: string
  projet_statut?: string
  projet_date_creation?: string
  projet_derniere_modification?: string
  projet_date_souscription?: string
  projet_iban?: string
  projet_bic?: string
  commercial?: string
  contrat_num_version?: string
  contrat_compagnie?: string
  contrat_produit?: string
  contrat_formule?: string
  contrat_options?: string
  contrat_date_creation?: string
  contrat_debut_signature?: string
  contrat_debut_effet?: string
  contrat_date_echeance?: string
  contrat_demande_resiliation?: string
  contrat_fin_contrat?: string
  contrat_motif_resiliation?: string
  contrat_num_contrat?: string
  prime_brute_mensuelle?: number
  prime_nette_mensuelle?: number
  prime_brute_annuelle?: number
  prime_nette_annuelle?: number
  frais_honoraires?: number
  nb_mois_gratuits_annee1?: number
  nb_mois_gratuits_annee2?: number
  nb_mois_gratuits_annee3?: number
  fractionnement?: string
  type_commissionnement?: string
  commissionnement_annee1?: number
  commissionnement_autres_annees?: number
  contrat_commentaire?: string
  // Commission calculation fields
  cotisation_mensuelle?: number
  cotisation_annuelle?: number
  commission_mensuelle?: number
  commission_annuelle?: number
  commission_annuelle_avec_retenue?: number
  commission_recurrente?: number
  commission_recurrente_avec_retenue?: number
  type_commission?: 'Précompte' | 'Linéaire'
  date_calcul_commission?: string
  statut_calcul?: 'calculé' | 'en_attente' | 'erreur'
}

// Commission configuration for insurance companies
export interface CommissionConfig {
  compagnie: string
  taux_annee1: number // Percentage for first year
  taux_recurrent: number // Percentage for subsequent years
  type_commission: 'Précompte' | 'Linéaire'
  actif?: boolean
  date_creation?: string
  date_modification?: string
}

// Commission calculation result
export interface CommissionCalculation {
  id: string
  projet_id: number
  contact_id?: number
  contrat_id?: string
  compagnie: string
  cotisation_mensuelle: number
  cotisation_annuelle: number
  commission_mensuelle: number
  commission_annuelle: number
  commission_annuelle_avec_retenue: number
  commission_recurrente: number
  commission_recurrente_avec_retenue: number
  type_commission: 'Précompte' | 'Linéaire'
  date_calcul: string
  statut: 'calculé' | 'en_attente' | 'erreur'
  erreurs?: string[]
  metadata?: Record<string, unknown>
}

// Commission statistics and analytics
export interface CommissionStats {
  total_commissions_mensuelles: number
  total_commissions_annuelles: number
  total_commissions_recurrentes: number
  commissions_par_compagnie: Record<string, {
    nombre_contrats: number
    total_commissions: number
    moyenne_commission: number
  }>
  commissions_par_commercial: Record<string, {
    nombre_contrats: number
    total_commissions: number
    commissions_moyennes: number
  }>
  evolution_mensuelle: Array<{
    mois: string
    total_commissions: number
    nombre_calculs: number
  }>
  taux_reussite_calculs: number
}

// Commission service configuration
export interface CommissionServiceConfig {
  batch_size: number
  retry_attempts: number
  retry_delay: number
  cache_ttl: number
  email_notifications: boolean
  auto_calculate: boolean
  retention_rate: number // 0.875 = 87.5%
}

// Email notification for commissions
export interface CommissionNotification {
  id: string
  type: 'calcul_reussi' | 'calcul_erreur' | 'rapport_mensuel' | 'alerte_anomalie'
  destinataire: string
  sujet: string
  contenu: string
  date_envoi: string
  statut: 'envoye' | 'en_attente' | 'erreur'
  metadata?: Record<string, unknown>
}

// Origin tracking for contracts
export interface OriginTracking {
  id: string
  projet_id: number
  contact_id?: number
  source_principale: string
  source_secondaire?: string
  campagne_tracking?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  referer?: string
  metadata_tracking?: Record<string, unknown>
  date_tracking: string
  confiance_score?: number
}

// Advanced analytics data
export interface AdvancedAnalytics {
  conversions_par_source: Record<string, {
    nombre_projets: number
    taux_conversion: number
    valeur_totale: number
  }>
  performance_campagnes: Record<string, {
    impressions?: number
    clics?: number
    conversions: number
    cout_par_conversion?: number
    roi?: number
  }>
  segmentation_client: {
    par_revenue: Record<string, number>
    par_source: Record<string, number>
    par_produit: Record<string, number>
  }
  predictions: {
    revenus_previsionnels: number
    croissance_attendue: number
    risques_identifies: string[]
  }
}

export interface Segment {
  id: number
  nom: string
  description?: string
  criteres: Record<string, string | number | boolean>
  couleur?: string
  created_at?: string
  type_segment?: string
  statut_projet?: string
  conditions?: Record<string, string | number | boolean>
}

export interface EmailTemplate {
  id: number
  nom: string
  sujet: string
  contenu_html: string
  contenu_texte?: string
  variables?: Record<string, string | number>
  categorie?: string
  statut?: string
  created_at?: string
  updated_at?: string
}

export interface Workflow {
  id: number
  nom?: string
  description?: string
  declencheur?: string
  etapes?: Record<string, string | number | boolean>
  statut?: string
  segment_id?: number
  template_id?: number
  actif?: boolean
  created_at?: string
}

export interface Campaign {
  id: number
  nom: string
  description?: string
  segment_id?: number
  template_id?: number
  statut?: string
  date_lancement?: string
  date_fin?: string
  date_planifiee?: string
  email_config_id?: number
  contact_count?: number
  tracking_stats?: {
    envois: number
    ouvertures: number
    clics: number
    bounces: number
    desabonnements: number
  }
  created_at?: string
}

export interface Interaction {
  id: number
  contact_id?: number
  created_at?: string
  type?: string
  canal?: string
  sujet?: string
  message?: string
  statut?: string
  workflow_name?: string
  segment_name?: string
}

export interface CRMStats {
  totalContacts: number
  activeClients: number
  prospects: number
  totalRevenue: number
  conversionRate: string
  avgRevenuePerClient: string
  growthRate: string
  activeCampaigns: number
  crossSellOpportunities: number
  aiScore: number
}

export interface AnalyticsData {
  trends: Array<{
    date: string
    value: number
    label?: string
  }>
  segmentPerformance: Record<string, {
    contacts: number
    conversion: number
    revenue: number
  }>
  topCampaigns: Array<{
    id: number
    name: string
    performance: number
    sent: number
    opened: number
    clicked: number
  }>
  overview: {
    totalRevenue: number
    revenueGrowth: number
    totalCampaigns: number
    activeCampaigns: number
    emailsSent: number
    openRate: string
    clickRate: string
    conversionRate: string
    roi: number
  }
  aiInsights: Array<{
    type: string
    message: string
    confidence: number
    recommendation?: string
  }>
}
