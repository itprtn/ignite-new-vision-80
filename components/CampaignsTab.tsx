"use client"

// Transformé en "Historique des envois groupés" avec KPIs détaillés

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { useToast } from "../hooks/use-toast"
import { supabase } from "../lib/supabase"
import { 
  Mail, Calendar, Users, TrendingUp, Eye, AlertCircle, 
  CheckCircle, XCircle, Clock, BarChart3, PieChart,
  Target, Send, Loader2
} from "lucide-react"

interface EnvoiGroupe {
  id: number
  nom_campagne: string
  nombre_destinataires: number
  nombre_envoyes: number
  nombre_echecs: number
  template_id?: number
  statut_cible?: string
  commercial?: string
  created_at: string
  updated_at: string
  filtre_utilise?: any
}

interface EnvoiEmail {
  id: number
  campagne_id: number
  contact_id?: number
  projet_id?: number
  email_destinataire: string
  sujet: string
  statut: string
  date_envoi?: string
  date_ouverture?: string
  date_clic?: string
  erreur_message?: string
  contact?: {
    prenom: string
    nom: string
  }
}

interface EmailTemplate {
  id: number
  nom: string
  sujet: string
}

export function CampaignsTab() {
  const { toast } = useToast()
  const [envoisGroupes, setEnvoisGroupes] = useState<EnvoiGroupe[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  
  // Détails campagne sélectionnée
  const [selectedCampaign, setSelectedCampaign] = useState<EnvoiGroupe | null>(null)
  const [campaignEmails, setCampaignEmails] = useState<EnvoiEmail[]>([])
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les envois groupés
      const { data: envois, error: envoiError } = await supabase
        .from('envois_groupes')
        .select('*')
        .order('created_at', { ascending: false })

      if (envoiError) throw envoiError

      // Charger les templates
      const { data: templatesData, error: templateError } = await supabase
        .from('email_templates')
        .select('id, nom, sujet')

      if (templateError) throw templateError

      setEnvoisGroupes(envois || [])
      setTemplates(templatesData || [])
    } catch (error) {
      console.error('Error loading campaigns data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des envois",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCampaignDetails = async (campaign: EnvoiGroupe) => {
    try {
      setLoadingDetails(true)
      setSelectedCampaign(campaign)
      
      const { data: emails, error } = await supabase
        .from('envois_email')
        .select(`
          *,
          contact:contact_id (prenom, nom)
        `)
        .eq('campagne_id', campaign.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCampaignEmails(emails || [])
      setIsDetailsOpen(true)
    } catch (error) {
      console.error('Error loading campaign details:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la campagne",
        variant: "destructive"
      })
    } finally {
      setLoadingDetails(false)
    }
  }

  // Filtrage des campagnes
  const filteredCampaigns = useMemo(() => {
    return envoisGroupes.filter((campaign) => {
      const matchesSearch = !searchTerm || 
        campaign.nom_campagne.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.commercial?.toLowerCase().includes(searchTerm.toLowerCase())

      const campaignDate = new Date(campaign.created_at)
      const now = new Date()
      const matchesDate = dateFilter === "all" ||
        (dateFilter === "today" && campaignDate.toDateString() === now.toDateString()) ||
        (dateFilter === "week" && campaignDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) ||
        (dateFilter === "month" && campaignDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))

      const hasErrors = campaign.nombre_echecs > 0
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "success" && !hasErrors) ||
        (statusFilter === "errors" && hasErrors)

      return matchesSearch && matchesDate && matchesStatus
    })
  }, [envoisGroupes, searchTerm, dateFilter, statusFilter])

  // Calculs des KPIs globaux
  const globalStats = useMemo(() => {
    const totalCampaigns = filteredCampaigns.length
    const totalSent = filteredCampaigns.reduce((sum, c) => sum + c.nombre_envoyes, 0)
    const totalErrors = filteredCampaigns.reduce((sum, c) => sum + c.nombre_echecs, 0)
    const successRate = totalSent > 0 ? ((totalSent - totalErrors) / totalSent * 100) : 0

    return {
      totalCampaigns,
      totalSent,
      totalErrors,
      successRate: Math.round(successRate * 100) / 100
    }
  }, [filteredCampaigns])

  const getStatusColor = (campaign: EnvoiGroupe) => {
    if (campaign.nombre_echecs === 0) {
      return "bg-green-100 text-green-800 border-green-200"
    } else if (campaign.nombre_echecs === campaign.nombre_destinataires) {
      return "bg-red-100 text-red-800 border-red-200"  
    } else {
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    }
  }

  const getStatusText = (campaign: EnvoiGroupe) => {
    if (campaign.nombre_echecs === 0) {
      return "Succès complet"
    } else if (campaign.nombre_echecs === campaign.nombre_destinataires) {
      return "Échec total"
    } else {
      return "Succès partiel"
    }
  }

  const getEmailStatusColor = (statut: string) => {
    switch (statut) {
      case 'envoye':
        return "bg-green-100 text-green-800"
      case 'echec':
        return "bg-red-100 text-red-800"
      case 'ouvert':
        return "bg-blue-100 text-blue-800"
      case 'clique':
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Historique des Envois Groupés</h1>
          <p className="text-muted-foreground mt-1">
            Suivi détaillé des campagnes emails avec statistiques Brevo
          </p>
        </div>
      </div>

      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Mail className="w-6 h-6 text-blue-600" />
              <div className="text-3xl font-bold text-blue-600">{globalStats.totalCampaigns}</div>
            </div>
            <div className="text-sm text-blue-700 font-medium">Campagnes Totales</div>
          </CardContent>
        </Card>
        
        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Send className="w-6 h-6 text-green-600" />
              <div className="text-3xl font-bold text-green-600">{globalStats.totalSent}</div>
            </div>
            <div className="text-sm text-green-700 font-medium">Emails Envoyés</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div className="text-3xl font-bold text-red-600">{globalStats.totalErrors}</div>
            </div>
            <div className="text-sm text-red-700 font-medium">Échecs</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <div className="text-3xl font-bold text-purple-600">{globalStats.successRate}%</div>
            </div>
            <div className="text-sm text-purple-700 font-medium">Taux de Succès</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Rechercher une campagne..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="success">Succès complet</SelectItem>
                <SelectItem value="errors">Avec erreurs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setDateFilter("all")
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des campagnes */}
      <div className="grid gap-4">
        {filteredCampaigns.map((campaign) => {
          const template = templates.find(t => t.id === campaign.template_id)
          const successRate = campaign.nombre_destinataires > 0 
            ? Math.round((campaign.nombre_envoyes - campaign.nombre_echecs) / campaign.nombre_destinataires * 100)
            : 0

          return (
            <Card key={campaign.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{campaign.nom_campagne}</h3>
                      <Badge className={getStatusColor(campaign)}>
                        {getStatusText(campaign)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-700">{campaign.nombre_destinataires}</div>
                        <div className="text-xs text-muted-foreground">Destinataires</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{campaign.nombre_envoyes}</div>
                        <div className="text-xs text-muted-foreground">Envoyés</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{campaign.nombre_echecs}</div>
                        <div className="text-xs text-muted-foreground">Échecs</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{successRate}%</div>
                        <div className="text-xs text-muted-foreground">Succès</div>
                      </div>
                    </div>

                    {campaign.nombre_destinataires > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progression</span>
                          <span>{campaign.nombre_envoyes}/{campaign.nombre_destinataires}</span>
                        </div>
                        <Progress value={(campaign.nombre_envoyes / campaign.nombre_destinataires) * 100} className="h-2" />
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(campaign.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {template && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {template.nom}
                        </div>
                      )}
                      {campaign.commercial && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {campaign.commercial}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadCampaignDetails(campaign)}
                      disabled={loadingDetails}
                      className="gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Détails
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune campagne trouvée</h3>
            <p className="text-muted-foreground">
              Aucun envoi groupé ne correspond à vos critères de recherche.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Détails Campagne */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Détails de la campagne : {selectedCampaign?.nom_campagne}
            </DialogTitle>
          </DialogHeader>

          {selectedCampaign && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                <TabsTrigger value="emails">Emails ({campaignEmails.length})</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* KPIs détaillés */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{selectedCampaign.nombre_destinataires}</div>
                      <div className="text-sm text-muted-foreground">Destinataires</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{selectedCampaign.nombre_envoyes}</div>
                      <div className="text-sm text-muted-foreground">Envoyés</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-600">{selectedCampaign.nombre_echecs}</div>
                      <div className="text-sm text-muted-foreground">Échecs</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedCampaign.nombre_destinataires > 0 
                          ? Math.round((selectedCampaign.nombre_envoyes - selectedCampaign.nombre_echecs) / selectedCampaign.nombre_destinataires * 100)
                          : 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">Taux Succès</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Informations détaillées */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de la campagne</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Paramètres</h4>
                        <div className="space-y-2 text-sm">
                          <div><strong>Créée le :</strong> {new Date(selectedCampaign.created_at).toLocaleString('fr-FR')}</div>
                          <div><strong>Modifiée le :</strong> {new Date(selectedCampaign.updated_at).toLocaleString('fr-FR')}</div>
                          {selectedCampaign.commercial && <div><strong>Commercial :</strong> {selectedCampaign.commercial}</div>}
                          {selectedCampaign.statut_cible && <div><strong>Statut ciblé :</strong> {selectedCampaign.statut_cible}</div>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Template utilisé</h4>
                        <div className="text-sm">
                          {templates.find(t => t.id === selectedCampaign.template_id) ? (
                            <div className="p-3 bg-gray-50 rounded">
                              <div><strong>{templates.find(t => t.id === selectedCampaign.template_id)?.nom}</strong></div>
                              <div className="text-muted-foreground mt-1">
                                {templates.find(t => t.id === selectedCampaign.template_id)?.sujet}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground">Template personnalisé ou supprimé</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="emails" className="space-y-4 mt-6">
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {campaignEmails.map((email) => (
                    <Card key={email.id} className="border-l-4 border-l-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="font-medium">
                                {email.contact?.prenom} {email.contact?.nom}
                              </div>
                              <Badge className={getEmailStatusColor(email.statut)}>
                                {email.statut}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{email.email_destinataire}</div>
                            <div className="text-sm font-medium mt-1">{email.sujet}</div>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            {email.date_envoi && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(email.date_envoi).toLocaleString('fr-FR')}
                              </div>
                            )}
                            {email.erreur_message && (
                              <div className="text-red-600 mt-1 max-w-xs">
                                <AlertCircle className="h-3 w-3 inline mr-1" />
                                {email.erreur_message}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Répartition des statuts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Répartition des statuts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { status: 'envoye', label: 'Envoyés avec succès', color: 'bg-green-500' },
                          { status: 'echec', label: 'Échecs', color: 'bg-red-500' },
                          { status: 'ouvert', label: 'Ouvertures', color: 'bg-blue-500' },
                          { status: 'clique', label: 'Clics', color: 'bg-purple-500' }
                        ].map(({ status, label, color }) => {
                          const count = campaignEmails.filter(e => e.statut === status).length
                          const percentage = campaignEmails.length > 0 ? (count / campaignEmails.length * 100) : 0
                          
                          return (
                            <div key={status} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${color}`}></div>
                                <span className="text-sm">{label}</span>
                              </div>
                              <div className="text-sm font-medium">
                                {count} ({percentage.toFixed(1)}%)
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Timeline d'envoi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <div>
                          <strong>Démarrage :</strong> {new Date(selectedCampaign.created_at).toLocaleString('fr-FR')}
                        </div>
                        <div>
                          <strong>Dernière mise à jour :</strong> {new Date(selectedCampaign.updated_at).toLocaleString('fr-FR')}
                        </div>
                        <div>
                          <strong>Durée totale :</strong> {
                            Math.round((new Date(selectedCampaign.updated_at).getTime() - new Date(selectedCampaign.created_at).getTime()) / (1000 * 60))
                          } minutes
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}