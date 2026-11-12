"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PendingMember={user_id:string;email:string|null;created_at:string;structure_name:string|null;display_name:string|null;first_name:string|null;last_name:string|null};
type DirectoryDraft={id:string;full_name:string;role_title:string;category:string;structure_name:string|null;visibility:string};
type AudioDraft={id:string;song_id:string;language:string;file_name:string;uploaded_by:string;created_at:string};

export default function AdminPage(){
  const {lang}=useLanguage();
  const en=lang==="en";
  const [loading,setLoading]=useState(true);
  const [isAdmin,setIsAdmin]=useState(false);
  const [members,setMembers]=useState<PendingMember[]>([]);
  const [directoryDrafts,setDirectoryDrafts]=useState<DirectoryDraft[]>([]);
  const [audioDrafts,setAudioDrafts]=useState<AudioDraft[]>([]);
  const [publishingAudioId,setPublishingAudioId]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [category,setCategory]=useState("bureau_national");
  const [fullName,setFullName]=useState("");
  const [roleTitle,setRoleTitle]=useState("");
  const [structure,setStructure]=useState("");
  const [description,setDescription]=useState("");
  const [contact,setContact]=useState("");
  const [visibility,setVisibility]=useState<"public"|"members">("public");

  async function load(){
    const supabase=getSupabaseBrowserClient();
    if(!supabase){setLoading(false);return;}
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.href="/login";return;}
    const {data:admin}=await supabase.rpc("is_jec_admin");
    if(admin!==true){setIsAdmin(false);setLoading(false);return;}
    setIsAdmin(true);
    const {data:pendingRows,error:membersError}=await supabase.rpc("jec_admin_pending_memberships");
    if(membersError)setError(membersError.message);
    setMembers((pendingRows??[]) as PendingMember[]);
    const {data:drafts,error:draftsError}=await supabase.from("jec_directory_entries").select("id,full_name,role_title,category,structure_name,visibility").eq("is_published",false).order("created_at",{ascending:false});
    if(draftsError)setError(draftsError.message);
    setDirectoryDrafts((drafts??[]) as DirectoryDraft[]);
    const {data:audioRows,error:audioError}=await supabase.from("jec_song_audio").select("id,song_id,language,file_name,uploaded_by,created_at").eq("bucket_id","jec-audio").eq("is_published",false).order("created_at",{ascending:false});
    if(audioError)setError(audioError.message);
    setAudioDrafts((audioRows??[]) as AudioDraft[]);
    setLoading(false);
  }

  useEffect(()=>{void load();},[]);

  async function validateMember(userId:string,status:"verified"|"rejected"){
    const supabase=getSupabaseBrowserClient();
    if(!supabase)return;
    setError("");setMessage("");
    const {data:{user}}=await supabase.auth.getUser();
    const {error:updateError}=await supabase.from("jec_memberships").update({
      membership_status:status,
      verified_at:new Date().toISOString(),
      verified_by:user?.id??null,
      updated_at:new Date().toISOString()
    }).eq("user_id",userId);
    if(updateError)setError(updateError.message);
    else {setMessage(en?"Membership status updated.":"Statut d'adhésion mis à jour.");await load();}
  }

  async function createDirectoryEntry(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const supabase=getSupabaseBrowserClient();
    if(!supabase)return;
    setError("");setMessage("");
    const {data:{user}}=await supabase.auth.getUser();
    const {error:insertError}=await supabase.from("jec_directory_entries").insert({
      category,full_name:fullName.trim(),role_title:roleTitle.trim(),
      structure_name:structure.trim()||null,description:description.trim()||null,
      functional_email:contact.trim()||null,visibility,is_published:false,
      created_by:user?.id??null
    });
    if(insertError)setError(insertError.message);
    else {setMessage(en?"Draft directory entry created. Publish it after validation.":"Fiche d'annuaire créée en brouillon. Elle pourra être publiée après validation.");setFullName("");setRoleTitle("");setStructure("");setDescription("");setContact("");await load();}
  }

  async function publishAudioDraft(id:string){
    const supabase=getSupabaseBrowserClient();
    if(!supabase)return;
    setPublishingAudioId(id);setError("");setMessage("");
    try{
      const {data:draft,error:draftError}=await supabase.from("jec_song_audio").select("id,song_id,language,storage_path,file_name,mime_type,bucket_id").eq("id",id).single();
      if(draftError||!draft)throw draftError??new Error("Audio draft not found.");
      const {data:file,error:downloadError}=await supabase.storage.from("jec-audio").download(draft.storage_path);
      if(downloadError||!file)throw downloadError??new Error("Unable to retrieve the private audio.");
      const {data:{user}}=await supabase.auth.getUser();
      const safeName=(draft.file_name||"audio").normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(-100)||"audio";
      const publicPath="official/"+draft.song_id+"/"+draft.language+"/"+Date.now()+"-"+safeName;
      const {error:uploadError}=await supabase.storage.from("jec-audio-public").upload(publicPath,file,{contentType:draft.mime_type||file.type||"audio/mpeg",upsert:false});
      if(uploadError)throw uploadError;
      const {error:updateError}=await supabase.from("jec_song_audio").update({
        bucket_id:"jec-audio-public",storage_path:publicPath,is_published:true,
        published_at:new Date().toISOString(),published_by:user?.id??null
      }).eq("id",id);
      if(updateError){await supabase.storage.from("jec-audio-public").remove([publicPath]);throw updateError;}
      setMessage(en?"Audio published to the public music library.":"Audio publié dans la bibliothèque musicale publique.");
      await load();
    }catch(error){setError(error instanceof Error?error.message:(en?"Unable to publish audio.":"Impossible de publier cet audio."));}
    finally{setPublishingAudioId(null);}
  }

  async function publishEntry(id:string){
    const supabase=getSupabaseBrowserClient();
    if(!supabase)return;
    const {error:publishError}=await supabase.from("jec_directory_entries").update({is_published:true,updated_at:new Date().toISOString()}).eq("id",id);
    if(publishError)setError(publishError.message);
    else {setMessage(en?"Directory entry published.":"Fiche d'annuaire publiée.");await load();}
  }

  const roleLabels:Record<string,string>={bureau_national:en?"National board":"Bureau national",equipe_nationale:en?"National team":"Équipe nationale",federation:en?"Federation":"Fédération",equipe_locale:en?"Local team":"Équipe locale",commission:en?"Commission":"Commission",service:en?"Service":"Service"};

  return <main className="admin-page">
    <header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/" className="back-link-inline">{en?"Back to portal":"Retour au portail"}</Link></div></header>
    <div className="admin-content">
      <p className="eyebrow">{en?"GOVERNANCE":"GOUVERNANCE"}</p><h1>{en?"JEC-conNEcT administration":"Administration JEC-conNEcT"}</h1>
      {loading?<p className="muted">{en?"Checking permissions…":"Vérification des permissions…"}</p>:!isAdmin?<section className="admin-locked"><h2>{en?"Administrator access required":"Accès administrateur requis"}</h2><p>{en?"Your account is connected, but it has not been granted JEC-conNEcT administrator privileges. Membership verification and administrator authorization are separate decisions.":"Ton compte est connecté, mais il ne dispose pas des droits d'administration de JEC-conNEcT. La validation de l'adhésion et l'autorisation d'administration sont deux décisions distinctes."}</p><p>{en?"The first administrator must be explicitly added by a project owner in the Supabase SQL Editor after checking the person's account email.":"Le premier administrateur doit être ajouté explicitement par le propriétaire du projet dans l'éditeur SQL Supabase, après vérification de l'adresse e-mail du compte."}</p></section>:<>
        <section className="admin-section"><div className="directory-section-heading"><div><p className="eyebrow">{en?"MEMBERSHIP":"ADHÉSIONS"}</p><h2>{en?"Membership requests":"Demandes d'adhésion"}</h2></div><span>{members.length} {en?"pending":"en attente"}</span></div>
          {members.length?members.map(m=><article className="admin-member-row" key={m.user_id}><div><strong>{m.display_name||[m.first_name,m.last_name].filter(Boolean).join(" ")||m.email||(en?"New account":"Nouveau compte")}</strong><small>{m.email??m.user_id}</small>{m.structure_name&&<small>{m.structure_name}</small>}</div><div><button className="primary-button" onClick={()=>validateMember(m.user_id,"verified")}>{en?"Verify member":"Valider le membre"}</button><button className="quiet-button" onClick={()=>validateMember(m.user_id,"rejected")}>{en?"Decline":"Refuser"}</button></div></article>):<div className="directory-empty compact"><p>{en?"No pending membership request.":"Aucune demande d'adhésion en attente."}</p></div>}
        </section>
        <section className="admin-section">
          <div className="directory-section-heading"><div><p className="eyebrow">{en?"MUSIC LIBRARY":"BIBLIOTHÈQUE MUSICALE"}</p><h2>{en?"Audio awaiting publication":"Audios en attente de publication"}</h2></div><span>{audioDrafts.length} {en?"drafts":"brouillons"}</span></div>
          <p className="admin-help">{en?"Members' uploads remain private until an administrator checks the recording and has confirmed the rights to publish it.":"Les audios déposés par les membres restent privés jusqu'à ce qu'un administrateur vérifie l'enregistrement et confirme les droits de diffusion."}</p>
          {audioDrafts.length?audioDrafts.map(audio=><article className="admin-member-row" key={audio.id}><div><strong>{audio.song_id==="rally"?(en?"Rallying song":"Chant de ralliement"):(en?"JEC anthem":"Hymne de la JEC")} · {audio.language.toUpperCase()}</strong><small>{audio.file_name} · {new Date(audio.created_at).toLocaleDateString(en?"en-GB":"fr-FR")}</small><small>{en?"Uploader":"Déposé par"} : {audio.uploaded_by}</small></div><button className="primary-button" disabled={publishingAudioId===audio.id} onClick={()=>publishAudioDraft(audio.id)}>{publishingAudioId===audio.id?(en?"Publishing…":"Publication…"):(en?"Publish publicly":"Publier publiquement")}</button></article>):<div className="directory-empty compact"><p>{en?"No audio draft awaits publication.":"Aucun audio n'attend actuellement de publication."}</p></div>}
        </section>
        <section className="admin-section"><p className="eyebrow">{en?"INSTITUTIONAL DIRECTORY":"ANNUAIRE INSTITUTIONNEL"}</p><h2>{en?"Create an official role":"Créer une fonction officielle"}</h2><p className="admin-help">{en?"Enter only names and responsibilities confirmed by JEC France. New entries are drafts and are not visible until published.":"Saisis uniquement des noms et responsabilités confirmés par la JEC France. Les nouvelles fiches sont des brouillons invisibles avant publication."}</p>
          <form className="account-form" onSubmit={createDirectoryEntry}>
            <label>{en?"Category":"Catégorie"}<select value={category} onChange={e=>setCategory(e.target.value)}>{Object.entries(roleLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>
            <label>{en?"Full name":"Nom complet"}<input value={fullName} onChange={e=>setFullName(e.target.value)} required maxLength={160}/></label>
            <label>{en?"Role / title":"Fonction"}<input value={roleTitle} onChange={e=>setRoleTitle(e.target.value)} required maxLength={160}/></label>
            <label>{en?"Structure":"Structure"}<input value={structure} onChange={e=>setStructure(e.target.value)}/></label>
            <label>{en?"Description":"Description"}<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3}/></label>
            <label>{en?"Functional email":"E-mail fonctionnel"}<input type="email" value={contact} onChange={e=>setContact(e.target.value)}/></label>
            <label>{en?"Visibility":"Visibilité"}<select value={visibility} onChange={e=>setVisibility(e.target.value as "public"|"members")}><option value="public">{en?"Public":"Publique"}</option><option value="members">{en?"Verified members only":"Membres vérifiés uniquement"}</option></select></label>
            <button className="primary-button">{en?"Save draft":"Enregistrer le brouillon"}</button>
          </form>
          <div className="admin-drafts"><h3>{en?"Unpublished directory entries":"Fiches d'annuaire non publiées"}</h3>{directoryDrafts.length?directoryDrafts.map(d=><article className="admin-member-row" key={d.id}><div><strong>{d.role_title} · {d.full_name}</strong><small>{roleLabels[d.category]??d.category}{d.structure_name?" · "+d.structure_name:""} · {d.visibility==="public"?(en?"Public":"Publique"):(en?"Members only":"Membres")}</small></div><button className="primary-button" onClick={()=>publishEntry(d.id)}>{en?"Publish":"Publier"}</button></article>):<p className="muted">{en?"No unpublished directory entry.":"Aucune fiche non publiée."}</p>}</div>
        </section>
      </>}
      {error&&<p className="alert error">{error}</p>}{message&&<p className="alert success">{message}</p>}
    </div>
  </main>;
}
