"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RightsStatus = "pending" | "approved" | "rejected";
type ConsentStatus = "pending" | "confirmed" | "not_applicable";
type PhotoAsset = {
  id: string; title_fr: string; title_en: string | null; caption_fr: string | null; caption_en: string | null;
  alt_text_fr: string; alt_text_en: string | null; event_name: string | null; event_date: string | null;
  country: string | null; image_url: string; source_name: string; source_url: string; photographer: string;
  license_name: string; license_url: string | null; rights_evidence: string | null; rights_status: RightsStatus;
  rights_confirmed: boolean; subject_consent_status: ConsentStatus; rights_notes: string | null;
  is_published: boolean; is_featured: boolean; sort_order: number; created_at: string;
};
type PhotoForm = {
  title_fr: string; title_en: string; caption_fr: string; caption_en: string; alt_text_fr: string; alt_text_en: string;
  event_name: string; event_date: string; country: string; image_url: string; source_name: string; source_url: string;
  photographer: string; license_name: string; license_url: string; rights_evidence: string;
  rights_status: RightsStatus; rights_confirmed: boolean; subject_consent_status: ConsentStatus; rights_notes: string;
  is_featured: boolean; sort_order: string;
};
function emptyForm(): PhotoForm {
  return { title_fr:"",title_en:"",caption_fr:"",caption_en:"",alt_text_fr:"",alt_text_en:"",event_name:"",event_date:"",
    country:"",image_url:"",source_name:"",source_url:"",photographer:"",license_name:"",license_url:"",
    rights_evidence:"",rights_status:"pending",rights_confirmed:false,subject_consent_status:"pending",rights_notes:"",
    is_featured:false,sort_order:"100" };
}
function dateValue(value: string | null) { return value ? value.slice(0,10) : ""; }

