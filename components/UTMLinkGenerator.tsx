'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Copy, 
  Link, 
  Settings, 
  Plus,
  Trash2,
  Eye,
  Download,
  QrCode,
  ExternalLink,
  Lock,
  Shield
} from 'lucide-react';

interface UTMLink {
  id: string;
  name: string;
  baseUrl: string;
  utmParams: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_content?: string;
    utm_term?: string;
  };
  jwtClaims?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  clickCount: number;
  conversionCount: number;
}

interface JWTClaim {
  key: string;
  value: string;
  description?: string;
}

const UTM_SOURCES = [
  'google',
  'facebook',
  'instagram',
  'linkedin',
  'twitter',
  'tiktok',
  'email',
  'sms',
  'direct',
  'referral',
  'organic',
  'cpc',
  'banner',
  'affiliate'
];

const UTM_MEDIUMS = [
  'cpc',
  'social',
  'email',
  'banner',
  'affiliate',
  'referral',
  'organic',
  'paid',
  'free',
  'push',
  'sms'
];

const CAMPAIGN_TYPES = [
  'brand_awareness',
  'lead_generation',
  'conversion',
  'retargeting',
  'seasonal',
  'product_launch',
  'promotional',
  'educational',
  'newsletter',
  'webinar'
];

export default function UTMLinkGenerator() {
  const [links, setLinks] = useState<UTMLink[]>([]);
  const [currentLink, setCurrentLink] = useState<UTMLink | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [jwtClaims, setJwtClaims] = useState<JWTClaim[]>([]);
  const [jwtSecret, setJwtSecret] = useState('your-jwt-secret-key');
  const [jwtExpiry, setJwtExpiry] = useState(24); // hours

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    // TODO: Charger depuis Supabase
    const mockLinks: UTMLink[] = [
      {
        id: '1',
        name: 'Campagne Facebook Mutuelle Santé',
        baseUrl: 'https://premunia.com/devis-mutuelle',
        utmParams: {
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'mutuelle_sante_q1_2024',
          utm_content: 'hero_banner',
          utm_term: 'mutuelle+sante'
        },
        jwtClaims: {
          prefill_email: 'user@example.com',
          prefill_source: 'facebook_ads',
          prefill_campaign: 'mutuelle_sante_q1_2024'
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        clickCount: 1250,
        conversionCount: 89
      },
      {
        id: '2',
        name: 'Email Newsletter Assurance Emprunteur',
        baseUrl: 'https://premunia.com/assurance-emprunteur',
        utmParams: {
          utm_source: 'email',
          utm_medium: 'email',
          utm_campaign: 'newsletter_emprunteur_2024',
          utm_content: 'cta_button',
          utm_term: 'assurance+emprunteur'
        },
        jwtClaims: {
          prefill_email: 'subscriber@example.com',
          prefill_source: 'email_newsletter',
          prefill_segment: 'emprunteurs'
        },
        isActive: true,
        createdAt: new Date().toISOString(),
        clickCount: 456,
        conversionCount: 34
      }
    ];
    setLinks(mockLinks);
  };

  const createNewLink = () => {
    const newLink: UTMLink = {
      id: `link_${Date.now()}`,
      name: '',
      baseUrl: '',
      utmParams: {
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: '',
        utm_content: '',
        utm_term: ''
      },
      jwtClaims: {},
      isActive: true,
      createdAt: new Date().toISOString(),
      clickCount: 0,
      conversionCount: 0
    };
    setCurrentLink(newLink);
    setJwtClaims([]);
    setIsEditing(true);
  };

  const addJWTClaim = () => {
    const newClaim: JWTClaim = {
      key: '',
      value: '',
      description: ''
    };
    setJwtClaims([...jwtClaims, newClaim]);
  };

  const removeJWTClaim = (index: number) => {
    setJwtClaims(jwtClaims.filter((_, i) => i !== index));
  };

  const updateJWTClaim = (index: number, field: keyof JWTClaim, value: string) => {
    const newClaims = [...jwtClaims];
    newClaims[index] = { ...newClaims[index], [field]: value };
    setJwtClaims(newClaims);
  };

  const generateUTMLink = (link: UTMLink): string => {
    const url = new URL(link.baseUrl);
    
    Object.entries(link.utmParams).forEach(([key, value]) => {
      if (value) {
        url.searchParams.append(key, value);
      }
    });

    return url.toString();
  };

  const generateJWTLink = async (link: UTMLink): Promise<string> => {
    if (jwtClaims.length === 0) {
      return generateUTMLink(link);
    }

    try {
      // Convert JWT claims to a simple object
      const claims = jwtClaims.reduce((acc, claim) => {
        if (claim.key && claim.value) {
          acc[claim.key] = claim.value;
        }
        return acc;
      }, {} as Record<string, string>);

      // TODO: Generate actual JWT token
      // For now, we'll create a base64 encoded string
      const token = btoa(JSON.stringify(claims));
      
      const url = new URL(link.baseUrl);
      
      // Add UTM parameters
      Object.entries(link.utmParams).forEach(([key, value]) => {
        if (value) {
          url.searchParams.append(key, value);
        }
      });

      // Add JWT token
      url.searchParams.append('jwt', token);
      
      return url.toString();
    } catch (error) {
      console.error('Error generating JWT link:', error);
      return generateUTMLink(link);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // TODO: Show success toast
      console.log('Link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const saveLink = async () => {
    if (!currentLink) return;

    try {
      // Convert JWT claims to object
      const claims = jwtClaims.reduce((acc, claim) => {
        if (claim.key && claim.value) {
          acc[claim.key] = claim.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const linkToSave = {
        ...currentLink,
        jwtClaims: claims
      };

      if (currentLink.id.startsWith('link_')) {
        // Create new link
        const newLink = { ...linkToSave, id: Date.now().toString() };
        setLinks([...links, newLink]);
      } else {
        // Update existing link
        setLinks(links.map(l => l.id === currentLink.id ? linkToSave : l));
      }

      setIsEditing(false);
      setCurrentLink(null);
    } catch (error) {
      console.error('Error saving link:', error);
    }
  };

  const deleteLink = (linkId: string) => {
    setLinks(links.filter(l => l.id !== linkId));
  };

  const toggleLinkStatus = (linkId: string) => {
    setLinks(links.map(l => 
      l.id === linkId ? { ...l, isActive: !l.isActive } : l
    ));
  };

  const renderLinkEditor = () => (
    <Card>
      <CardHeader>
        <CardTitle>Créer un nouveau lien UTM</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nom de la campagne</Label>
            <Input
              value={currentLink?.name || ''}
              onChange={(e) => setCurrentLink(prev => prev ? { ...prev, name: e.target.value } : null)}
              placeholder="Ex: Campagne Facebook Q1 2024"
            />
          </div>
          <div>
            <Label>URL de base</Label>
            <Input
              value={currentLink?.baseUrl || ''}
              onChange={(e) => setCurrentLink(prev => prev ? { ...prev, baseUrl: e.target.value } : null)}
              placeholder="https://votre-site.com/landing-page"
            />
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-lg font-semibold mb-4 block">Paramètres UTM</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Source (utm_source)</Label>
              <Select
                value={currentLink?.utmParams.utm_source || ''}
                onValueChange={(value) => setCurrentLink(prev => 
                  prev ? { 
                    ...prev, 
                    utmParams: { ...prev.utmParams, utm_source: value } 
                  } : null
                )}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une source" />
                </SelectTrigger>
                <SelectContent>
                  {UTM_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Moyen (utm_medium)</Label>
              <Select
                value={currentLink?.utmParams.utm_medium || ''}
                onValueChange={(value) => setCurrentLink(prev => 
                  prev ? { 
                    ...prev, 
                    utmParams: { ...prev.utmParams, utm_medium: value } 
                  } : null
                )}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un moyen" />
                </SelectTrigger>
                <SelectContent>
                  {UTM_MEDIUMS.map((medium) => (
                    <SelectItem key={medium} value={medium}>
                      {medium}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Campagne (utm_campaign)</Label>
              <Input
                value={currentLink?.utmParams.utm_campaign || ''}
                onChange={(e) => setCurrentLink(prev => 
                  prev ? { 
                    ...prev, 
                    utmParams: { ...prev.utmParams, utm_campaign: e.target.value } 
                  } : null
                )}
                placeholder="Ex: mutuelle_sante_q1_2024"
              />
            </div>

            <div>
              <Label>Contenu (utm_content)</Label>
              <Input
                value={currentLink?.utmParams.utm_content || ''}
                onChange={(e) => setCurrentLink(prev => 
                  prev ? { 
                    ...prev, 
                    utmParams: { ...prev.utmParams, utm_content: e.target.value } 
                  } : null
                )}
                placeholder="Ex: hero_banner, cta_button"
              />
            </div>

            <div>
              <Label>Terme (utm_term)</Label>
              <Input
                value={currentLink?.utmParams.utm_term || ''}
                onChange={(e) => setCurrentLink(prev => 
                  prev ? { 
                    ...prev, 
                    utmParams: { ...prev.utmParams, utm_term: e.target.value } 
                  } : null
                )}
                placeholder="Ex: mutuelle+sante, assurance+emprunteur"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex justify-between items-center mb-4">
            <Label className="text-lg font-semibold">Claims JWT (Pré-remplissage)</Label>
            <Button variant="outline" size="sm" onClick={addJWTClaim}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un claim
            </Button>
          </div>
          
          <div className="space-y-3">
            {jwtClaims.map((claim, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border rounded-lg">
                <div>
                  <Label className="text-sm">Clé</Label>
                  <Input
                    value={claim.key}
                    onChange={(e) => updateJWTClaim(index, 'key', e.target.value)}
                    placeholder="Ex: prefill_email"
                  />
                </div>
                <div>
                  <Label className="text-sm">Valeur</Label>
                  <Input
                    value={claim.value}
                    onChange={(e) => updateJWTClaim(index, 'value', e.target.value)}
                    placeholder="Ex: user@example.com"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <Label className="text-sm">Description</Label>
                    <Input
                      value={claim.description || ''}
                      onChange={(e) => updateJWTClaim(index, 'description', e.target.value)}
                      placeholder="Description optionnelle"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeJWTClaim(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {jwtClaims.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Aucun claim JWT configuré</p>
                <p className="text-sm text-gray-400 mb-4">
                  Ajoutez des claims pour pré-remplir automatiquement les formulaires
                </p>
                <Button variant="outline" onClick={addJWTClaim}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un claim
                </Button>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Annuler
          </Button>
          <Button onClick={saveLink}>
            Sauvegarder le lien
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderLinkPreview = (link: UTMLink) => {
    const utmLink = generateUTMLink(link);
    const jwtLink = generateJWTLink(link);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Aperçu du lien</span>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(utmLink)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copier UTM
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(jwtLink)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copier JWT
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Lien UTM standard</Label>
            <div className="flex space-x-2">
              <Input value={utmLink} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(utmLink, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {jwtClaims.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                Lien JWT avec pré-remplissage
              </Label>
              <div className="flex space-x-2">
                <Input value={jwtLink} readOnly className="font-mono text-sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(jwtLink, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ce lien contient des informations de pré-remplissage sécurisées
              </p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Claims JWT configurés :</h4>
            {jwtClaims.length > 0 ? (
              <div className="space-y-2">
                {jwtClaims.map((claim, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="font-mono text-gray-600">{claim.key}</span>
                    <span className="text-gray-500">{claim.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Aucun claim configuré</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLinksList = () => (
    <div className="space-y-4">
      {links.map((link) => (
        <Card key={link.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">{link.name}</h3>
                  <Badge variant={link.isActive ? 'default' : 'secondary'}>
                    {link.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-600">URL de base</Label>
                    <p className="text-sm font-mono text-gray-800">{link.baseUrl}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Campagne</Label>
                    <p className="text-sm text-gray-800">{link.utmParams.utm_campaign}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(link.utmParams).map(([key, value]) => (
                    value && (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {value}
                      </Badge>
                    )
                  ))}
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-500">
                  <span>Clics: {link.clickCount.toLocaleString()}</span>
                  <span>Conversions: {link.conversionCount.toLocaleString()}</span>
                  <span>CTR: {link.clickCount > 0 ? ((link.conversionCount / link.clickCount) * 100).toFixed(1) : 0}%</span>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentLink(link);
                    setJwtClaims(Object.entries(link.jwtClaims || {}).map(([key, value]) => ({
                      key,
                      value: value.toString(),
                      description: ''
                    })));
                    setShowPreview(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Aperçu
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentLink(link);
                    setJwtClaims(Object.entries(link.jwtClaims || {}).map(([key, value]) => ({
                      key,
                      value: value.toString(),
                      description: ''
                    })));
                    setIsEditing(true);
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleLinkStatus(link.id)}
                >
                  {link.isActive ? 'Désactiver' : 'Activer'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteLink(link.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-semibold">Éditeur de liens UTM</h1>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Annuler
                </Button>
                <Button onClick={saveLink}>
                  Sauvegarder
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderLinkEditor()}
        </div>
      </div>
    );
  }

  if (showPreview && currentLink) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <h1 className="text-xl font-semibold">Aperçu du lien</h1>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Retour
                </Button>
                <Button onClick={() => {
                  setShowPreview(false);
                  setIsEditing(true);
                }}>
                  Modifier
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderLinkPreview(currentLink)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold">Générateur de liens UTM</h1>
            <div className="flex space-x-2">
              <Button onClick={createNewLink}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau lien
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link className="w-5 h-5 mr-2" />
                Gestion des liens UTM et JWT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold text-xl">UTM</span>
                  </div>
                  <h3 className="font-semibold mb-2">Paramètres UTM</h3>
                  <p className="text-sm text-gray-600">
                    Suivez vos campagnes marketing avec des paramètres standardisés
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Liens JWT</h3>
                  <p className="text-sm text-gray-600">
                    Pré-remplissez automatiquement vos formulaires de manière sécurisée
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">RGPD Compliant</h3>
                  <p className="text-sm text-gray-600">
                    Respectez la réglementation avec une gestion des consentements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {links.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Link className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun lien UTM créé
              </h3>
              <p className="text-gray-500 mb-6">
                Commencez par créer votre premier lien UTM pour vos campagnes marketing
              </p>
              <Button onClick={createNewLink}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un lien UTM
              </Button>
            </CardContent>
          </Card>
        ) : (
          renderLinksList()
        )}
      </div>
    </div>
  );
}
