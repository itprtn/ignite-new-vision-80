"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Badge } from "./ui/badge"
import { supabase } from "../lib/supabase"
import { useToast } from "../hooks/use-toast"

interface EmailConfig {
  id: number
  email: string
  description: string
  smtp_host: string
  smtp_port: number
  smtp_secure: boolean
  smtp_username: string
  smtp_password: string
  is_active: boolean
}

interface TestEmailData {
  to: string
  subject: string
  html: string
  text: string
}

export function EmailTestInterface() {
  const [emailConfigs, setEmailConfigs] = useState<EmailConfig[]>([])
  const [selectedConfig, setSelectedConfig] = useState<string>("")
  const [testEmail, setTestEmail] = useState<TestEmailData>({
    to: "",
    subject: "Test d'envoi - CRM Marketing",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333; text-align: center;">Test d'envoi email</h1>
        <p style="color: #666; line-height: 1.6;">
          Bonjour,
        </p>
        <p style="color: #666; line-height: 1.6;">
          Ceci est un email de test depuis votre système CRM Marketing.
          Si vous recevez cet email, votre configuration fonctionne parfaitement !
        </p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #28a745; font-weight: bold;">
            ✓ Configuration email validée avec succès
          </p>
        </div>
        <p style="color: #666; line-height: 1.6;">
          Cordialement,<br>
          <strong>Votre équipe CRM Marketing</strong>
        </p>
      </div>
    `,
    text: "Test d'envoi email - Si vous recevez cet email, votre configuration fonctionne parfaitement ! Cordialement, Votre équipe CRM Marketing"
  })
  const [sending, setSending] = useState(false)
  const [sendHistory, setSendHistory] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadEmailConfigs()
    loadSendHistory()
  }, [])

  const loadEmailConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from("email_configurations")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setEmailConfigs(data || [])
      
      // Sélectionner la config Premunia par défaut
      const premuniaConfig = data?.find(config => config.email === "info@premunia.com")
      if (premuniaConfig) {
        setSelectedConfig(premuniaConfig.id.toString())
      } else if (data && data.length > 0) {
        setSelectedConfig(data[0].id.toString())
      }
    } catch (error) {
      console.error("Error loading email configs:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les configurations email",
        variant: "destructive"
      })
    }
  }

  const loadSendHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("email_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) throw error
      setSendHistory(data || [])
    } catch (error) {
      console.error("Error loading send history:", error)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail.to || !selectedConfig) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail.to)) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email valide",
        variant: "destructive"
      })
      return
    }

    setSending(true)
    try {
      console.log("🚀 Envoi test email vers:", testEmail.to)
      
      const selectedConfigData = emailConfigs.find(c => c.id.toString() === selectedConfig)
      
      const emailPayload = {
        to: testEmail.to,
        subject: testEmail.subject,
        html: testEmail.html,
        text: testEmail.text,
        config: selectedConfigData ? {
          smtp_host: selectedConfigData.smtp_host,
          smtp_port: selectedConfigData.smtp_port,
          smtp_secure: selectedConfigData.smtp_secure,
          smtp_username: selectedConfigData.smtp_username,
          smtp_password: selectedConfigData.smtp_password,
          sender_email: selectedConfigData.email
        } : undefined
      }

      console.log("📧 Payload:", emailPayload)

      const { data, error } = await supabase.functions.invoke("send-email", {
        body: emailPayload
      })

      if (error) throw error

      console.log("✅ Réponse:", data)

      if (data?.success) {
        toast({
          title: "Email envoyé !",
          description: `Email de test envoyé avec succès à ${testEmail.to}`,
          variant: "default"
        })
        
        // Recharger l'historique
        await loadSendHistory()
      } else {
        throw new Error(data?.error || "Erreur inconnue")
      }
    } catch (error: any) {
      console.error("❌ Erreur envoi:", error)
      toast({
        title: "Erreur d'envoi",
        description: error.message || "Impossible d'envoyer l'email de test",
        variant: "destructive"
      })
    } finally {
      setSending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Envoyé</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Échec</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">En attente</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Test d'Envoi Email</h1>
          <p className="text-muted-foreground mt-2">Testez vos configurations email avant de lancer des campagnes marketing</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          {emailConfigs.length} configuration(s) active(s)
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">📧</span>
              Nouvel Email de Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="config">Configuration Email *</Label>
              <Select value={selectedConfig} onValueChange={setSelectedConfig}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une configuration" />
                </SelectTrigger>
                <SelectContent>
                  {emailConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span>{config.email}</span>
                        <Badge variant="outline" className="text-xs">
                          {config.smtp_host}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="to">Destinataire *</Label>
              <Input
                id="to"
                type="email"
                placeholder="test@example.com"
                value={testEmail.to}
                onChange={(e) => setTestEmail({ ...testEmail, to: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="subject">Sujet</Label>
              <Input
                id="subject"
                value={testEmail.subject}
                onChange={(e) => setTestEmail({ ...testEmail, subject: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="html">Contenu HTML</Label>
              <Textarea
                id="html"
                rows={8}
                value={testEmail.html}
                onChange={(e) => setTestEmail({ ...testEmail, html: e.target.value })}
                className="font-mono text-sm"
              />
            </div>

            <div>
              <Label htmlFor="text">Contenu Texte (optionnel)</Label>
              <Textarea
                id="text"
                rows={3}
                value={testEmail.text}
                onChange={(e) => setTestEmail({ ...testEmail, text: e.target.value })}
                placeholder="Version texte de votre email..."
              />
            </div>

            <Button 
              onClick={handleSendTest} 
              disabled={sending || !testEmail.to || !selectedConfig}
              className="w-full"
            >
              {sending ? (
                <>
                  <span className="mr-2">⏳</span>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Envoyer le Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Configurations et historique */}
        <div className="space-y-6">
          {/* Configurations actives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">⚙️</span>
                Configurations Actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emailConfigs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune configuration active trouvée
                  </p>
                ) : (
                  emailConfigs.map((config) => (
                    <div 
                      key={config.id} 
                      className={`p-3 border rounded-lg transition-colors ${
                        selectedConfig === config.id.toString() 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{config.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {config.smtp_host}:{config.smtp_port}
                          </div>
                        </div>
                        <Badge className={config.smtp_secure ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"}>
                          {config.smtp_secure ? "SSL" : "Non SSL"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Historique des envois */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">📊</span>
                Historique des Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sendHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Aucun test d'envoi récent
                  </p>
                ) : (
                  sendHistory.map((log, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                       <div className="font-medium truncate">{log.destinataire}</div>
                       {getStatusBadge(log.statut)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("fr-FR")}
                      </div>
                      {log.error_details && (
                        <div className="text-sm text-red-600 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-950 p-2 rounded">
                          {log.error_details}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}