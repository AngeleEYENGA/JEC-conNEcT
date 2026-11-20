"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ContentType = "news" | "event";
type PublicContent = {
  id: string; content_type: ContentType; title: string; title_en: string | null;
  summary: string; summary_en: string | null; category: string | null; category_en: string | null;
  content_date: string; date_label: string | null; date_label_en: string | null;
  starts_on: string | null; ends_on: string | null; source_name: string;
  source_label: string; source_label_en: string | null; source_kind: string;
  source_url: string | null; image_url: string | null; detail_path: string | null;
  is_published: boolean; published_at: string | null; created_at: string;
};
type ContentForm = {
  content_type: ContentType; title: string; title_en: string; summary: string; summary_en: string;
  category: string; category_en: string; content_date: string; date_label: string; date_label_en: string;
  starts_on: string; ends_on: string; source_name: string; source_label: string; source_label_en: string;
  source_kind: string; source_url: string; image_url: string; detail_path: string;
};
function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
function emptyForm(): ContentForm {
  return {
    content_type: "news", title: "", title_en: "", summary: "", summary_en: "",
    category: "", category_en: "", content_date: localToday(), date_label: "", date_label_en: "",
    starts_on: "", ends_on: "", source_name: "", source_label: "", source_label_en: "",
    source_kind: "article", source_url: "", image_url: "", detail_path: ""
  };
}
function inputDate(value: string | null) { return value ? value.slice(0, 10) : ""; }

