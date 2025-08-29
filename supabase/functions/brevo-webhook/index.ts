import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "" // ⚠️ bien mettre la clé Service Role
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("📩 Webhook reçu de Brevo:", JSON.stringify(payload, null, 2));

    const eventType = payload.event;
    const email = payload.email;
    const messageId = payload["message-id"];
    const subject = payload.subject || null;
    const ts = payload.ts ? new Date(payload.ts * 1000).toISOString() : new Date().toISOString();

    console.log(`➡️ Event: ${eventType}, Email: ${email}, MsgID: ${messageId}`);

    switch (eventType) {
      case "delivered":
        await handleEmailDelivered({ email, subject, ts });
        break;
      case "opened":
        await handleEmailOpened({ email, subject, ts });
        break;
      case "click":
        await handleEmailClicked({ email, subject, ts, link: payload.link });
        break;
      case "bounced":
      case "hard_bounce":
      case "soft_bounce":
        await handleEmailBounced({ email, subject, ts, reason: payload.reason });
        break;
      case "unsubscribed":
        await handleEmailUnsubscribed({ email, ts });
        break;
      default:
        console.log(`⚠️ Événement non traité: ${eventType}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error: any) {
    console.error("❌ Erreur webhook Brevo:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});

/* === HANDLERS === */
async function handleEmailDelivered({ email, subject, ts }) {
  await insertInteraction(email, "envoi", subject || "Email envoyé", "Email délivré avec succès", "success", ts);
}

async function handleEmailOpened({ email, subject, ts }) {
  await insertInteraction(email, "ouverture", subject || "Email ouvert", "Email ouvert", "success", ts);
}

async function handleEmailClicked({ email, subject, ts, link }) {
  await insertInteraction(email, "clic", subject || "Lien cliqué", `Lien cliqué: ${link}`, "success", ts);
}

async function handleEmailBounced({ email, subject, ts, reason }) {
  await insertInteraction(email, "bounce", subject || "Email bounce", `Email bounce: ${reason}`, "error", ts);
}

async function handleEmailUnsubscribed({ email, ts }) {
  await insertInteraction(email, "desabonnement", "Désabonnement", "Contact désabonné", "info", ts);
}

/* === INSERT DANS interactions === */
async function insertInteraction(email, type, sujet, message, statut, created_at) {
  const contactId = await getContactIdByEmail(email);

  const { error } = await supabase.from("interactions").insert({
    contact_id: contactId,
    type,
    canal: "email",
    sujet,
    message,
    statut,
    created_at
  });

  if (error) {
    console.error(`❌ Erreur insertion ${type}:`, error);
  } else {
    console.log(`✅ Interaction ${type} insérée pour ${email}`);
  }
}

/* === RESOLVE CONTACT === */
async function getContactIdByEmail(email) {
  if (!email) return null;

  const { data, error } = await supabase
    .from("contact")
    .select("identifiant")
    .eq("email", email)
    .maybeSingle();

  if (error || !data) {
    console.log(`⚠️ Contact introuvable pour l'email: ${email}`);
    return null;
  }
  return data.identifiant;
}
