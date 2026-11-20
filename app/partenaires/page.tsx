"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type FollowUpPreview = { id:string; partner_id:string; title:string; due_at:string; status:string; priority:string; assigned_to:string|null };
type OpportunityPreview = { id:string; partner_id:string|null; title:string; opportunity_type:string; opportunity_status:string; deadline:string|null; expected_amount:number|null; currency_code:string|null; source_url:string|null };

type Partner = {
  id: string;
  display_name: string;
  legal_name: string;
  slug: string;
  partner_types: string[];
  geographic_scope: string;
  country_name: string | null;
  region: string | null;
  city: string | null;
  website_url: string | null;
  public_summary: string | null;
  relationship_status: string;
  verification_status: string;
  evidence_url: string | null;
  evidence_label: string | null;
  evidence_summary: string | null;
};

const partnerTypeLabels: Record<string, { fr: string; en: string }> = {
  association: { fr: "Association", en: "Association" },
  ngo: { fr: "ONG", en: "NGO" },
  faith_based: { fr: "Organisation ecclésiale", en: "Faith-based organisation" },
  youth_movement: { fr: "Mouvement de jeunesse", en: "Youth movement" },
  international_network: { fr: "Réseau international", en: "International network" },
  public_institution: { fr: "Institution publique", en: "Public institution" },
  educational: { fr: "Éducation / recherche", en: "Education / research" },
  foundation: { fr: "Fondation", en: "Foundation" },
  company: { fr: "Entreprise", en: "Company" },
  funding_programme: { fr: "Dispositif de financement", en: "Funding programme" },
  public_programme: { fr: "Programme public", en: "Public programme" },
  media: { fr: "Média", en: "Media" },
  donor: { fr: "Mécène / donateur", en: "Donor" },
  other: { fr: "Autre", en: "Other" }
};

const scopeLabels: Record<string, { fr: string; en: string }> = {
  local: { fr: "Local", en: "Local" },
  regional: { fr: "Régional", en: "Regional" },
  national: { fr: "National", en: "National" },
  european: { fr: "Européen", en: "European" },
  international: { fr: "International", en: "International" },
  multilateral: { fr: "Multilatéral", en: "Multilateral" }
};

const relationshipLabels: Record<string, { fr: string; en: string }> = {
  prospect: { fr: "Piste à étudier", en: "Prospect" },
  active: { fr: "Partenariat actif", en: "Active partnership" },
  paused: { fr: "En pause", en: "Paused" },
  ended: { fr: "Terminé", en: "Ended" },
  historic: { fr: "Lien historique", en: "Historic relationship" },
  network_membership: { fr: "Appartenance à un réseau", en: "Network membership" },
  project_collaboration: { fr: "Coopération sur un projet", en: "Project collaboration" },
  project_support: { fr: "Soutien à un projet", en: "Project support" },
  participation: { fr: "Participation à une instance", en: "Participation in a body" },
  to_confirm: { fr: "Statut à confirmer", en: "Status to confirm" }
};

