"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Source = {
  id: string;
  title: string;
  publisher: string;
  source_type: string;
  language: string;
  source_url: string | null;
  evidence_label: string;
  content_text: string;
  visibility_scope: string;
  workspace_id: string | null;
  source_status: string;
  created_at: string;
  evidence_checked_at: string | null;
};
type Workspace = { id: string; name: string };

export default function JecAiKnowledgeAdminPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [publisher, setPublisher] = useState("JEC France");
  const [sourceType, setSourceType] = useState("official_page");
  const [language, setLanguage] = useState("fr");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [scope, setScope] = useState("public");
  const [workspaceId, setWorkspaceId] = useState("");
  const [content, setContent] = useState("");

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setAuthorized(false); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminFlag, error: adminError } = await supabase.rpc("is_jec_admin");
    if (adminError || !user || adminFlag !== true) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    setAuthorized(true);
    const [{ data: sourceRows, error: sourceError }, { data: workspaceRows }] = await Promise.all([
      supabase.from("jec_ai_sources").select("id,title,publisher,source_type,language,source_url,evidence_label,content_text,visibility_scope,workspace_id,source_status,created_at,evidence_checked_at").order("created_at", { ascending: false }),
      supabase.from("jec_workspaces").select("id,name").eq("is_active", true).order("name")
    ]);
    if (sourceError) setError(sourceError.message);
    setSources((sourceRows ?? []) as Source[]);
    setWorkspaces((workspaceRows ?? []) as Workspace[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function createSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError(en ? "Sign in again." : "Reconnecte-toi."); return; }
    if (scope === "workspace" && !workspaceId) {
      setError(en ? "Choose a workspace." : "Choisis un espace de travail.");
      return;
    }
    setSaving(true); setError(""); setMessage("");
    const sourceKey = title.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
      .slice(0, 70) + "-" + crypto.randomUUID().slice(0, 8);
    const { error: insertError } = await supabase.from("jec_ai_sources").insert({
      source_key: sourceKey,
      title: title.trim(),
      publisher: publisher.trim(),
      source_type: sourceType,
      language,
      source_url: url.trim() || null,
      evidence_label: label.trim(),
      content_text: content.trim(),
      visibility_scope: scope,
      workspace_id: scope === "workspace" ? workspaceId : null,
      source_status: "draft",
      created_by: user.id,
      evidence_checked_at: null
    });
    if (insertError) setError(insertError.message);
    else {
      setMessage(en ? "Draft created. Review it before approving it for JEC AI." : "Brouillon créé. Relis-le avant de l’approuver pour JEC IA.");
      setTitle(""); setUrl(""); setLabel(""); setContent("");
      await load();
    }
    setSaving(false);
  }

  async function changeStatus(source: Source, status: "approved" | "archived" | "draft") {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    setError(""); setMessage("");
    const { error: updateError } = await supabase.from("jec_ai_sources").update({
      source_status: status,
      approved_by: status === "approved" ? user?.id ?? null : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      evidence_checked_at: status === "approved" ? new Date().toISOString() : source.evidence_checked_at
    }).eq("id", source.id);
    if (updateError) setError(updateError.message);
    else {
      setMessage(en ? "Source status updated." : "Statut de la source mis à jour.");
      await load();
    }
  }

  return <main className="jec-ai-admin-page">
    <header className="account-header">
      <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link>
      <div><LanguageSwitcher/><Link href="/gestion" className="back-link-inline">{en ? "Administration" : "Administration"}</Link></div>
    </header>
    <div className="jec-ai-admin-content">
      <Link href="/gestion" className="project-open-link">← {en ? "Back to administration" : "Retour à l’administration"}</Link>
      <p className="eyebrow">{en ? "EDITORIAL GOVERNANCE" : "GOUVERNANCE ÉDITORIALE"}</p>
      <h1>{en ? "JEC AI knowledge base" : "Base de connaissances JEC IA"}</h1>
      <p className="jec-ai-admin-intro">{en
        ? "Add sources, check provenance and approve content before it can be used in an answer. New material always starts as a draft."
        : "Ajoute des sources, vérifie leur provenance et approuve les contenus avant leur utilisation dans une réponse. Tout nouveau contenu commence en brouillon."}</p>

      {loading ? <p className="muted">{en ? "Checking permissions…" : "Vérification des permissions…"}</p> :
        !authorized ? <section className="admin-locked"><h2>{en ? "Administrator access required" : "Accès administrateur requis"}</h2><p>{en ? "Only JEC-conNEcT administrators can manage the assistant's sources." : "Seuls les administrateurs JEC-conNEcT peuvent gérer les sources de l’assistant."}</p></section> :
        <>
          <section className="jec-ai-source-form-card">
            <p className="eyebrow">{en ? "ADD A SOURCE" : "AJOUTER UNE SOURCE"}</p>
            <h2>{en ? "Create a knowledge draft" : "Créer un brouillon documentaire"}</h2>
            <form className="jec-ai-source-form" onSubmit={createSource}>
              <label>{en ? "Document title" : "Titre du document"}<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={180}/></label>
              <label>{en ? "Publisher / organisation" : "Éditeur / organisation"}<input value={publisher} onChange={e=>setPublisher(e.target.value)} required maxLength={180}/></label>
              <div className="jec-ai-source-form-grid">
                <label>{en ? "Source type" : "Type de source"}<select value={sourceType} onChange={e=>setSourceType(e.target.value)}>
                  <option value="official_page">{en ? "Official page" : "Page officielle"}</option>
                  <option value="official_article">{en ? "Official article" : "Article officiel"}</option>
                  <option value="source_document">{en ? "Source document" : "Document source"}</option>
                  <option value="song_lyrics">{en ? "Song lyrics" : "Paroles de chant"}</option>
                  <option value="meeting_minutes">{en ? "Meeting minutes" : "Compte rendu"}</option>
                  <option value="internal_note">{en ? "Internal note" : "Note interne"}</option>
                </select></label>
                <label>{en ? "Content language" : "Langue du contenu"}<select value={language} onChange={e=>setLanguage(e.target.value)}><option value="fr">Français</option><option value="en">English</option><option value="de">Deutsch</option><option value="es">Español</option></select></label>
              </div>
              <label>{en ? "Public source URL (optional)" : "URL de la source publique (facultatif)"}<input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://…"/></label>
              <label>{en ? "Source label / file reference" : "Libellé de source / référence du fichier"}<input value={label} onChange={e=>setLabel(e.target.value)} required maxLength={240} placeholder={en ? "Official report, page title, booklet…" : "Rapport officiel, titre de page, livret…"}/></label>
              <div className="jec-ai-source-form-grid">
                <label>{en ? "Access scope" : "Périmètre d’accès"}<select value={scope} onChange={e=>setScope(e.target.value)}><option value="public">{en ? "Public" : "Public"}</option><option value="members">{en ? "Verified JEC members" : "Membres JEC vérifiés"}</option><option value="workspace">{en ? "Specific workspace" : "Espace de travail précis"}</option></select></label>
                {scope==="workspace"&&<label>{en ? "Workspace" : "Espace de travail"}<select value={workspaceId} onChange={e=>setWorkspaceId(e.target.value)} required><option value="">{en ? "Choose a workspace" : "Choisir un espace"}</option>{workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>}
              </div>
              <label>{en ? "Extracted text / verified content" : "Texte extrait / contenu vérifié"}<textarea value={content} onChange={e=>setContent(e.target.value)} rows={9} required maxLength={40000} placeholder={en ? "Paste the text that JEC AI may use. Do not include content you are not authorised to share." : "Colle le texte que JEC IA pourra utiliser. N’ajoute pas de contenu que tu n’es pas autorisé à partager."}/></label>
              <div className="jec-ai-source-form-footer"><small>{en ? "Draft only · not searchable by the assistant until approved" : "Brouillon uniquement · non consultable par l’assistant avant approbation"}</small><button className="primary-button" disabled={saving}>{saving?(en?"Saving…":"Enregistrement…"):(en?"Save draft":"Enregistrer le brouillon")}</button></div>
            </form>
          </section>

          <section className="jec-ai-source-list-card">
            <div className="directory-section-heading"><div><p className="eyebrow">{en ? "SOURCE LIBRARY" : "BIBLIOTHÈQUE DES SOURCES"}</p><h2>{en ? "Registered knowledge" : "Connaissances enregistrées"}</h2></div><span>{sources.length} {en ? "sources" : "sources"}</span></div>
            {sources.map(source=><article className="jec-ai-managed-source" key={source.id}>
              <div className="jec-ai-managed-source-copy">
                <div className="jec-ai-managed-source-top"><strong>{source.title}</strong><span className={"jec-ai-status "+source.source_status}>{source.source_status==="approved"?(en?"Approved":"Approuvée"):source.source_status==="archived"?(en?"Archived":"Archivée"):(en?"Draft":"Brouillon")}</span></div>
                <small>{source.publisher} · {source.evidence_label}</small>
                <small>{source.visibility_scope==="public"?(en?"Public": "Public"):source.visibility_scope==="members"?(en?"Verified members":"Membres vérifiés"):(en?"Workspace restricted":"Espace restreint")} · {source.language.toUpperCase()} · {source.source_type}</small>
                {source.source_url&&<a href={source.source_url} target="_blank" rel="noreferrer">{source.source_url} ↗</a>}
                <p>{source.content_text.slice(0,260)}{source.content_text.length>260?"…":""}</p>
              </div>
              <div className="jec-ai-managed-actions">
                {source.source_status!=="approved"&&<button className="primary-button" onClick={()=>void changeStatus(source,"approved")}>{en?"Approve":"Approuver"}</button>}
                {source.source_status!=="draft"&&<button className="quiet-button" onClick={()=>void changeStatus(source,"draft")}>{en?"Return to draft":"Remettre en brouillon"}</button>}
                {source.source_status!=="archived"&&<button className="quiet-button" onClick={()=>void changeStatus(source,"archived")}>{en?"Archive":"Archiver"}</button>}
              </div>
            </article>)}
          </section>
        </>
      }
      {error&&<p className="alert error">{error}</p>}
      {message&&<p className="alert success">{message}</p>}
    </div>
  </main>;
}
