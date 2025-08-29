// 🔒 SUPABASE EDGE FUNCTION - SÉCURISÉE
// Cette fonction remplace l'accès direct aux tables depuis le client

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("🔐 Secure API Function loaded")

serve(async (req) => {
  // Headers CORS sécurisés
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Gestion des préflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. VÉRIFICATION DE L'AUTHENTIFICATION (CRITIQUE)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Vérifier le token JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. GET DATA SECURE - FILTRAGE PAR USER_ID
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const table = url.searchParams.get('table')

      const allowedTables = ['contacts', 'projets', 'contrats']

      if (!allowedTables.includes(table || '')) {
        return new Response(
          JSON.stringify({ error: 'Table not allowed' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Query avec filtrage de sécurité
      const { data, error } = await supabaseClient
        .from(table!)
        .select('*')
        .eq('user_id', user.id) // ⚠️ ASSURE LA SÉCURITÉ !

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. POST/CREATE SECURE
    if (req.method === 'POST') {
      const body = await req.json()

      // Validation des données (exemple simple)
      if (!body.table || !body.data) {
        return new Response(
          JSON.stringify({ error: 'Invalid request data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Injection automatique du user_id pour la sécurité
      body.data.user_id = user.id
      const { data, error } = await supabaseClient
        .from(body.table)
        .insert(body.data)
        .select()

      if (error) throw error

      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Secure API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})