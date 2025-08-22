"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "./ui/checkbox"
import { useToast } from "../hooks/use-toast"
import { supabase } from "../lib/supabase"
import { 
  Eye, Mail, Filter, Search, ChevronLeft, ChevronRight, 
  User, Building2, FileText, Calendar, Users, Target, 
  Send, CalendarPlus, CheckSquare, Square, Loader2
} from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Project {
  projet_id: number
  contact_id: number
  date_creation: string
  origine: string
  statut: string
  commercial: string
  contact?: {
    identifiant: number
    prenom: string
    nom: string
    email: string
    civilite: string
  }
}

interface EmailTemplate {
  id: number
  nom: string
  sujet: string
  contenu_html: string
  contenu_texte: string
}

export function ProjectsTab() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [commercialFilter, setCommercialFilter] = useState("all")
  const [distinctStatuses, setDistinctStatuses] = useState<string[]>([])
  const [distinctCommercials, setDistinctCommercials] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  
  // Dialogs
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [isRdvDialogOpen, setIsRdvDialogOpen] = useState(false)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [isCreatingRdv, setIsCreatingRdv] = useState(false)
  
  // Email form
  const [emailData, setEmailData] = useState({
    templateId: '',
    subject: '',
    content: '',
    useCustomContent: false
  })
  
  // RDV form
  const [rdvData, setRdvData] = useState({
    dateProposee: '',
    message: ''
  })

  useEffect(() => {
    loadProjects()
    loadFilters()
    loadTemplates()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("projets")
        .select(`
          *,
          contact:contact_id (
            identifiant,
            prenom,
            nom,
            email,
            civilite
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error loading projects:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les projets",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFilters = async () => {
    try {
      const { data, error } = await supabase
        .from("projets")
        .select("statut, commercial")
        .not("statut", "is", null)
        .not("commercial", "is", null)

      if (error) throw error
      
      const statuses = [...new Set(data?.map(p => p.statut).filter(Boolean))] as string[]
      const commercials = [...new Set(data?.map(p => p.commercial).filter(Boolean))] as string[]
      
      setDistinctStatuses(statuses.sort())
      setDistinctCommercials(commercials.sort())
    } catch (error) {
      console.error("Error loading filters:", error)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, nom, sujet, contenu_html, contenu_texte')
        .eq('statut', 'active')
        .order('nom')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  // Filtrage des projets
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = !searchTerm || 
        project.contact?.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.contact?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.commercial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.origine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projet_id.toString().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || 
        project.statut?.toLowerCase().includes(statusFilter.toLowerCase())

      const matchesCommercial = commercialFilter === "all" ||
        project.commercial === commercialFilter

      return matchesSearch && matchesStatus && matchesCommercial
    })
  }, [projects, searchTerm, statusFilter, commercialFilter])

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage)

  // Sélection
  const toggleProjectSelection = (projectId: number) => {
    const newSelection = new Set(selectedProjects)
    if (newSelection.has(projectId)) {
      newSelection.delete(projectId)
    } else {
      newSelection.add(projectId)
    }
    setSelectedProjects(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedProjects.size === paginatedProjects.length) {
      setSelectedProjects(new Set())
    } else {
      setSelectedProjects(new Set(paginatedProjects.map(p => p.projet_id)))
    }
  }

  const getSelectedProjectsWithEmail = () => {
    return paginatedProjects
      .filter(p => selectedProjects.has(p.projet_id) && p.contact?.email)
      .map(p => ({
        projectId: p.projet_id,
        contactId: p.contact?.identifiant,
        email: p.contact!.email!,
        prenom: p.contact?.prenom || '',
        nom: p.contact?.nom || '',
        civilite: p.contact?.civilite || '',
        commercial: p.commercial || ''
      }))
  }

  // Personnalisation des variables dans le contenu
  const personalizeContent = (content: string, recipient: any) => {
    return content
      .replace(/{{nom_client}}/g, `${recipient.prenom} ${recipient.nom}`)
      .replace(/{{prenom}}/g, recipient.prenom)
      .replace(/{{nom}}/g, recipient.nom)
      .replace(/{{nom_commercial}}/g, recipient.commercial)
      .replace(/{{lien_rdv}}/g, recipient.lien_rdv || '#')
      .replace(/{{infos_premunia}}/g, `
        📞 Contactez-nous :
        Téléphone : 01 23 45 67 89
        Email : info@premunia.com
        Disponible du lundi au vendredi, 9h-18h
      `)
  }

  // Envoi groupé d'emails via Brevo
  const handleSendGroupEmail = async () => {
    const recipients = getSelectedProjectsWithEmail()
    if (recipients.length === 0) {
      toast({
        title: "Aucun destinataire",
        description: "Sélectionnez des projets avec des emails valides",
        variant: "destructive"
      })
      return
    }

    setIsSendingEmail(true)
    
    try {
      // Créer une campagne
      const { data: campaign, error: campaignError } = await supabase
        .from('envois_groupes')
        .insert({
          nom_campagne: `Envoi groupé - ${new Date().toLocaleDateString()}`,
          nombre_destinataires: recipients.length,
          template_id: emailData.templateId ? parseInt(emailData.templateId) : null,
          statut_cible: statusFilter !== 'all' ? statusFilter : null,
          commercial: commercialFilter !== 'all' ? commercialFilter : null
        })
        .select()
        .single()

      if (campaignError) throw campaignError

      let successCount = 0
      let errorCount = 0
      const errors: string[] = []

      // Envoyer les emails un par un via Brevo
      for (const recipient of recipients) {
        try {
          const selectedTemplate = templates.find(t => t.id === parseInt(emailData.templateId))
          const subject = emailData.useCustomContent ? emailData.subject : selectedTemplate?.sujet || 'Email Premunia'
          const htmlContent = emailData.useCustomContent ? emailData.content : selectedTemplate?.contenu_html || ''
          const textContent = selectedTemplate?.contenu_texte || ''

          // Personnaliser le contenu
          const personalizedHtml = personalizeContent(htmlContent, recipient)
          const personalizedText = personalizeContent(textContent, recipient)
          const personalizedSubject = personalizeContent(subject, recipient)

          // Appeler l'edge function d'envoi via Brevo
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
            body: {
              to: recipient.email,
              subject: personalizedSubject,
              html: personalizedHtml,
              text: personalizedText,
              projectId: recipient.projectId,
              campaignId: campaign.id
            }
          })

          if (emailError) throw emailError

          console.log(`Email envoyé avec succès à ${recipient.email}:`, emailResult)
          successCount++

          // Enregistrer l'envoi
          await supabase.from('envois_email').insert({
            campagne_id: campaign.id,
            contact_id: recipient.contactId,
            projet_id: recipient.projectId,
            email_destinataire: recipient.email,
            sujet: personalizedSubject,
            contenu_html: personalizedHtml,
            contenu_texte: personalizedText,
            statut: 'envoye',
            date_envoi: new Date().toISOString()
          })

        } catch (error: any) {
          console.error(`Erreur envoi email à ${recipient.email}:`, error)
          errorCount++
          errors.push(`${recipient.email}: ${error.message}`)

          // Enregistrer l'échec
          await supabase.from('envois_email').insert({
            campagne_id: campaign.id,
            contact_id: recipient.contactId,
            projet_id: recipient.projectId,
            email_destinataire: recipient.email,
            sujet: emailData.subject,
            statut: 'echec',
            erreur_message: error.message
          })
        }
      }

      // Mettre à jour les stats de la campagne
      await supabase
        .from('envois_groupes')
        .update({
          nombre_envoyes: successCount,
          nombre_echecs: errorCount
        })
        .eq('id', campaign.id)

      // Notification de résultat
      if (successCount > 0) {
        toast({
          title: "Emails envoyés",
          description: `${successCount} emails envoyés avec succès ${errorCount > 0 ? `(${errorCount} échecs)` : ''}`,
        })
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "Échec d'envoi",
          description: `Tous les emails ont échoué. Vérifiez la configuration Brevo.`,
          variant: "destructive"
        })
      }

      setIsEmailDialogOpen(false)
      setSelectedProjects(new Set())
      setEmailData({ templateId: '', subject: '', content: '', useCustomContent: false })

    } catch (error: any) {
      console.error('Erreur envoi groupé:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer les emails",
        variant: "destructive"
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Créer des RDV pour les projets sélectionnés
  const handleCreateRdv = async () => {
    const selectedProjectsList = paginatedProjects.filter(p => selectedProjects.has(p.projet_id))
    
    if (selectedProjectsList.length === 0) {
      toast({
        title: "Aucun projet sélectionné",
        description: "Sélectionnez au moins un projet",
        variant: "destructive"
      })
      return
    }

    setIsCreatingRdv(true)

    try {
      const rdvPromises = selectedProjectsList.map(async (project) => {
        // Créer le RDV dans la base
        const { data: rdv, error } = await supabase
          .from('rdv')
          .insert({
            projet_id: project.projet_id,
            commercial_id: project.commercial,
            date_proposee: rdvData.dateProposee,
            message: rdvData.message,
            statut: 'propose'
          })
          .select()
          .single()

        if (error) throw error

        // Générer le lien unique
        const lienRdv = `${window.location.origin}/rdv/${rdv.id}`
        
        // Mettre à jour avec le lien
        await supabase
          .from('rdv')
          .update({ lien: lienRdv })
          .eq('id', rdv.id)

        return { ...rdv, lien: lienRdv }
      })

      const rdvResults = await Promise.all(rdvPromises)

      toast({
        title: "RDV créés",
        description: `${rdvResults.length} rendez-vous proposés avec succès`,
      })

      setIsRdvDialogOpen(false)
      setSelectedProjects(new Set())
      setRdvData({ dateProposee: '', message: '' })

    } catch (error: any) {
      console.error('Erreur création RDV:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer les rendez-vous",
        variant: "destructive"
      })
    } finally {
      setIsCreatingRdv(false)
    }
  }

  // Sélection du template
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === parseInt(templateId))
    if (template) {
      setEmailData({
        templateId,
        subject: template.sujet,
        content: template.contenu_html,
        useCustomContent: false
      })
    }
  }

  const getStatusColor = (statut: string) => {
    const statusLower = statut?.toLowerCase()
    switch (true) {
      case statusLower?.includes("ne repond pas") || statusLower?.includes("ne répond pas"):
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case statusLower?.includes("en cours"):
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case statusLower?.includes("devis envoyé"):
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case statusLower?.includes("contrat"):
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
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
          <h1 className="text-3xl font-bold text-foreground">Gestion des Projets</h1>
          <p className="text-muted-foreground mt-2">
            {filteredProjects.length} projets • {selectedProjects.size} sélectionnés
          </p>
        </div>
      </div>

      {/* Filtres avancés */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ne repond pas">Ne répond pas</SelectItem>
                <SelectItem value="en cours">En cours</SelectItem>
                <SelectItem value="devis envoyé">Devis envoyé</SelectItem>
                <SelectItem value="contrat">Contrat signé</SelectItem>
                {distinctStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={commercialFilter} onValueChange={setCommercialFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Commercial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les commerciaux</SelectItem>
                {distinctCommercials.map(commercial => (
                  <SelectItem key={commercial} value={commercial}>{commercial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setCommercialFilter("all")
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions groupées */}
      {selectedProjects.size > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">
                {selectedProjects.size} projet{selectedProjects.size > 1 ? 's' : ''} sélectionné{selectedProjects.size > 1 ? 's' : ''}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsEmailDialogOpen(true)}
                  className="gap-2"
                  disabled={getSelectedProjectsWithEmail().length === 0}
                >
                  <Send className="h-4 w-4" />
                  Envoyer Email Groupé ({getSelectedProjectsWithEmail().length})
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsRdvDialogOpen(true)}
                  className="gap-2"
                >
                  <CalendarPlus className="h-4 w-4" />
                  Proposer RDV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des projets */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Projets</CardTitle>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedProjects.size === paginatedProjects.length && paginatedProjects.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Tout sélectionner</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paginatedProjects.map((project) => (
              <div 
                key={project.projet_id}
                className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedProjects.has(project.projet_id)}
                  onCheckedChange={() => toggleProjectSelection(project.projet_id)}
                />
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <div className="font-medium">
                      {project.contact?.prenom} {project.contact?.nom}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ID: {project.projet_id}
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    {project.contact?.email || (
                      <span className="text-red-500">Pas d'email</span>
                    )}
                  </div>
                  
                  <Badge className={getStatusColor(project.statut)}>
                    {project.statut}
                  </Badge>
                  
                  <div className="text-sm">
                    <User className="h-4 w-4 inline mr-1" />
                    {project.commercial}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/projects/${project.projet_id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredProjects.length)} sur {filteredProjects.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Envoi Email Groupé */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Envoi Email Groupé - {getSelectedProjectsWithEmail().length} destinataires</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template existant</Label>
                <Select 
                  value={emailData.templateId} 
                  onValueChange={handleTemplateSelect}
                  disabled={emailData.useCustomContent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 mt-8">
                <Checkbox
                  checked={emailData.useCustomContent}
                  onCheckedChange={(checked) => setEmailData({
                    ...emailData, 
                    useCustomContent: !!checked,
                    templateId: checked ? '' : emailData.templateId
                  })}
                />
                <Label>Rédiger un email personnalisé</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sujet</Label>
              <Input
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                placeholder="Sujet de l'email"
              />
            </div>

            <div className="space-y-2">
              <Label>Contenu HTML</Label>
              <Textarea
                value={emailData.content}
                onChange={(e) => setEmailData({...emailData, content: e.target.value})}
                placeholder="Contenu de l'email en HTML"
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Variables disponibles :</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><code>{'{{nom_client}}'}</code> - Nom complet</div>
                <div><code>{'{{prenom}}'}</code> - Prénom</div>
                <div><code>{'{{nom}}'}</code> - Nom de famille</div>
                <div><code>{'{{nom_commercial}}'}</code> - Commercial assigné</div>
                <div><code>{'{{lien_rdv}}'}</code> - Lien RDV (si créé)</div>
                <div><code>{'{{infos_premunia}}'}</code> - Infos de contact Premunia</div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSendGroupEmail} disabled={isSendingEmail}>
                {isSendingEmail && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Envoyer via Brevo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Proposition RDV */}
      <Dialog open={isRdvDialogOpen} onOpenChange={setIsRdvDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Proposer un RDV - {selectedProjects.size} projets</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date proposée</Label>
              <Input
                type="datetime-local"
                value={rdvData.dateProposee}
                onChange={(e) => setRdvData({...rdvData, dateProposee: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Message personnalisé</Label>
              <Textarea
                value={rdvData.message}
                onChange={(e) => setRdvData({...rdvData, message: e.target.value})}
                placeholder="Message à joindre à la proposition de RDV"
                rows={4}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Liens générés automatiquement :</h4>
              <p className="text-sm text-blue-700">
                Un lien unique sera créé pour chaque RDV : <br />
                <code className="bg-white px-2 py-1 rounded">
                  https://moncrm.netlify.app/rdv/[id]
                </code>
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsRdvDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleCreateRdv} disabled={isCreatingRdv}>
                {isCreatingRdv && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Créer les RDV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}