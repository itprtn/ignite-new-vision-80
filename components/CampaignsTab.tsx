"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Progress } from "./ui/progress"
import { supabase, supabaseUrl, supabaseAnonKey } from "../lib/supabase"
import type { Campaign, Contact } from "../lib/types"

interface CampaignsTabProps {
  campaigns: Campaign[]
  contacts: Contact[]
  onCampaignUpdate: () => void
}

interface Segment {
  id: number
  nom: string
  description: string
  criteres: any
}

interface EmailTemplate {
  id: number
  nom: string
  sujet: string
  contenu_html: string
  contenu_texte: string
}

interface EmailConfig {
  id: number
  email: string
  description: string
}

export function CampaignsTab({ campaigns, contacts, onCampaignUpdate }: CampaignsTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isNewCampaign, setIsNewCampaign] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)

  const [segments, setSegments] = useState<Segment[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([])
  const [campaignStats, setCampaignStats] = useState<any>({})

  useEffect(() => {
    loadSegments()
    loadTemplates()
    loadEmailConfigs()
    loadCampaignStats()
  }, [])

  const loadSegments = async () => {
    try {
      const { data, error } = await supabase.from("segments").select("id, nom, description, criteres").order("nom")

      if (error) throw error
      setSegments(data || [])
    } catch (error) {
      console.error("Error loading segments:", error)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("id, nom, sujet, contenu_html, contenu_texte")
        .eq("statut", "actif")
        .order("nom")

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  const loadEmailConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from("email_configurations")
        .select("id, email, description")
        .eq("is_active", true)
        .order("email")

      if (error) throw error
      setEmailConfigs(data || [])
    } catch (error) {
      console.error("Error loading email configs:", error)
    }
  }

  const loadCampaignStats = async () => {
    try {
      const stats: any = {}
      for (const campaign of campaigns) {
        const { data, error } = await supabase.rpc("get_email_stats", { p_campagne_id: campaign.id })
        if (!error && data && data.length > 0) {
          stats[campaign.id] = data[0]
        }
      }
      setCampaignStats(stats)
    } catch (error) {
      console.error("Error loading campaign stats:", error)
    }
  }

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch =
        !searchTerm ||
        campaign.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || campaign.statut === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [campaigns, searchTerm, statusFilter])

  const getStatusColor = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case "en_cours":
        return "bg-green-100 text-green-800"
      case "brouillon":
        return "bg-gray-100 text-gray-800"
      case "planifiee":
        return "bg-blue-100 text-blue-800"
      case "terminee":
        return "bg-purple-100 text-purple-800"
      case "annulee":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCampaignSubmit = async (formData: FormData) => {
    try {
      const campaignData = {
        nom: formData.get("nom") as string,
        description: formData.get("description") as string,
        segment_id: Number.parseInt(formData.get("segment_id") as string),
        template_id: Number.parseInt(formData.get("template_id") as string),
        email_config_id: Number.parseInt(formData.get("email_config_id") as string),
        statut: formData.get("statut") as string,
        date_planifiee: (formData.get("date_planifiee") as string) || null,
        updated_at: new Date().toISOString(),
      }

      if (isNewCampaign) {
        await supabase.from("campagnes_email").insert([
          {
            ...campaignData,
            created_at: new Date().toISOString(),
          },
        ])
      } else if (selectedCampaign) {
        await supabase.from("campagnes_email").update(campaignData).eq("id", selectedCampaign.id)
      }

      setIsDialogOpen(false)
      setSelectedCampaign(null)
      onCampaignUpdate()
    } catch (error) {
      console.error("Error saving campaign:", error)
    }
  }

  const handleLaunchCampaign = async (campaignId: number, immediate = false) => {
    setIsLaunching(true)
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/launch-campaign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          campaignId,
          immediate,
          scheduledFor: immediate ? null : new Date().toISOString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log("Campaign launched successfully:", result)
        onCampaignUpdate()
        loadCampaignStats()
      } else {
        console.error("Campaign launch failed:", result.error)
      }
    } catch (error) {
      console.error("Error launching campaign:", error)
    } finally {
      setIsLaunching(false)
    }
  }

  const openNewCampaignDialog = () => {
    setSelectedCampaign(null)
    setIsNewCampaign(true)
    setIsDialogOpen(true)
  }

  const openEditCampaignDialog = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setIsNewCampaign(false)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Campagnes Email</h2>
          <p className="text-muted-foreground">{filteredCampaigns.length} campagnes trouvées</p>
        </div>
        <Button onClick={openNewCampaignDialog} className="bg-orange-600 hover:bg-orange-700">
          <i className="fas fa-plus mr-2"></i>
          Nouvelle Campagne
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Rechercher</Label>
              <Input
                id="search"
                placeholder="Nom, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Statut</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="planifiee">Planifiée</SelectItem>
                  <SelectItem value="terminee">Terminée</SelectItem>
                  <SelectItem value="annulee">Annulée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
              >
                <i className="fas fa-times mr-2"></i>
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => {
          const stats = campaignStats[campaign.id] || {}
          return (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{campaign.nom}</CardTitle>
                  <Badge className={getStatusColor(campaign.statut)}>{campaign.statut}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-semibold text-blue-600">{stats.total_sent || 0}</div>
                      <div className="text-xs text-muted-foreground">Envoyés</div>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold text-green-600">{stats.open_rate || 0}%</div>
                      <div className="text-xs text-muted-foreground">Ouverture</div>
                    </div>
                  </div>

                  {campaign.statut === "en_cours" && stats.total_sent > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Progression</span>
                        <span>
                          {stats.total_sent}/{campaign.contact_count || 0}
                        </span>
                      </div>
                      <Progress
                        value={campaign.contact_count ? (stats.total_sent / campaign.contact_count) * 100 : 0}
                        className="h-2"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-sm">
                    <i className="fas fa-calendar text-muted-foreground w-4"></i>
                    <span>{new Date(campaign.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => openEditCampaignDialog(campaign)}>
                    <i className="fas fa-edit mr-1"></i>
                    Modifier
                  </Button>
                  {campaign.statut === "brouillon" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleLaunchCampaign(campaign.id, true)}
                      disabled={isLaunching}
                    >
                      <i className="fas fa-paper-plane mr-1"></i>
                      Lancer
                    </Button>
                  )}
                  {campaign.statut === "en_cours" && (
                    <Button size="sm" variant="outline">
                      <i className="fas fa-chart-line mr-1"></i>
                      Stats
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNewCampaign ? "Nouvelle Campagne Email" : "Modifier la Campagne"}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="targeting">Ciblage</TabsTrigger>
              <TabsTrigger value="content">Contenu</TabsTrigger>
            </TabsList>

            <form onSubmit={(e) => { e.preventDefault(); handleCampaignSubmit(new FormData(e.currentTarget)); }} className="space-y-4">
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">Nom de la campagne *</Label>
                    <Input id="nom" name="nom" defaultValue={selectedCampaign?.nom || ""} required />
                  </div>
                  <div>
                    <Label htmlFor="statut">Statut</Label>
                    <Select name="statut" defaultValue={selectedCampaign?.statut || "brouillon"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="planifiee">Planifiée</SelectItem>
                        <SelectItem value="en_cours">En cours</SelectItem>
                        <SelectItem value="terminee">Terminée</SelectItem>
                        <SelectItem value="annulee">Annulée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={selectedCampaign?.description || ""}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_planifiee">Date planifiée (optionnel)</Label>
                    <Input
                      id="date_planifiee"
                      name="date_planifiee"
                      type="datetime-local"
                      defaultValue={
                        selectedCampaign?.date_planifiee
                          ? new Date(selectedCampaign.date_planifiee).toISOString().slice(0, 16)
                          : ""
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email_config_id">Configuration Email</Label>
                    <Select name="email_config_id" defaultValue={selectedCampaign?.email_config_id?.toString() || "2"}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {emailConfigs.map((config) => (
                          <SelectItem key={config.id} value={config.id.toString()}>
                            {config.email} - {config.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="targeting" className="space-y-4">
                <div>
                  <Label htmlFor="segment_id">Segment cible *</Label>
                  <Select name="segment_id" defaultValue={selectedCampaign?.segment_id?.toString() || ""} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un segment" />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((segment) => (
                        <SelectItem key={segment.id} value={segment.id.toString()}>
                          {segment.nom} - {segment.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="template_id">Template Email *</Label>
                  <Select name="template_id" defaultValue={selectedCampaign?.template_id?.toString() || ""} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.nom} - {template.sujet}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Template preview */}
                {templates.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Aperçu du template sélectionné</h4>
                    <div className="text-sm text-gray-600">
                      Variables disponibles: {"{prenom}"}, {"{nom}"}, {"{civilite}"}, {"{email}"}
                    </div>
                  </div>
                )}
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                  {isNewCampaign ? "Créer la Campagne" : "Modifier la Campagne"}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
