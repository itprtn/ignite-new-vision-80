// Fonction Edge pour gérer les relances
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Fonction relance démarrée")

Deno.serve(async (req) => {
  try {
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email requis"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        },
      )
    }

    // Ici, vous pourriez intégrer un service d'envoi d'email réel
    console.log("Relance envoyée à :", email)

    // Simulation d'un traitement de relance
    const data = {
      success: true,
      message: `Relance traitée pour ${email}`,
      timestamp: new Date().toISOString(),
      email: email
    }

    return new Response(
      JSON.stringify(data),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("Erreur dans la fonction relance:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      },
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/relance' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
