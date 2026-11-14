"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Partner={id:string;display_name:string;legal_name:string;partner_types:string[];geographic_scope:string;country_name:string|null;city:string|null;website_url:string|null;public_summary:string|null;relationship_status:string;verification_status:string;evidence_url:string|null;evidence_label:string|null;evidence_summary:string|null;visibility:string};
type Engagement={id:string;title:string;engagement_type:string;engagement_status:string;summary:string|null;starts_on:string|null;ends_on:string|null;support_kind:string};
type Opportunity={id:string;title:string;opportunity_type:string;opportunity_status:string;description:string|null;source_url:string|null;deadline:string|null};
type Contact={id:string;full_name:string;role_title:string|null;email:string|null;phone:string|null;is_primary:boolean;consent_status:string};
type DocumentRow={id:string;title:string;document_type:string;storage_path:string;document_status:string;valid_from:string|null;valid_until:string|null};
type Activity={id:string;event_type:string;summary_fr:string;summary_en:string;created_at:string};

const relationship:Record<string,{fr:string;en:string}>={
 prospect:{fr:"Piste à étudier",en:"Prospect"},active:{fr:"Partenariat actif",en:"Active partnership"},
 paused:{fr:"En pause",en:"Paused"},ended:{fr:"Terminé",en:"Ended"},historic:{fr:"Lien historique",en:"Historic relationship"},
 network_membership:{fr:"Appartenance à un réseau",en:"Network membership"},project_collaboration:{fr:"Coopération sur un projet",en:"Project collaboration"},
 project_support:{fr:"Soutien à un projet",en:"Project support"},participation:{fr:"Participation à une instance",en:"Participation in a body"},
 to_confirm:{fr:"Statut à confirmer",en:"Status to confirm"}
};
const typeLabels:Record<string,{fr:string;en:string}>={
 association:{fr:"Association",en:"Association"},ngo:{fr:"ONG",en:"NGO"},faith_based:{fr:"Organisation ecclésiale",en:"Faith-based organisation"},
 youth_movement:{fr:"Mouvement de jeunesse",en:"Youth movement"},international_network:{fr:"Réseau international",en:"International network"},
 public_institution:{fr:"Institution publique",en:"Public institution"},educational:{fr:"Éducation / recherche",en:"Education / research"},
 foundation:{fr:"Fondation",en:"Foundation"},company:{fr:"Entreprise",en:"Company"},funding_programme:{fr:"Dispositif de financement",en:"Funding programme"},
 public_programme:{fr:"Programme public",en:"Public programme"},media:{fr:"Média",en:"Media"},donor:{fr:"Mécène / donateur",en:"Donor"},other:{fr:"Autre",en:"Other"}
};
function date(value:string|null,en:boolean){return value?new Date(value+"T00:00:00").toLocaleDateString(en?"en-GB":"fr-FR"):"—";}

