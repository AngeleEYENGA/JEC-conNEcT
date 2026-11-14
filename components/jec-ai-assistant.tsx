"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

type ChatRole = "user" | "assistant";
type SourceReference = {
  id: string;
  title: string;
  publisher: string;
  evidence_label: string;
  source_url: string | null;
};
type ChatMessage = {
  role: ChatRole;
  content: string;
  sources?: SourceReference[];
};

const suggestions = {
  fr: [
    "Présente-moi l’histoire de la JEC et ses grandes étapes.",
    "Explique-moi la démarche Voir-Juger-Agir.",
    "Quels chants et hymnes sont documentés ?",
    "Aide-moi à préparer une réunion d’équipe."
  ],
  en: [
    "Introduce the history of the YCS and its main milestones.",
    "Explain the See-Judge-Act approach.",
    "Which songs and anthems are documented?",
    "Help me prepare a team meeting."
  ]
};

export default function JecAiAssistant() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [authState, setAuthState] = useState<"checking" | "signed-in" | "signed-out" | "unavailable">("checking");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthState("unavailable");
      return;
    }
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (active) setAuthState(session?.user ? "signed-in" : "signed-out");
    });
    void supabase.auth.getSession().then((result: { data: { session: Session | null }; error: { message: string } | null }) => {
      if (!active) return;
      if (result.error) setAuthState("signed-out");
      else setAuthState(result.data.session?.user ? "signed-in" : "signed-out");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || loading || !supabase || authState !== "signed-in") return;

    const previous = [...messages, { role: "user" as const, content }];
    const history = previous.slice(-8);
    if (history[0]?.role === "assistant") history.shift();

    setMessages((current) => [...current, { role: "user", content }]);
    setDraft("");
    setError("");
    setLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("jec-ai", {
        body: { messages: history.map(({ role, content: text }) => ({ role, content: text })), language: lang }
      });

      if (invokeError) {
        let message = invokeError.message || (en ? "The assistant is temporarily unavailable." : "L’assistant est momentanément indisponible.");
        try {
          const context = await (invokeError as { context?: Response }).context;
          if (context) {
            const payload = await context.clone().json() as { error?: string };
            if (payload.error) message = payload.error;
          }
        } catch {
          // Keep the safe generic error when the response body is not JSON.
        }
        throw new Error(message);
      }

      if (!data || typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error(en ? "The assistant returned an empty response. Please try again." : "L’assistant n’a pas retourné de réponse. Réessaie.");
      }

      const sources = Array.isArray(data.sources) ? data.sources as SourceReference[] : [];
      const assistantMessage: ChatMessage = { role: "assistant", content: data.reply as string, sources };
      setMessages((current) => [...current, assistantMessage].slice(-9));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (en ? "Unexpected error. Please try again." : "Une erreur inattendue est survenue. Réessaie."));
    } finally {
      setLoading(false);
    }
  }

  const resetConversation = () => {
    if (loading) return;
    setMessages([]);
    setError("");
    setDraft("");
  };

  return (
    <section className="jec-ai-page">
      <div className="jec-ai-heading">
        <div className="jec-ai-brand">
          <div className="jec-ai-mark" aria-hidden="true">✧</div>
          <div>
            <p className="eyebrow">{en ? "KNOWLEDGE ASSISTANT" : "ASSISTANT DOCUMENTAIRE"}</p>
            <h2>JEC IA</h2>
          </div>
        </div>
        <span className="jec-ai-status"><i />{en ? "Verified sources · Beta" : "Sources vérifiées · Bêta"}</span>
      </div>

      <div className="jec-ai-intro">
        <h3>{en ? "Explore the JEC movement with a documented assistant." : "Explore le mouvement JEC avec un assistant documenté."}</h3>
        <p>{en
          ? "Ask questions about the movement’s history, approach, resources and documented activities. Answers are grounded in the sources you are allowed to access."
          : "Pose tes questions sur l’histoire du mouvement, sa démarche, ses ressources et ses activités documentées. Les réponses s’appuient sur les sources que tu es autorisé·e à consulter."}</p>
      </div>

      {authState === "checking" && <div className="jec-ai-auth-note">{en ? "Checking your session…" : "Vérification de ta session…"}</div>}
      {authState === "unavailable" && <div className="jec-ai-auth-note">{en ? "Supabase is not configured on this deployment." : "Supabase n’est pas configuré sur ce déploiement."}</div>}
      {authState === "signed-out" && (
        <div className="jec-ai-login-card">
          <strong>{en ? "Sign in to use JEC IA" : "Connecte-toi pour utiliser JEC IA"}</strong>
          <p>{en ? "The assistant is available to authenticated JEC-conNEcT accounts." : "L’assistant est accessible aux comptes connectés à JEC-conNEcT."}</p>
          <Link href="/login" className="primary-button">{en ? "Sign in →" : "Se connecter →"}</Link>
        </div>
      )}

      {authState === "signed-in" && (
        <>
          <div className="jec-ai-chat-card">
            <div className="jec-ai-chat-toolbar">
              <div><span className="jec-ai-live-dot" />{en ? "Conversation" : "Conversation"}</div>
              <button type="button" onClick={resetConversation} disabled={loading || messages.length === 0}>
                {en ? "Clear conversation" : "Effacer la conversation"}
              </button>
            </div>

            <div className="jec-ai-messages" aria-live="polite">
              {messages.length === 0 && (
                <div className="jec-ai-welcome">
                  <div className="jec-ai-welcome-icon">✧</div>
                  <h3>{en ? "Hello! I’m JEC IA." : "Bonjour ! Je suis JEC IA."}</h3>
                  <p>{en
                    ? "I can help you understand documented JEC information, prepare activities and structure your ideas. What would you like to explore?"
                    : "Je peux t’aider à comprendre les informations documentées sur la JEC, préparer des activités et structurer tes idées. Que souhaites-tu explorer ?"}</p>
                  <div className="jec-ai-suggestions">
                    {suggestions[lang].map((suggestion) => (
                      <button type="button" key={suggestion} onClick={() => setDraft(suggestion)}>{suggestion}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <article className={"jec-ai-message " + (message.role === "user" ? "is-user" : "is-assistant")} key={index}>
                  <div className="jec-ai-message-avatar">{message.role === "user" ? (en ? "YOU" : "TOI") : "IA"}</div>
                  <div className="jec-ai-message-content">
                    <div className="jec-ai-bubble">
                      <p>{message.content}</p>
                    </div>
                    {message.sources && message.sources.length > 0 && (
                      <div className="jec-ai-source-list">
                        <strong>{en ? "Sources used" : "Sources utilisées"}</strong>
                        {message.sources.map((source) => (
                          <div className="jec-ai-source-item" key={source.id}>
                            <span>{source.id}</span>
                            <div>
                              <b>{source.title}</b>
                              <small>{source.publisher} · {source.evidence_label}</small>
                              {source.source_url && <a href={source.source_url} target="_blank" rel="noreferrer">{en ? "Open source ↗" : "Consulter la source ↗"}</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}

              {loading && (
                <div className="jec-ai-typing"><span /><span /><span />{en ? "JEC IA is preparing an answer…" : "JEC IA prépare une réponse…"}</div>
              )}
              <div ref={bottomRef} />
            </div>

            {error && <p className="jec-ai-error" role="alert">{error}</p>}

            <form className="jec-ai-composer" onSubmit={sendMessage}>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={en ? "Ask JEC IA a question…" : "Pose une question à JEC IA…"}
                maxLength={2000}
                rows={3}
                disabled={loading}
              />
              <div className="jec-ai-composer-footer">
                <small>{draft.length}/2000 · {en ? "Enter to send, Shift+Enter for a new line" : "Entrée pour envoyer, Maj+Entrée pour un retour à la ligne"}</small>
                <button type="submit" className="primary-button" disabled={!draft.trim() || loading}>
                  {loading ? (en ? "Sending…" : "Envoi…") : (en ? "Send" : "Envoyer")} <span aria-hidden="true">↗</span>
                </button>
              </div>
            </form>
          </div>
          <p className="jec-ai-privacy">
            {en
              ? "Privacy: your messages are sent to OpenAI to generate a reply. This prototype does not save chat history in the JEC database. Do not enter personal, sensitive or confidential information."
              : "Confidentialité : tes messages sont transmis à OpenAI pour générer une réponse. Cette version ne sauvegarde pas l’historique dans la base JEC. N’y saisis pas d’informations personnelles, sensibles ou confidentielles."}
          </p>
        </>
      )}
    </section>
  );
}
