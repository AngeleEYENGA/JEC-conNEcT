"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Partner={id:string;display_name:string;legal_name:string;partner_types:string[];geographic_scope:string;country_name:string|null;city:string|null;website_url:string|null;public_summary:string|null;relationship_status:string;verification_status:string;evidence_url:string|null;evidence_label:string|null;evidence_summary:string|null;visibility:string};
type Engagement={id:string;title:string;engagement_type:string;engagement_status:string;summary:string|null;starts_on:string|null;ends_on:string|null;support_kind:string;support_amount:number|null;currency_code:string|null};
type Opportunity={id:string;title:string;opportunity_type:string;opportunity_status:string;description:string|null;source_url:string|null;deadline:string|null;expected_amount:number|null;currency_code:string|null};
type Contact={id:string;full_name:string;role_title:string|null;email:string|null;phone:string|null;is_primary:boolean;consent_status:string;preferred_contact_method:string;notes:string|null};
type DocumentRow={id:string;title:string;document_type:string;storage_path:string;document_status:string;valid_from:string|null;valid_until:string|null};
type FollowUp={id:string;title:string;details:string|null;due_at:string;status:"todo"|"in_progress"|"done"|"cancelled";priority:"low"|"normal"|"high";assigned_to:string|null;created_at:string};
type Activity={id:string;event_type:string;summary_fr:string;summary_en:string;created_at:string};
type PartnerNote={id:string;note_type:string;content:string;created_by:string;created_at:string};

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
 const [notes,setNotes]=useState<PartnerNote[]>([]);
 const [followUps,setFollowUps]=useState<FollowUp[]>([]);
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
 const [opportunityDescription,setOpportunityDescription]=useState("");
 const [opportunityAmount,setOpportunityAmount]=useState("");
 const [opportunityCurrency,setOpportunityCurrency]=useState("EUR");
 const [engagementStartsOn,setEngagementStartsOn]=useState("");
 const [engagementEndsOn,setEngagementEndsOn]=useState("");
 const [engagementSupportKind,setEngagementSupportKind]=useState("non_financial");
 const [engagementAmount,setEngagementAmount]=useState("");
 const [engagementCurrency,setEngagementCurrency]=useState("EUR");
 const [contactName,setContactName]=useState("");
 const [contactRole,setContactRole]=useState("");
 const [contactEmail,setContactEmail]=useState("");
 const [contactPhone,setContactPhone]=useState("");
 const [contactMethod,setContactMethod]=useState("email");
 const [contactConsent,setContactConsent]=useState<"not_recorded"|"pending"|"granted"|"withdrawn">("not_recorded");
 const [contactNotes,setContactNotes]=useState("");
 const [contactPrimary,setContactPrimary]=useState(false);
 const [documentFile,setDocumentFile]=useState<File|null>(null);
 const [documentTitle,setDocumentTitle]=useState("");
 const [documentType,setDocumentType]=useState("convention");
 const [documentStatus,setDocumentStatus]=useState("under_review");
 const [documentValidFrom,setDocumentValidFrom]=useState("");
 const [documentValidUntil,setDocumentValidUntil]=useState("");
 const [followUpTitle,setFollowUpTitle]=useState("");
 const [followUpDetails,setFollowUpDetails]=useState("");
 const [followUpDueAt,setFollowUpDueAt]=useState("");
 const [followUpPriority,setFollowUpPriority]=useState<"low"|"normal"|"high">("normal");
 const [followUpAssignMe,setFollowUpAssignMe]=useState(true);

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
   const [e,o,c,d,a,n,f]=await Promise.all([
    supabase.from("jec_partner_engagements").select("id,title,engagement_type,engagement_status,summary,starts_on,ends_on,support_kind,support_amount,currency_code").eq("partner_id",partnerId).order("starts_on",{ascending:false}),
    supabase.from("jec_partner_opportunities").select("id,title,opportunity_type,opportunity_status,description,source_url,deadline,expected_amount,currency_code").eq("partner_id",partnerId).order("deadline",{ascending:true}),
    supabase.from("jec_partner_contacts").select("id,full_name,role_title,email,phone,is_primary,consent_status,preferred_contact_method,notes").eq("partner_id",partnerId).order("is_primary",{ascending:false}),
    supabase.from("jec_partner_documents").select("id,title,document_type,storage_path,document_status,valid_from,valid_until").eq("partner_id",partnerId).order("created_at",{ascending:false}),
    supabase.from("jec_partner_activity").select("id,event_type,summary_fr,summary_en,created_at").eq("partner_id",partnerId).order("created_at",{ascending:false}).limit(30),
    supabase.from("jec_partner_notes").select("id,note_type,content,created_by,created_at").eq("partner_id",partnerId).order("created_at",{ascending:false}).limit(30),
    supabase.from("jec_partner_follow_ups").select("id,title,details,due_at,status,priority,assigned_to,created_at").eq("partner_id",partnerId).order("due_at",{ascending:true})
   ]);
   if(e.error||o.error||c.error||d.error||a.error||n.error||f.error)setError((e.error||o.error||c.error||d.error||a.error||n.error||f.error)?.message??"");
   setEngagements((e.data??[]) as Engagement[]);setOpportunities((o.data??[]) as Opportunity[]);
   setContacts((c.data??[]) as Contact[]);setDocuments((d.data??[]) as DocumentRow[]);setActivity((a.data??[]) as Activity[]);setNotes((n.data??[]) as PartnerNote[]);setFollowUps((f.data??[]) as FollowUp[]);
  }else{
   setEngagements([]);setOpportunities([]);setContacts([]);setDocuments([]);setActivity([]);setNotes([]);setFollowUps([]);
  }
  setLoading(false);
 },[partnerId,en]);

 useEffect(()=>{void load();},[load]);

 async function createEngagement(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const supabase=getSupabaseBrowserClient();if(!supabase||!canManage)return;
  setBusy(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();if(!user){setBusy(false);return;}
  if(engagementEndsOn&&engagementStartsOn&&engagementEndsOn<engagementStartsOn){setError(en?"The end date must be after the start date.":"La date de fin doit être postérieure à la date de début.");setBusy(false);return;}
  const amount=engagementAmount.trim()?Number(engagementAmount):null;
  if(engagementAmount.trim()&&(!Number.isFinite(amount)||Number(amount)<0)){setError(en?"Enter a valid non-negative amount.":"Saisis un montant positif valide.");setBusy(false);return;}
  const {error:e}=await supabase.from("jec_partner_engagements").insert({partner_id:partnerId,title:engagementTitle.trim(),engagement_type:engagementType,summary:engagementSummary.trim()||null,engagement_status:"planned",support_kind:engagementSupportKind,starts_on:engagementStartsOn||null,ends_on:engagementEndsOn||null,support_amount:amount,currency_code:amount===null?null:engagementCurrency,created_by:user.id});
  if(e)setError(e.message);else{setEngagementTitle("");setEngagementSummary("");setEngagementStartsOn("");setEngagementEndsOn("");setEngagementAmount("");setNotice(en?"Engagement added.":"Relation ajoutée.");await load();}
  setBusy(false);
 }
 async function createOpportunity(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const supabase=getSupabaseBrowserClient();if(!supabase||!canManage)return;
  setBusy(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();if(!user){setBusy(false);return;}
  const amount=opportunityAmount.trim()?Number(opportunityAmount):null;
  if(opportunityAmount.trim()&&(!Number.isFinite(amount)||Number(amount)<0)){setError(en?"Enter a valid non-negative amount.":"Saisis un montant positif valide.");setBusy(false);return;}
  const {error:e}=await supabase.from("jec_partner_opportunities").insert({partner_id:partnerId,title:opportunityTitle.trim(),opportunity_type:opportunityType,deadline:opportunityDeadline||null,source_url:opportunityUrl.trim()||null,description:opportunityDescription.trim()||null,expected_amount:amount,currency_code:amount===null?null:opportunityCurrency,owner_id:user.id,created_by:user.id,opportunity_status:"identified"});
  if(e)setError(e.message);else{setOpportunityTitle("");setOpportunityDeadline("");setOpportunityUrl("");setOpportunityDescription("");setOpportunityAmount("");setNotice(en?"Opportunity added.":"Opportunité ajoutée.");await load();}
  setBusy(false);
 }

 async function createContact(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const supabase=getSupabaseBrowserClient();if(!supabase||!canManage)return;
  setBusy(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();if(!user){setBusy(false);return;}
  if(!contactEmail.trim()&&!contactPhone.trim()){setError(en?"Add an email address or a phone number.":"Ajoute une adresse e-mail ou un numéro de téléphone.");setBusy(false);return;}
  const {data:created,error:e}=await supabase.from("jec_partner_contacts").insert({
   partner_id:partnerId,full_name:contactName.trim(),role_title:contactRole.trim()||null,
   email:contactEmail.trim()||null,phone:contactPhone.trim()||null,
   preferred_contact_method:contactMethod,is_primary:false,consent_status:contactConsent,
   consent_recorded_at:contactConsent==="granted"?new Date().toISOString():null,
   notes:contactNotes.trim()||null,created_by:user.id
  }).select("id").single();
  if(e)setError(e.message);else{
   if(contactPrimary&&created?.id){
    const {error:clearError}=await supabase.from("jec_partner_contacts").update({is_primary:false}).eq("partner_id",partnerId).eq("is_primary",true);
    if(clearError)setError(clearError.message);
    else{
     const {error:primaryError}=await supabase.from("jec_partner_contacts").update({is_primary:true}).eq("id",created.id);
     if(primaryError)setError(primaryError.message);
    }
   }
   setContactName("");setContactRole("");setContactEmail("");setContactPhone("");setContactNotes("");setContactPrimary(false);setContactConsent("not_recorded");
   setNotice(en?"Contact saved.":"Contact enregistré.");
   await load();
  }
  setBusy(false);
 }

 async function createDocument(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const supabase=getSupabaseBrowserClient();if(!supabase||!canManage||!documentFile)return;
  setBusy(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();if(!user){setBusy(false);return;}
  const allowedTypes=new Set(["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","application/vnd.openxmlformats-officedocument.presentationml.presentation","text/plain","text/csv","image/png","image/jpeg","image/webp"]);
  if(documentFile.size>20*1024*1024){setError(en?"The file exceeds the 20 MB limit.":"Le fichier dépasse la limite de 20 Mo.");setBusy(false);return;}
  if(!allowedTypes.has(documentFile.type)){setError(en?"This file type is not allowed.":"Ce type de fichier n'est pas autorisé.");setBusy(false);return;}
  if(documentValidUntil&&documentValidFrom&&documentValidUntil<documentValidFrom){setError(en?"The expiry date must be after the start date.":"La date de fin doit être postérieure à la date de début.");setBusy(false);return;}
  const safeName=documentFile.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(-120);
  const storagePath=partnerId+"/"+user.id+"/"+crypto.randomUUID()+"-"+safeName;
  const {error:uploadError}=await supabase.storage.from("jec-partner-documents").upload(storagePath,documentFile,{contentType:documentFile.type,upsert:false});
  if(uploadError){setError(uploadError.message);setBusy(false);return;}
  const title=documentTitle.trim()||documentFile.name.replace(/\.[^.]+$/,"");
  const {error:insertError}=await supabase.from("jec_partner_documents").insert({
   partner_id:partnerId,title,document_type:documentType,storage_path:storagePath,
   document_status:documentStatus,valid_from:documentValidFrom||null,valid_until:documentValidUntil||null,uploaded_by:user.id
  });
  if(insertError){
   const {error:cleanupError}=await supabase.storage.from("jec-partner-documents").remove([storagePath]);
   setError(cleanupError?insertError.message+" "+(en?"The uploaded file could not be cleaned up automatically.":"Le fichier importé n'a pas pu être supprimé automatiquement."):insertError.message);
  }else{
   setDocumentFile(null);setDocumentTitle("");setDocumentValidFrom("");setDocumentValidUntil("");
   setNotice(en?"Document uploaded securely.":"Document déposé de manière sécurisée.");await load();
  }
  setBusy(false);
 }

 async function createFollowUp(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const supabase=getSupabaseBrowserClient();if(!supabase||!canManage)return;
  setBusy(true);setError("");setNotice("");
  const {data:{user}}=await supabase.auth.getUser();if(!user){setBusy(false);return;}
  const dueAt=new Date(followUpDueAt);
  if(!followUpTitle.trim()||!followUpDueAt||Number.isNaN(dueAt.getTime())){setError(en?"Enter a title and a valid due date.":"Saisis un intitulé et une échéance valide.");setBusy(false);return;}
  const {error:e}=await supabase.from("jec_partner_follow_ups").insert({
   partner_id:partnerId,title:followUpTitle.trim(),details:followUpDetails.trim()||null,due_at:dueAt.toISOString(),
   status:"todo",priority:followUpPriority,assigned_to:followUpAssignMe?user.id:null,created_by:user.id
  });
  if(e)setError(e.message);else{setFollowUpTitle("");setFollowUpDetails("");setFollowUpDueAt("");setFollowUpPriority("normal");setNotice(en?"Follow-up scheduled.":"Relance planifiée.");await load();}
  setBusy(false);
 }

 async function updateFollowUpStatus(id:string,status:FollowUp["status"]){
  const supabase=getSupabaseBrowserClient();if(!supabase||!canManage)return;
  setBusy(true);setError("");setNotice("");
  const {error:e}=await supabase.from("jec_partner_follow_ups").update({
   status,completed_at:status==="done"?new Date().toISOString():null,updated_at:new Date().toISOString()
  }).eq("id",id);
  if(e)setError(e.message);else{setNotice(en?"Follow-up updated.":"Relance mise à jour.");await load();}
  setBusy(false);
 }

 async function updateOpportunityStatus(id:string,status:string){
  const supabase=getSupabaseBrowserClient();if(!supabase||!canManage)return;
  setBusy(true);setError("");setNotice("");
  const {error:e}=await supabase.from("jec_partner_opportunities").update({opportunity_status:status,updated_at:new Date().toISOString()}).eq("id",id);
  if(e)setError(e.message);else{setNotice(en?"Opportunity status updated.":"Statut de l'opportunité mis à jour.");await load();}
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
      {engagements.length?engagements.map(item=><article className="partner-private-row" key={item.id}><strong>{item.title}</strong><small>{item.engagement_type.replaceAll("_"," ")} · {item.engagement_status.replaceAll("_"," ")}</small>{item.summary&&<p>{item.summary}</p>}{item.support_amount!==null&&item.currency_code&&<strong>{new Intl.NumberFormat(en?"en-GB":"fr-FR",{maximumFractionDigits:2}).format(Number(item.support_amount))+" "+item.currency_code}</strong>}<time>{date(item.starts_on,en)} – {date(item.ends_on,en)} · {item.support_kind.replaceAll("_"," ")}</time></article>):<p className="collab-muted">{en?"No engagement recorded.":"Aucun engagement enregistré."}</p>}
      {canManage&&<form className="collab-form partner-inline-form" onSubmit={createEngagement}><h3>{en?"Add an engagement":"Ajouter une relation"}</h3><label>{en?"Title":"Intitulé"}<input value={engagementTitle} onChange={e=>setEngagementTitle(e.target.value)} required/></label><label>{en?"Relationship type":"Type de relation"}<select value={engagementType} onChange={e=>setEngagementType(e.target.value)}><option value="collaboration">{en?"Collaboration":"Collaboration"}</option><option value="network_membership">{en?"Network membership":"Appartenance à un réseau"}</option><option value="funding">{en?"Funding":"Financement"}</option><option value="education">{en?"Education":"Éducation"}</option><option value="international_exchange">{en?"International exchange":"Échange international"}</option><option value="event">{en?"Event":"Événement"}</option><option value="other">{en?"Other":"Autre"}</option></select></label><label>{en?"Summary":"Résumé"}<textarea rows={2} value={engagementSummary} onChange={e=>setEngagementSummary(e.target.value)}/></label><div className="partner-inline-fields"><label>{en?"Support type":"Nature du soutien"}<select value={engagementSupportKind} onChange={e=>setEngagementSupportKind(e.target.value)}><option value="non_financial">{en?"Non-financial":"Non financier"}</option><option value="funding">{en?"Funding":"Financement"}</option><option value="in_kind">{en?"In kind":"En nature"}</option><option value="expertise">{en?"Expertise":"Expertise"}</option><option value="network">{en?"Network":"Réseau"}</option><option value="event">{en?"Event":"Événement"}</option></select></label><label>{en?"Start date":"Début"}<input type="date" value={engagementStartsOn} onChange={e=>setEngagementStartsOn(e.target.value)}/></label><label>{en?"End date":"Fin"}<input type="date" value={engagementEndsOn} onChange={e=>setEngagementEndsOn(e.target.value)}/></label></div><div className="partner-inline-fields"><label>{en?"Amount (optional)":"Montant (facultatif)"}<input type="number" min="0" step="0.01" value={engagementAmount} onChange={e=>setEngagementAmount(e.target.value)}/></label><label>{en?"Currency":"Devise"}<select value={engagementCurrency} onChange={e=>setEngagementCurrency(e.target.value)}><option value="EUR">EUR</option><option value="USD">USD</option><option value="XAF">XAF</option><option value="GBP">GBP</option><option value="CHF">CHF</option></select></label></div><button className="primary-button" disabled={busy}>{en?"Save engagement":"Enregistrer la relation"}</button></form>}
     </section>
     <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"FUNDING & OPPORTUNITIES":"FINANCEMENTS ET OPPORTUNITÉS"}</p><h2>{en?"Opportunities":"Opportunités"}</h2></div><span className="collab-count">{opportunities.length}</span></div>
      {opportunities.length?opportunities.map(item=><article className="partner-private-row" key={item.id}><strong>{item.title}</strong><small>{item.opportunity_type.replaceAll("_"," ")} · {item.opportunity_status}</small>{item.description&&<p>{item.description}</p>}{item.expected_amount!==null&&item.currency_code&&<strong>{new Intl.NumberFormat(en?"en-GB":"fr-FR",{maximumFractionDigits:2}).format(Number(item.expected_amount))+" "+item.currency_code}</strong>}<time>{en?"Deadline":"Échéance"} : {date(item.deadline,en)}</time>{canManage&&<label className="partner-status-edit">{en?"Pipeline status":"Avancement"}<select value={item.opportunity_status} disabled={busy} onChange={e=>void updateOpportunityStatus(item.id,e.target.value)}><option value="identified">{en?"Identified":"Identifiée"}</option><option value="reviewing">{en?"Reviewing":"À l'étude"}</option><option value="submitted">{en?"Submitted":"Déposée"}</option><option value="accepted">{en?"Accepted":"Acceptée"}</option><option value="declined">{en?"Declined":"Refusée"}</option><option value="won">{en?"Won":"Obtenue"}</option><option value="closed">{en?"Closed":"Clôturée"}</option><option value="expired">{en?"Expired":"Expirée"}</option></select></label>}{item.source_url&&<a href={item.source_url} target="_blank" rel="noreferrer">{en?"Open source ↗":"Ouvrir la source ↗"}</a>}</article>):<p className="collab-muted">{en?"No opportunity recorded.":"Aucune opportunité enregistrée."}</p>}
      {canManage&&<form className="collab-form partner-inline-form" onSubmit={createOpportunity}><h3>{en?"Track an opportunity":"Suivre une opportunité"}</h3><label>{en?"Title":"Intitulé"}<input value={opportunityTitle} onChange={e=>setOpportunityTitle(e.target.value)} required/></label><label>{en?"Type":"Type"}<select value={opportunityType} onChange={e=>setOpportunityType(e.target.value)}><option value="funding_call">{en?"Funding call":"Appel à financement"}</option><option value="call_for_projects">{en?"Call for projects":"Appel à projets"}</option><option value="training">{en?"Training":"Formation"}</option><option value="sponsorship">{en?"Sponsorship":"Mécénat"}</option><option value="exchange">{en?"Exchange":"Échange"}</option><option value="other">{en?"Other":"Autre"}</option></select></label><label>{en?"Deadline":"Échéance"}<input type="date" value={opportunityDeadline} onChange={e=>setOpportunityDeadline(e.target.value)}/></label><label>{en?"Source URL":"Lien source"}<input type="url" value={opportunityUrl} onChange={e=>setOpportunityUrl(e.target.value)}/></label><label>{en?"Description":"Description"}<textarea rows={2} value={opportunityDescription} onChange={e=>setOpportunityDescription(e.target.value)}/></label><div className="partner-inline-fields"><label>{en?"Expected amount":"Montant attendu"}<input type="number" min="0" step="0.01" value={opportunityAmount} onChange={e=>setOpportunityAmount(e.target.value)}/></label><label>{en?"Currency":"Devise"}<select value={opportunityCurrency} onChange={e=>setOpportunityCurrency(e.target.value)}><option value="EUR">EUR</option><option value="USD">USD</option><option value="XAF">XAF</option><option value="GBP">GBP</option><option value="CHF">CHF</option></select></label></div><button className="primary-button" disabled={busy}>{en?"Save opportunity":"Enregistrer l'opportunité"}</button></form>}
     </section>
     <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"CONTACTS":"INTERLOCUTEURS"}</p><h2>{en?"Partner contacts":"Contacts partenaires"}</h2></div><span className="collab-count">{contacts.length}</span></div>
      {contacts.length?contacts.map(item=><article className="partner-private-row" key={item.id}><strong>{item.full_name}{item.is_primary?" · "+(en?"Main contact":"Contact principal"):""}</strong>{item.role_title&&<small>{item.role_title}</small>}{item.email&&<a href={"mailto:"+item.email}>{item.email}</a>}{item.phone&&<a href={"tel:"+item.phone}>{item.phone}</a>}<time>{en?"Preferred contact":"Canal préféré"} : {item.preferred_contact_method} · {en?"Consent":"Consentement"} : {item.consent_status}</time>{item.notes&&<p>{item.notes}</p>}</article>):<p className="collab-muted">{en?"No contact has been recorded.":"Aucun contact n'a été enregistré."}</p>}
     </section>
     {canManage&&<section className="collab-card partner-contact-add">canManage&&<form className="collab-form partner-inline-form" onSubmit={createContact}><h3>{en?"Add a contact":"Ajouter un interlocuteur"}</h3><div className="partner-inline-fields"><label>{en?"Full name":"Nom complet"}<input value={contactName} onChange={e=>setContactName(e.target.value)} required minLength={2}/></label><label>{en?"Role / title":"Fonction"}<input value={contactRole} onChange={e=>setContactRole(e.target.value)}/></label></div><div className="partner-inline-fields"><label>{en?"Email":"E-mail"}<input type="email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)}/></label><label>{en?"Phone":"Téléphone"}<input type="tel" value={contactPhone} onChange={e=>setContactPhone(e.target.value)}/></label></div><div className="partner-inline-fields"><label>{en?"Preferred channel":"Canal préféré"}<select value={contactMethod} onChange={e=>setContactMethod(e.target.value)}><option value="email">E-mail</option><option value="phone">{en?"Phone":"Téléphone"}</option><option value="meeting">{en?"Meeting":"Réunion"}</option><option value="other">{en?"Other":"Autre"}</option></select></label><label>{en?"Consent status":"État du consentement"}<select value={contactConsent} onChange={e=>setContactConsent(e.target.value as typeof contactConsent)}><option value="not_recorded">{en?"Not recorded":"Non renseigné"}</option><option value="pending">{en?"Pending":"En attente"}</option><option value="granted">{en?"Granted":"Accord donné"}</option><option value="withdrawn">{en?"Withdrawn":"Retiré"}</option></select></label></div><label>{en?"Internal note":"Note interne"}<textarea rows={2} value={contactNotes} onChange={e=>setContactNotes(e.target.value)}/></label><label className="partner-checkbox-label"><input type="checkbox" checked={contactPrimary} onChange={e=>setContactPrimary(e.target.checked)}/>{en?"Set as main contact":"Définir comme contact principal"}</label><button className="primary-button" disabled={busy}>{en?"Save contact":"Enregistrer le contact"}</button></form></section>}
      <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"AGREEMENTS & DOCUMENTS":"CONVENTIONS ET DOCUMENTS"}</p><h2>{en?"Documents":"Documents"}</h2></div><span className="collab-count">{documents.length}</span></div>
      {documents.length?documents.map(item=><article className="partner-private-row" key={item.id}><strong>{item.title}</strong><small>{item.document_type.replaceAll("_"," ")} · {item.document_status}</small><time>{date(item.valid_from,en)} – {date(item.valid_until,en)}</time><button className="secondary-outline-button" type="button" onClick={()=>void openDocument(item.storage_path)}>{en?"Open secure file":"Ouvrir le document sécurisé"}</button></article>):<p className="collab-muted">{en?"No agreement or document uploaded.":"Aucune convention ou pièce justificative déposée."}</p>}
      {canManage&&<form className="collab-form partner-inline-form" onSubmit={createDocument}><h3>{en?"Upload an agreement or document":"Déposer une convention ou un document"}</h3><label>{en?"File (20 MB max)":"Fichier (20 Mo max)"}<input type="file" accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp" onChange={e=>setDocumentFile(e.target.files?.[0]??null)} required/><small className="partner-field-hint">{documentFile?documentFile.name+" · "+(documentFile.size/1024/1024).toFixed(2)+" MB":(en?"Private storage, accessible only to authorised partner teams.":"Stockage privé, accessible uniquement aux équipes partenaires habilitées.")}</small></label><label>{en?"Document title":"Intitulé du document"}<input value={documentTitle} onChange={e=>setDocumentTitle(e.target.value)} placeholder={documentFile?.name}/></label><div className="partner-inline-fields"><label>{en?"Type":"Type"}<select value={documentType} onChange={e=>setDocumentType(e.target.value)}><option value="convention">{en?"Convention":"Convention"}</option><option value="agreement">{en?"Agreement":"Accord"}</option><option value="grant_letter">{en?"Grant letter":"Notification de financement"}</option><option value="report">{en?"Report":"Rapport"}</option><option value="invoice">{en?"Invoice":"Facture"}</option><option value="proof">{en?"Supporting evidence":"Justificatif"}</option><option value="other">{en?"Other":"Autre"}</option></select></label><label>{en?"Document status":"Statut"}<select value={documentStatus} onChange={e=>setDocumentStatus(e.target.value)}><option value="draft">{en?"Draft":"Brouillon"}</option><option value="under_review">{en?"Under review":"En validation"}</option><option value="signed">{en?"Signed":"Signé"}</option><option value="expired">{en?"Expired":"Expiré"}</option><option value="archived">{en?"Archived":"Archivé"}</option></select></label></div><div className="partner-inline-fields"><label>{en?"Valid from":"Valide à partir du"}<input type="date" value={documentValidFrom} onChange={e=>setDocumentValidFrom(e.target.value)}/></label><label>{en?"Valid until":"Valide jusqu'au"}<input type="date" value={documentValidUntil} onChange={e=>setDocumentValidUntil(e.target.value)}/></label></div><button className="primary-button" disabled={busy||!documentFile}>{busy?(en?"Uploading…":"Dépôt…"):(en?"Upload securely":"Déposer de manière sécurisée")}</button></form>}
     </section>
    </div>
    <section className="collab-card partner-followups-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"FOLLOW-UP DEADLINES":"ÉCHÉANCES DE SUIVI"}</p><h2>{en?"Planned follow-ups":"Relances et prochaines étapes"}</h2></div><span className="collab-count">{followUps.filter(item=>item.status!=="done"&&item.status!=="cancelled").length}</span></div>{followUps.length?followUps.map(item=><article className={"partner-private-row partner-followup-row "+(new Date(item.due_at).getTime()<Date.now()&&item.status!=="done"&&item.status!=="cancelled"?"is-overdue":"")} key={item.id}><div className="partner-followup-main"><strong>{item.title}</strong><span className={"partner-priority "+item.priority}>{item.priority==="high"?(en?"High priority":"Priorité haute"):item.priority==="low"?(en?"Low priority":"Priorité basse"):(en?"Normal priority":"Priorité normale")}</span></div>{item.details&&<p>{item.details}</p>}<time>{en?"Due":"Échéance"} : {new Date(item.due_at).toLocaleString(en?"en-GB":"fr-FR",{dateStyle:"medium",timeStyle:"short"})}</time>{canManage&&<label className="partner-status-edit">{en?"Progress":"Avancement"}<select value={item.status} disabled={busy} onChange={e=>void updateFollowUpStatus(item.id,e.target.value as FollowUp["status"])}><option value="todo">{en?"To do":"À faire"}</option><option value="in_progress">{en?"In progress":"En cours"}</option><option value="done">{en?"Done":"Terminée"}</option><option value="cancelled">{en?"Cancelled":"Annulée"}</option></select></label>}</article>):<p className="collab-muted">{en?"No follow-up scheduled yet.":"Aucune relance planifiée pour le moment."}</p>}{canManage&&<form className="collab-form partner-inline-form" onSubmit={createFollowUp}><h3>{en?"Schedule a follow-up":"Planifier une relance"}</h3><label>{en?"Next action":"Prochaine action"}<input value={followUpTitle} onChange={e=>setFollowUpTitle(e.target.value)} required minLength={2} maxLength={220}/></label><label>{en?"Details":"Détails"}<textarea rows={2} value={followUpDetails} onChange={e=>setFollowUpDetails(e.target.value)}/></label><div className="partner-inline-fields"><label>{en?"Due date and time":"Date et heure de relance"}<input type="datetime-local" value={followUpDueAt} onChange={e=>setFollowUpDueAt(e.target.value)} required/></label><label>{en?"Priority":"Priorité"}<select value={followUpPriority} onChange={e=>setFollowUpPriority(e.target.value as typeof followUpPriority)}><option value="low">{en?"Low":"Basse"}</option><option value="normal">{en?"Normal":"Normale"}</option><option value="high">{en?"High":"Haute"}</option></select></label></div><label className="partner-checkbox-label"><input type="checkbox" checked={followUpAssignMe} onChange={e=>setFollowUpAssignMe(e.target.checked)}/>{en?"Assign this follow-up to me":"M'assigner cette relance"}</label><button className="primary-button" disabled={busy}>{en?"Schedule follow-up":"Enregistrer la relance"}</button></form>}</section>
    {canManage&&<form className="collab-card partner-note-form" onSubmit={createNote}><h2>{en?"Relationship follow-up":"Suivi de la relation"}</h2><label>{en?"Internal note":"Note interne"}<textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} required placeholder={en?"Next step, meeting notes, reminder…":"Prochaine étape, échange, rappel…"} /></label><button className="primary-button" disabled={busy}>{en?"Save note":"Enregistrer la note"}</button></form>}
    {notes.length>0&&<section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"INTERNAL NOTES":"NOTES INTERNES"}</p><h2>{en?"Source and follow-up notes":"Sources et notes de suivi"}</h2></div><span className="collab-count">{notes.length}</span></div>{notes.map(item=><article className="partner-private-row" key={item.id}><p>{item.content}</p><time>{new Date(item.created_at).toLocaleString(en?"en-GB":"fr-FR")}</time></article>)}</section>}
    <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"CHANGE HISTORY":"HISTORIQUE"}</p><h2>{en?"Recent activity":"Activité récente"}</h2></div></div>{activity.map(item=><article className="partner-private-row" key={item.id}><p>{en?item.summary_en:item.summary_fr}</p><time>{new Date(item.created_at).toLocaleString(en?"en-GB":"fr-FR")}</time></article>)}</section>
   </>}
  </div>
 </main>;
}
