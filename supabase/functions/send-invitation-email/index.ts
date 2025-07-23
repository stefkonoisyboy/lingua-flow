// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

console.log("Hello from Functions!");

Deno.serve(async (req) => {
  try {
    const { to, inviter, project, role, token, expiresAt } = await req.json();

    // Compose the invitation link
    const link = `http://localhost:3000/accept-invitation?token=${token}`;

    // Compose the email content
    const subject = `You’ve been invited to join ${project}`;

    const html = `
      <p><b>${inviter}</b> has invited you to join <b>${project}</b> as a <b>${role}</b>.</p>
      <p><a href="${link}">Accept Invitation</a></p>
      <p>This invitation expires on ${new Date(expiresAt).toLocaleString()}.</p>
    `;

    // Use the built-in email API (Supabase SMTP)
    const { error } = await fetch("https://api.supabase.com/v1/mailer/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: "mern.developers03@gmail.com", name: project },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    }).then((res) => res.json());

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-invitation-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
