"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/language-provider";

type Source = {
  id: string;
  reference: string;
  title: string;
  publisher: string;
  evidenceLabel: string;
  url: string | null;
  language: string;
};
type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};
type ApiResponse = {
  answer?: string;
  error?: string;
  message?: string;
  sources?: Source[];
  modelConfigured?: boolean;
};

const suggestedQuestions = {
  fr: [
    "Comment fonctionne la démarche Voir-Juger-Agir ?",
    "Quels sont les cinq piliers de la JEC France ?",
    "Que sait-on du Camp National Universitaire de Garoua 2026 ?",
    "Peux-tu retrouver les paroles du chant de ralliement ?"
  ],
  en: [
    "How does the See-Judge-Act approach work?",
    "What are the five pillars of JEC France?",
    "What is documented about the 2026 Garoua National University Camp?",
    "Can you find the lyrics of the YCS rallying song?"
  ]
};

export function JecAiAssistant() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modelConfigured, setModelConfigured] = useState<boolean | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendQuestion(value?: string) {
    const prompt = (value ?? question).trim();
    if (!prompt || loading) return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: prompt
    };
    const previous = messages.slice(-6).map(item => ({
      role: item.role,
      content: item.content
    }));
    setMessages(current => [...current, userMessage]);
    setQuestion("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/jec-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          history: previous,
          language: en ? "en" : "fr"
        })
      });
      const payload = (await response.json()) as ApiResponse;
      if (typeof payload.modelConfigured === "boolean") setModelConfigured(payload.modelConfigured);

      if (!response.ok || payload.error) {
        setError(payload.message || (en ? "The assistant is temporarily unavailable." : "L’assistant est momentanément indisponible."));
        if (payload.sources?.length) {
          setMessages(current => [...current, {
            id: crypto.randomUUID(),
            role: "assistant",
            content: en
              ? "I found relevant, approved JEC sources. The generative model is not connected yet, so I am showing you the documents rather than inventing an answer."
              : "J’ai trouvé des sources JEC pertinentes et validées. Le moteur de génération n’est pas encore raccordé : je t’affiche les documents plutôt que d’inventer une réponse.",
            sources: payload.sources
          }]);
        }
        return;
      }

      setMessages(current => [...current, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: payload.answer || (en ? "No answer was returned." : "Aucune réponse n’a été renvoyée."),
        sources: payload.sources ?? []
      }]);
    } catch {
      setError(en
        ? "Unable to contact JEC AI. Check your connection and try again."
        : "Impossible de contacter JEC IA. Vérifie ta connexion puis réessaie.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion();
  }

  function resetConversation() {
    setMessages([]);
    setError("");
    setQuestion("");
  }

  return (
    <div className="jec-ai-shell">
      <section className="jec-ai-hero">
        <div className="jec-ai-orb" aria-hidden="true"><span>✧</span></div>
        <div className="jec-ai-hero-copy">
          <p className="eyebrow">{en ? "JEC KNOWLEDGE ASSISTANT" : "ASSISTANT DOCUMENTAIRE JEC"}</p>
          <h1>JEC IA</h1>
          <p>{en
            ? "Explore the history, approach, projects, songs and documented life of the Young Christian Students."
            : "Explore l’histoire, la démarche, les projets, les chants et la vie documentée de la Jeunesse Étudiante Chrétienne."}</p>
          <div className="jec-ai-trust-line">
            <span><i/> {en ? "Answers grounded in approved sources" : "Réponses fondées sur des sources validées"}</span>
            <span>{en ? "French · English" : "Français · anglais"}</span>
          </div>
        </div>
      </section>

      <div className="jec-ai-layout">
        <aside className="jec-ai-aside">
          <div className="jec-ai-side-card">
            <p className="eyebrow">{en ? "WHAT IT CAN DO" : "SES CAPACITÉS"}</p>
            <h2>{en ? "A documented JEC assistant" : "Un assistant ancré dans les sources JEC"}</h2>
            <ul>
              <li>{en ? "Explain JEC history and the See-Judge-Act approach." : "Expliquer l’histoire de la JEC et la démarche Voir-Juger-Agir."}</li>
              <li>{en ? "Find approved songs and programme details." : "Retrouver les chants validés et les informations des programmes."}</li>
              <li>{en ? "Summarise the sources and point to the original documents." : "Résumer les sources et renvoyer aux documents d’origine."}</li>
            </ul>
          </div>
          <div className="jec-ai-side-card jec-ai-principle">
            <p className="eyebrow">{en ? "EDITORIAL RULE" : "RÈGLE ÉDITORIALE"}</p>
            <strong>{en ? "No source, no invented fact." : "Pas de source, pas de fait inventé."}</strong>
            <p>{en
              ? "When the knowledge base does not support an answer, JEC AI says so. It distinguishes JEC France, JECI/IYCS and national movements."
              : "Quand la base documentaire ne permet pas de répondre, JEC IA le dit. Elle distingue la JEC France, la JECI/MIEC et les mouvements nationaux."}</p>
          </div>
        </aside>

        <section className="jec-ai-chat-card" aria-label={en ? "JEC AI conversation" : "Conversation avec JEC IA"}>
          <div className="jec-ai-chat-header">
            <div className="jec-ai-chat-avatar">✧</div>
            <div>
              <strong>JEC IA</strong>
              <small>{en ? "Knowledge assistant · source-based" : "Assistant documentaire · réponses sourcées"}</small>
            </div>
            <button type="button" className="jec-ai-reset" onClick={resetConversation} disabled={!messages.length && !error}>
              {en ? "New chat" : "Nouvelle discussion"}
            </button>
          </div>

          <div className="jec-ai-messages" aria-live="polite">
            {!messages.length && (
              <div className="jec-ai-welcome">
                <div className="jec-ai-welcome-mark">JEC</div>
                <h2>{en ? "Hello! What would you like to understand about JEC?" : "Bonjour ! Que souhaites-tu comprendre sur la JEC ?"}</h2>
                <p>{en
                  ? "Ask a question. I will look for approved documents and identify the sources used."
                  : "Pose une question. Je rechercherai les documents validés et j’indiquerai les sources utilisées."}</p>
                <div className="jec-ai-suggestions">
                  {(en ? suggestedQuestions.en : suggestedQuestions.fr).map(item =>
                    <button key={item} type="button" onClick={() => void sendQuestion(item)}>{item}<span>↗</span></button>
                  )}
                </div>
              </div>
            )}

            {messages.map(message => (
              <article className={"jec-ai-message " + (message.role === "user" ? "user" : "assistant")} key={message.id}>
                <div className="jec-ai-message-avatar">{message.role === "user" ? "T" : "✧"}</div>
                <div className="jec-ai-message-body">
                  <div className="jec-ai-message-label">{message.role === "user" ? (en ? "You" : "Toi") : "JEC IA"}</div>
                  <p>{message.content}</p>
                  {message.sources && message.sources.length > 0 && (
                    <div className="jec-ai-sources">
                      <strong>{en ? "Sources consulted" : "Sources consultées"}</strong>
                      {message.sources.map(source => (
                        <div className="jec-ai-source" key={source.id}>
                          <span>{source.reference}</span>
                          <div>
                            <strong>{source.title}</strong>
                            <small>{source.publisher} · {source.evidenceLabel}</small>
                            {source.url && <a href={source.url} target="_blank" rel="noreferrer">{en ? "Open source" : "Ouvrir la source"} ↗</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}

            {loading && (
              <div className="jec-ai-loading">
                <span/><span/><span/>
                <small>{en ? "Searching JEC sources…" : "Recherche dans les sources JEC…"} </small>
              </div>
            )}
            <div ref={endRef}/>
          </div>

          {error && (
            <div className="jec-ai-error" role="status">
              <strong>{en ? "Configuration notice" : "Information de configuration"}</strong>
              <span>{error}</span>
            </div>
          )}

          <form className="jec-ai-composer" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="jec-ai-question">{en ? "Your question" : "Ta question"}</label>
            <textarea
              id="jec-ai-question"
              value={question}
              onChange={event => setQuestion(event.target.value)}
              onKeyDown={event => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendQuestion();
                }
              }}
              placeholder={en ? "Ask JEC AI a question…" : "Pose une question à JEC IA…"}
              rows={2}
              maxLength={1500}
              disabled={loading}
            />
            <div className="jec-ai-composer-bottom">
              <small>{en ? "Enter to send · Shift + Enter for a new line" : "Entrée pour envoyer · Maj + Entrée pour un retour à la ligne"}</small>
              <button type="submit" disabled={!question.trim() || loading}>
                {loading ? (en ? "Searching…" : "Recherche…") : (en ? "Send" : "Envoyer")} <span>↑</span>
              </button>
            </div>
          </form>
          <p className="jec-ai-privacy-note">{en
            ? "Only sources returned by your access permissions are sent to the AI provider. Private workspace data is not made public."
            : "Seules les sources autorisées par tes droits d’accès sont transmises au fournisseur IA. Les données privées d’un espace ne deviennent pas publiques."}</p>
        </section>
      </div>

      <div className="jec-ai-back-link"><Link href="/">{en ? "← Back to JEC-conNEcT" : "← Retour à JEC-conNEcT"}</Link></div>
    </div>
  );
}
