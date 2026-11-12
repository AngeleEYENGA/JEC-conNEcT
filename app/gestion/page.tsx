"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type PendingMember={user_id:string;membership_status:string;structure_name:string|null;jec_profiles:{first_name:string|null;last_name:string|null;display_name:string|null}|null};

export default function AdminPage(){
  const {lang}=useLanguage();
  const en=lang==="en";
  const [loading,setLoading]=useState(true);
  const [isAdmin,setIsAdmin]=useState(false);
  const [members,setMembers]=useState<PendingMember[]>([]);
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
    const {data,error:membersError}=await supabase.from("jec_memberships")
      .select("user_id,membership_status,structure_name,jec_profiles(first_name,last_name,display_name)")
      .eq("membership_status","pending")
      .order("created_at");
    if(membersError)setError(membersError.message);
    setMembers((data??[]) as unknown as PendingMember[]);
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
    else {setMessage(en?"Draft directory entry created. Publish it after validation.":"Fiche d'annuaire créée en brouillon. Elle pourra être publiée après validation.");setFullName("");setRoleTitle("");setStructure("");setDescription("");setContact("");}
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
          {members.length?members.map(m=><article className="admin-member-row" key={m.user_id}><div><strong>{m.jec_profiles?.display_name||[m.jec_profiles?.first_name,m.jec_profiles?.last_name].filter(Boolean).join(" ")||en?"New account":"Nouveau compte"}</strong><small>{m.user_id}</small>{m.structure_name&&<small>{m.structure_name}</small>}</div><div><button className="primary-button" onClick={()=>validateMember(m.user_id,"verified")}>{en?"Verify member":"Valider le membre"}</button><button className="quiet-button" onClick={()=>validateMember(m.user_id,"rejected")}>{en?"Decline":"Refuser"}</button></div></article>):<div className="directory-empty compact"><p>{en?"No pending membership request.":"Aucune demande d'adhésion en attente."}</p></div>}
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
        </section>
      </>}
      {error&&<p className="alert error">{error}</p>}{message&&<p className="alert success">{message}</p>}
    </div>
  </main>;
}