export default function PartnerDetailPage(){
 const params=useParams<{id:string}>();const partnerId=params.id;
 const {lang}=useLanguage();const en=lang==="en";
 const [partner,setPartner]=useState<Partner|null>(null);
 const [engagements,setEngagements]=useState<Engagement[]>([]);
 const [opportunities,setOpportunities]=useState<Opportunity[]>([]);
 const [contacts,setContacts]=useState<Contact[]>([]);
 const [documents,setDocuments]=useState<DocumentRow[]>([]);
 const [activity,setActivity]=useState<Activity[]>([]);
 const [canManage,setCanManage]=useState(false);
 const [canViewPrivate,setCanViewPrivate]=useState(false);
 const [loading,setLoading]=useState(true);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [note,setNote]=useState("");
 const [engagementTitle,setEngagementTitle]=useState("");
 const [engagementType,setEngagementType]=useState("collaboration");
 const [engagementSummary,setEngagementSummary]=useState("");
 const [opportunityTitle,setOpportunityTitle]=useState("");
 const [opportunityType,setOpportunityType]=useState("funding_call");
 const [opportunityDeadline,setOpportunityDeadline]=useState("");
 const [opportunityUrl,setOpportunityUrl]=useState("");

 const load=useCallback(async()=>{
  const supabase=getSupabaseBrowserClient();if(!supabase){setError("Supabase n'est pas configuré.");setLoading(false);return;}
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user){window.location.href="/login";return;}
  const [adminResult,accessResult,partnerResult]=await Promise.all([
   supabase.rpc("is_jec_admin"),
   supabase.from("jec_partner_access").select("partner_id,access_role").eq("user_id",user.id),
   supabase.from("jec_partners").select("id,display_name,legal_name,partner_types,geographic_scope,country_name,city,website_url,public_summary,relationship_status,verification_status,evidence_url,evidence_label,evidence_summary,visibility").eq("id",partnerId).maybeSingle()
  ]);
  if(partnerResult.error||!partnerResult.data){setError(en?"This partner record is unavailable.":"Cette fiche partenaire n'est pas accessible.");setPartner(null);setLoading(false);return;}
  const admin=adminResult.data===true;
  const accessRows=accessResult.data??[];
  const access=accessRows.find((row:{partner_id:string|null;access_role:string})=>row.partner_id===partnerId);
  const global=accessRows.find((row:{partner_id:string|null;access_role:string})=>row.partner_id===null);
  const role=access?.access_role??global?.access_role;
  const privateAccess=admin||["manager","editor","viewer"].includes(role??"");
  setCanViewPrivate(privateAccess);setCanManage(admin||["manager","editor"].includes(role??""));
  setPartner(partnerResult.data as Partner);
  if(privateAccess){
   const [e,o,c,d,a]=await Promise.all([
    supabase.from("jec_partner_engagements").select("id,title,engagement_type,engagement_status,summary,starts_on,ends_on,support_kind").eq("partner_id",partnerId).order("starts_on",{ascending:false}),
    supabase.from("jec_partner_opportunities").select("id,title,opportunity_type,opportunity_status,description,source_url,deadline").eq("partner_id",partnerId).order("deadline",{ascending:true}),
    supabase.from("jec_partner_contacts").select("id,full_name,role_title,email,phone,is_primary,consent_status").eq("partner_id",partnerId).order("is_primary",{ascending:false}),
    supabase.from("jec_partner_documents").select("id,title,document_type,storage_path,document_status,valid_from,valid_until").eq("partner_id",partnerId).order("created_at",{ascending:false}),
    supabase.from("jec_partner_activity").select("id,event_type,summary_fr,summary_en,created_at").eq("partner_id",partnerId).order("created_at",{ascending:false}).limit(30)
   ]);
   if(e.error||o.error||c.error||d.error||a.error)setError((e.error||o.error||c.error||d.error||a.error)?.message??"");
   setEngagements((e.data??[]) as Engagement[]);setOpportunities((o.data??[]) as Opportunity[]);
   setContacts((c.data??[]) as Contact[]);setDocuments((d.data??[]) as DocumentRow[]);setActivity((a.data??[]) as Activity[]);
  }else{
   setEngagements([]);setOpportunities([]);setContacts([]);setDocuments([]);setActivity([]);
  }
  setLoading(false);
 },[partnerId,en]);

 useEffect(()=>{void load();},[load]);

 async function createEngagement(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const supabase=getSupabaseBrowserClient();if(!supabase||!canManage)return;
  setBusy(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();if(!user){setBusy(false);return;}
  const {error:e}=await supabase.from("jec_partner_engagements").insert({partner_id:partnerId,title:engagementTitle.trim(),engagement_type:engagementType,summary:engagementSummary.trim()||null,engagement_status:"planned",support_kind:"non_financial",created_by:user.id});
  if(e)setError(e.message);else{setEngagementTitle("");setEngagementSummary("");setNotice(en?"Engagement added.":"Relation ajoutée.");await load();}
  setBusy(false);
 }
 async function createOpportunity(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const supabase=getSupabaseBrowserClient();if(!supabase||!canManage)return;
  setBusy(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();if(!user){setBusy(false);return;}
  const {error:e}=await supabase.from("jec_partner_opportunities").insert({partner_id:partnerId,title:opportunityTitle.trim(),opportunity_type:opportunityType,deadline:opportunityDeadline||null,source_url:opportunityUrl.trim()||null,created_by:user.id,opportunity_status:"identified"});
  if(e)setError(e.message);else{setOpportunityTitle("");setOpportunityDeadline("");setOpportunityUrl("");setNotice(en?"Opportunity added.":"Opportunité ajoutée.");await load();}
  setBusy(false);
 }
 async function createNote(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const supabase=getSupabaseBrowserClient();if(!supabase||!canManage||!note.trim())return;
  setBusy(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();if(!user){setBusy(false);return;}
  const {error:e}=await supabase.from("jec_partner_notes").insert({partner_id:partnerId,content:note.trim(),created_by:user.id,note_type:"follow_up"});
  if(e)setError(e.message);else{setNote("");setNotice(en?"Follow-up note saved.":"Note de suivi enregistrée.");}
  setBusy(false);
 }

 async function openDocument(path:string){
  const supabase=getSupabaseBrowserClient();if(!supabase)return;
  const {data,error:e}=await supabase.storage.from("jec-partner-documents").createSignedUrl(path,120);
  if(e){setError(e.message);return;}if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
 }

 if(loading)return <main className="collab-page"><p className="muted">{en?"Loading partner record…":"Chargement de la fiche partenaire…"}</p></main>;
 if(!partner)return <main className="collab-page"><div className="collab-content"><p className="alert error">{error|| (en?"Partner not found.":"Partenaire introuvable.")}</p><Link href="/partenaires" className="project-open-link">{en?"Back to partners":"Retour aux partenaires"}</Link></div></main>;

 return <main className="collab-page">
  <header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/partenaires" className="back-link-inline">{en?"Partners":"Partenaires"}</Link></div></header>
  <div className="collab-content partner-detail-content">
   <Link href="/partenaires" className="project-open-link">← {en?"Partner directory":"Annuaire des partenaires"}</Link>
   <div className="partner-detail-hero">
    <div><p className="eyebrow">{en?"PARTNER RECORD":"FICHE PARTENAIRE"}</p><h1>{partner.display_name}</h1><p className="collab-lead">{partner.public_summary||partner.evidence_summary||partner.legal_name}</p>
     <div className="partner-category-row">{partner.partner_types.map(type=><span className="partner-category-chip" key={type}>{typeLabels[type]?.[en?"en":"fr"]??type}</span>)}</div>
    </div>
    <div className="partner-detail-status"><span className={"partner-validation "+partner.verification_status}>{partner.verification_status==="verified"?(en?"Source checked":"Source vérifiée"):(en?"To review":"À vérifier")}</span><strong>{relationship[partner.relationship_status]?.[en?"en":"fr"]??partner.relationship_status}</strong><small>{[partner.city,partner.country_name].filter(Boolean).join(" · ")|| (en?"Geography not specified":"Rayonnement géographique à préciser")}</small></div>
   </div>
   <div className="partner-detail-links">{partner.website_url&&<a href={partner.website_url} target="_blank" rel="noreferrer">{en?"Official website ↗":"Site officiel ↗"}</a>}{partner.evidence_url&&<a href={partner.evidence_url} target="_blank" rel="noreferrer">{partner.evidence_label|| (en?"Evidence source":"Source justificative")} ↗</a>}</div>
   {error&&<p className="alert error">{error}</p>}{notice&&<p className="alert success">{notice}</p>}
   {!canViewPrivate&&<p className="partner-form-note">{en?"Internal contacts, agreement files and relationship notes are restricted to designated partner coordinators.":"Les contacts internes, conventions et notes de relation sont réservés aux personnes habilitées pour ce partenaire."}</p>}
   {canViewPrivate&&<>
    <div className="partner-detail-grid">
     <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"RELATIONSHIP MANAGEMENT":"SUIVI DE LA RELATION"}</p><h2>{en?"Engagements":"Collaborations et engagements"}</h2></div><span className="collab-count">{engagements.length}</span></div>
      {engagements.length?engagements.map(item=><article className="partner-private-row" key={item.id}><strong>{item.title}</strong><small>{item.engagement_type.replaceAll("_"," ")} · {item.engagement_status.replaceAll("_"," ")}</small>{item.summary&&<p>{item.summary}</p>}<time>{date(item.starts_on,en)} – {date(item.ends_on,en)}</time></article>):<p className="collab-muted">{en?"No engagement recorded.":"Aucun engagement enregistré."}</p>}
      {canManage&&<form className="collab-form partner-inline-form" onSubmit={createEngagement}><h3>{en?"Add an engagement":"Ajouter une relation"}</h3><label>{en?"Title":"Intitulé"}<input value={engagementTitle} onChange={e=>setEngagementTitle(e.target.value)} required/></label><label>{en?"Relationship type":"Type de relation"}<select value={engagementType} onChange={e=>setEngagementType(e.target.value)}><option value="collaboration">{en?"Collaboration":"Collaboration"}</option><option value="network_membership">{en?"Network membership":"Appartenance à un réseau"}</option><option value="funding">{en?"Funding":"Financement"}</option><option value="education">{en?"Education":"Éducation"}</option><option value="international_exchange">{en?"International exchange":"Échange international"}</option><option value="event">{en?"Event":"Événement"}</option><option value="other">{en?"Other":"Autre"}</option></select></label><label>{en?"Summary":"Résumé"}<textarea rows={2} value={engagementSummary} onChange={e=>setEngagementSummary(e.target.value)}/></label><button className="primary-button" disabled={busy}>{en?"Save engagement":"Enregistrer la relation"}</button></form>}
     </section>
     <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"FUNDING & OPPORTUNITIES":"FINANCEMENTS ET OPPORTUNITÉS"}</p><h2>{en?"Opportunities":"Opportunités"}</h2></div><span className="collab-count">{opportunities.length}</span></div>
      {opportunities.length?opportunities.map(item=><article className="partner-private-row" key={item.id}><strong>{item.title}</strong><small>{item.opportunity_type.replaceAll("_"," ")} · {item.opportunity_status}</small>{item.description&&<p>{item.description}</p>}<time>{en?"Deadline":"Échéance"} : {date(item.deadline,en)}</time>{item.source_url&&<a href={item.source_url} target="_blank" rel="noreferrer">{en?"Open source ↗":"Ouvrir la source ↗"}</a>}</article>):<p className="collab-muted">{en?"No opportunity recorded.":"Aucune opportunité enregistrée."}</p>}
      {canManage&&<form className="collab-form partner-inline-form" onSubmit={createOpportunity}><h3>{en?"Track an opportunity":"Suivre une opportunité"}</h3><label>{en?"Title":"Intitulé"}<input value={opportunityTitle} onChange={e=>setOpportunityTitle(e.target.value)} required/></label><label>{en?"Type":"Type"}<select value={opportunityType} onChange={e=>setOpportunityType(e.target.value)}><option value="funding_call">{en?"Funding call":"Appel à financement"}</option><option value="call_for_projects">{en?"Call for projects":"Appel à projets"}</option><option value="training">{en?"Training":"Formation"}</option><option value="sponsorship">{en?"Sponsorship":"Mécénat"}</option><option value="exchange">{en?"Exchange":"Échange"}</option><option value="other">{en?"Other":"Autre"}</option></select></label><label>{en?"Deadline":"Échéance"}<input type="date" value={opportunityDeadline} onChange={e=>setOpportunityDeadline(e.target.value)}/></label><label>{en?"Source URL":"Lien source"}<input type="url" value={opportunityUrl} onChange={e=>setOpportunityUrl(e.target.value)}/></label><button className="primary-button" disabled={busy}>{en?"Save opportunity":"Enregistrer l'opportunité"}</button></form>}
     </section>
     <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"CONTACTS":"INTERLOCUTEURS"}</p><h2>{en?"Partner contacts":"Contacts partenaires"}</h2></div><span className="collab-count">{contacts.length}</span></div>
      {contacts.length?contacts.map(item=><article className="partner-private-row" key={item.id}><strong>{item.full_name}{item.is_primary?" · "+(en?"Main contact":"Contact principal"):""}</strong>{item.role_title&&<small>{item.role_title}</small>}{item.email&&<a href={"mailto:"+item.email}>{item.email}</a>}{item.phone&&<a href={"tel:"+item.phone}>{item.phone}</a>}<time>{en?"Consent":"Consentement"} : {item.consent_status}</time></article>):<p className="collab-muted">{en?"No contact has been recorded.":"Aucun contact n'a été enregistré."}</p>}
     </section>
     <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"AGREEMENTS & DOCUMENTS":"CONVENTIONS ET DOCUMENTS"}</p><h2>{en?"Documents":"Documents"}</h2></div><span className="collab-count">{documents.length}</span></div>
      {documents.length?documents.map(item=><article className="partner-private-row" key={item.id}><strong>{item.title}</strong><small>{item.document_type.replaceAll("_"," ")} · {item.document_status}</small><time>{date(item.valid_from,en)} – {date(item.valid_until,en)}</time><button className="secondary-outline-button" type="button" onClick={()=>void openDocument(item.storage_path)}>{en?"Open secure file":"Ouvrir le document sécurisé"}</button></article>):<p className="collab-muted">{en?"No agreement or document uploaded.":"Aucune convention ou pièce justificative déposée."}</p>}
     </section>
    </div>
    {canManage&&<form className="collab-card partner-note-form" onSubmit={createNote}><h2>{en?"Relationship follow-up":"Suivi de la relation"}</h2><label>{en?"Internal note":"Note interne"}<textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} required placeholder={en?"Next step, meeting notes, reminder…":"Prochaine étape, échange, rappel…"} /></label><button className="primary-button" disabled={busy}>{en?"Save note":"Enregistrer la note"}</button></form>}
    <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"CHANGE HISTORY":"HISTORIQUE"}</p><h2>{en?"Recent activity":"Activité récente"}</h2></div></div>{activity.map(item=><article className="partner-private-row" key={item.id}><p>{en?item.summary_en:item.summary_fr}</p><time>{new Date(item.created_at).toLocaleString(en?"en-GB":"fr-FR")}</time></article>)}</section>
   </>}
  </div>
 </main>;
}