function slugify(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function PartnersPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [rows, setRows] = useState<Partner[]>([]);
  const [followUpPreview, setFollowUpPreview] = useState<FollowUpPreview[]>([]);
  const [opportunityPreview, setOpportunityPreview] = useState<OpportunityPreview[]>([]);
  const [showPrivateOverview, setShowPrivateOverview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [canViewDirectory, setCanViewDirectory] = useState(false);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [partnerType, setPartnerType] = useState("association");
  const [scope, setScope] = useState("national");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [website, setWebsite] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceLabel, setEvidenceLabel] = useState("");
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(en ? "Supabase is not configured." : "Supabase n'est pas configuré.");
      setLoading(false);
      return;
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      window.location.href = "/login";
      return;
    }
    setUserId(user.id);
    const [adminResult, accessResult, membershipResult] = await Promise.all([
      supabase.rpc("is_jec_admin"),
      supabase.from("jec_partner_access").select("partner_id,access_scope,access_role").eq("user_id", user.id),
      supabase.from("jec_memberships").select("membership_status").eq("user_id", user.id).maybeSingle()
    ]);
    const admin = adminResult.data === true;
    const accesses = accessResult.data ?? [];
    const globalManager = accesses.some((item: { partner_id: string | null; access_role: string }) =>
      item.partner_id === null && ["manager", "editor"].includes(item.access_role)
    );
    const partnerAccess = accesses.length > 0;
    const privateAccess = admin || accesses.some((item: { access_role: string }) => ["manager","editor","viewer"].includes(item.access_role));
    const verifiedMember = membershipResult.data?.membership_status === "verified";
    setIsAdmin(admin);
    setCanCreate(admin || globalManager);
    setCanViewDirectory(admin || verifiedMember || partnerAccess);
    setShowPrivateOverview(privateAccess);

    const { data, error: queryError } = await supabase
      .from("jec_partners")
      .select("id,display_name,legal_name,slug,partner_types,geographic_scope,country_name,region,city,website_url,public_summary,relationship_status,verification_status,evidence_url,evidence_label,evidence_summary")
      .order("display_name", { ascending: true });
    if (queryError) setError(queryError.message);
    else {
      setError("");
      setRows((data ?? []) as Partner[]);
    }
    if (privateAccess) {
      const [followUpResult, opportunityResult] = await Promise.all([
        supabase.from("jec_partner_follow_ups")
          .select("id,partner_id,title,due_at,status,priority,assigned_to")
          .in("status", ["todo","in_progress"])
          .order("due_at", { ascending:true }).limit(8),
        supabase.from("jec_partner_opportunities")
          .select("id,partner_id,title,opportunity_type,opportunity_status,deadline,expected_amount,currency_code,source_url")
          .in("opportunity_status", ["identified","reviewing","submitted"])
          .order("deadline", { ascending:true, nullsFirst:false }).limit(8)
      ]);
      if (followUpResult.error || opportunityResult.error) setError((followUpResult.error || opportunityResult.error)?.message ?? "");
      setFollowUpPreview((followUpResult.data ?? []) as FollowUpPreview[]);
      setOpportunityPreview((opportunityResult.data ?? []) as OpportunityPreview[]);
    } else {
      setFollowUpPreview([]);
      setOpportunityPreview([]);
    }
    setLoading(false);
  }, [en]);

  useEffect(() => { void load(); }, [load]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(row => {
      const haystack = [
        row.display_name, row.legal_name, row.country_name ?? "", row.region ?? "",
        row.city ?? "", row.public_summary ?? "", row.evidence_summary ?? ""
      ].join(" ").toLowerCase();
      return (!query || haystack.includes(query))
        && (scopeFilter === "all" || row.geographic_scope === scopeFilter)
        && (typeFilter === "all" || row.partner_types.includes(typeFilter))
        && (statusFilter === "all" || row.relationship_status === statusFilter);
    });
  }, [rows, search, scopeFilter, typeFilter, statusFilter]);

  const verifiedCount = rows.filter(row => row.verification_status === "verified").length;
  const pendingCount = rows.filter(row => row.verification_status !== "verified").length;
  const typeCount = new Set(rows.flatMap(row => row.partner_types)).size;

  async function createPartner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!canCreate || !userId) return;
    if (!name.trim()) {
      setError(en ? "Enter the partner's name." : "Saisis le nom du partenaire.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSaving(true);
    const slug = slugify(name);
    const { error: insertError } = await supabase.from("jec_partners").insert({
      display_name: name.trim(),
      legal_name: legalName.trim() || name.trim(),
      slug,
      partner_types: [partnerType],
      geographic_scope: scope,
      country_name: country.trim() || null,
      city: city.trim() || null,
      website_url: website.trim() || null,
      public_summary: summary.trim() || null,
      relationship_status: "prospect",
      verification_status: "pending",
      visibility: "internal",
      evidence_url: evidenceUrl.trim() || null,
      evidence_label: evidenceLabel.trim() || null,
      evidence_summary: evidenceUrl.trim()
        ? (en ? "Source entered by a JEC coordinator; pending validation." : "Source saisie par un responsable JEC ; validation en attente.")
        : null,
      relationship_owner_id: userId,
      created_by: userId
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      setName(""); setLegalName(""); setCountry(""); setCity(""); setWebsite("");
      setEvidenceUrl(""); setEvidenceLabel(""); setSummary("");
      setShowCreate(false);
      setNotice(en ? "Partner record created in the review queue." : "Fiche créée dans la file de validation.");
      await load();
    }
    setSaving(false);
  }

  return (
    <main className="collab-page">
      <header className="account-header">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link>
        <div><LanguageSwitcher /><Link href="/workspace" className="back-link-inline">{en ? "Workspaces" : "Espaces de travail"}</Link></div>
      </header>
      <div className="collab-content partner-page-content">
        <p className="eyebrow">{en ? "JEC ECOSYSTEM" : "ÉCOSYSTÈME JEC"}</p>
        <div className="partner-page-heading">
          <div>
            <h1>{en ? "Partners" : "Partenaires"}</h1>
            <p className="collab-lead">
              {en
                ? "A shared directory to understand, nurture and document JEC relationships across local, national, European and international levels."
                : "Un annuaire commun pour connaître, faire vivre et documenter les relations de la JEC aux niveaux local, national, européen et international."}
            </p>
          </div>
          {canCreate && <button className="primary-button" onClick={() => setShowCreate(value => !value)}>
            {showCreate ? (en ? "Close form" : "Fermer le formulaire") : (en ? "+ Add a partner" : "+ Ajouter un partenaire")}
          </button>}
        </div>

        {error && <p className="alert error">{error}</p>}
        {notice && <p className="alert success">{notice}</p>}

        {!canViewDirectory && !loading && (
          <div className="collab-card partner-access-notice">
            <h2>{en ? "Member access required" : "Accès réservé"}</h2>
            <p>{en ? "The partner directory is available to verified JEC members and designated partner-team members." : "L'annuaire est accessible aux membres JEC vérifiés et aux personnes désignées dans une équipe partenaire."}</p>
          </div>
        )}

        {canViewDirectory && <>
          <div className="partner-kpi-grid">
            <article className="partner-kpi"><strong>{rows.length}</strong><span>{en ? "Partner records" : "Fiches partenaires"}</span></article>
            <article className="partner-kpi"><strong>{verifiedCount}</strong><span>{en ? "Source verified" : "Sources vérifiées"}</span></article>
            <article className="partner-kpi"><strong>{pendingCount}</strong><span>{en ? "To review" : "À vérifier"}</span></article>
            <article className="partner-kpi"><strong>{typeCount}</strong><span>{en ? "Partner categories" : "Types de partenaires"}</span></article>
          </div>

          {showPrivateOverview && <section className="partner-workbench-grid">
            <article className="collab-card partner-workbench-card">
              <div className="collab-card-heading"><div><p className="eyebrow">{en?"FOLLOW-UP PIPELINE":"SUIVI DES RELANCES"}</p><h2>{en?"Next actions":"Prochaines actions"}</h2></div><span className="collab-count">{followUpPreview.length}</span></div>
              {followUpPreview.length ? followUpPreview.map(item => {
                const partner=rows.find(row=>row.id===item.partner_id);
                const overdue=new Date(item.due_at).getTime()<Date.now();
                return <Link className={"partner-workbench-row "+(overdue?"is-overdue":"")} href={"/partenaires/"+item.partner_id} key={item.id}>
                  <span className="partner-workbench-row-top"><strong>{item.title}</strong><span className={"partner-priority "+item.priority}>{item.priority==="high"?(en?"High":"Haute"):item.priority==="low"?(en?"Low":"Basse"):(en?"Normal":"Normale")}</span></span>
                  <small>{partner?.display_name|| (en?"Partner record":"Fiche partenaire")} · {new Date(item.due_at).toLocaleString(en?"en-GB":"fr-FR",{dateStyle:"medium",timeStyle:"short"})}</small>
                </Link>;
              }) : <p className="collab-muted">{en?"No open follow-up is scheduled.":"Aucune relance en cours n'est planifiée."}</p>}
            </article>
            <article className="collab-card partner-workbench-card">
              <div className="collab-card-heading"><div><p className="eyebrow">{en?"FUNDING PIPELINE":"PIPELINE FINANCEMENTS"}</p><h2>{en?"Opportunities to review":"Opportunités à traiter"}</h2></div><span className="collab-count">{opportunityPreview.length}</span></div>
              {opportunityPreview.length ? opportunityPreview.map(item => {
                const partner=item.partner_id?rows.find(row=>row.id===item.partner_id):null;
                return <article className="partner-workbench-row" key={item.id}>
                  {item.partner_id ? <Link href={"/partenaires/"+item.partner_id}><strong>{item.title}</strong></Link> : <strong>{item.title}</strong>}
                  <small>{partner?.display_name|| (en?"General opportunity":"Opportunité générale")} · {item.opportunity_type.replaceAll("_"," ")}</small>
                  <span className="partner-workbench-meta">{item.deadline?(en?"Deadline":"Échéance")+": "+new Date(item.deadline+"T00:00:00").toLocaleDateString(en?"en-GB":"fr-FR"):(en?"No deadline entered":"Échéance non renseignée")}{item.expected_amount!==null&&item.currency_code?" · "+new Intl.NumberFormat(en?"en-GB":"fr-FR",{maximumFractionDigits:2}).format(Number(item.expected_amount))+" "+item.currency_code:""}</span>
                  {item.source_url&&<a href={item.source_url} target="_blank" rel="noreferrer">{en?"Open source ↗":"Ouvrir la source ↗"}</a>}
                </article>;
              }) : <p className="collab-muted">{en?"No funding opportunity is being tracked.":"Aucune opportunité de financement n'est suivie."}</p>}
            </article>
          </section>}

          {showCreate && canCreate && <section className="collab-card partner-create-card">
            <div className="collab-card-heading"><div><p className="eyebrow">{en ? "NEW RECORD" : "NOUVELLE FICHE"}</p><h2>{en ? "Add a partner or a network" : "Ajouter un partenaire ou un réseau"}</h2></div></div>
            <p className="partner-form-note">{en ? "New records enter the review queue. They are not labelled as active partnerships automatically." : "Toute nouvelle fiche entre en validation. Elle n'est jamais considérée automatiquement comme un partenariat actif."}</p>
            <form className="collab-form" onSubmit={createPartner}>
              <div className="partner-form-grid">
                <label>{en ? "Display name" : "Nom usuel"}<input value={name} onChange={e => setName(e.target.value)} required /></label>
                <label>{en ? "Legal name (optional)" : "Dénomination légale (facultatif)"}<input value={legalName} onChange={e => setLegalName(e.target.value)} /></label>
                <label>{en ? "Category" : "Catégorie"}<select value={partnerType} onChange={e => setPartnerType(e.target.value)}>
                  {Object.entries(partnerTypeLabels).map(([value, label]) => <option value={value} key={value}>{en ? label.en : label.fr}</option>)}
                </select></label>
                <label>{en ? "Geographic reach" : "Rayonnement"}<select value={scope} onChange={e => setScope(e.target.value)}>
                  {Object.entries(scopeLabels).map(([value, label]) => <option value={value} key={value}>{en ? label.en : label.fr}</option>)}
                </select></label>
                <label>{en ? "Country" : "Pays"}<input value={country} onChange={e => setCountry(e.target.value)} placeholder={en ? "e.g. France, Lebanon…" : "Ex. France, Liban…"} /></label>
                <label>{en ? "City / region" : "Ville / région"}<input value={city} onChange={e => setCity(e.target.value)} /></label>
                <label>{en ? "Website" : "Site web"}<input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" /></label>
                <label>{en ? "Evidence / source URL" : "Lien de preuve / source"}<input type="url" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)} placeholder="https://" /></label>
              </div>
              <label>{en ? "Source title" : "Intitulé de la source"}<input value={evidenceLabel} onChange={e => setEvidenceLabel(e.target.value)} /></label>
              <label>{en ? "Short description" : "Présentation courte"}<textarea rows={3} value={summary} onChange={e => setSummary(e.target.value)} /></label>
              <button className="primary-button" disabled={saving}>{saving ? (en ? "Saving…" : "Enregistrement…") : (en ? "Create review record" : "Créer la fiche à valider")}</button>
            </form>
          </section>}

          <section className="partner-filter-bar">
            <label className="partner-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder={en ? "Search an organisation, country or topic…" : "Rechercher une organisation, un pays ou un sujet…"} /></label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label={en ? "Partner type" : "Type de partenaire"}>
              <option value="all">{en ? "All categories" : "Toutes les catégories"}</option>
              {Object.entries(partnerTypeLabels).map(([value, label]) => <option value={value} key={value}>{en ? label.en : label.fr}</option>)}
            </select>
            <select value={scopeFilter} onChange={e => setScopeFilter(e.target.value)} aria-label={en ? "Geographic scope" : "Rayonnement"}>
              <option value="all">{en ? "All areas" : "Tous les rayonnements"}</option>
              {Object.entries(scopeLabels).map(([value, label]) => <option value={value} key={value}>{en ? label.en : label.fr}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label={en ? "Relationship status" : "Statut de la relation"}>
              <option value="all">{en ? "All relationships" : "Toutes les relations"}</option>
              {Object.entries(relationshipLabels).map(([value, label]) => <option value={value} key={value}>{en ? label.en : label.fr}</option>)}
            </select>
          </section>

          {loading ? <p className="muted">{en ? "Loading partners…" : "Chargement des partenaires…"}</p> : filteredRows.length ? (
            <div className="partner-directory-grid">
              {filteredRows.map(partner => (
                <article className="collab-card partner-directory-card" key={partner.id}>
                  <div className="partner-card-top">
                    <span className={"partner-validation " + partner.verification_status}>{partner.verification_status === "verified" ? (en ? "Source checked" : "Source vérifiée") : (en ? "To review" : "À vérifier")}</span>
                    <span className="partner-scope">{scopeLabels[partner.geographic_scope]?.[en ? "en" : "fr"] ?? partner.geographic_scope}</span>
                  </div>
                  <h3>{partner.display_name}</h3>
                  <div className="partner-category-row">{partner.partner_types.map(type => <span className="partner-category-chip" key={type}>{partnerTypeLabels[type]?.[en ? "en" : "fr"] ?? type}</span>)}</div>
                  <p className="partner-location">{[partner.city, partner.region, partner.country_name].filter(Boolean).join(" · ") || (en ? "Geography to be completed" : "Localisation à compléter")}</p>
                  <p className="partner-description">{partner.public_summary || partner.evidence_summary || (en ? "No description yet." : "Aucune présentation pour le moment.")}</p>
                  <span className={"project-status partner-relationship-status " + partner.relationship_status}>{relationshipLabels[partner.relationship_status]?.[en ? "en" : "fr"] ?? partner.relationship_status}</span>
                  <div className="partner-card-footer">
                    {partner.evidence_url ? <a href={partner.evidence_url} target="_blank" rel="noreferrer">{en ? "View source ↗" : "Voir la source ↗"}</a> : <span>{en ? "No source supplied" : "Source non renseignée"}</span>}
                    <Link href={"/partenaires/" + partner.id}>{en ? "Open record →" : "Ouvrir la fiche →"}</Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="collab-empty">
              <span>◎</span>
              <h3>{en ? "No matching partner" : "Aucun partenaire correspondant"}</h3>
              <p>{en ? "Clear the filters or add a partner record with a source to review." : "Modifie les filtres ou ajoute une fiche avec une source à vérifier."}</p>
            </div>
          )}
        </>}
      </div>
    </main>
  );
}
