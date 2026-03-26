import { createClient } from "npm:@supabase/supabase-js@2";
import { verifyUnsubscribeToken } from "../_shared/unsubscribe.ts";

const htmlHeaders = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

function renderPage({
  title,
  message,
  detail,
  status = 200,
}: {
  title: string;
  message: string;
  detail?: string;
  status?: number;
}) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeDetail = detail ? escapeHtml(detail) : "";

  return new Response(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>${safeTitle}</title>
    <style>
      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        padding: 24px;
        background:
          radial-gradient(circle at top, rgba(200, 56, 3, 0.14), transparent 28%),
          linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
      }

      .shell {
        width: 100%;
        max-width: 720px;
        margin: 0 auto;
        padding: 48px 0;
      }

      .card {
        overflow: hidden;
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 28px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
      }

      .hero {
        padding: 28px 32px 20px;
        background: linear-gradient(135deg, #0b162a 0%, #132642 100%);
        color: #ffffff;
      }

      .eyebrow {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.22em;
        text-transform: uppercase;
        color: #fda47f;
      }

      h1 {
        margin: 14px 0 0;
        font-size: 34px;
        line-height: 1.1;
      }

      .content {
        padding: 32px;
      }

      .lead {
        margin: 0;
        font-size: 19px;
        line-height: 1.7;
        color: #334155;
      }

      .detail {
        margin: 20px 0 0;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        font-size: 15px;
        line-height: 1.7;
        color: #64748b;
      }

      .footer {
        margin-top: 24px;
        font-size: 14px;
        color: #94a3b8;
      }

      @media (max-width: 640px) {
        body {
          padding: 16px;
        }

        .shell {
          padding: 20px 0;
        }

        .hero,
        .content {
          padding: 24px 20px;
        }

        h1 {
          font-size: 28px;
        }

        .lead {
          font-size: 17px;
        }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <section class="card">
        <div class="hero">
          <div class="eyebrow">Bears Prediction Tracker</div>
          <h1>${safeTitle}</h1>
        </div>
        <div class="content">
          <p class="lead">${safeMessage}</p>
          ${safeDetail ? `<p class="detail">${safeDetail}</p>` : ""}
          <div class="footer">You can close this page at any time.</div>
        </div>
      </section>
    </main>
  </body>
</html>`,
    { status, headers: htmlHeaders },
  );
}

Deno.serve(async (req) => {
  try {
    if (req.method === "HEAD") {
      return new Response(null, { status: 200, headers: htmlHeaders });
    }

    if (req.method !== "GET") {
      return renderPage({
        title: "Method not allowed",
        message: "This page only supports unsubscribe confirmation links opened in a browser.",
        status: 405,
      });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return renderPage({
        title: "Unsubscribe link missing",
        message: "This unsubscribe link is incomplete.",
        detail: "Please use the full link from your email, or contact support if the problem continues.",
        status: 400,
      });
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

    return renderPage({
      title: "You're unsubscribed",
      message: `${payload.email} will no longer receive recap and reminder emails from Bears Prediction Tracker.`,
      detail: "You can resubscribe later if email preferences are added in the app.",
    });
  } catch (error) {
    return renderPage({
      title: "We couldn't process that request",
      message: "The unsubscribe link could not be completed.",
      detail: error instanceof Error ? error.message : "Unknown error",
      status: 400,
    });
  }
});
