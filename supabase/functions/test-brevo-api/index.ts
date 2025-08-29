import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
}

interface BrevoApiRequest {
  action: 'test_connection' | 'get_campaign_stats' | 'create_campaign'
  api_key?: string
  campaign_id?: string
  campaign_data?: any
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData: BrevoApiRequest = await req.json()

    console.log('🔧 Brevo API Request:', requestData)

    if (!requestData.api_key) {
      return new Response(
        JSON.stringify({
          error: 'API key is required',
          hint: 'Please provide a valid Brevo API key'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let result: any

    switch (requestData.action) {
      case 'test_connection':
        result = await testBrevoConnection(requestData.api_key)
        break

      case 'get_campaign_stats':
        if (!requestData.campaign_id) {
          return new Response(
            JSON.stringify({ error: 'Campaign ID is required for getting stats' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        result = await getBrevoCampaignStats(requestData.api_key, requestData.campaign_id)
        break

      case 'create_campaign':
        if (!requestData.campaign_data) {
          return new Response(
            JSON.stringify({ error: 'Campaign data is required for creating campaign' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        result = await createBrevoCampaign(requestData.api_key, requestData.campaign_data)
        break

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid action',
            supported_actions: ['test_connection', 'get_campaign_stats', 'create_campaign']
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('API Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function testBrevoConnection(apiKey: string) {
  try {
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Connection failed',
        status: response.status
      }
    }

    return {
      success: true,
      message: 'Connection successful',
      account: data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hint: 'Check your API key and internet connection'
    }
  }
}

async function getBrevoCampaignStats(apiKey: string, campaignId: string) {
  try {
    const response = await fetch(`https://api.brevo.com/v3/emailCampaigns/${campaignId}`, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to get campaign stats',
        status: response.status
      }
    }

    return {
      success: true,
      campaign: data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function createBrevoCampaign(apiKey: string, campaignData: any) {
  try {
    const response = await fetch('https://api.brevo.com/v3/emailCampaigns', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(campaignData)
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Failed to create campaign',
        status: response.status,
        details: data
      }
    }

    return {
      success: true,
      message: 'Campaign created successfully',
      campaign: data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}