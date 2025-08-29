'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Progress } from '../../../../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Projet, Contact, Contrat, Interaction } from '../../../../lib/types';

interface EmailHistory {
  id: number;
  campagne_id: number;
  contact_id: number;
  projet_id: number;
  destinataire: string;
  sujet: string;
  contenu_html?: string;
  contenu_texte?: string;
  statut: string;
  date_envoi?: string;
  date_ouverture?: string;
  date_clic?: string;
  created_at: string;
}

interface BrevoEvent {
  date: string;
  event: string;
  subject: string;
  campaign: string;
}
import { Calendar, User, Building, Euro, Phone, Mail, MapPin, Clock, TrendingUp, FileText, AlertCircle, ArrowLeft, MessageSquare, History, Eye } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../../../../hooks/use-toast';

async function getProjectData(projectId: string) {
  const { data: projet, error: projetError } = await supabase
    .from('projets')
    .select('*, contact:contact_id(*)')
    .eq('projet_id', projectId)
    .single();

  if (projetError || !projet) {
    console.error('Error fetching project:', projetError);
    return null;
  }

  const { data: contrat, error: contratError } = await supabase
    .from('contrats')
    .select('*')
    .eq('projet_id', projectId)
    .single();

  if (contratError) {
    console.error('Error fetching contract:', contratError);
  }

  const { data: interactions, error: interactionsError } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', projet.contact_id);

  if (interactionsError) {
    console.error('Error fetching interactions:', interactionsError);
  }

  return {
    projet: projet as Projet,
    contact: projet.contact as Contact,
    contrat: contrat as Contrat | undefined,
    interactions: (interactions as Interaction[]) || [],
  };
}

