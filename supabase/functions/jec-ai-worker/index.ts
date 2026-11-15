import { createClient } from "npm:@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
});
const AGENT_ID = "jec-windows-primary";

function getSecretKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed.default) return parsed.default;
      const first = Object.values(parsed).find((value) => typeof value === "string" && value);
      if (first) return first;
    } catch { /* fail closed below */ }
  }
  return "";
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const expectedHash = (Deno.env.get("JEC_AI_AGENT_TOKEN_SHA256") ?? "").trim().toLowerCase();
  const authorization = req.headers.get("Authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!expectedHash || !match) return json({ error: "Agent authentication required." }, 401);
  const actualHash = await sha256Hex(match[1]);
  if (!constantTimeEqual(actualHash, expectedHash)) return json({ error: "Agent authentication failed." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = getSecretKey();
  if (!supabaseUrl || !secretKey) {
    console.error("[jec-ai-worker] Server-side Supabase credentials are unavailable.");
    return json({ error: "Worker service is not configured." }, 503);
  }

  const raw = await req.text();
  if (raw.length > 20000) return json({ error: "Request too large." }, 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return json({ error: "Invalid JSON." }, 400); }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  if (body.action === "claim") {
    const { data, error } = await admin.rpc("jec_ai_claim_next_job", { p_agent_id: AGENT_ID });
    if (error) {
      console.error("[jec-ai-worker] Claim failed:", error.code);
      return json({ error: "Unable to claim a JEC AI task." }, 503);
    }
    const job = Array.isArray(data) ? data[0] : null;
    if (!job) return json({ job: null, idle: true });
    return json({ job: {
      id: job.id, messages: job.messages, language: job.language,
      source_context: job.source_context, attempts: job.attempts
    }});
  }

  if (body.action === "complete" || body.action === "fail") {
    const jobId = typeof body.job_id === "string" ? body.job_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
      return json({ error: "Invalid job identifier." }, 400);
    }
    const { data: current, error: readError } = await admin
      .from("jec_ai_jobs").select("id,attempts,claimed_by,status")
      .eq("id", jobId).eq("claimed_by", AGENT_ID).eq("status", "processing").maybeSingle();
    if (readError || !current) return json({ error: "Task is no longer assigned to this agent." }, 409);

    let update: Record<string, unknown>;
    if (body.action === "complete") {
      const responseText = typeof body.response_text === "string" ? body.response_text.trim() : "";
      const refs = Array.isArray(body.source_references) ? body.source_references.slice(0, 6) : [];
      if (!responseText || responseText.length > 12000) return json({ error: "Invalid response text." }, 400);
      update = {
        status: "succeeded", response_text: responseText, source_references: refs,
        last_error: null, completed_at: new Date().toISOString(), updated_at: new Date().toISOString()
      };
    } else {
      const message = typeof body.error === "string" ? body.error.slice(0, 500) : "Local model processing failed.";
      const retry = Number(current.attempts) < 3;
      update = {
        status: retry ? "queued" : "failed", last_error: message,
        claimed_by: null, claimed_at: null, updated_at: new Date().toISOString(),
        completed_at: retry ? null : new Date().toISOString()
      };
    }

    const { data: updated, error: updateError } = await admin
      .from("jec_ai_jobs").update(update)
      .eq("id", jobId).eq("claimed_by", AGENT_ID).eq("status", "processing")
      .select("id,status").maybeSingle();
    if (updateError || !updated) return json({ error: "Unable to update task status." }, 503);
    return json({ ok: true, job_id: updated.id, status: updated.status });
  }
  return json({ error: "Unknown worker action." }, 400);
});
