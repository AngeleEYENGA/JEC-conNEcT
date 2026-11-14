"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Collection =
  | "history" | "events" | "publications" | "photos" | "audio"
  | "video" | "testimonies" | "posters" | "meeting_records" | "other";
type RightsStatus = "not_checked" | "permission_granted" | "public_domain" | "restricted" | "refused" | "unknown";
type VisibilityScope = "public" | "members" | "workspace";
type ArchiveFile = {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  description: string | null;
  sort_order: number;
};
type ArchiveItem = {
  id: string;
  collection_key: Collection;
  item_type: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  event_name: string | null;
  event_date_start: string | null;
  event_date_end: string | null;
  record_date: string | null;
  publisher_name: string | null;
  structure_name: string | null;
  country: string | null;
  region: string | null;
  language: string;
  tags: string[];
  source_label: string | null;
  source_reference: string | null;
  source_url: string | null;
  rights_status: RightsStatus;
  rights_holder: string | null;
  rights_notes: string | null;
  visibility_scope: VisibilityScope;
  workspace_id: string | null;
  status: "draft" | "review" | "approved" | "archived";
  created_by: string;
  created_at: string;
  files: ArchiveFile[];
};

const collectionMeta: Record<Collection, { fr: string; en: string; icon: string }> = {
  history: { fr: "Histoire du mouvement", en: "Movement history", icon: "⌛" },
  events: { fr: "Événements", en: "Events", icon: "◷" },
  publications: { fr: "Publications", en: "Publications", icon: "▤" },
  photos: { fr: "Photographies", en: "Photographs", icon: "▧" },
  audio: { fr: "Archives sonores", en: "Audio archive", icon: "♫" },
  video: { fr: "Vidéos", en: "Videos", icon: "▷" },
  testimonies: { fr: "Témoignages", en: "Testimonies", icon: "❝" },
  posters: { fr: "Affiches et visuels", en: "Posters & artwork", icon: "▣" },
  meeting_records: { fr: "Comptes rendus", en: "Meeting records", icon: "☷" },
  other: { fr: "Autres archives", en: "Other archives", icon: "✧" }
};

const collectionOrder: Collection[] = [
  "history","events","publications","photos","audio","video","testimonies","posters","meeting_records","other"
];

const rightsLabels: Record<RightsStatus, { fr: string; en: string }> = {
  not_checked: { fr: "Droits à vérifier", en: "Rights not checked" },
  permission_granted: { fr: "Autorisation obtenue", en: "Permission granted" },
  public_domain: { fr: "Domaine public", en: "Public domain" },
  restricted: { fr: "Diffusion restreinte", en: "Restricted distribution" },
  refused: { fr: "Diffusion refusée", en: "Distribution refused" },
  unknown: { fr: "Droits inconnus", en: "Rights unknown" }
};

function formatDate(value: string | null, en: boolean) {
  if (!value) return "";
  const date = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  return new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", {
    day: "numeric", month: "long", year: "numeric"
  }).format(date);
}

function formatSize(value: number | null, en: boolean) {
  if (!value) return "";
  if (value < 1024 * 1024) return Math.ceil(value / 1024) + " KB";
  return (value / (1024 * 1024)).toFixed(1) + (en ? " MB" : " Mo");
}

function archiveMimeType(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowed: Record<string,string> = {
    pdf:"application/pdf",doc:"application/msword",
    docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt:"application/vnd.ms-powerpoint",
    pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt:"text/plain",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",
    gif:"image/gif",mp3:"audio/mpeg",m4a:"audio/mp4",aac:"audio/aac",wav:"audio/wav",
    ogg:"audio/ogg",mp4:"video/mp4",webm:"video/webm"
  };
  const accepted = new Set(Object.values(allowed));
  if (file.type && accepted.has(file.type)) return file.type;
  return allowed[extension] ?? null;
}

function safeFileName(value: string) {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  return normalized.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-140) || "archive-file";
}