const ProjectDetailsPage = ({ params }: { params: { id: string } }) => {
  const { toast } = useToast()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [projectHistory, setProjectHistory] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<Projet | null>(null)
  const [projet, setProjet] = useState<Projet | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [contrat, setContrat] = useState<Contrat | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  // Email statistics state
  const [emailStats, setEmailStats] = useState({
    totalEmails: 0,
    recentEmailDate: null as Date | null,
    sentEmails: 0,
    openedEmails: 0,
    clickedEmails: 0,
    errorEmails: 0
  })
  const [brevoHistory, setBrevoHistory] = useState<BrevoEvent[]>([])
  const [loadingEmailStats, setLoadingEmailStats] = useState(false)
  const [loadingBrevoHistory, setLoadingBrevoHistory] = useState(false)

  // Load project data
  useEffect(() => {
    const loadData = async () => {
      const data = await getProjectData(params.id);
      if (!data) {
        notFound();
        return;
      }
      setProjet(data.projet);
      setContact(data.contact);
      setContrat(data.contrat || null);
      setInteractions(data.interactions);
      setLoading(false);
    };

    loadData();
  }, [params.id]);

  // Load email statistics
  const loadEmailStats = async (projectId: string) => {
    if (!projectId) return;

    try {
      setLoadingEmailStats(true);
      console.log('🔍 DEBUG: Loading email statistics for project:', projectId);

      // First, let's check if there are any emails in the database at all
      const { data: allEmails, error: allEmailsError } = await supabase
        .from('envois_email')
        .select('id, projet_id, statut')
        .limit(5);

      if (allEmailsError) {
        console.error('🔍 DEBUG: Error checking all emails:', allEmailsError);
      } else {
        console.log('🔍 DEBUG: Sample emails in database:', allEmails);
      }

      // Convert projectId to number if it's a string
      const numericProjectId = parseInt(projectId);
      console.log('🔍 DEBUG: Numeric project ID:', numericProjectId);

      // Get all emails for this project
      const { data: emails, error } = await supabase
        .from('envois_email')
        .select('id, campagne_id, contact_id, projet_id, email_destinataire, sujet, contenu_html, contenu_texte, statut, date_envoi, date_ouverture, date_clic, created_at')
        .eq('projet_id', numericProjectId)
        .order('date_envoi', { ascending: false });

      if (error) {
        console.error('🔍 DEBUG: Error loading email stats:', error);
        return;
      }

      console.log('🔍 DEBUG: Found emails for stats:', emails?.length || 0);
      if (emails && emails.length > 0) {
        console.log('🔍 DEBUG: First email sample:', emails[0]);
      } else {
        console.log('🔍 DEBUG: No emails found for project ID:', numericProjectId);
      }

      if (emails && emails.length > 0) {
        // Calculate statistics
        const totalEmails = emails.length;
        const sentEmails = emails.filter(e => e.statut === 'envoye').length;
        const openedEmails = emails.filter(e => e.statut === 'ouvert').length;
        const clickedEmails = emails.filter(e => e.statut === 'clique').length;
        const errorEmails = emails.filter(e => e.statut === 'echec').length;

        // Find most recent email date
        const recentEmail = emails.find(e => e.date_envoi);
        const recentEmailDate = recentEmail?.date_envoi ? new Date(recentEmail.date_envoi) : null;

        setEmailStats({
          totalEmails,
          recentEmailDate,
          sentEmails,
          openedEmails,
          clickedEmails,
          errorEmails
        });

        console.log('🔍 DEBUG: Email stats calculated:', {
          totalEmails,
          recentEmailDate,
          sentEmails,
          openedEmails,
          clickedEmails,
          errorEmails
        });
      } else {
        // No emails found, reset stats
        setEmailStats({
          totalEmails: 0,
          recentEmailDate: null,
          sentEmails: 0,
          openedEmails: 0,
          clickedEmails: 0,
          errorEmails: 0
        });
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error in loadEmailStats:', error);
    } finally {
      setLoadingEmailStats(false);
    }
  };

  // Load email tracking history for the contact
  const loadEmailTrackingHistory = async (email: string) => {
    if (!email) return;

    try {
      setLoadingBrevoHistory(true);
      console.log('🔍 DEBUG: Loading email tracking history for:', email);

      const historyData = await history(email);
      setBrevoHistory(historyData);

      console.log('🔍 DEBUG: Email tracking history loaded:', historyData.length, 'events');
    } catch (error) {
      console.error('🔍 DEBUG: Error loading email tracking history:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique de suivi email",
        variant: "destructive"
      });
    } finally {
      setLoadingBrevoHistory(false);
    }
  };

  // Load data and email stats when project is loaded
  useEffect(() => {
    if (projet?.projet_id) {
      console.log('🔍 DEBUG: Project loaded:', projet);
      console.log('🔍 DEBUG: Project ID type:', typeof projet.projet_id, 'value:', projet.projet_id);
      loadEmailStats(projet.projet_id.toString());
      if (contact?.email) {
        loadEmailTrackingHistory(contact.email);
      }
    }
  }, [projet?.projet_id, contact?.email]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!projet || !contact) {
    notFound();
    return null;
  }

  const getStatutColor = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'contrat enregistré': return 'bg-green-100 text-green-800';
      case 'devis envoyé': return 'bg-blue-100 text-blue-800';
      case 'en cours': case 'projet à traiter': return 'bg-yellow-100 text-yellow-800';
      case 'perdu': case 'inexploitable': return 'bg-red-100 text-red-800';
      case 'ne répond pas': return 'bg-gray-100 text-gray-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const getProgressValue = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'nouveau': return 20;
      case 'projet à traiter': case 'en cours': return 40;
      case 'devis envoyé': return 70;
      case 'contrat enregistré': return 100;
      default: return 10;
    }
  };

  const getProgressColor = (statut: string) => {
    switch (statut?.toLowerCase()) {
      case 'contrat enregistré': return 'bg-green-500';
      case 'devis envoyé': return 'bg-blue-500';
      case 'en cours': case 'projet à traiter': return 'bg-yellow-500';
      case 'perdu': case 'inexploitable': return 'bg-red-500';
      case 'ne répond pas': return 'bg-gray-500';
      default: return 'bg-purple-500';
    }
  };

  const loadProjectEmailHistory = async () => {
    if (!projet) return;

    try {
      setLoadingHistory(true);
      setSelectedProject(projet);

      console.log('🔍 DEBUG: Loading project email history for project ID:', projet.projet_id);

      // Get emails for this project
      const { data: emails, error } = await supabase
        .from('envois_email')
        .select('id, campagne_id, contact_id, projet_id, destinataire, sujet, contenu_html, contenu_texte, statut, date_envoi, date_ouverture, date_clic, created_at')
        .eq('projet_id', projet.projet_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('🔍 DEBUG: Error loading emails:', error);
        throw error;
      }

      console.log('🔍 DEBUG: Found emails:', emails?.length || 0);

      if (emails && emails.length > 0) {
        // Group emails by campaign and get campaign details
        const campaignEmailsMap = new Map();

        // Get unique campaign IDs
        const campaignIds = [...new Set(emails.map(e => e.campagne_id).filter(Boolean))];
        console.log('🔍 DEBUG: Campaign IDs found:', campaignIds);

        if (campaignIds.length > 0) {
          // Fetch campaign details
          const { data: campaigns, error: campaignError } = await supabase
            .from('envois_groupes')
            .select('id, nom_campagne, created_at, commercial')
            .in('id', campaignIds);

          if (campaignError) {
            console.error('🔍 DEBUG: Error loading campaigns:', campaignError);
          } else {
            console.log('🔍 DEBUG: Campaigns loaded:', campaigns?.length || 0);

            // Group emails by campaign
            campaigns?.forEach(campaign => {
              const campaignEmails = emails.filter(e => e.campagne_id === campaign.id);
              campaignEmailsMap.set(campaign.id, {
                campaign,
                emails: campaignEmails
              });
            });
          }
        }

        // Create history data
        const historyData = Array.from(campaignEmailsMap.values()).map(({ campaign, emails }) => ({
          campaign,
          emails,
          emailCount: emails.length,
          sentCount: emails.filter(e => e.statut === 'envoye').length,
          openedCount: emails.filter(e => e.statut === 'ouvert').length,
          clickedCount: emails.filter(e => e.statut === 'clique').length,
          errorCount: emails.filter(e => e.statut === 'echec').length
        }));

        console.log('🔍 DEBUG: History data created:', historyData.length);
        setProjectHistory(historyData);
        setIsHistoryOpen(true);
      } else {
        toast({
          title: "Aucun email trouvé",
          description: "Ce projet n'a pas d'historique d'emails.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error in loadProjectEmailHistory:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique des emails",
        variant: "destructive"
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  // Email tracking history function
  const history = async (email: string, startDate?: string, endDate?: string) => {
    try {
      console.log('🔍 DEBUG: Loading email tracking history for:', email);

      // Get email tracking data from database
      const { data: emailHistory, error } = await supabase
        .from('envois_email')
        .select('date_envoi, date_ouverture, date_clic, sujet, statut, campagne_id')
        .eq('destinataire', email)
        .order('date_envoi', { ascending: false });

      if (error) throw error;

      // Transform data to match expected format
      const formattedHistory = emailHistory?.map(email => ({
        date: email.date_envoi,
        event: email.statut === 'envoye' ? 'delivered' :
               email.date_ouverture ? 'opened' :
               email.date_clic ? 'clicked' : 'sent',
        subject: email.sujet,
        campaign: `Campagne #${email.campagne_id || 'N/A'}`
      })) || [];

      console.log('🔍 DEBUG: Email tracking history retrieved:', formattedHistory.length, 'events');
      return formattedHistory;
    } catch (error) {
      console.error('🔍 DEBUG: Error loading email tracking history:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Link href="/?tab=projects" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Retour aux projets
      </Link>
      {/* Header avec informations principales */}
      <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
<h1 className="text-3xl font-bold text-foreground">Projet #{projet.projet_id}</h1>
              <p className="text-muted-foreground text-lg">{projet.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadProjectEmailHistory}
              disabled={loadingHistory}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {loadingHistory ? 'Chargement...' : 'Emails par projet'}
            </Button>
            <Badge className={`px-4 py-2 text-sm font-medium ${getStatutColor(projet.statut ?? '')}`}>
              {projet.statut}
            </Badge>
          </div>
        </div>
        
        {/* Barre de progression */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression du projet</span>
            <span className="font-medium">{getProgressValue(projet.statut ?? '')}%</span>
          </div>
          <Progress value={getProgressValue(projet.statut ?? '')} className={`h-3 ${getProgressColor(projet.statut ?? '')}`} />
        </div>
      </div>
      <Tabs defaultValue="project" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="project" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Projet</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Contact</span>
          </TabsTrigger>
          <TabsTrigger value="contract" className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Contrat</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>Suivi Email ({emailStats.totalEmails})</span>
          </TabsTrigger>
          <TabsTrigger value="interaction" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Interactions ({interactions.length})</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="project" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Informations Projet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID Projet</p>
                    <p className="font-semibold text-lg">{projet.projet_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-semibold">{projet.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Origine</p>
                    <Badge variant="outline">{projet.origine}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attribution</p>
                    <p className="font-semibold">{projet.commercial}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Emails envoyés</p>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{emailStats.totalEmails}</p>
                      {loadingEmailStats && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Dernier email</p>
                    <p className="font-semibold text-sm">
                      {emailStats.recentEmailDate
                        ? emailStats.recentEmailDate.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Aucun'
                      }
                    </p>
                  </div>
                </div>
                {projet.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Commentaire</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{projet.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Chronologie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Créé le</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(projet.date_creation ?? '').toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Dernière modification</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(projet.date_creation ?? '').toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {projet.commercial && (
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Commercial assigné</p>
                      <p className="text-sm text-muted-foreground">{projet.commercial}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="contact" className="space-y-6">
          {projet.contact ? (
            <Card className="card-glow">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${projet.contact.prenom} ${projet.contact.nom}`} />
                    <AvatarFallback className="text-xl">{projet.contact.prenom?.[0]}{projet.contact.nom?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{projet.contact.prenom} {projet.contact.nom}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Informations Personnelles
                    </h3>
                    {projet.contact.civilite && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">Civilité:</span>
                        <span className="font-medium">{projet.contact.civilite}</span>
                      </div>
                    )}
                    {projet.contact.raison_sociale && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{projet.contact.raison_sociale}</span>
                      </div>
                    )}
                    {projet.contact.siret && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">SIRET:</span>
                        <span className="font-medium">{projet.contact.siret}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Contact</h3>
                    {projet.contact.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{projet.contact.email}</span>
                      </div>
                    )}
                    {projet.contact.telephone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{projet.contact.telephone}</span>
                      </div>
                    )}
                    {(projet.contact.adresse || projet.contact.ville) && (
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          {projet.contact.adresse && <div>{projet.contact.adresse}</div>}
                          {(projet.contact.code_postal || projet.contact.ville) && (
                            <div>{projet.contact.code_postal} {projet.contact.ville}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun contact associé</h3>
                <p className="text-muted-foreground">Ce projet n'a pas de contact associé.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="contract" className="space-y-6">
          {contrat ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="w-5 h-5 mr-2" />
                    Informations Contrat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">ID Contrat</p>
                      <p className="font-semibold">{contrat.projet_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <Badge className={getStatutColor(contrat.contrat_statut || '')}>
                        {contrat.contrat_statut || 'Non spécifié'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Compagnie</p>
                      <p className="font-semibold">{contrat.contrat_compagnie || 'Non spécifiée'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Produit</p>
                      <p className="font-semibold">{contrat.contrat_produit || 'Non spécifié'}</p>
                    </div>
                    {contrat.contrat_formule && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Formule</p>
                        <p className="font-semibold">{contrat.contrat_formule}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Date de création</p>
                    <p className="font-semibold">
                      {new Date(contrat.contrat_date_creation ?? '').toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Euro className="w-5 h-5 mr-2" />
                    Détails Financiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Prime Brute Annuelle</p>
                        <p className="text-2xl font-bold text-green-600">
                          €{contrat.prime_brute_annuelle?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Prime Nette Annuelle</p>
                        <p className="text-lg font-bold text-blue-600">
                          €{contrat.prime_nette_annuelle?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Prime Mensuelle</p>
                        <p className="text-lg font-bold text-purple-600">
                          €{contrat.prime_brute_mensuelle?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Commission Année 1</p>
                        <p className="text-lg font-bold text-orange-600">
                          €{contrat.commissionnement_annee1?.toLocaleString() || '0'}
                        </p>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Commission Récurrente</p>
                        <p className="text-lg font-bold text-indigo-600">
                          €{contrat.commissionnement_annee1?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="card-glow">
              <CardContent className="text-center py-12">
                <Building className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun contrat associé</h3>
                <p className="text-muted-foreground mb-4">Ce projet n'a pas encore de contrat enregistré.</p>
                <Button variant="outline">
                  Créer un contrat
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value="email" className="space-y-6">
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <Mail className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Suivi Email</h2>
                <p className="text-muted-foreground">Historique détaillé des emails pour ce projet</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Statistics Overview */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Statistiques Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{emailStats.totalEmails}</div>
                    <div className="text-xs text-muted-foreground">Total emails</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{emailStats.sentEmails}</div>
                    <div className="text-xs text-muted-foreground">Envoyés</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{emailStats.openedEmails}</div>
                    <div className="text-xs text-muted-foreground">Ouverts</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{emailStats.clickedEmails}</div>
                    <div className="text-xs text-muted-foreground">Clics</div>
                  </div>
                </div>

                {emailStats.recentEmailDate && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Dernière activité</p>
                    <p className="font-semibold text-sm">
                      {emailStats.recentEmailDate.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {loadingEmailStats && (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Chargement des statistiques...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Tracking History */}
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Suivi Email Détaillé
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contact?.email ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{contact.email}</p>
                        <p className="text-xs text-muted-foreground">Email du contact</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadEmailTrackingHistory(contact.email!)}
                        disabled={loadingBrevoHistory}
                      >
                        {loadingBrevoHistory ? (
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <History className="h-4 w-4" />
                        )}
                        <span className="ml-2">Actualiser</span>
                      </Button>
                    </div>

                    {brevoHistory.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {brevoHistory.map((event: BrevoEvent, index: number) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              event.event === 'delivered' ? 'bg-green-500' :
                              event.event === 'opened' ? 'bg-blue-500' :
                              event.event === 'clicked' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {event.event}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {event.subject && (
                                <p className="text-sm font-medium mb-1">{event.subject}</p>
                              )}
                              {event.campaign && (
                                <p className="text-xs text-muted-foreground">Campagne: {event.campaign}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground text-sm">
                          {loadingBrevoHistory ? 'Chargement de l\'historique...' : 'Aucun événement de suivi trouvé'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Aucun email associé au contact</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Email History by Campaign */}
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Historique détaillé par campagne
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={loadProjectEmailHistory}
                disabled={loadingHistory}
                className="mb-4"
              >
                {loadingHistory ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                <span className="ml-2">Charger l'historique détaillé</span>
              </Button>

              {projectHistory.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {projectHistory.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-lg">{item.campaign.nom_campagne}</div>
                            <div className="text-sm text-muted-foreground">
                              Créée le {new Date(item.campaign.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                          <Badge className={getStatutColor(item.campaign.commercial)}>
                            {item.campaign.commercial}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-5 gap-4 mb-4">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-lg font-bold text-gray-700">{item.emailCount}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <div className="text-lg font-bold text-green-600">{item.sentCount}</div>
                            <div className="text-xs text-muted-foreground">Envoyés</div>
                          </div>
                          <div className="text-center p-2 bg-blue-50 rounded">
                            <div className="text-lg font-bold text-blue-600">{item.openedCount}</div>
                            <div className="text-xs text-muted-foreground">Ouverts</div>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded">
                            <div className="text-lg font-bold text-purple-600">{item.clickedCount}</div>
                            <div className="text-xs text-muted-foreground">Clics</div>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded">
                            <div className="text-lg font-bold text-red-600">{item.errorCount}</div>
                            <div className="text-xs text-muted-foreground">Erreurs</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Emails individuels:</h5>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {item.emails.slice(0, 5).map((email: EmailHistory, emailIndex: number) => (
                              <div key={emailIndex} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">{email.sujet}</div>
                                    <div className="text-xs text-muted-foreground">→ {email.destinataire}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getStatutColor(email.statut)} variant="outline">
                                      {email.statut}
                                    </Badge>
                                    {email.date_envoi && (
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(email.date_envoi).toLocaleDateString('fr-FR')}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Aperçu du contenu */}
                                {(email.contenu_html || email.contenu_texte) && (
                                  <div className="mt-2">
                                    <div className="text-xs text-muted-foreground mb-1">Aperçu:</div>
                                    <div className="max-h-20 overflow-y-auto bg-white p-2 rounded border text-xs">
                                      {email.contenu_html ? (
                                        <div dangerouslySetInnerHTML={{
                                          __html: email.contenu_html.length > 200
                                            ? email.contenu_html.substring(0, 200) + '...'
                                            : email.contenu_html
                                        }} />
                                      ) : (
                                        <div className="whitespace-pre-wrap">
                                          {email.contenu_texte && email.contenu_texte.length > 200
                                            ? email.contenu_texte.substring(0, 200) + '...'
                                            : email.contenu_texte || 'Aucun contenu texte'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Suivi des interactions */}
                                {(email.date_ouverture || email.date_clic) && (
                                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                                    {email.date_ouverture && (
                                      <div className="flex items-center gap-1">
                                        <Eye className="h-3 w-3" />
                                        Ouvert
                                      </div>
                                    )}
                                    {email.date_clic && (
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        Clic
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                            {item.emails.length > 5 && (
                              <div className="text-center text-xs text-muted-foreground py-2">
                                ... et {item.emails.length - 5} autres emails
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Cliquez sur "Charger l'historique détaillé" pour voir les emails par campagne</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="interaction">
          <Card className="card-glow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Historique des Interactions ({interactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {interactions.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="flex items-start space-x-3 p-4 bg-muted/30 rounded-xl">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="capitalize">
                              {interaction.type || 'Communication'}
                            </Badge>
                            {interaction.canal && (
                              <Badge variant="secondary" className="text-xs">
                                {interaction.canal}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {interaction.created_at && new Date(interaction.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {interaction.sujet && (
                          <h4 className="font-medium text-sm mb-1">{interaction.sujet}</h4>
                        )}
                        {interaction.message && (
                          <p className="text-sm text-muted-foreground">{interaction.message}</p>
                        )}
                        {interaction.workflow_name && (
                          <div className="flex items-center space-x-1 mt-2">
                            <span className="text-xs text-blue-600 font-medium">Workflow:</span>
                            <span className="text-xs text-blue-600">{interaction.workflow_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucune interaction enregistrée pour ce contact</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Historique par projet */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique Email Détaillé - {contact?.prenom} {contact?.nom}
            </DialogTitle>
          </DialogHeader>

          {projectHistory.length > 0 ? (
            <div className="space-y-6 mt-6">
              {projectHistory.map((item, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="font-medium text-lg">
                            {item.campaign.nom_campagne}
                          </div>
                          <Badge variant="outline">
                            Campagne #{item.campaign.id}
                          </Badge>
                          <Badge className={getStatutColor(item.campaign.commercial)}>
                            {item.campaign.commercial}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Créée le {new Date(item.campaign.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (contact?.email) {
                            history(contact.email)
                              .then(historyData => {
                                console.log('📧 Email tracking history for project:', historyData)
                                toast({
                                  title: "Historique Email chargé",
                                  description: `${historyData.length} événements trouvés`,
                                })
                              })
                              .catch(error => {
                                console.error('Error loading email tracking history:', error)
                                toast({
                                  title: "Erreur",
                                  description: "Impossible de charger l'historique Email",
                                  variant: "destructive"
                                })
                              })
                          }
                        }}
                        disabled={!contact?.email}
                      >
                        <History className="h-4 w-4 mr-2" />
                        Historique Email
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-700">{item.emailCount}</div>
                        <div className="text-xs text-muted-foreground">Total emails</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{item.sentCount}</div>
                        <div className="text-xs text-muted-foreground">Envoyés</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{item.openedCount}</div>
                        <div className="text-xs text-muted-foreground">Ouverts</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{item.clickedCount}</div>
                        <div className="text-xs text-muted-foreground">Clics</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{item.errorCount}</div>
                        <div className="text-xs text-muted-foreground">Erreurs</div>
                      </div>
                    </div>

                    {/* Détails des emails pour cette campagne */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Détails des emails :</h4>
                      <div className="max-h-96 overflow-y-auto space-y-3">
                        {item.emails.map((email: EmailHistory, emailIndex: number) => (
                          <div key={emailIndex} className="p-4 bg-gray-50 rounded-lg border">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={getStatutColor(email.statut)}>
                                    {email.statut}
                                  </Badge>
                                  <span className="text-sm font-medium">{email.sujet}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Destinataire: {email.destinataire}
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground text-right">
                                {email.date_envoi && new Date(email.date_envoi).toLocaleString('fr-FR')}
                              </div>
                            </div>

                            {/* Contenu de l'email */}
                            {(email.contenu_html || email.contenu_texte) && (
                              <div className="mb-3">
                                <div className="text-xs font-medium text-muted-foreground mb-2">Contenu de l'email:</div>
                                <div className="max-h-32 overflow-y-auto bg-white p-3 rounded border text-sm">
                                  {email.contenu_html ? (
                                    <div dangerouslySetInnerHTML={{ __html: email.contenu_html }} />
                                  ) : (
                                    <div className="whitespace-pre-wrap">{email.contenu_texte}</div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Suivi des interactions */}
                            {(email.date_ouverture || email.date_clic) && (
                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                {email.date_ouverture && (
                                  <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    Ouvert: {new Date(email.date_ouverture).toLocaleString('fr-FR')}
                                  </div>
                                )}
                                {email.date_clic && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    Clic: {new Date(email.date_clic).toLocaleString('fr-FR')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun historique trouvé</h3>
                <p className="text-muted-foreground">
                  Ce projet n'a pas d'historique d'emails par campagne.
                </p>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetailsPage;
