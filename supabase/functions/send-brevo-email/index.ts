import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildSeasonRecapEmail,
  type SeasonRecapImageUrls,
  type SeasonRecapLinks,
} from "../_shared/seasonRecapEmail.ts";
import { buildUnsubscribeUrl, createUnsubscribeToken } from "../_shared/unsubscribe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SegmentName = "season_2025_participants";
type SendMode = "test" | "send";

interface SendBrevoEmailRequest {
  mode?: SendMode;
  segment?: SegmentName;
  recipients?: string[];
  testEmail?: string;
  subject?: string;
  previewText?: string;
  imageUrls?: SeasonRecapImageUrls;
  links?: Partial<SeasonRecapLinks>;
}

interface Contact {
  user_id?: string;
  email: string;
}

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

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function dedupeEmails(values: string[]) {
  return [...new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))];
}

async function listAllAuthUsers() {
  const supabase = getAdminClient();
  const users = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`);
    }

    users.push(...data.users);

    if (data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return users;
}

async function fetchSeason2025Participants() {
  const supabase = getAdminClient();

  const { data: predictions, error: predictionError } = await supabase
    .from("predictions")
    .select("user_id, question_id, questions!inner(season)")
    .eq("questions.season", 2025);

  if (predictionError) {
    throw new Error(`Failed to fetch prediction users: ${predictionError.message}`);
  }

  const userIds = [...new Set((predictions ?? []).map((row) => row.user_id).filter(Boolean))];

  if (userIds.length === 0) return [];

  const users = await listAllAuthUsers();

  const emails = users
    .filter((user) => userIds.includes(user.id) && user.email)
    .map((user) => ({ user_id: user.id, email: user.email! }));

  const { data: preferences, error: preferencesError } = await supabase
    .from("email_preferences")
    .select("user_id, marketing_subscribed");

  if (preferencesError) {
    throw new Error(`Failed to fetch email preferences: ${preferencesError.message}`);
  }

  const subscriptionMap = new Map(
    (preferences ?? []).map((preference) => [preference.user_id, preference.marketing_subscribed]),
  );

  return emails.filter((contact) => subscriptionMap.get(contact.user_id) !== false);
}

async function findRecipientByEmail(email: string): Promise<Contact> {
  const normalizedEmail = email.trim().toLowerCase();
  const supabase = getAdminClient();
  const users = await listAllAuthUsers();
  const user = users.find((entry) => entry.email?.trim().toLowerCase() === normalizedEmail);

  if (!user) {
    return { email: normalizedEmail };
  }

  const { data: preference, error: preferenceError } = await supabase
    .from("email_preferences")
    .select("marketing_subscribed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (preferenceError) {
    throw new Error(`Failed to look up email preference for test email: ${preferenceError.message}`);
  }

  if (preference?.marketing_subscribed === false) {
    throw new Error("This test recipient is unsubscribed from marketing emails.");
  }

  return {
    user_id: user.id,
    email: normalizedEmail,
  };
}

async function resolveRecipients(request: SendBrevoEmailRequest) {
  if (request.mode === "test") {
    if (!request.testEmail) {
      throw new Error("`testEmail` is required when mode is `test`.");
    }

    return [await findRecipientByEmail(request.testEmail)];
  }

  if (request.recipients?.length) {
    return dedupeEmails(request.recipients).map((email) => ({ email }));
  }

  const segment = request.segment ?? "season_2025_participants";

  if (segment !== "season_2025_participants") {
    throw new Error(`Unsupported segment: ${segment}`);
  }

  const contacts = await fetchSeason2025Participants();
  const deduped = new Map<string, Contact>();
  for (const contact of contacts) {
    const normalizedEmail = contact.email.trim().toLowerCase();
    if (!deduped.has(normalizedEmail)) {
      deduped.set(normalizedEmail, {
        user_id: contact.user_id,
        email: normalizedEmail,
      });
    }
  }

  return [...deduped.values()];
}

async function sendBrevoEmail({
  to,
  subject,
  htmlContent,
}: {
  to: string;
  subject: string;
  htmlContent: string;
}) {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  const senderEmail = Deno.env.get("BREVO_SENDER_EMAIL");
  const senderName = Deno.env.get("BREVO_SENDER_NAME") ?? "Bears Prediction Tracker";
  const replyToEmail = Deno.env.get("BREVO_REPLY_TO_EMAIL");
  const replyToName = Deno.env.get("BREVO_REPLY_TO_NAME") ?? senderName;

  if (!apiKey || !senderEmail) {
    throw new Error("Missing BREVO_API_KEY or BREVO_SENDER_EMAIL secrets.");
  }

  const payload: Record<string, unknown> = {
    sender: {
      email: senderEmail,
      name: senderName,
    },
    to: [{ email: to }],
    subject,
    htmlContent,
  };

  if (replyToEmail) {
    payload.replyTo = {
      email: replyToEmail,
      name: replyToName,
    };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo send failed for ${to}: ${response.status} ${errorText}`);
  }

  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const request = (await req.json()) as SendBrevoEmailRequest;

    const subject = request.subject ?? "How Bears fans predicted the 2025 season";
    const previewText =
      request.previewText ??
      "The dust has settled. See how Bears fans did across all 13 predictions and check your results.";

    const links: SeasonRecapLinks = {
      dashboard: request.links?.dashboard ?? "https://bearsprediction.com/dashboard",
      recap: request.links?.recap ?? "https://bearsprediction.com/season-recap",
    };
    const unsubscribeBaseUrl =
      Deno.env.get("EMAIL_UNSUBSCRIBE_URL") ??
      `https://${Deno.env.get("SUPABASE_PROJECT_ID") ?? "mvyvfvwguwqowytnkvvs"}.supabase.co/functions/v1/unsubscribe-email`;
    const unsubscribeSecret = Deno.env.get("UNSUBSCRIBE_SIGNING_SECRET");

    const recipients = await resolveRecipients(request);

    if (recipients.length === 0) {
      return jsonResponse({ error: "No recipients resolved for this request." }, 400);
    }

    const results = [];
    for (const recipient of recipients) {
      let unsubscribeUrl: string | undefined;
      if (unsubscribeSecret && recipient.user_id) {
        const token = await createUnsubscribeToken(
          {
            userId: recipient.user_id,
            email: recipient.email,
          },
          unsubscribeSecret,
        );
        unsubscribeUrl = buildUnsubscribeUrl(unsubscribeBaseUrl, token);
      }

      const htmlContent = buildSeasonRecapEmail({
        previewText,
        imageUrls: request.imageUrls ?? {},
        links,
        unsubscribeUrl,
      });

      const result = await sendBrevoEmail({
        to: recipient.email,
        subject,
        htmlContent,
      });

      results.push({
        email: recipient.email,
        result,
      });
    }

    return jsonResponse({
      ok: true,
      mode: request.mode ?? "send",
      recipientCount: recipients.length,
      recipients: recipients.map((recipient) => recipient.email),
      results,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500,
    );
  }
});
