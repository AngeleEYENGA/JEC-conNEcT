import { createClient } from "npm:@supabase/supabase-js@2.86.0";
import nodemailer from "npm:nodemailer@^9.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: corsHeaders });
}

function htmlEscape(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character] ?? character);
}

function displayName(profile: Record<string, unknown> | null, fallback: string) {
  if (!profile) return fallback;
  const name = typeof profile.display_name === "string" ? profile.display_name.trim() : "";
  if (name) return name;
  const first = typeof profile.first_name === "string" ? profile.first_name.trim() : "";
  const last = typeof profile.last_name === "string" ? profile.last_name.trim() : "";
  return [first, last].filter(Boolean).join(" ") || fallback;
}

function defaultSecretKey() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch {
      // Fall back to the legacy server-side key name below.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

function emailCopy(language: "fr" | "en", sender: string, conversation: string, url: string) {
  const safeSender = htmlEscape(sender);
  const safeConversation = htmlEscape(conversation);
  const safeUrl = htmlEscape(url);

  if (language === "en") {
    return {
      subject: `${sender} sent you a message in ${conversation}`,
      text: `Hello,

You have received a new message from ${sender} in the conversation ${conversation} on JEC Connect.

Open JEC Connect to read and reply:
${url}

You are receiving this email because message email notifications are enabled for your account.
For your security, the message content is not included in this email.`,
      html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#202a46">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fa;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#202a46;padding:24px 30px;color:#fff"><div style="font-size:13px;letter-spacing:2px;font-weight:700">JEC CONNECT</div><div style="font-size:12px;margin-top:6px;color:#d9e0f1">Connect. Collaborate. Build together.</div></td></tr>
<tr><td style="padding:30px">
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">Hello,</p>
<h1 style="font-size:22px;line-height:1.3;margin:0 0 14px;color:#202a46">You have a new message</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 22px"><strong>${safeSender}</strong> sent you a message in <strong>${safeConversation}</strong>.</p>
<p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#202a46;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700">Open conversation</a></p>
<p style="font-size:13px;line-height:1.6;color:#667085;margin:0">For your privacy, the message content is not included in this email. You are receiving this email because message notifications are enabled for your account.</p>
</td></tr>
<tr><td style="padding:18px 30px;background:#f8f9fc;font-size:12px;line-height:1.6;color:#667085">JEC Connect · Connect. Collaborate. Build together.</td></tr>
</table></td></tr></table></body></html>`
    };
  }

  return {
    subject: `${sender} t'a envoyé un message dans ${conversation}`,
    text: `Bonjour,

Tu as reçu un nouveau message de ${sender} dans la conversation ${conversation} sur JEC Connect.

Pour consulter la conversation et répondre :
${url}

Tu reçois cet e-mail parce que les notifications de messages sont activées sur ton compte.
Pour ta confidentialité, le contenu du message n'est pas inclus dans cet e-mail.`,
    html: `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f6fa;font-family:Arial,Helvetica,sans-serif;color:#202a46">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fa;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#202a46;padding:24px 30px;color:#fff"><div style="font-size:13px;letter-spacing:2px;font-weight:700">JEC CONNECT</div><div style="font-size:12px;margin-top:6px;color:#d9e0f1">Connecter. Collaborer. Construire ensemble.</div></td></tr>
<tr><td style="padding:30px">
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">Bonjour,</p>
<h1 style="font-size:22px;line-height:1.3;margin:0 0 14px;color:#202a46">Tu as reçu un nouveau message</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 22px"><strong>${safeSender}</strong> t'a envoyé un message dans <strong>${safeConversation}</strong>.</p>
<p style="margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#202a46;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700">Ouvrir la conversation</a></p>
<p style="font-size:13px;line-height:1.6;color:#667085;margin:0">Pour ta confidentialité, le contenu du message n'est pas inclus dans cet e-mail. Tu reçois cet e-mail parce que les notifications de messages sont activées sur ton compte.</p>
</td></tr>
<tr><td style="padding:18px 30px;background:#f8f9fc;font-size:12px;line-height:1.6;color:#667085">JEC Connect · Connecter. Collaborer. Construire ensemble.</td></tr>
</table></td></tr></table></body></html>`
  };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);

  const authorization = request.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return jsonResponse({ error: "authentication_required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const secretKey = defaultSecretKey();
  if (!supabaseUrl || !secretKey) return jsonResponse({ error: "server_configuration_missing" }, 503);

  const smtpHost = Deno.env.get("SMTP_HOSTNAME") ?? "smtp.gmail.com";
  const smtpPort = Number(Deno.env.get("SMTP_PORT") ?? "465");
  const smtpUser = Deno.env.get("SMTP_USERNAME") ?? "";
  const smtpPassword = Deno.env.get("SMTP_PASSWORD") ?? "";
  const smtpFrom = Deno.env.get("SMTP_FROM") ?? (smtpUser ? `JEC Connect <${smtpUser}>` : "");

  if (!smtpUser || !smtpPassword || !smtpFrom) {
    return jsonResponse({ error: "smtp_not_configured" }, 503);
  }
  if (smtpPort !== 465) {
    return jsonResponse({ error: "smtp_port_not_supported_use_465" }, 503);
  }

  let body: { messageId?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const messageId = typeof body.messageId === "string" ? body.messageId : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId)) {
    return jsonResponse({ error: "invalid_message_id" }, 400);
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: authData, error: authError } = await admin.auth.getUser(token);
  const actor = authData.user;
  if (authError || !actor) return jsonResponse({ error: "invalid_session" }, 401);

  const { data: message, error: messageError } = await admin
    .from("jec_messages")
    .select("id,conversation_id,sender_id")
    .eq("id", messageId)
    .maybeSingle();

  if (messageError || !message) return jsonResponse({ error: "message_not_found" }, 404);
  if (message.sender_id !== actor.id) return jsonResponse({ error: "sender_mismatch" }, 403);

  const [{ data: conversation, error: conversationError }, { data: memberRows, error: membersError }] = await Promise.all([
    admin.from("jec_conversations")
      .select("id,conversation_type,title,workspace_id")
      .eq("id", message.conversation_id)
      .maybeSingle(),
    admin.from("jec_conversation_members")
      .select("user_id")
      .eq("conversation_id", message.conversation_id)
      .eq("membership_status", "active")
      .neq("user_id", actor.id)
  ]);

  if (conversationError || !conversation) return jsonResponse({ error: "conversation_not_found" }, 404);
  if (membersError) return jsonResponse({ error: "conversation_roster_unavailable" }, 500);

  const recipientIds = [...new Set((memberRows ?? []).map((member) => member.user_id))];
  if (recipientIds.length === 0) return jsonResponse({ sent: 0, skipped: 0, failed: 0 });

  const { data: profileRows } = await admin.from("jec_profiles")
    .select("user_id,first_name,last_name,display_name")
    .in("user_id", [actor.id, ...recipientIds]);

  const profiles = new Map((profileRows ?? []).map((profile) => [profile.user_id, profile]));
  const senderName = displayName(profiles.get(actor.id) ?? null, "Un membre JEC");

  let conversationName = typeof conversation.title === "string" ? conversation.title.trim() : "";
  if (!conversationName && conversation.conversation_type === "workspace" && conversation.workspace_id) {
    const { data: workspace } = await admin.from("jec_workspaces")
      .select("name").eq("id", conversation.workspace_id).maybeSingle();
    conversationName = workspace?.name ?? "Espace de travail JEC";
  }
  if (!conversationName && conversation.conversation_type === "direct") conversationName = senderName;
  if (!conversationName) conversationName = "Conversation de groupe";

  const appBaseUrl = (Deno.env.get("APP_BASE_URL") ?? "https://jec-connect-ten.vercel.app").replace(/\/$/, "");
  const conversationUrl = `${appBaseUrl}/messagerie`;
  const mailer = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: true,
    auth: { user: smtpUser, pass: smtpPassword }
  });

  const rows = recipientIds.map((recipientId) => ({
    message_id: messageId,
    recipient_id: recipientId,
    status: "pending"
  }));
  const { data: newDeliveries, error: deliveryError } = await admin
    .from("jec_notification_email_deliveries")
    .upsert(rows, { onConflict: "message_id,recipient_id", ignoreDuplicates: true })
    .select("id,recipient_id");

  if (deliveryError) return jsonResponse({ error: "delivery_log_unavailable" }, 500);
  if (!newDeliveries?.length) return jsonResponse({ sent: 0, skipped: recipientIds.length, failed: 0 });

  let sent = 0;
  let failed = 0;
  for (const delivery of newDeliveries) {
    const attemptedAt = new Date().toISOString();
    await admin.from("jec_notification_email_deliveries")
      .update({ attempts: 1, attempted_at: attemptedAt })
      .eq("id", delivery.id);

    const { data: recipientData, error: recipientError } = await admin.auth.admin.getUserById(delivery.recipient_id);
    const recipient = recipientData.user;
    if (recipientError || !recipient?.email) {
      failed += 1;
      await admin.from("jec_notification_email_deliveries")
        .update({ status: "failed", error_code: "recipient_email_unavailable" })
        .eq("id", delivery.id);
      continue;
    }

    const metadata = (recipient.user_metadata ?? {}) as Record<string, unknown>;
    const localeValue = String(metadata.language ?? metadata.locale ?? "fr").toLowerCase();
    const language = localeValue.startsWith("en") ? "en" : "fr";
    const recipientName = displayName(profiles.get(delivery.recipient_id) ?? null, language === "en" ? "JEC member" : "membre JEC");
    const copy = emailCopy(language, senderName, conversationName, conversationUrl);

    try {
      await mailer.sendMail({
        from: smtpFrom,
        to: recipient.email,
        subject: copy.subject,
        text: copy.text.replace(/^Bonjour,|^Hello,/m, language === "en" ? `Hello ${recipientName},` : `Bonjour ${recipientName},`),
        html: copy.html.replace(language === "en" ? "<p style=\"font-size:15px;line-height:1.6;margin:0 0 18px\">Hello,</p>" : "<p style=\"font-size:15px;line-height:1.6;margin:0 0 18px\">Bonjour,</p>",
          language === "en"
            ? `<p style="font-size:15px;line-height:1.6;margin:0 0 18px">Hello ${htmlEscape(recipientName)},</p>`
            : `<p style="font-size:15px;line-height:1.6;margin:0 0 18px">Bonjour ${htmlEscape(recipientName)},</p>`)
      });
      sent += 1;
      await admin.from("jec_notification_email_deliveries")
        .update({ status: "sent", sent_at: new Date().toISOString(), error_code: null })
        .eq("id", delivery.id);
    } catch {
      failed += 1;
      await admin.from("jec_notification_email_deliveries")
        .update({ status: "failed", error_code: "smtp_delivery_failed" })
        .eq("id", delivery.id);
    }
  }

  return jsonResponse({ sent, skipped: recipientIds.length - newDeliveries.length, failed });
});
