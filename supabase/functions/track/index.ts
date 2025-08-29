import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

function cors(req: Request) {
  const origin = req.headers.get("Origin") || "*";
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  return null;
}

const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

serve(async (req: Request) => {
  const corsResp = cors(req);
  if (corsResp) return corsResp;

  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ ok: false, error: "Authentification requise" }, 401);
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return json({ ok: false, error: "Token d'authentification invalide" }, 401);
    }

    const body = await req.json();
    const {
      event_name,
      properties = {},
      lead_id,
      contact_id,
      page_id,
      campaign_id,
      projet_id,
      contrat_id,
      event_id
    } = body;

    if (!event_name) {
      return json({ ok: false, error: "event_name is required" }, 400);
    }

    // Validation et assainissement des inputs
    if (typeof event_name !== 'string' || event_name.length > 100) {
      return json({ ok: false, error: "event_name must be a string under 100 characters" }, 400);
    }

    // Assainir les propriétés pour éviter les injections
    const sanitizedProperties = {};
    for (const [key, value] of Object.entries(properties)) {
      if (typeof key === 'string' && key.length <= 50) {
        let sanitizedValue = value;
        if (typeof value === 'string') {
          sanitizedValue = value.substring(0, 1000); // Limiter la longueur
        }
        sanitizedProperties[key] = sanitizedValue;
      }
    }

    // Générer un event_id unique si non fourni
    const finalEventId = event_id || `${Date.now()}-${crypto.randomUUID()}`;

    // Insérer l'événement
    const { error: evtError } = await supabase.from("events").insert({
      lead_id: lead_id || null,
      contact_id: contact_id || null,
      name: event_name,
      properties: sanitizedProperties,
      page_id: page_id || null,
      campaign_id: campaign_id || null,
      projet_id: projet_id || null,
      contrat_id: contrat_id || null,
      event_id: finalEventId,
      source: "client",
    });

    if (evtError) throw evtError;

    // Traitement spécial selon le type d'événement
    switch (event_name) {
      case "page_view":
        // Logique pour page_view
        break;
      case "form_started":
        // Logique pour form_started
        break;
      case "form_submitted":
        // Logique pour form_submitted
        break;
      case "consent_granted":
        // Logique pour consent_granted
        break;
      default:
        // Événement générique
        break;
    }

    return json({ ok: true, event_id: finalEventId });
  } catch (e: any) {
    console.error("Tracking error:", e);
    return json({ ok: false, error: e.message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
