"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type MembershipStatus = "pending" | "verified" | "rejected";

export default function AccountPage() {
  const {lang}=useLanguage();
  const en=lang==="en";
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [email,setEmail]=useState("");
  const [userId,setUserId]=useState("");
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [displayName,setDisplayName]=useState("");
  const [avatarUrl,setAvatarUrl]=useState("");
  const [membership,setMembership]=useState<MembershipStatus>("pending");
  const [showInDirectory,setShowInDirectory]=useState(false);
  const [isAdmin,setIsAdmin]=useState(false);

  useEffect(()=>{
    let active=true;
    const supabaseClient=getSupabaseBrowserClient();
    let membershipChannel:ReturnType<typeof supabaseClient.channel>|null=null;
    async function load(){
      const supabase=supabaseClient;
      if(!supabase){setError(en?"Supabase is not configured.":"Supabase n'est pas configuré.");setLoading(false);return;}
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError||!user){window.location.href="/login";return;}
      const [profileResult,membershipResult,adminResult]=await Promise.all([
        supabase.from("jec_profiles").select("first_name,last_name,display_name,avatar_url,show_in_directory").eq("user_id",user.id).maybeSingle(),
        supabase.from("jec_memberships").select("membership_status").eq("user_id",user.id).maybeSingle(),
        supabase.rpc("is_jec_admin")
      ]);
      if(!active)return;
      if(!membershipChannel){
        membershipChannel=supabase.channel("jec-account-membership:"+user.id)
          .on("postgres_changes",{event:"*",schema:"public",table:"jec_memberships",filter:"user_id=eq."+user.id},()=>{void load();})
          .subscribe();
      }
      const meta=user.user_metadata??{};
      const profile=profileResult.data;
      setUserId(user.id);
      setEmail(user.email??"");
      setFirstName(profile?.first_name??(typeof meta.given_name==="string"?meta.given_name:""));
      setLastName(profile?.last_name??(typeof meta.family_name==="string"?meta.family_name:""));
      setDisplayName(profile?.display_name??(typeof meta.full_name==="string"?meta.full_name:typeof meta.name==="string"?meta.name:""));
      setAvatarUrl(profile?.avatar_url??(typeof meta.avatar_url==="string"?meta.avatar_url:""));
      setMembership(membershipResult.data?.membership_status==="verified"?"verified":membershipResult.data?.membership_status==="rejected"?"rejected":"pending");
      setShowInDirectory(profile?.show_in_directory===true);
      setIsAdmin(adminResult.data===true);
      if(profileResult.error)setError(profileResult.error.message);
      setLoading(false);
    }
    const refreshOnReturn=()=>{if(!document.hidden)void load();};
    void load();
    window.addEventListener("focus",refreshOnReturn);
    document.addEventListener("visibilitychange",refreshOnReturn);
    return ()=>{
      active=false;
      window.removeEventListener("focus",refreshOnReturn);
      document.removeEventListener("visibilitychange",refreshOnReturn);
      if(membershipChannel&&supabaseClient)void supabaseClient.removeChannel(membershipChannel);
    };
  },[en]);

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");setMessage("");
    const supabase=getSupabaseBrowserClient();
    if(!supabase||!userId)return;
    setSaving(true);
    const {error:saveError}=await supabase.from("jec_profiles").update({
      first_name:firstName.trim()||null,
      last_name:lastName.trim()||null,
      display_name:displayName.trim()||null,
      avatar_url:avatarUrl.trim()||null,
      show_in_directory:showInDirectory
    }).eq("user_id",userId);
    if(saveError)setError(saveError.message);
    else setMessage(en?"Your profile has been saved.":"Ton profil a été enregistré.");
    setSaving(false);
  }

  async function signOut(){
    const supabase=getSupabaseBrowserClient();
    if(!supabase)return;
    const {error:signOutError}=await supabase.auth.signOut({scope:"local"});
    if(signOutError){setError(signOutError.message);return;}
    window.location.href="/";
  }

  const statusLabel=membership==="verified"?(en?"JEC membership verified":"Adhésion JEC vérifiée"):membership==="rejected"?(en?"Membership not approved":"Adhésion non validée"):(en?"Pending JEC validation":"En attente de validation JEC");

  return <main className="account-page">
    <header className="account-header">
      <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link>
      <div><LanguageSwitcher/><Link href="/" className="back-link-inline">{en?"Back to portal":"Retour au portail"}</Link></div>
    </header>
    <div className="account-content">
      <p className="eyebrow">{en?"PERSONAL SPACE":"ESPACE PERSONNEL"}</p>
      <h1>{en?"My account":"Mon compte"}</h1>
      {loading?<p className="muted">{en?"Loading your profile…":"Chargement de ton profil…"}</p>:<>
        <section className="account-status-card">
          <div className="account-avatar">{avatarUrl?<img src={avatarUrl} alt=""/>:displayName.trim().split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase()||"J"}</div>
          <div><strong>{displayName||email}</strong><small>{email}</small><span className={"membership-pill "+membership}>{statusLabel}</span>{isAdmin&&<span className="admin-pill">{en?"Platform administrator":"Administrateur de la plateforme"}</span>}</div>
        </section>
        <form className="account-form" onSubmit={save}>
          <h2>{en?"Profile details":"Informations du profil"}</h2>
          <label>{en?"First name":"Prénom"}<input value={firstName} onChange={e=>setFirstName(e.target.value)} maxLength={100}/></label>
          <label>{en?"Last name":"Nom"}<input value={lastName} onChange={e=>setLastName(e.target.value)} maxLength={100}/></label>
          <label>{en?"Display name":"Nom affiché"}<input value={displayName} onChange={e=>setDisplayName(e.target.value)} maxLength={160} placeholder={en?"Name shown in the community":"Nom affiché dans la communauté"}/></label>
          <label>{en?"Avatar URL (optional)":"Adresse de ta photo (facultatif)"}<input type="url" value={avatarUrl} onChange={e=>setAvatarUrl(e.target.value)} placeholder="https://…"/></label>
          <label className="directory-optin"><input type="checkbox" checked={showInDirectory} onChange={e=>setShowInDirectory(e.target.checked)}/><span><strong>{en?"Show my name in the members directory":"Afficher mon nom dans l'annuaire des membres"}</strong><small>{en?"Only verified JEC members can see opted-in member profiles. Your email address is not displayed.":"Seuls les membres JEC vérifiés peuvent voir les profils qui ont choisi d'apparaître. Ton adresse e-mail ne sera pas affichée."}</small></span></label>
          <button className="primary-button" disabled={saving}>{saving?(en?"Saving…":"Enregistrement…"):(en?"Save my profile":"Enregistrer mon profil")}</button>
          {error&&<p className="alert error">{error}</p>}
          {message&&<p className="alert success">{message}</p>}
        </form>
        <section className="account-next-actions">
          <Link href="/annuaire">{en?"JEC directory →":"Consulter l'annuaire JEC →"}</Link>
          {isAdmin&&<Link href="/gestion">{en?"Administration →":"Administration →"}</Link>}
          <button className="quiet-button" onClick={signOut}>{en?"Sign out":"Se déconnecter"}</button>
        </section>
        {membership==="pending"&&<p className="account-note">{en?"You are signed in, but your JEC membership has not yet been verified. Signing in does not automatically grant membership or administrative rights.":"Tu es bien connecté·e, mais ton appartenance à la JEC n'a pas encore été vérifiée. La connexion ne donne pas automatiquement le statut de membre ni des droits d'administration."}</p>}
      </>}
    </div>
  </main>;
}
