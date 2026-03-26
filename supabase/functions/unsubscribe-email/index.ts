import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyUnsubscribeToken } from "../_shared/unsubscribe.ts";

const redirectStatusCodes = {
  success: "success",
  error: "error",
} as const;

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

function redirectToStatus(status: (typeof redirectStatusCodes)[keyof typeof redirectStatusCodes]) {
  const siteUrl = Deno.env.get("PUBLIC_SITE_URL") ?? "https://bearsprediction.com";
  const redirectUrl = new URL("/email/unsubscribed", siteUrl);
  redirectUrl.searchParams.set("status", status);

  return Response.redirect(redirectUrl.toString(), 303);
}

Deno.serve(async (req) => {
  try {
    if (req.method !== "GET") {
      return redirectToStatus(redirectStatusCodes.error);
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return redirectToStatus(redirectStatusCodes.error);
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

    return redirectToStatus(redirectStatusCodes.success);
  } catch (error) {
    console.error("Failed to process unsubscribe request", error);
    return redirectToStatus(redirectStatusCodes.error);
  }
});
