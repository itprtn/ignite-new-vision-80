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

    const signature = req.headers.get("X-Hub-Signature") || req.headers.get("X-Hub-Signature-256");
    // TODO: Verify Meta signature with app secret (HMAC SHA-256). For now, log only.
    console.log("Meta signature:", signature);

    const body = await req.json();
    console.log("Incoming Meta lead:", JSON.stringify(body));

    // Expected format mapping (simplified). Adjust to your webhook payload.
    const lead = extractLeadFromMeta(body);

    // Créer le lead
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .insert({
        email: lead.email || null,
        phone: lead.phone || null,
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
        zipcode: lead.zipcode || null,
        city: lead.city || null,
        country: lead.country || null,
        utm_source: lead.utm.utm_source,
        utm_medium: lead.utm.utm_medium,
        utm_campaign: lead.utm.utm_campaign,
        utm_content: lead.utm.utm_content,
        utm_term: lead.utm.utm_term,
        ad_id: lead.utm.ad_id,
        adset_id: lead.utm.adset_id,
        campaign_id: lead.utm.campaign_id,
        source: "facebook",
        assigned_to: 1, // Commercial par défaut (Jean Dupont)
      })
      .select("*")
      .maybeSingle();

    if (leadError) throw leadError;

    const leadId = leadData?.id;

    // Insert consent event if present
    if (lead.consent) {
      await supabase.from("consents").insert({
        lead_id: leadId,
        purpose: lead.consent.purpose || "lead_generation",
        channel: lead.consent.channel || "form",
        text: lead.consent.text || "",
        lawful_basis: lead.consent.lawful_basis || "contract",
        granted: true,
        ip: lead.ip || null,
        user_agent: lead.user_agent || null,
      });
    }

    // Create form submission
    const { error: subError } = await supabase.from("form_submissions").insert({
      form_id: null,
      lead_id: leadId,
      payload: lead.payload || {},
      status: "submitted",
      utm: lead.utm || {},
      jwt_claims: null,
    });
    if (subError) throw subError;

    // Track event (Lead)
    const eventId = `${Date.now()}-${crypto.randomUUID()}`;
    const { error: evtError } = await supabase.from("events").insert({
      lead_id: leadId,
      name: "Lead",
      properties: { platform: "meta", payload: lead.payload, utm: lead.utm },
      campaign_id: null,
      page_id: null,
      event_id: eventId,
      source: "server",
    });
    if (evtError) throw evtError;

    return json({ ok: true, lead_id: leadId, event_id: eventId });
  } catch (e: any) {
    console.error("Meta webhook error:", e);
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

function extractLeadFromMeta(payload: any) {
  // Minimal tolerant mapping. Adjust per actual Meta payload.
  const firstEntry = payload?.entry?.[0];
  const changes = firstEntry?.changes?.[0];
  const leadGen = changes?.value || payload;
  const fields: Record<string, string> = {};
  try {
    for (const f of leadGen?.field_data ?? []) {
      fields[f.name] = Array.isArray(f.values) ? f.values[0] : f.values;
    }
  } catch (_) {}
  return {
    email: fields["email"] || leadGen?.email,
    phone: fields["phone_number"] || leadGen?.phone_number,
    first_name: fields["first_name"] || leadGen?.first_name,
    last_name: fields["last_name"] || leadGen?.last_name,
    zipcode: fields["zip"] || fields["zipcode"],
    city: fields["city"],
    country: fields["country"],
    consent: { purpose: "lead_generation", channel: "form", text: "Meta Lead Ads consent", lawful_basis: "contract" },
    ip: null,
    user_agent: null,
    payload: { fields },
    utm: {
      utm_source: "facebook",
      campaign_id: leadGen?.ad_campaign_id || leadGen?.campaign_id,
      adset_id: leadGen?.adset_id,
      ad_id: leadGen?.ad_id,
    },
  };
}


