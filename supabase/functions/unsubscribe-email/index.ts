import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyUnsubscribeToken } from "../_shared/unsubscribe.ts";

const htmlHeaders = {
  "Content-Type": "text/html; charset=utf-8",
};

function getAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY secrets.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function renderPage(title: string, body: string) {
  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:40px 20px; background:#eef2ff; font-family:Arial, Helvetica, sans-serif; color:#1e293b;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border-radius:20px; padding:32px; box-shadow:0 10px 30px rgba(15,23,42,0.08);">
      <div style="font-size:14px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:#c83803;">Bears Prediction Tracker</div>
      <h1 style="margin:16px 0 0; font-size:32px; line-height:38px; color:#0b162a;">${title}</h1>
      <div style="margin-top:18px; font-size:18px; line-height:30px; color:#334155;">
        ${body}
      </div>
    </div>
  </body>
</html>`,
    { status: 200, headers: htmlHeaders },
  );
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return renderPage(
        "Unsubscribe link missing",
        "<p>This unsubscribe link is incomplete.</p>",
      );
    }

    const secret = Deno.env.get("UNSUBSCRIBE_SIGNING_SECRET");
    if (!secret) {
      throw new Error("Missing UNSUBSCRIBE_SIGNING_SECRET secret.");
    }

    const payload = await verifyUnsubscribeToken(token, secret);
    const supabase = getAdminClient();

    const { error } = await supabase
      .from("email_preferences")
      .upsert({
        user_id: payload.userId,
        marketing_subscribed: false,
        unsubscribed_at: new Date().toISOString(),
      });

    if (error) {
      throw new Error(`Failed to update unsubscribe state: ${error.message}`);
    }

    return renderPage(
      "You're unsubscribed",
      `<p><strong>${payload.email}</strong> will no longer receive recap and reminder emails from Bears Prediction Tracker.</p>
      <p>You can always resubscribe later if you add email preferences in the app.</p>`,
    );
  } catch (error) {
    return renderPage(
      "We couldn't process that request",
      `<p>${error instanceof Error ? error.message : "Unknown error"}</p>`,
    );
  }
});
