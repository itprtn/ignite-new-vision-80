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

    const signature = req.headers.get("TT-Signature");
    console.log("TikTok signature:", signature);

    const body = await req.json();
    console.log("Incoming TikTok lead:", JSON.stringify(body));

    const lead = extractLeadFromTikTok(body);

    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .upsert({
        email: lead.email || null,
        phone: lead.phone || null,
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
        zipcode: lead.zipcode || null,
        city: lead.city || null,
        country: lead.country || null,
      }, { onConflict: "email" })
      .select("*")
      .maybeSingle();

    if (contactError) throw contactError;
    const contactId = contact?.id;

    if (lead.consent) {
      await supabase.from("consents").insert({
        contact_id: contactId,
        purpose: lead.consent.purpose || "lead_generation",
        channel: lead.consent.channel || "form",
        text: lead.consent.text || "",
        lawful_basis: lead.consent.lawful_basis || "contract",
        granted: true,
        ip: lead.ip || null,
        user_agent: lead.user_agent || null,
      });
    }

    const { error: subError } = await supabase.from("form_submissions").insert({
      form_id: null,
      contact_id: contactId,
      payload: lead.payload || {},
      status: "submitted",
      utm: lead.utm || {},
      jwt_claims: null,
    });
    if (subError) throw subError;

    const eventId = `${Date.now()}-${crypto.randomUUID()}`;
    const { error: evtError } = await supabase.from("events").insert({
      contact_id: contactId,
      name: "Lead",
      properties: { platform: "tiktok", payload: lead.payload, utm: lead.utm },
      campaign_id: null,
      page_id: null,
      event_id: eventId,
      source: "server",
    });
    if (evtError) throw evtError;

    return json({ ok: true, contact_id: contactId, event_id: eventId });
  } catch (e: any) {
    console.error("TikTok webhook error:", e);
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

function extractLeadFromTikTok(payload: any) {
  const data = payload?.data || payload;
  const fields: Record<string, string> = {};
  try {
    for (const f of data?.form_fields ?? []) {
      fields[f.key] = f.value;
    }
  } catch (_) {}
  return {
    email: fields["email"],
    phone: fields["phone_number"],
    first_name: fields["first_name"],
    last_name: fields["last_name"],
    zipcode: fields["zip"] || fields["zipcode"],
    city: fields["city"],
    country: fields["country"],
    consent: { purpose: "lead_generation", channel: "form", text: "TikTok Lead Gen consent", lawful_basis: "contract" },
    ip: null,
    user_agent: null,
    payload: { fields },
    utm: {
      utm_source: "tiktok",
      campaign_id: data?.campaign_id,
      adset_id: data?.adgroup_id,
      ad_id: data?.ad_id,
    },
  };
}