export default function ArchivesPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [membershipVerified, setMembershipVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCollection, setActiveCollection] = useState<"all" | Collection>("all");
  const [search, setSearch] = useState("");
  const [showSubmit, setShowSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [rightsEdits, setRightsEdits] = useState<Record<string, RightsStatus>>({});
  const [scopeEdits, setScopeEdits] = useState<Record<string, "public" | "members">>({});
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [collection, setCollection] = useState<Collection>("history");
  const [description, setDescription] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [recordDate, setRecordDate] = useState("");
  const [publisher, setPublisher] = useState("");
  const [structure, setStructure] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState<"fr" | "en" | "multi" | "und">("fr");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceReference, setSourceReference] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rightsStatus, setRightsStatus] = useState<RightsStatus>("not_checked");
  const [rightsHolder, setRightsHolder] = useState("");
  const [tags, setTags] = useState("");

  const load = useCallback(async () => {
    if (!supabase) {
      setError(en ? "Supabase is not configured." : "Supabase n’est pas configuré.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const [{ data: userData }, { data, error: queryError }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.from("jec_archive_items")
        .select("id,collection_key,item_type,title,subtitle,description,event_name,event_date_start,event_date_end,record_date,publisher_name,structure_name,country,region,language,tags,source_label,source_reference,source_url,rights_status,rights_holder,rights_notes,visibility_scope,workspace_id,status,created_by,created_at,files:jec_archive_files(id,storage_path,file_name,mime_type,file_size,description,sort_order)")
        .order("created_at", { ascending: false })
        .limit(120)
    ]);
    if (queryError) setError(queryError.message);
    setItems((data ?? []) as unknown as ArchiveItem[]);
    const user = userData.user;
    setUserId(user?.id ?? null);
    if (user) {
      const [membershipResult, adminResult] = await Promise.all([
        supabase.from("jec_memberships").select("membership_status").eq("user_id", user.id).maybeSingle(),
        supabase.rpc("is_jec_admin")
      ]);
      setMembershipVerified(membershipResult.data?.membership_status === "verified");
      setIsAdmin(adminResult.data === true);
    } else {
      setMembershipVerified(false);
      setIsAdmin(false);
    }
    setLoading(false);
  }, [supabase, en]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesCollection = activeCollection === "all" || item.collection_key === activeCollection;
      const searchable = [
        item.title,item.subtitle,item.description,item.event_name,item.publisher_name,
        item.structure_name,item.country,item.region,item.source_label,item.source_reference,
        ...(item.tags ?? [])
      ].filter(Boolean).join(" ").toLocaleLowerCase();
      return matchesCollection && (!needle || searchable.includes(needle));
    });
  }, [items, activeCollection, search]);

  const collectionCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const key of collectionOrder) counts[key] = items.filter((item) => item.collection_key === key).length;
    return counts;
  }, [items]);

  function resetForm() {
    setTitle("");setCollection("history");setDescription("");setEventName("");setEventDate("");
    setRecordDate("");setPublisher("");setStructure("");setCountry("");setLanguage("fr");
    setSourceLabel("");setSourceReference("");setSourceUrl("");setRightsStatus("not_checked");
    setRightsHolder("");setTags("");setFiles([]);
  }

  async function submitArchive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId || (!membershipVerified && !isAdmin)) return;
    if (!sourceUrl.trim() && files.length === 0) {
      setError(en ? "Add at least one file or a source URL." : "Ajoute au moins un fichier ou une URL de source.");
      return;
    }
    if (files.some((file) => file.size > 50 * 1024 * 1024)) {
      setError(en ? "Each file must be 50 MB or smaller." : "Chaque fichier doit faire 50 Mo maximum.");
      return;
    }
    if (files.length > 8) {
      setError(en ? "You can attach up to 8 files." : "Tu peux joindre jusqu’à 8 fichiers.");
      return;
    }
    const unsupported = files.find((file) => !archiveMimeType(file));
    if (unsupported) {
      setError((en ? "Unsupported file type: " : "Format de fichier non pris en charge : ") + unsupported.name);
      return;
    }
    setSubmitting(true);setError("");setMessage("");
    let itemId: string | null = null;
    const uploadedPaths: string[] = [];
    try {
      const itemType: Record<Collection,string> = {
        history:"document",events:"other",publications:"newsletter",photos:"photograph",
        audio:"audio_recording",video:"video_recording",testimonies:"testimony",
        posters:"poster",meeting_records:"meeting_record",other:"other"
      };
      const { data: inserted, error: insertError } = await supabase.from("jec_archive_items").insert({
        collection_key:collection,item_type:itemType[collection],title:title.trim(),
        description:description.trim()||null,event_name:eventName.trim()||null,
        event_date_start:eventDate||null,record_date:recordDate||null,
        publisher_name:publisher.trim()||null,structure_name:structure.trim()||null,
        country:country.trim()||null,language,tags:tags.split(",").map((tag)=>tag.trim()).filter(Boolean).slice(0,20),
        source_label:sourceLabel.trim()||null,source_reference:sourceReference.trim()||null,
        source_url:sourceUrl.trim()||null,rights_status:rightsStatus,
        rights_holder:rightsHolder.trim()||null,visibility_scope:"members",
        status:"draft",created_by:userId
      }).select("id").single();
      if (insertError || !inserted) throw insertError ?? new Error("Could not create the archive record.");
      itemId = inserted.id;

      for (const [index, file] of files.entries()) {
        const fileId = crypto.randomUUID();
        const path = itemId + "/" + userId + "/" + fileId + "-" + safeFileName(file.name);
        const contentType = archiveMimeType(file);
        if (!contentType) throw new Error("Unsupported archive file type: " + file.name);
        const { error: uploadError } = await supabase.storage.from("jec-archives").upload(path,file,{
          contentType,upsert:false
        });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        const { error: metadataError } = await supabase.from("jec_archive_files").insert({
          archive_item_id:itemId,storage_path:path,file_name:file.name,mime_type:file.type||null,
          file_size:file.size,sort_order:index,created_by:userId
        });
        if (metadataError) throw metadataError;
      }

      const { error: submitError } = await supabase.from("jec_archive_items").update({
        status:"review",updated_at:new Date().toISOString()
      }).eq("id",itemId);
      if (submitError) throw submitError;

      setMessage(en ? "Archive submitted. It will appear in the catalogue after editorial review." : "Archive transmise. Elle apparaîtra dans le catalogue après validation éditoriale.");
      setShowSubmit(false);resetForm();await load();
    } catch (cause) {
      if (uploadedPaths.length) await supabase.storage.from("jec-archives").remove(uploadedPaths);
      if (itemId) await supabase.from("jec_archive_items").delete().eq("id",itemId);
      setError(cause instanceof Error ? cause.message : (en ? "Unable to submit the archive." : "Impossible de transmettre cette archive."));
    } finally {
      setSubmitting(false);
    }
  }

  async function openArchiveFile(file: ArchiveFile) {
    if (!supabase) return;
    const { data, error: signedError } = await supabase.storage.from("jec-archives").createSignedUrl(file.storage_path,300);
    if (signedError) setError(signedError.message);
    else if (data?.signedUrl) window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  async function approveItem(item: ArchiveItem) {
    if (!supabase || !userId || !isAdmin) return;
    const nextRights = rightsEdits[item.id] ?? item.rights_status;
    const nextScope = scopeEdits[item.id] ?? "members";
    if (nextScope === "public" && nextRights !== "permission_granted" && nextRights !== "public_domain") {
      setError(en
        ? "A public archive must have documented permission or public-domain status."
        : "Une archive publique doit disposer d’une autorisation documentée ou relever du domaine public.");
      return;
    }
    setPublishingId(item.id);setError("");setMessage("");
    const { error: updateError } = await supabase.from("jec_archive_items").update({
      status:"approved",visibility_scope:nextScope,rights_status:nextRights,
      approved_by:userId,approved_at:new Date().toISOString(),updated_at:new Date().toISOString()
    }).eq("id",item.id);
    if (updateError) setError(updateError.message);
    else { setMessage(en ? "Archive approved and added to the catalogue." : "Archive validée et ajoutée au catalogue.");await load(); }
    setPublishingId(null);
  }

  async function archiveItem(item: ArchiveItem) {
    if (!supabase || !isAdmin) return;
    setPublishingId(item.id);setError("");setMessage("");
    const { error: updateError } = await supabase.from("jec_archive_items").update({
      status:"archived",updated_at:new Date().toISOString()
    }).eq("id",item.id);
    if (updateError) setError(updateError.message);
    else { setMessage(en ? "Archive withdrawn from public display." : "Archive retirée de l’affichage du catalogue.");await load(); }
    setPublishingId(null);
  }

  const canSubmit = Boolean(userId && (membershipVerified || isAdmin));

  return (
    <main className="archives-page">
      <header className="archives-header">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link>
        <div className="archives-header-actions">
          <LanguageSwitcher/>
          <Link href="/" className="archives-back-link">{en ? "Back to portal" : "Retour au portail"}</Link>
        </div>
      </header>

      <section className="archives-hero">
        <div className="archives-hero-copy">
          <p className="eyebrow light">{en ? "JEC DIGITAL HERITAGE" : "PATRIMOINE NUMÉRIQUE JEC"}</p>
          <h1>{en ? "Our memory, preserved and shared." : "Notre mémoire, à préserver et à transmettre."}</h1>
          <p>{en
            ? "A documentary collection for the history, people, activities and cultural heritage of the Young Christian Students."
            : "Un espace documentaire pour l’histoire, les personnes, les activités et le patrimoine culturel de la Jeunesse Étudiante Chrétienne."}</p>
          <div className="archives-hero-stats">
            <span><strong>{items.filter((item)=>item.status==="approved").length}</strong>{en ? "published records" : "archives publiées"}</span>
            <span><strong>{collectionOrder.length}</strong>{en ? "collections" : "collections"}</span>
            <span><strong>{items.reduce((sum,item)=>sum+(item.files?.length??0),0)}</strong>{en ? "digital files" : "fichiers numériques"}</span>
          </div>
        </div>
        <div className="archives-hero-art" aria-hidden="true">
          <div className="archive-art-orbit orbit-a"/><div className="archive-art-orbit orbit-b"/>
          <div className="archive-art-card archive-art-back"><span>1929</span><i>✧</i></div>
          <div className="archive-art-card archive-art-front"><span>JEC</span><b>✝</b><small>MEMORY · HISTORY · ACTION</small></div>
          <div className="archive-art-dot"/>
        </div>
      </section>

      <section className="archives-toolbar">
        <div>
          <p className="eyebrow">{en ? "DOCUMENTARY COLLECTION" : "COLLECTION DOCUMENTAIRE"}</p>
          <h2>{en ? "Explore the archives" : "Explorer les archives"}</h2>
        </div>
        <div className="archives-toolbar-actions">
          <label className="archives-search"><span>⌕</span><input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder={en ? "Search title, year, structure…" : "Rechercher un titre, une année, une structure…"} /></label>
          {canSubmit
            ? <button className="primary-button" onClick={()=>{setShowSubmit(!showSubmit);setError("");}}>{showSubmit?(en?"Close form":"Fermer le formulaire"):(en?"Contribute an archive":"Proposer une archive")} <span>＋</span></button>
            : <Link className="primary-button" href="/login">{en ? "Sign in to contribute" : "Se connecter pour contribuer"}</Link>}
        </div>
      </section>

      {message && <p className="archives-success">{message}</p>}
      {error && <p className="alert error">{error}</p>}

      {showSubmit && canSubmit && (
        <section className="archive-submit-card">
          <div className="archive-submit-heading"><div><p className="eyebrow">{en ? "CONTRIBUTE TO THE HERITAGE" : "CONTRIBUER AU PATRIMOINE"}</p><h2>{en ? "Submit an archive" : "Transmettre une archive"}</h2></div><span>{en ? "Editorial review required" : "Validation éditoriale requise"}</span></div>
          <p className="archive-form-intro">{en
            ? "Add what you know about the document: where it came from, what period it relates to, who produced it and whether it can be shared. Your submission remains private until reviewed."
            : "Renseigne la provenance du document, la période concernée, son éditeur et les conditions de diffusion. Ta proposition reste privée jusqu’à sa validation."}</p>
          <form className="archive-submit-form" onSubmit={submitArchive}>
            <label className="archive-form-wide">{en ? "Title *" : "Titre *"}<input required minLength={3} maxLength={220} value={title} onChange={(event)=>setTitle(event.target.value)} placeholder={en ? "e.g. National gathering programme, 1987" : "Ex. Programme d’une rencontre nationale, 1987"}/></label>
            <label>{en ? "Collection" : "Collection"}<select value={collection} onChange={(event)=>setCollection(event.target.value as Collection)}>{collectionOrder.map((key)=><option key={key} value={key}>{en?collectionMeta[key].en:collectionMeta[key].fr}</option>)}</select></label>
            <label>{en ? "Language" : "Langue"}<select value={language} onChange={(event)=>setLanguage(event.target.value as typeof language)}><option value="fr">Français</option><option value="en">English</option><option value="multi">{en?"Multilingual":"Multilingue"}</option><option value="und">{en?"Unknown":"Non renseignée"}</option></select></label>
            <label className="archive-form-wide">{en ? "Description / historical context" : "Description / contexte historique"}<textarea rows={3} value={description} onChange={(event)=>setDescription(event.target.value)} placeholder={en ? "What does this archive show? Who, what, where, why?" : "Que montre cette archive ? Qui, quoi, où, pourquoi ?"} /></label>
            <label>{en ? "Event or period" : "Événement ou période"}<input value={eventName} onChange={(event)=>setEventName(event.target.value)} placeholder={en ? "e.g. National congress" : "Ex. Congrès national"}/></label>
            <label>{en ? "Event date" : "Date de l’événement"}<input type="date" value={eventDate} onChange={(event)=>setEventDate(event.target.value)}/></label>
            <label>{en ? "Document date" : "Date du document"}<input type="date" value={recordDate} onChange={(event)=>setRecordDate(event.target.value)}/></label>
            <label>{en ? "Publisher / authoring organisation" : "Éditeur / organisation productrice"}<input value={publisher} onChange={(event)=>setPublisher(event.target.value)}/></label>
            <label>{en ? "JEC structure" : "Structure JEC concernée"}<input value={structure} onChange={(event)=>setStructure(event.target.value)} placeholder={en ? "National movement, federation…" : "Mouvement national, fédération…"}/></label>
            <label>{en ? "Country / territory" : "Pays / territoire"}<input value={country} onChange={(event)=>setCountry(event.target.value)}/></label>
            <label>{en ? "Source label" : "Référence de la source"}<input value={sourceLabel} onChange={(event)=>setSourceLabel(event.target.value)} placeholder={en ? "Document, archive box, website…" : "Document, carton d’archives, site…"}/></label>
            <label>{en ? "Reference / shelf mark" : "Cote / référence d’archive"}<input value={sourceReference} onChange={(event)=>setSourceReference(event.target.value)}/></label>
            <label className="archive-form-wide">{en ? "Source URL" : "URL de la source"}<input type="url" value={sourceUrl} onChange={(event)=>setSourceUrl(event.target.value)} placeholder="https://…"/></label>
            <label>{en ? "Reuse rights" : "Droits de réutilisation"}<select value={rightsStatus} onChange={(event)=>setRightsStatus(event.target.value as RightsStatus)}>{Object.entries(rightsLabels).map(([value,label])=><option key={value} value={value}>{en?label.en:label.fr}</option>)}</select></label>
            <label>{en ? "Rights holder (if known)" : "Titulaire des droits (si connu)"}<input value={rightsHolder} onChange={(event)=>setRightsHolder(event.target.value)}/></label>
            <label className="archive-form-wide archive-file-field">{en ? "Attach files (up to 8 · 50 MB each)" : "Joindre des fichiers (8 maximum · 50 Mo chacun)"}<input type="file" multiple onChange={(event)=>setFiles(Array.from(event.target.files??[]).slice(0,8))} accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp,.gif,.mp3,.m4a,.aac,.wav,.ogg,.mp4,.webm"/><small>{files.length ? files.map((file)=>file.name).join(" · ") : (en ? "PDF, Word, PowerPoint, photos, audio and video." : "PDF, Word, PowerPoint, photos, audio et vidéo.")}</small></label>
            <label className="archive-form-wide">{en ? "Keywords (comma-separated)" : "Mots-clés (séparés par des virgules)"}<input value={tags} onChange={(event)=>setTags(event.target.value)} placeholder={en ? "history, congress, 1987…" : "histoire, congrès, 1987…"}/></label>
            <div className="archive-form-notice">{en ? "Your proposal will be visible only to you and JEC administrators until approved. Public distribution is blocked until usage rights are confirmed." : "Ta proposition restera visible uniquement par toi et les administrateurs JEC jusqu’à validation. La publication publique est bloquée tant que les droits de diffusion ne sont pas confirmés."}</div>
            <div className="archive-form-actions"><small>{en ? "Fields marked * are required." : "Les champs marqués * sont obligatoires."}</small><button className="primary-button" disabled={submitting}>{submitting?(en?"Submitting…":"Transmission…"):(en?"Submit for review":"Soumettre pour validation")} →</button></div>
          </form>
        </section>
      )}

      <div className="archives-content-grid">
        <aside className="archives-filters">
          <p className="eyebrow">{en ? "COLLECTIONS" : "COLLECTIONS"}</p>
          <button className={activeCollection==="all"?"active":""} onClick={()=>setActiveCollection("all")}><span>✧</span>{en?"All collections":"Toutes les collections"}<b>{collectionCounts.all??0}</b></button>
          {collectionOrder.map((key)=><button key={key} className={activeCollection===key?"active":""} onClick={()=>setActiveCollection(key)}><span>{collectionMeta[key].icon}</span>{en?collectionMeta[key].en:collectionMeta[key].fr}<b>{collectionCounts[key]??0}</b></button>)}
          <div className="archives-rights-note"><strong>{en ? "A living archive" : "Une mémoire vivante"}</strong><p>{en ? "Every record needs a source, a date and verified reuse rights before public distribution." : "Chaque fiche doit avoir une provenance, une datation et des droits de réutilisation vérifiés avant diffusion publique."}</p></div>
        </aside>

        <section className="archives-results">
          <div className="archives-results-heading"><div><p className="eyebrow">{en ? "CATALOGUE" : "CATALOGUE"}</p><h2>{en ? "Documentary records" : "Fonds documentaires"}</h2></div><span>{visibleItems.length} {en ? "records" : "fiches"}</span></div>
          {loading ? <p className="muted">{en ? "Loading archive catalogue…" : "Chargement du catalogue…"}</p>
            : visibleItems.length ? visibleItems.map((item)=>(
              <article className="archive-record-card" key={item.id}>
                <div className="archive-record-icon">{collectionMeta[item.collection_key]?.icon??"✧"}</div>
                <div className="archive-record-main">
                  <div className="archive-record-meta">
                    <span>{en?collectionMeta[item.collection_key]?.en:collectionMeta[item.collection_key]?.fr}</span>
                    {item.status!=="approved"&&<b className={"archive-status "+item.status}>{item.status==="review"?(en?"Awaiting review":"À valider"):(item.status==="draft"?(en?"Draft":"Brouillon"):(en?"Archived":"Archivée"))}</b>}
                    {item.visibility_scope==="public"&&item.status==="approved"&&<b className="archive-public-badge">{en?"PUBLIC":"PUBLIC"}</b>}
                  </div>
                  <h3>{item.title}</h3>
                  {item.description&&<p>{item.description}</p>}
                  <div className="archive-record-details">
                    {item.event_name&&<span>{item.event_name}</span>}
                    {item.event_date_start&&<span>{formatDate(item.event_date_start,en)}</span>}
                    {item.record_date&&<span>{en?"Document":"Document"} · {formatDate(item.record_date,en)}</span>}
                    {item.publisher_name&&<span>{item.publisher_name}</span>}
                    {item.structure_name&&<span>{item.structure_name}</span>}
                    {item.country&&<span>{item.country}</span>}
                  </div>
                  {(item.source_label||item.source_reference)&&<div className="archive-provenance"><strong>{en?"Provenance":"Provenance"}</strong><span>{[item.source_label,item.source_reference].filter(Boolean).join(" · ")}</span></div>}
                  {item.source_url&&<a className="archive-source-link" href={item.source_url} target="_blank" rel="noreferrer">{en?"Open original source":"Consulter la source d’origine"} ↗</a>}
                  {item.tags?.length>0&&<div className="archive-tags">{item.tags.map((tag)=><span key={tag}>{tag}</span>)}</div>}
                  {item.files?.length>0&&<div className="archive-attachments"><strong>{en?"Digital attachments":"Pièces numériques"}</strong>{item.files.slice().sort((a,b)=>a.sort_order-b.sort_order).map((file)=><button type="button" key={file.id} onClick={()=>void openArchiveFile(file)}><span>▤</span>{file.file_name}<small>{formatSize(file.file_size,en)}</small>↗</button>)}</div>}
                  {isAdmin&&item.status==="review"&&<div className="archive-review-panel">
                    <div className="archive-review-fields">
                      <label>{en?"Rights verification":"Vérification des droits"}<select value={rightsEdits[item.id]??item.rights_status} onChange={(event)=>setRightsEdits((current)=>({...current,[item.id]:event.target.value as RightsStatus}))}>{Object.entries(rightsLabels).map(([value,label])=><option key={value} value={value}>{en?label.en:label.fr}</option>)}</select></label>
                      <label>{en?"Publication scope":"Périmètre de publication"}<select value={scopeEdits[item.id]??"members"} onChange={(event)=>setScopeEdits((current)=>({...current,[item.id]:event.target.value as "public"|"members"}))}><option value="members">{en?"Verified JEC members":"Membres JEC vérifiés"}</option><option value="public">{en?"Public website":"Site public"}</option></select></label>
                    </div>
                    <div className="archive-review-actions"><button className="primary-button" disabled={publishingId===item.id} onClick={()=>void approveItem(item)}>{en?"Approve record":"Valider la fiche"} →</button><button className="quiet-button" disabled={publishingId===item.id} onClick={()=>void archiveItem(item)}>{en?"Archive / reject":"Archiver / refuser"}</button></div>
                  </div>}
                </div>
              </article>
            ))
            : <div className="archives-empty-state"><div>▤</div><h3>{en?"The collection is being built.":"La collection est en cours de constitution."}</h3><p>{en
              ? "No archive record matches this search yet. We are keeping the catalogue empty rather than inventing documents, dates or photographs."
              : "Aucune fiche ne correspond à cette recherche pour le moment. Le catalogue reste volontairement vide plutôt que d’inventer des documents, des dates ou des photographies."}</p>{canSubmit&&<button className="primary-button" onClick={()=>setShowSubmit(true)}>{en?"Submit the first archive":"Transmettre la première archive"} ＋</button>}</div>}
        </section>
      </div>

      <footer className="archives-footer">
        <span>{en ? "JEC-conNEcT · Digital heritage" : "JEC-conNEcT · Patrimoine numérique"}</span>
        <span>{en ? "Source traceability · Rights · Editorial review" : "Traçabilité des sources · Droits · Validation éditoriale"}</span>
      </footer>
    </main>
  );
}