export default function PublicContentAdminPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<PublicContent[]>([]);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(en ? "Supabase is not configured." : "Supabase n’est pas configuré.");
      setLoading(false);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login?next=%2Fgestion%2Fcontenus"; return; }
    const { data: admin, error: adminError } = await supabase.rpc("is_jec_admin");
    if (adminError || admin !== true) { setIsAdmin(false); setLoading(false); return; }
    setIsAdmin(true);
    const { data, error: queryError } = await supabase.from("jec_public_content").select("*").order("content_date", { ascending: false });
    if (queryError) setError(queryError.message);
    else setItems((data ?? []) as PublicContent[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);
  function update<K extends keyof ContentForm>(key: K, value: ContentForm[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }
  function resetForm() { setEditingId(null); setForm(emptyForm()); }

  function editItem(item: PublicContent) {
    setEditingId(item.id);
    setForm({
      content_type: item.content_type, title: item.title, title_en: item.title_en ?? "",
      summary: item.summary, summary_en: item.summary_en ?? "", category: item.category ?? "",
      category_en: item.category_en ?? "", content_date: inputDate(item.content_date),
      date_label: item.date_label ?? "", date_label_en: item.date_label_en ?? "",
      starts_on: inputDate(item.starts_on), ends_on: inputDate(item.ends_on),
      source_name: item.source_name, source_label: item.source_label, source_label_en: item.source_label_en ?? "",
      source_kind: item.source_kind, source_url: item.source_url ?? "", image_url: item.image_url ?? "",
      detail_path: item.detail_path ?? ""
    });
    setError(""); setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setError(""); setMessage("");
    const contentDate = form.content_type === "event" ? (form.starts_on || form.content_date) : form.content_date;
    if (!contentDate) { setError(en ? "A reference date is required." : "Une date de référence est obligatoire."); return; }
    if (form.content_type === "event" && !form.starts_on) { setError(en ? "An event start date is required." : "La date de début de l’événement est obligatoire."); return; }
    if (form.ends_on && form.starts_on && form.ends_on < form.starts_on) { setError(en ? "The end date must not be earlier than the start date." : "La date de fin doit être postérieure à la date de début."); return; }
    if (form.source_url && !/^https?:\/\//i.test(form.source_url.trim())) { setError(en ? "The source URL must start with https:// or http://." : "L’URL de la source doit commencer par https:// ou http://."); return; }
    if (form.detail_path && (!form.detail_path.startsWith("/") || form.detail_path.startsWith("//"))) { setError(en ? "The internal link must be a local path beginning with /." : "Le lien interne doit être un chemin local commençant par /."); return; }
    setSaving(true);
    try {
      const payload = {
        content_type: form.content_type, title: form.title.trim(), title_en: form.title_en.trim() || null,
        summary: form.summary.trim(), summary_en: form.summary_en.trim() || null,
        category: form.category.trim() || null, category_en: form.category_en.trim() || null,
        content_date: contentDate, date_label: form.date_label.trim() || null,
        date_label_en: form.date_label_en.trim() || null,
        starts_on: form.content_type === "event" ? form.starts_on : null,
        ends_on: form.content_type === "event" ? (form.ends_on || null) : null,
        source_name: form.source_name.trim(), source_label: form.source_label.trim(),
        source_label_en: form.source_label_en.trim() || null, source_kind: form.source_kind,
        source_url: form.source_url.trim() || null, image_url: form.image_url.trim() || null,
        detail_path: form.detail_path.trim() || null, updated_at: new Date().toISOString()
      };
      if (editingId) {
        const { error: updateError } = await supabase.from("jec_public_content").update(payload).eq("id", editingId);
        if (updateError) throw updateError;
        setMessage(en ? "Content updated." : "Contenu mis à jour.");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error: insertError } = await supabase.from("jec_public_content").insert({ ...payload, is_published: false, created_by: user?.id ?? null });
        if (insertError) throw insertError;
        setMessage(en ? "Draft saved. It is not visible publicly yet." : "Brouillon enregistré. Il n’est pas encore visible publiquement.");
      }
      resetForm();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (en ? "Unable to save this content." : "Impossible d’enregistrer ce contenu."));
    } finally { setSaving(false); }
  }

  async function togglePublished(item: PublicContent) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const next = !item.is_published;
    if (next && (!item.source_name.trim() || !item.source_label.trim())) {
      setError(en ? "Add a source name and source label before publishing." : "Ajoute le nom et le libellé de la source avant de publier.");
      return;
    }
    setBusyId(item.id); setError(""); setMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: updateError } = await supabase.from("jec_public_content").update({
        is_published: next,
        published_at: next ? (item.published_at ?? new Date().toISOString()) : item.published_at,
        published_by: next ? (user?.id ?? null) : null,
        updated_at: new Date().toISOString()
      }).eq("id", item.id);
      if (updateError) throw updateError;
      setMessage(next ? (en ? "Content published on the public portal." : "Contenu publié sur le portail public.") : (en ? "Content unpublished." : "Contenu dépublié."));
      await load();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : (en ? "Unable to change publication status." : "Impossible de modifier le statut de publication."));
    } finally { setBusyId(null); }
  }

  async function deleteItem(item: PublicContent) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const prompt = en ? "Permanently delete “" + item.title + "”?" : "Supprimer définitivement « " + item.title + " » ?";
    if (!window.confirm(prompt)) return;
    setBusyId(item.id); setError(""); setMessage("");
    const { error: deleteError } = await supabase.from("jec_public_content").delete().eq("id", item.id);
    if (deleteError) setError(deleteError.message);
    else {
      setMessage(en ? "Content deleted." : "Contenu supprimé.");
      if (editingId === item.id) resetForm();
      await load();
    }
    setBusyId(null);
  }

  const newsItems = items.filter(item => item.content_type === "news");
  const eventItems = items.filter(item => item.content_type === "event");

  return <main className="admin-page">
    <header className="account-header">
      <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✝</i></span><span>conNEcT</span></Link>
      <div><LanguageSwitcher/><Link href="/gestion" className="back-link-inline">{en ? "Back to administration" : "Retour à l’administration"}</Link></div>
    </header>
    <div className="admin-content">
      <p className="eyebrow">{en ? "PUBLIC PORTAL" : "PORTAIL PUBLIC"}</p>
      <h1>{en ? "Manage news and events" : "Gérer les actualités et les événements"}</h1>
      <p className="public-content-intro">{en
        ? "Create drafts, add source details, review translations and publish only content checked by the JEC editorial team. Published entries appear on the public portal."
        : "Crée des brouillons, renseigne les sources, vérifie les traductions et ne publie que les contenus contrôlés par l’équipe éditoriale JEC. Les éléments publiés apparaissent sur le portail public."}</p>
      {loading ? <p className="muted">{en ? "Checking permissions…" : "Vérification des permissions…"}</p>
        : !isAdmin ? <section className="admin-locked"><h2>{en ? "Administrator access required" : "Accès administrateur requis"}</h2><p>{en ? "Only a JEC-conNEcT administrator can manage public content." : "Seul un administrateur JEC-conNEcT peut gérer les contenus publics."}</p></section>
        : <>
          <section className="admin-section" id="public-content-editor">
            <div className="directory-section-heading"><div><p className="eyebrow">{en ? "EDITORIAL WORKSPACE" : "ESPACE ÉDITORIAL"}</p><h2>{editingId ? (en ? "Edit content" : "Modifier le contenu") : (en ? "Create a content draft" : "Créer un brouillon")}</h2></div><span>{editingId ? (en ? "Editing" : "Modification") : (en ? "Draft" : "Brouillon")}</span></div>
            <form className="account-form public-content-form" onSubmit={saveContent}>
              <label>{en ? "Content type" : "Type de contenu"}
                <select value={form.content_type} onChange={event => update("content_type", event.target.value as ContentType)}>
                  <option value="news">{en ? "News article" : "Actualité"}</option><option value="event">{en ? "Public event" : "Événement public"}</option>
                </select>
              </label>
              <div className="public-content-two-cols">
                <label>{en ? "Title (French)" : "Titre (français)"}<input required minLength={3} maxLength={200} value={form.title} onChange={event => update("title", event.target.value)}/></label>
                <label>{en ? "Title (English)" : "Titre (anglais)"}<input maxLength={200} value={form.title_en} onChange={event => update("title_en", event.target.value)}/></label>
              </div>
              <div className="public-content-two-cols">
                <label>{en ? "Summary (French)" : "Résumé (français)"}<textarea required minLength={5} maxLength={6000} rows={4} value={form.summary} onChange={event => update("summary", event.target.value)}/></label>
                <label>{en ? "Summary (English)" : "Résumé (anglais)"}<textarea maxLength={6000} rows={4} value={form.summary_en} onChange={event => update("summary_en", event.target.value)}/></label>
              </div>
              <div className="public-content-two-cols">
                <label>{en ? "Category (French)" : "Catégorie (français)"}<input maxLength={100} value={form.category} onChange={event => update("category", event.target.value)}/></label>
                <label>{en ? "Category (English)" : "Catégorie (anglais)"}<input maxLength={100} value={form.category_en} onChange={event => update("category_en", event.target.value)}/></label>
              </div>
              <div className="public-content-two-cols">
                <label>{form.content_type === "event" ? (en ? "Event start date" : "Date de début") : (en ? "Source publication date" : "Date de publication / référence")}
                  <input type="date" required value={form.content_type === "event" ? form.starts_on : form.content_date} onChange={event => {
                    if (form.content_type === "event") { update("starts_on", event.target.value); update("content_date", event.target.value); }
                    else update("content_date", event.target.value);
                  }}/>
                </label>
                {form.content_type === "event"
                  ? <label>{en ? "Event end date (optional)" : "Date de fin (facultative)"}<input type="date" min={form.starts_on || undefined} value={form.ends_on} onChange={event => update("ends_on", event.target.value)}/></label>
                  : <label>{en ? "Display date in French (optional)" : "Libellé de date affiché (facultatif)"}<input maxLength={100} placeholder="Ex. 26 juillet – 2 août 2026" value={form.date_label} onChange={event => update("date_label", event.target.value)}/></label>}
              </div>
              {form.content_type === "news" && <label>{en ? "Display date in English (optional)" : "Libellé de date en anglais (facultatif)"}<input maxLength={100} placeholder="e.g. 26 July – 2 August 2026" value={form.date_label_en} onChange={event => update("date_label_en", event.target.value)}/></label>}
              <div className="public-content-two-cols">
                <label>{en ? "Source / publisher name" : "Nom de la source / publication"}<input required minLength={2} maxLength={200} value={form.source_name} onChange={event => update("source_name", event.target.value)}/></label>
                <label>{en ? "Source type" : "Type de source"}
                  <select value={form.source_kind} onChange={event => update("source_kind", event.target.value)}>
                    <option value="article">Article</option><option value="booklet">{en ? "Booklet / document" : "Livret / document"}</option>
                    <option value="official_notice">{en ? "Official notice" : "Communication officielle"}</option><option value="event_page">{en ? "Event website" : "Site de l’événement"}</option>
                    <option value="partner_release">{en ? "Partner publication" : "Publication partenaire"}</option><option value="other">{en ? "Other" : "Autre"}</option>
                  </select>
                </label>
              </div>
              <div className="public-content-two-cols">
                <label>{en ? "Source label (French)" : "Libellé de source (français)"}<input required minLength={2} maxLength={300} value={form.source_label} onChange={event => update("source_label", event.target.value)}/></label>
                <label>{en ? "Source label (English)" : "Libellé de source (anglais)"}<input maxLength={300} value={form.source_label_en} onChange={event => update("source_label_en", event.target.value)}/></label>
              </div>
              <label>{en ? "Source URL (optional)" : "URL de la source (facultative)"}<input type="url" placeholder="https://" value={form.source_url} onChange={event => update("source_url", event.target.value)}/></label>
              <div className="public-content-two-cols">
                <label>{en ? "Illustration URL or local path (optional)" : "URL ou chemin d’illustration (facultatif)"}<input placeholder="/images/…" value={form.image_url} onChange={event => update("image_url", event.target.value)}/></label>
                <label>{en ? "Internal detail page (optional)" : "Page de détail interne (facultative)"}<input placeholder="/actualites/…" value={form.detail_path} onChange={event => update("detail_path", event.target.value)}/></label>
              </div>
              <div className="public-content-form-actions">
                <button className="primary-button" disabled={saving}>{saving ? (en ? "Saving…" : "Enregistrement…") : editingId ? (en ? "Save changes" : "Enregistrer les modifications") : (en ? "Save as draft" : "Enregistrer le brouillon")}</button>
                {editingId && <button type="button" className="quiet-button" onClick={resetForm}>{en ? "Cancel editing" : "Annuler la modification"}</button>}
              </div>
            </form>
          </section>
          <section className="admin-section">
            <div className="directory-section-heading"><div><p className="eyebrow">{en ? "NEWS" : "ACTUALITÉS"}</p><h2>{en ? "News articles" : "Articles d’actualité"}</h2></div><span>{newsItems.length} {en ? "items" : "contenus"}</span></div>
            {newsItems.length ? newsItems.map(item => <article className="public-content-item" key={item.id}>
              <div className="public-content-item-copy"><div className="public-content-item-title"><strong>{item.title}</strong><span className={item.is_published ? "public-content-status published" : "public-content-status draft"}>{item.is_published ? (en ? "Published" : "Publié") : (en ? "Draft" : "Brouillon")}</span></div><small>{item.source_name} · {inputDate(item.content_date)}{item.category ? " · " + item.category : ""}</small><p>{item.summary}</p></div>
              <div className="public-content-item-actions"><button className="secondary-outline-button" onClick={() => editItem(item)}>{en ? "Edit" : "Modifier"}</button><button className="primary-button" disabled={busyId === item.id} onClick={() => void togglePublished(item)}>{item.is_published ? (en ? "Unpublish" : "Dépublier") : (en ? "Publish" : "Publier")}</button><button className="danger-outline-button" disabled={busyId === item.id} onClick={() => void deleteItem(item)}>{en ? "Delete" : "Supprimer"}</button></div>
            </article>) : <div className="directory-empty compact"><p>{en ? "No news articles yet." : "Aucune actualité enregistrée."}</p></div>}
          </section>
          <section className="admin-section">
            <div className="directory-section-heading"><div><p className="eyebrow">{en ? "PUBLIC CALENDAR" : "AGENDA PUBLIC"}</p><h2>{en ? "Events" : "Événements"}</h2></div><span>{eventItems.length} {en ? "items" : "contenus"}</span></div>
            {eventItems.length ? eventItems.map(item => <article className="public-content-item" key={item.id}>
              <div className="public-content-item-copy"><div className="public-content-item-title"><strong>{item.title}</strong><span className={item.is_published ? "public-content-status published" : "public-content-status draft"}>{item.is_published ? (en ? "Published" : "Publié") : (en ? "Draft" : "Brouillon")}</span></div><small>{item.source_name} · {inputDate(item.starts_on)}{item.ends_on ? " – " + inputDate(item.ends_on) : ""}</small><p>{item.summary}</p></div>
              <div className="public-content-item-actions"><button className="secondary-outline-button" onClick={() => editItem(item)}>{en ? "Edit" : "Modifier"}</button><button className="primary-button" disabled={busyId === item.id} onClick={() => void togglePublished(item)}>{item.is_published ? (en ? "Unpublish" : "Dépublier") : (en ? "Publish" : "Publier")}</button><button className="danger-outline-button" disabled={busyId === item.id} onClick={() => void deleteItem(item)}>{en ? "Delete" : "Supprimer"}</button></div>
            </article>) : <div className="directory-empty compact"><p>{en ? "No events yet." : "Aucun événement enregistré."}</p></div>}
          </section>
        </>}
      {error && <p className="alert error">{error}</p>}{message && <p className="alert success">{message}</p>}
    </div>
  </main>;
}