export default function PhotoLibraryAdminPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [loading,setLoading]=useState(true);
  const [isAdmin,setIsAdmin]=useState(false);
  const [items,setItems]=useState<PhotoAsset[]>([]);
  const [form,setForm]=useState<PhotoForm>(emptyForm);
  const [editingId,setEditingId]=useState<string|null>(null);
  const [saving,setSaving]=useState(false);
  const [busyId,setBusyId]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");

  async function load(){
    const supabase=getSupabaseBrowserClient();
    if(!supabase){setError(en?"Supabase is not configured.":"Supabase n’est pas configuré.");setLoading(false);return;}
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.href="/login?next=%2Fgestion%2Fphototheque";return;}
    const {data:admin,error:adminError}=await supabase.rpc("is_jec_admin");
    if(adminError||admin!==true){setIsAdmin(false);setLoading(false);return;}
    setIsAdmin(true);
    const [{data,error:queryError},{data:rightsRows,error:rightsError}]=await Promise.all([
      supabase.from("jec_photo_assets").select("*").order("created_at",{ascending:false}),
      supabase.from("jec_photo_rights").select("photo_id,rights_evidence,rights_notes,approved_by,approved_at")
    ]);
    if(queryError)setError(queryError.message);
    if(rightsError)setError(rightsError.message);
    type RightsRow={photo_id:string;rights_evidence:string|null;rights_notes:string|null;approved_by:string|null;approved_at:string|null};
    const rightsByPhoto=new Map<string,RightsRow>(((rightsRows??[]) as RightsRow[]).map(row=>[row.photo_id,row]));
    const photoRows=(data??[]) as Array<Omit<PhotoAsset,"rights_evidence"|"rights_notes">>;
    setItems(photoRows.map(item=>{
      const rights=rightsByPhoto.get(item.id);
      return {...item,rights_evidence:rights?.rights_evidence??null,rights_notes:rights?.rights_notes??null};
    }));
    setLoading(false);
  }
  useEffect(()=>{void load();},[]);

  function update<K extends keyof PhotoForm>(key:K,value:PhotoForm[K]){
    setForm(current=>({...current,[key]:value}));
  }
  function resetForm(){setEditingId(null);setForm(emptyForm());}

  function editPhoto(item:PhotoAsset){
    setEditingId(item.id);
    setForm({
      title_fr:item.title_fr,title_en:item.title_en??"",caption_fr:item.caption_fr??"",caption_en:item.caption_en??"",
      alt_text_fr:item.alt_text_fr,alt_text_en:item.alt_text_en??"",event_name:item.event_name??"",event_date:dateValue(item.event_date),
      country:item.country??"",image_url:item.image_url,source_name:item.source_name,source_url:item.source_url,
      photographer:item.photographer,license_name:item.license_name,license_url:item.license_url??"",
      rights_evidence:item.rights_evidence??"",rights_status:item.rights_status,rights_confirmed:item.rights_confirmed,
      subject_consent_status:item.subject_consent_status,rights_notes:item.rights_notes??"",
      is_featured:item.is_featured,sort_order:String(item.sort_order)
    });
    setError("");setMessage("");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function savePhoto(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setError("");setMessage("");
    if(!/^https:\/\//i.test(form.image_url.trim())||!/^https:\/\//i.test(form.source_url.trim())){
      setError(en?"The image and source URLs must use HTTPS.":"Les URL de l’image et de la source doivent utiliser HTTPS.");return;
    }
    if(form.license_url&&!/^https:\/\//i.test(form.license_url.trim())){
      setError(en?"The license URL must use HTTPS.":"L’URL de la licence doit utiliser HTTPS.");return;
    }
    if(form.rights_status==="approved"&&(!form.rights_confirmed||!form.rights_evidence.trim())){
      setError(en?"To mark rights as approved, confirm that permission is held and record the written evidence.":"Pour valider les droits, confirme que l’autorisation est détenue et renseigne la référence de la preuve écrite.");return;
    }
    if(form.subject_consent_status==="pending"&&form.rights_status==="approved"){
      setError(en?"Confirm the subjects’ consent, or mark it not applicable, before approving rights.":"Confirme le consentement des personnes photographiées, ou indique qu’il ne s’applique pas, avant de valider les droits.");return;
    }
    setSaving(true);
    try{
      const {data:{user}}=await supabase.auth.getUser();
      const payload={
        title_fr:form.title_fr.trim(),title_en:form.title_en.trim()||null,
        caption_fr:form.caption_fr.trim()||null,caption_en:form.caption_en.trim()||null,
        alt_text_fr:form.alt_text_fr.trim(),alt_text_en:form.alt_text_en.trim()||null,
        event_name:form.event_name.trim()||null,event_date:form.event_date||null,country:form.country.trim()||null,
        image_url:form.image_url.trim(),source_name:form.source_name.trim(),source_url:form.source_url.trim(),
        photographer:form.photographer.trim(),license_name:form.license_name.trim(),license_url:form.license_url.trim()||null,
        rights_status:form.rights_status,rights_confirmed:form.rights_confirmed,
        subject_consent_status:form.subject_consent_status,
        is_featured:form.is_featured,sort_order:Number(form.sort_order)||100,
        is_published:false,updated_at:new Date().toISOString()
      };
      let photoId=editingId;
      if(editingId){
        const {error:updateError}=await supabase.from("jec_photo_assets").update(payload).eq("id",editingId);
        if(updateError)throw updateError;
        setMessage(en?"Photo record updated and unpublished pending review.":"Fiche photo mise à jour et dépubliée en attente d’une nouvelle vérification.");
      }else{
        const {data:inserted,error:insertError}=await supabase.from("jec_photo_assets").insert(payload).select("id").single();
        if(insertError)throw insertError;
        photoId=inserted.id;
        setMessage(en?"Photo saved as an unpublished draft.":"Photo enregistrée en brouillon non publié.");
      }
      if(!photoId)throw new Error("Photo record id is missing.");
      const {error:rightsSaveError}=await supabase.from("jec_photo_rights").upsert({
        photo_id:photoId,
        rights_evidence:form.rights_evidence.trim()||null,
        rights_notes:form.rights_notes.trim()||null,
        approved_by:null,
        approved_at:null,
        updated_at:new Date().toISOString()
      },{onConflict:"photo_id"});
      if(rightsSaveError)throw rightsSaveError;
      resetForm();await load();
    }catch(saveError){
      setError(saveError instanceof Error?saveError.message:(en?"Unable to save the photo record.":"Impossible d’enregistrer la fiche photo."));
    }finally{setSaving(false);}
  }

  async function togglePublished(item:PhotoAsset){
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    const next=!item.is_published;
    if(next&&(item.rights_status!=="approved"||!item.rights_confirmed||!item.rights_evidence?.trim()||!["confirmed","not_applicable"].includes(item.subject_consent_status))){
      setError(en?"This photo is not ready: rights evidence and subject consent must be cleared first.":"Cette photo n’est pas prête : la preuve des droits et le consentement des personnes doivent être validés.");return;
    }
    setBusyId(item.id);setError("");setMessage("");
    const {data:{user}}=await supabase.auth.getUser();
    if(next){
      const {error:rightsApprovalError}=await supabase.from("jec_photo_rights").update({
        approved_by:user?.id??null,approved_at:new Date().toISOString(),updated_at:new Date().toISOString()
      }).eq("photo_id",item.id);
      if(rightsApprovalError){setError(rightsApprovalError.message);setBusyId(null);return;}
    }
    const {error:updateError}=await supabase.from("jec_photo_assets").update({
      is_published:next,updated_at:new Date().toISOString()
    }).eq("id",item.id);
    if(updateError)setError(updateError.message);
    else{
      if(!next){
        const {error:clearApprovalError}=await supabase.from("jec_photo_rights").update({
          approved_by:null,approved_at:null,updated_at:new Date().toISOString()
        }).eq("photo_id",item.id);
        if(clearApprovalError)setError(clearApprovalError.message);
      }
      setMessage(next?(en?"Photo published to the public gallery.":"Photo publiée dans la galerie publique."):(en?"Photo unpublished.":"Photo dépubliée."));
      await load();
    }
    setBusyId(null);
  }

  async function deletePhoto(item:PhotoAsset){
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    if(!window.confirm(en?"Delete this photo record? The external image will not be deleted.":"Supprimer cette fiche photo ? L’image hébergée à l’extérieur ne sera pas supprimée."))return;
    setBusyId(item.id);setError("");setMessage("");
    const {error:deleteError}=await supabase.from("jec_photo_assets").delete().eq("id",item.id);
    if(deleteError)setError(deleteError.message);else{setMessage(en?"Photo record deleted.":"Fiche photo supprimée.");if(editingId===item.id)resetForm();await load();}
    setBusyId(null);
  }

  const published=items.filter(item=>item.is_published);
  const pending=items.filter(item=>!item.is_published);
  const readyCount=items.filter(item=>item.rights_status==="approved"&&item.rights_confirmed&&item.rights_evidence&&["confirmed","not_applicable"].includes(item.subject_consent_status)).length;

  return <main className="admin-page">
    <header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/gestion" className="back-link-inline">{en?"Back to administration":"Retour à l’administration"}</Link></div></header>
    <div className="admin-content photo-library-admin">
      <p className="eyebrow">{en?"MEDIA GOVERNANCE":"GESTION DES MÉDIAS"}</p>
      <h1>{en?"JEC photo library":"Photothèque JEC"}</h1>
      <p className="public-content-intro">{en?"Curate real photographs from JEC movements and events. Add the public image URL, original source, photographer, license and rights evidence. Only cleared photographs can be published.":"Centralise les vraies photographies des mouvements et événements JEC. Ajoute l’URL publique de l’image, sa source d’origine, le photographe, la licence et la preuve des droits. Seules les photos validées pourront être publiées."}</p>
      {loading?<p className="muted">{en?"Checking permissions…":"Vérification des permissions…"}</p>
        :!isAdmin?<section className="admin-locked"><h2>{en?"Administrator access required":"Accès administrateur requis"}</h2><p>{en?"Only a JEC-conNEcT administrator can manage the photo library.":"Seul un administrateur JEC-conNEcT peut gérer la photothèque."}</p></section>
        :<>
          <div className="photo-admin-stats">
            <article><strong>{items.length}</strong><span>{en?"Photo records":"Fiches photo"}</span></article>
            <article><strong>{published.length}</strong><span>{en?"Published":"Publiées"}</span></article>
            <article><strong>{pending.length}</strong><span>{en?"Unpublished drafts":"Brouillons"}</span></article>
            <article><strong>{readyCount}</strong><span>{en?"Rights-cleared":"Droits vérifiés"}</span></article>
          </div>
          <section className="admin-section photo-admin-notice">
            <p className="eyebrow">{en?"IMPORTANT — RIGHTS AND CONSENT":"IMPORTANT — DROITS ET CONSENTEMENT"}</p>
            <p>{en?"Do not copy or embed photographs from JEC France, JECI-MIEC or IYCS reports and websites unless the rights holder has authorised reuse in writing. A public page or an accessible image URL does not grant reuse rights.":"Ne copie et n’intègre aucune photographie des sites ou rapports JEC France, JECI-MIEC ou IYCS sans autorisation écrite du détenteur des droits. Une page publique ou une URL d’image accessible ne vaut pas autorisation de réutilisation."}</p>
            <p>{en?"Use an HTTPS URL for an image already hosted by an authorised source. This manager stores the record and displays the image; it does not upload or copy the image file.":"Utilise une URL HTTPS vers une image déjà hébergée par une source autorisée. Ce gestionnaire enregistre la fiche et affiche l’image ; il ne téléverse ni ne copie le fichier."}</p>
          </section>
          <section className="admin-section photo-official-sources">
            <div className="directory-section-heading"><div><p className="eyebrow">{en?"OFFICIAL SOURCES":"SOURCES OFFICIELLES"}</p><h2>{en?"Where to request original photographs":"Où demander les photographies originales"}</h2></div></div>
            <div className="photo-source-links">
              <article><strong>JEC France</strong><p>{en?"News, camps, training sessions and national-team life. Ask the association for written permission and the original files.":"Actualités, camps, formations et vie des équipes nationales. Demander une autorisation écrite et les fichiers originaux à l’association."}</p><a href="https://jecfrance.org/" target="_blank" rel="noreferrer">jecfrance.org ↗</a><small>contact@jecfrance.org</small><a className="photo-source-legal" href="https://jecfrance.org/mentions-legales/" target="_blank" rel="noreferrer">{en?"Legal notice":"Mentions légales"} ↗</a></article>
              <article><strong>JECI-MIEC Europe</strong><p>{en?"Recaps and reports from European committees, anniversary meetings and study sessions.":"Récaps et comptes rendus des comités européens, anniversaires et sessions d’étude."}</p><a href="https://www.jecimiec.eu/category/recap-events/" target="_blank" rel="noreferrer">Recap &amp; Events ↗</a><small>jeci.miec.europe@gmail.com</small></article>
              <article><strong>IYCS-JECI International</strong><p>{en?"International events and national-movement visits. The 2023 Annual Report explicitly requires prior written permission before copying or storing its contents.":"Événements internationaux et visites des mouvements nationaux. Le rapport annuel 2023 exige une autorisation écrite préalable pour copier ou stocker son contenu."}</p><a href="https://iycs-jeci.org/" target="_blank" rel="noreferrer">iycs-jeci.org ↗</a><small>mail@iycs-jeci.org</small><a className="photo-source-legal" href="https://iycs-jeci.org/wp-content/uploads/2025/08/2023-IYCS-Annual-Report-EN.pdf" target="_blank" rel="noreferrer">{en?"2023 Annual Report (permission required)":"Rapport annuel 2023 (autorisation requise)"} ↗</a></article>
              <article><strong>{en?"Council of Europe · Youth":"Conseil de l’Europe · Jeunesse"}</strong><p>{en?"Its article documents the JECI-MIEC study session in Budapest (20–24 April 2026) and includes an image gallery. Request permission from the photographer or rights holder before reuse.":"Son article documente la session d’étude JECI-MIEC à Budapest (20–24 avril 2026) et comporte une galerie. Demander l’autorisation du photographe ou de l’ayant droit avant toute réutilisation."}</p><a href="https://www.coe.int/fr/web/youth/-/mental-health-for-all-awareness-action-and-advocacy" target="_blank" rel="noreferrer">{en?"Open photo gallery":"Ouvrir la galerie photo"} ↗</a><small>{en?"European Youth Centre Budapest":"Centre européen de la jeunesse de Budapest"}</small></article>
            </div>
          </section>
          {error&&<p className="alert error">{error}</p>}{message&&<p className="alert success">{message}</p>}
          <section className="admin-section photo-admin-editor" id="photo-editor">
            <div className="directory-section-heading"><div><p className="eyebrow">{en?"PHOTO RECORD":"FICHE PHOTO"}</p><h2>{editingId?(en?"Edit photo record":"Modifier la fiche photo"):(en?"Add a photograph":"Ajouter une photographie")}</h2></div><span>{editingId?(en?"Editing":"Modification"):(en?"Draft":"Brouillon")}</span></div>
            <form className="account-form photo-admin-form" onSubmit={savePhoto}>
              <div className="photo-admin-url-row">
                <label>{en?"Public image URL (HTTPS)":"URL publique de l’image (HTTPS)"}<input type="url" required placeholder="https://" value={form.image_url} onChange={e=>update("image_url",e.target.value)}/></label>
                <div className="photo-admin-live-preview">{form.image_url?<img src={form.image_url} alt={form.alt_text_fr||"Aperçu de la photo"}/>:<span>{en?"Image preview":"Aperçu de la photo"}</span>}</div>
              </div>
              <div className="public-content-two-cols">
                <label>{en?"Title (French)":"Titre (français)"}<input required minLength={3} maxLength={180} value={form.title_fr} onChange={e=>update("title_fr",e.target.value)}/></label>
                <label>{en?"Title (English)":"Titre (anglais)"}<input maxLength={180} value={form.title_en} onChange={e=>update("title_en",e.target.value)}/></label>
              </div>
              <div className="public-content-two-cols">
                <label>{en?"Alternative text (French)":"Texte alternatif (français)"}<input required minLength={5} maxLength={250} value={form.alt_text_fr} onChange={e=>update("alt_text_fr",e.target.value)}/></label>
                <label>{en?"Alternative text (English)":"Texte alternatif (anglais)"}<input maxLength={250} value={form.alt_text_en} onChange={e=>update("alt_text_en",e.target.value)}/></label>
              </div>
              <div className="public-content-two-cols">
                <label>{en?"Caption (French)":"Légende (français)"}<textarea rows={2} value={form.caption_fr} onChange={e=>update("caption_fr",e.target.value)}/></label>
                <label>{en?"Caption (English)":"Légende (anglais)"}<textarea rows={2} value={form.caption_en} onChange={e=>update("caption_en",e.target.value)}/></label>
              </div>
              <div className="photo-admin-subheading"><span>01</span><b>{en?"Event and context":"Événement et contexte"}</b></div>
              <div className="public-content-two-cols">
                <label>{en?"Event / activity":"Événement / activité"}<input maxLength={180} value={form.event_name} onChange={e=>update("event_name",e.target.value)} placeholder={en?"e.g. European Committee 2026":"Ex. Comité européen 2026"}/></label>
                <label>{en?"Event date":"Date de l’événement"}<input type="date" value={form.event_date} onChange={e=>update("event_date",e.target.value)}/></label>
              </div>
              <label>{en?"Country / location":"Pays / lieu"}<input maxLength={120} value={form.country} onChange={e=>update("country",e.target.value)}/></label>
              <div className="photo-admin-subheading"><span>02</span><b>{en?"Source and photographer":"Source et photographe"}</b></div>
              <div className="public-content-two-cols">
                <label>{en?"Organisation / source":"Organisation / source"}<input required minLength={2} maxLength={160} value={form.source_name} onChange={e=>update("source_name",e.target.value)}/></label>
                <label>{en?"Original source page":"Page source d’origine"}<input type="url" required placeholder="https://" value={form.source_url} onChange={e=>update("source_url",e.target.value)}/></label>
              </div>
              <div className="public-content-two-cols">
                <label>{en?"Photographer / author":"Photographe / auteur"}<input required minLength={2} maxLength={160} value={form.photographer} onChange={e=>update("photographer",e.target.value)}/></label>
                <label>{en?"License / permission":"Licence / autorisation"}<input required minLength={2} maxLength={160} value={form.license_name} onChange={e=>update("license_name",e.target.value)} placeholder={en?"e.g. Written permission from YCS":"Ex. Autorisation écrite de la JEC"}/></label>
              </div>
              <label>{en?"License URL (if public)":"URL de la licence (si publique)"}<input type="url" placeholder="https://" value={form.license_url} onChange={e=>update("license_url",e.target.value)}/></label>
              <div className="photo-admin-subheading"><span>03</span><b>{en?"Publication rights and consent":"Droits de publication et consentement"}</b></div>
              <div className="public-content-two-cols">
                <label>{en?"Rights status":"Statut des droits"}<select value={form.rights_status} onChange={e=>update("rights_status",e.target.value as RightsStatus)}><option value="pending">{en?"To be checked":"À vérifier"}</option><option value="approved">{en?"Approved":"Autorisés"}</option><option value="rejected">{en?"Rejected":"Refusés"}</option></select></label>
                <label>{en?"People in the image":"Personnes photographiées"}<select value={form.subject_consent_status} onChange={e=>update("subject_consent_status",e.target.value as ConsentStatus)}><option value="pending">{en?"Consent to be checked":"Consentement à vérifier"}</option><option value="confirmed">{en?"Consent confirmed":"Consentement confirmé"}</option><option value="not_applicable">{en?"Not applicable (no identifiable people)":"Non applicable (aucune personne identifiable)"}</option></select></label>
              </div>
              <label className="photo-admin-checkbox"><input type="checkbox" checked={form.rights_confirmed} onChange={e=>update("rights_confirmed",e.target.checked)}/><span>{en?"I confirm that JEC Connect holds the necessary permission or a valid license to reuse this photograph.":"Je confirme que JEC Connect détient l’autorisation nécessaire ou une licence valide pour réutiliser cette photographie."}</span></label>
              <label>{en?"Evidence of permission (required to publish)":"Référence de la preuve d’autorisation (obligatoire pour publier)"}<input required={form.rights_status==="approved"} value={form.rights_evidence} onChange={e=>update("rights_evidence",e.target.value)} placeholder={en?"Email from rights holder, license record, agreement date…":"Courriel du détenteur, référence de licence, date de l’accord…"}/></label>
              <label>{en?"Internal notes":"Notes internes"}<textarea rows={2} value={form.rights_notes} onChange={e=>update("rights_notes",e.target.value)}/></label>
              <div className="public-content-two-cols">
                <label>{en?"Display order":"Ordre d’affichage"}<input type="number" min={0} max={10000} value={form.sort_order} onChange={e=>update("sort_order",e.target.value)}/></label>
                <label className="photo-admin-checkbox"><input type="checkbox" checked={form.is_featured} onChange={e=>update("is_featured",e.target.checked)}/><span>{en?"Feature this photo in the gallery":"Mettre cette photo à la une"}</span></label>
              </div>
              <div className="public-content-form-actions">
                <button className="primary-button" disabled={saving}>{saving?(en?"Saving…":"Enregistrement…"):editingId?(en?"Save changes":"Enregistrer les modifications"):(en?"Save as unpublished draft":"Enregistrer en brouillon non publié")}</button>
                {editingId&&<button type="button" className="quiet-button" onClick={resetForm}>{en?"Cancel":"Annuler"}</button>}
              </div>
            </form>
          </section>

          <section className="admin-section">
            <div className="directory-section-heading"><div><p className="eyebrow">{en?"COLLECTION MANAGEMENT":"GESTION DE LA COLLECTION"}</p><h2>{en?"All photo records":"Toutes les fiches photo"}</h2></div><span>{items.length}</span></div>
            {items.length?items.map(item=><article className="photo-admin-row" key={item.id}>
              <img src={item.image_url} alt="" loading="lazy"/>
              <div className="photo-admin-row-main"><strong>{en?(item.title_en||item.title_fr):item.title_fr}</strong><small>{item.event_name||item.source_name} · {item.photographer}</small><div className="photo-admin-pills"><span className={"photo-rights-pill "+item.rights_status}>{item.rights_status==="approved"?(en?"Rights approved":"Droits approuvés"):item.rights_status==="rejected"?(en?"Rights rejected":"Droits refusés"):(en?"Rights pending":"Droits en attente")}</span><span className={"photo-state-pill "+(item.is_published?"published":"draft")}>{item.is_published?(en?"Published":"Publiée"):(en?"Unpublished":"Non publiée")}</span><span className="photo-state-pill">{item.subject_consent_status==="confirmed"?(en?"Consent confirmed":"Consentement confirmé"):item.subject_consent_status==="not_applicable"?(en?"Consent N/A":"Consent. N/A"):(en?"Consent pending":"Consentement en attente")}</span></div></div>
              <div className="photo-admin-row-actions"><button className="quiet-button" onClick={()=>editPhoto(item)}>{en?"Edit":"Modifier"}</button><button className={item.is_published?"quiet-button":"secondary-outline-button"} disabled={busyId===item.id} onClick={()=>void togglePublished(item)}>{busyId===item.id?(en?"Working…":"En cours…"):item.is_published?(en?"Unpublish":"Dépublier"):(en?"Publish":"Publier")}</button><button className="danger-outline-button" disabled={busyId===item.id} onClick={()=>void deletePhoto(item)}>{en?"Delete":"Supprimer"}</button></div>
            </article>):<p className="admin-help">{en?"No photographs have been registered yet. Start by adding an image URL with its original source and rights evidence.":"Aucune photographie n’a encore été enregistrée. Commence par ajouter une URL d’image avec sa source d’origine et la preuve des droits."}</p>}
          </section>
        </>}
      <p className="photo-library-admin-footer"><Link href="/phototheque">{en?"Preview the public photo gallery →":"Prévisualiser la photothèque publique →"}</Link></p>
    </div>
  </main>;
}
