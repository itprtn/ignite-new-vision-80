import React, { useState, useEffect } from 'react'
import { useAuth } from '../../components/auth-provider'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { CampaignsTab } from '../../components/CampaignsTab'
import { supabase } from '../../lib/supabase'
import type { Campaign, Contact } from '../../lib/types'

export default function CampaignsPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  if (loading) return null

  if (!user) {
    navigate('/login')
    return null
  }

  const loadData = async () => {
    try {
      const { data: contactsData } = await supabase
        .from('contact')
        .select('*')
        .order('created_at', { ascending: false })
      
      setContacts(contactsData || [])
      setCampaigns([]) // Will be loaded from Supabase once campaigns table is ready
    } catch (error) {
      console.error('Error loading campaigns data:', error)
    }
  }

  return (
    <Layout title="Gestion des Campagnes">
      <CampaignsTab 
        campaigns={campaigns} 
        contacts={contacts} 
        onCampaignUpdate={loadData} 
      />
    </Layout>
  )
}