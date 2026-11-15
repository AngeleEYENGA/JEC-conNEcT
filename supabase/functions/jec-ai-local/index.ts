import { createClient } from "npm:@supabase/supabase-js@2.86.0";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Source = {
  id: string; source_key: string; title: string; publisher: string;
  source_type: string; language: string; publication_date: string | null;
  source_url: string | null; evidence_label: string; content_text: string; score: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin"
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
});

function getPublishableKey() {
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed.default) return parsed.default;
      const first = Object.values(parsed).find((value) => typeof value === "string" && value);
      if (first) return first;
    } catch { /* use legacy key below */ }
  }
  return Deno.env.get("SUPABASE_ANON_KEY") ?? "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return json({ error: "Connexion requise." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = getPublishableKey();
  if (!supabaseUrl || !publishableKey) return json({ error: "Configuration Supabase indisponible." }, 503);

  const raw = await req.text();
  if (raw.length > 24000) return json({ error: "Requête trop volumineuse." }, 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(raw); } catch { return json({ error: "JSON invalide." }, 400); }

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: "Bearer " + match[1] } }
  });
  const { data: authData, error: authError } = await supabase.auth.getUser(match[1]);
  if (authError || !authData.user) return json({ error: "Session invalide. Reconnecte-toi à JEC-conNEcT." }, 401);

  if (body.action === "submit") {
    if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 8) {
      return json({ error: "La conversation doit contenir entre 1 et 8 messages." }, 400);
    }
    const messages: ChatMessage[] = [];
    for (const item of body.messages) {
      if (!item || typeof item !== "object") return json({ error: "Format de message invalide." }, 400);
      const candidate = item as { role?: unknown; content?: unknown };
      if ((candidate.role !== "user" && candidate.role !== "assistant") || typeof candidate.content !== "string") {
        return json({ error: "Format de message invalide." }, 400);
      }
      const content = candidate.content.trim();
      if (!content || content.length > 2000) return json({ error: "Chaque message doit contenir entre 1 et 2 000 caractères." }, 400);
      messages.push({ role: candidate.role, content });
    }
    if (messages[messages.length - 1].role !== "user") return json({ error: "Le dernier message doit être une question." }, 400);

    const language = body.language === "en" ? "en" : "fr";
    const query = messages[messages.length - 1].content;
    const { data: found, error: searchError } = await supabase.rpc("jec_ai_search_sources", {
      search_text: query, result_limit: 6, search_language: language
    });
    if (searchError) {
      console.error("[jec-ai-local] Source search failed:", searchError.code);
      return json({ error: "La recherche dans les sources JEC est momentanément indisponible." }, 503);
    }

    const sources = ((found ?? []) as Source[])
      .filter((source) => Number(source.score) >= 0.18)
      .slice(0, 6)
      .map((source) => ({
        id: source.id, source_key: source.source_key, title: source.title,
        publisher: source.publisher, source_type: source.source_type,
        language: source.language, publication_date: source.publication_date,
        source_url: source.source_url, evidence_label: source.evidence_label,
        content_text: source.content_text.slice(0, 2200)
      }));

    const { data: created, error: insertError } = await supabase
      .from("jec_ai_jobs")
      .insert({ user_id: authData.user.id, messages, language, source_context: sources })
      .select("id")
      .single();

    if (insertError || !created) {
      console.error("[jec-ai-local] Queue insert failed:", insertError?.code);
      return json({ error: "Impossible d'ajouter la demande à la file IA. Réessaie." }, 503);
    }
    return json({ job_id: created.id, status: "queued" }, 202);
  }

  if (body.action === "status") {
    const jobId = typeof body.job_id === "string" ? body.job_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
      return json({ error: "Identifiant de tâche invalide." }, 400);
    }
    const { data: job, error } = await supabase
      .from("jec_ai_jobs")
      .select("id,status,response_text,source_references,last_error,created_at,completed_at")
      .eq("id", jobId)
      .maybeSingle();

    if (error) return json({ error: "Impossible de vérifier l'état de la demande." }, 503);
    if (!job) return json({ error: "Demande introuvable ou non autorisée." }, 404);
    return json({
      job_id: job.id, status: job.status, reply: job.response_text,
      sources: job.source_references ?? [], error: job.last_error,
      created_at: job.created_at, completed_at: job.completed_at
    });
  }
  return json({ error: "Action non reconnue." }, 400);
});
