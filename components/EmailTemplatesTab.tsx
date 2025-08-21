import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useToast } from '../hooks/use-toast'
import { supabase } from '../lib/supabase'
import type { EmailTemplate, Segment } from '../lib/types'
import { Plus, Mail, Eye, Brain, Copy, Edit, Trash2 } from 'lucide-react'

interface EmailTemplatesTabProps {
  templates: EmailTemplate[]
  segments: Segment[]
  onTemplateUpdate: () => void
}

export function EmailTemplatesTab({ templates, segments, onTemplateUpdate }: EmailTemplatesTabProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const { toast } = useToast()

  const [newTemplate, setNewTemplate] = useState({
    nom: '',
    sujet: '',
    contenu_html: '',
    contenu_texte: '',
    categorie: 'prospection',
    statut: 'active'
  })

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.sujet.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || template.categorie === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleCreateTemplate = async () => {
    try {
      if (isEditMode && selectedTemplate) {
        const { error } = await supabase
          .from('email_templates')
          .update(newTemplate)
          .eq('id', selectedTemplate.id)
        
        if (error) throw error
        
        toast({
          title: "Template modifié",
          description: "Le template a été modifié avec succès.",
        })
      } else {
        const { error } = await supabase
          .from('email_templates')
          .insert([newTemplate])

        if (error) throw error

        toast({
          title: "Template créé",
          description: "Le nouveau template a été créé avec succès.",
        })
      }

      setIsCreateDialogOpen(false)
      setIsEditMode(false)
      setSelectedTemplate(null)
      setNewTemplate({
        nom: '',
        sujet: '',
        contenu_html: '',
        contenu_texte: '',
        categorie: 'prospection',
        statut: 'active'
      })
      onTemplateUpdate()
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le template.",
        variant: "destructive"
      })
    }
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setNewTemplate({
      nom: template.nom,
      sujet: template.sujet,
      contenu_html: template.contenu_html,
      contenu_texte: template.contenu_texte || '',
      categorie: template.categorie || 'prospection',
      statut: template.statut || 'active'
    })
    setIsEditMode(true)
    setIsCreateDialogOpen(true)
  }

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)
      
      if (error) throw error
      
      toast({
        title: "Template supprimé",
        description: "Le template a été supprimé avec succès.",
      })
      
      onTemplateUpdate()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le template.",
        variant: "destructive"
      })
    }
  }

  const generateAITemplates = async () => {
    setIsGeneratingAI(true)
    try {
      // Template IA spécifique pour assurance santé seniors - Premunia
      const aiTemplate = {
        nom: "Relance Assurance Santé Seniors - Premunia IA",
        sujet: "Votre assurance santé seniors vous attend - Premunia",
        contenu_html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Premunia</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Votre courtier en assurance santé</p>
            </div>
            
            <div style="padding: 30px; background: white; border: 1px solid #e0e0e0; border-top: none;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Bonjour {{prenom}},</p>
              
              <p style="margin: 0 0 20px 0;">Nous avons remarqué que vous n'avez pas encore répondu à notre proposition d'assurance santé adaptée aux seniors.</p>
              
              <h3 style="color: #667eea; margin: 25px 0 15px 0;">Pourquoi nous contacter maintenant ?</h3>
              
              <div style="margin: 20px 0;">
                <p style="margin: 5px 0; color: #28a745;">✅ Devis gratuit et sans engagement</p>
                <p style="margin: 5px 0; color: #28a745;">✅ Garanties complémentaires santé</p>
                <p style="margin: 5px 0; color: #28a745;">✅ Accompagnement personnalisé</p>
                <p style="margin: 5px 0; color: #28a745;">✅ Économies sur vos frais de santé</p>
              </div>
              
              <p style="margin: 20px 0;">En tant que courtier spécialisé seniors, nous comprenons vos besoins et vous proposons des solutions adaptées.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="font-size: 18px; color: #667eea; margin: 10px 0;">📞 Appelez-nous au 01 23 45 67 89</p>
                <p style="margin: 10px 0;">Ou répondez à cet email pour un rappel immédiat.</p>
              </div>
              
              <p style="margin: 25px 0 5px 0;">Cordialement,<br>
              <strong>Votre courtier en assurance santé</strong></p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
              <h4 style="color: #667eea; margin: 0 0 15px 0;">📞 Contactez-nous :</h4>
              <p style="margin: 5px 0;">Téléphone : 01 23 45 67 89</p>
              <p style="margin: 5px 0;">Email : info@premunia.com</p>
              <p style="margin: 5px 0;">Disponible du lundi au vendredi, 9h-18h</p>
              
              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                <p style="margin: 0;">Cet email vous est envoyé par <strong>Premunia</strong>, votre courtier en assurance santé.</p>
              </div>
            </div>
          </div>
        `,
        contenu_texte: `
Bonjour {{prenom}},

Nous avons remarqué que vous n'avez pas encore répondu à notre proposition d'assurance santé adaptée aux seniors.

Pourquoi nous contacter maintenant ?

✅ Devis gratuit et sans engagement
✅ Garanties complémentaires santé  
✅ Accompagnement personnalisé
✅ Économies sur vos frais de santé

En tant que courtier spécialisé seniors, nous comprenons vos besoins et vous proposons des solutions adaptées.

📞 Appelez-nous au 01 23 45 67 89
Ou répondez à cet email pour un rappel immédiat.

Cordialement,
Votre courtier en assurance santé

📞 Contactez-nous :
Téléphone : 01 23 45 67 89
Email : info@premunia.com
Disponible du lundi au vendredi, 9h-18h

Cet email vous est envoyé par Premunia, votre courtier en assurance santé.
        `,
        categorie: 'relance',
        statut: 'active',
        variables: {
          prenom: 'Prénom du contact',
          nom: 'Nom du contact',
          email: 'Email du contact'
        }
      }

      const { error } = await supabase.from('email_templates').insert([aiTemplate])
      
      if (error) throw error

      toast({
        title: "Template IA Premunia généré",
        description: "Template d'assurance santé seniors créé avec succès.",
      })

      onTemplateUpdate()
    } catch (error) {
      console.error('Error generating AI templates:', error)
      toast({
        title: "Erreur",
        description: "Impossible de générer les templates IA.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handlePreview = (template: EmailTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewDialogOpen(true)
  }

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      const duplicatedTemplate = {
        ...template,
        nom: `${template.nom} (copie)`,
        statut: 'draft'
      }
      delete duplicatedTemplate.id
      delete duplicatedTemplate.created_at
      delete duplicatedTemplate.updated_at

      const { error } = await supabase
        .from('email_templates')
        .insert([duplicatedTemplate])

      if (error) throw error

      toast({
        title: "Template dupliqué",
        description: "Une copie du template a été créée.",
      })

      onTemplateUpdate()
    } catch (error) {
      console.error('Error duplicating template:', error)
      toast({
        title: "Erreur",
        description: "Impossible de dupliquer le template.",
        variant: "destructive"
      })
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      prospection: 'bg-blue-500',
      relance: 'bg-orange-500',
      onboarding: 'bg-green-500',
      newsletter: 'bg-purple-500',
      promotion: 'bg-red-500'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Templates Email</h2>
          <p className="text-muted-foreground">
            Gérez vos modèles d'emails pour vos campagnes et workflows
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={generateAITemplates}
            disabled={isGeneratingAI}
            variant="outline"
            className="gap-2"
          >
            <Brain size={16} />
            {isGeneratingAI ? 'Génération...' : 'Templates IA'}
          </Button>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="gap-2"
          >
            <Plus size={16} />
            Nouveau Template
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Rechercher un template..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            <SelectItem value="prospection">Prospection</SelectItem>
            <SelectItem value="relance">Relance</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="promotion">Promotion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-1">{template.nom}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge 
                      className={`${getCategoryColor(template.categorie || '')} text-white`}
                    >
                      {template.categorie}
                    </Badge>
                    <Badge variant={template.statut === 'active' ? 'default' : 'secondary'}>
                      {template.statut === 'active' ? 'Actif' : 'Brouillon'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Sujet</div>
                  <div className="text-sm font-medium line-clamp-2">{template.sujet}</div>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-xs text-muted-foreground">
                    Créé le {new Date(template.created_at || '').toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                    >
                      <Copy size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Modifier le template' : 'Créer un nouveau template'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Général</TabsTrigger>
              <TabsTrigger value="content">Contenu</TabsTrigger>
              <TabsTrigger value="preview">Aperçu</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template-name">Nom du template</Label>
                  <Input
                    id="template-name"
                    value={newTemplate.nom}
                    onChange={(e) => setNewTemplate({...newTemplate, nom: e.target.value})}
                    placeholder="Ex: Email de prospection"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template-category">Catégorie</Label>
                  <Select 
                    value={newTemplate.categorie} 
                    onValueChange={(value) => setNewTemplate({...newTemplate, categorie: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospection">Prospection</SelectItem>
                      <SelectItem value="relance">Relance</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template-subject">Sujet de l'email</Label>
                <Input
                  id="template-subject"
                  value={newTemplate.sujet}
                  onChange={(e) => setNewTemplate({...newTemplate, sujet: e.target.value})}
                  placeholder="Ex: 🏠 Protégez votre foyer avec notre assurance"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-html">Contenu HTML</Label>
                <Textarea
                  id="template-html"
                  value={newTemplate.contenu_html}
                  onChange={(e) => setNewTemplate({...newTemplate, contenu_html: e.target.value})}
                  placeholder="Contenu HTML de votre email..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Variables disponibles :</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <code>{'{{prenom}}'}</code>
                  <code>{'{{nom}}'}</code>
                  <code>{'{{email}}'}</code>
                  <code>{'{{telephone}}'}</code>
                  <code>{'{{ville}}'}</code>
                  <code>{'{{commercial}}'}</code>
                  <code>{'{{entreprise}}'}</code>
                  <code>{'{{produit}}'}</code>
                  <code>{'{{date}}'}</code>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="mb-4">
                  <div className="text-sm font-medium">Sujet :</div>
                  <div className="text-lg">{newTemplate.sujet || "Sujet de l'email"}</div>
                </div>
                <div 
                  className="bg-white p-4 rounded border"
                  dangerouslySetInnerHTML={{ 
                    __html: newTemplate.contenu_html || "<p>Contenu de l'email...</p>" 
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false)
                setIsEditMode(false)
                setSelectedTemplate(null)
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleCreateTemplate}>
              {isEditMode ? 'Modifier le template' : 'Créer le template'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Aperçu : {selectedTemplate?.nom}</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="text-sm font-medium">Sujet :</div>
                <div className="text-lg">{selectedTemplate.sujet}</div>
              </div>
              <div 
                className="bg-white p-6 border rounded-lg"
                dangerouslySetInnerHTML={{ __html: selectedTemplate.contenu_html }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}