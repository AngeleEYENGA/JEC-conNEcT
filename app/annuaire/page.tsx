"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type DirectoryEntry={id:string;category:string;full_name:string;role_title:string;structure_name:string|null;description:string|null;functional_email:string|null;visibility:"public"|"members";sort_order:number};
type MemberProfile={user_id:string;first_name:string|null;last_name:string|null;display_name:string|null;avatar_url:string|null};

const categories:Record<string,{fr:string;en:string}> = {
  bureau_national:{fr:"Bureau national",en:"National board"},
  equipe_nationale:{fr:"Équipe nationale",en:"National team"},
  federation:{fr:"Fédérations",en:"Federations"},
  equipe_locale:{fr:"Équipes locales",en:"Local teams"},
  commission:{fr:"Commissions",en:"Commissions"},
  service:{fr:"Services",en:"Services"}
};

export default function DirectoryPage(){
  const {lang}=useLanguage();
  const en=lang==="en";
  const [entries,setEntries]=useState<DirectoryEntry[]>([]);
  const [members,setMembers]=useState<MemberProfile[]>([]);
  const [verified,setVerified]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    let active=true;
    async function load(){
      const supabase=getSupabaseBrowserClient();
      if(!supabase){setLoading(false);return;}
      const [{data:directory,error:directoryError},{data:{user}}]=await Promise.all([
        supabase.from("jec_directory_entries").select("id,category,full_name,role_title,structure_name,description,functional_email,visibility,sort_order").eq("is_published",true).order("sort_order"),
        supabase.auth.getUser()
      ]);
      if(!active)return;
      if(directoryError)setError(directoryError.message);
      setEntries((directory??[]) as DirectoryEntry[]);
      if(user){
        const {data:membership}=await supabase.from("jec_memberships").select("membership_status").eq("user_id",user.id).maybeSingle();
        const isVerified=membership?.membership_status==="verified";
        if(active)setVerified(isVerified);
        if(isVerified){
          const {data:profiles, error:profilesError}=await supabase.from("jec_profiles").select("user_id,first_name,last_name,display_name,avatar_url").eq("show_in_directory",true).order("display_name");
          if(active&&!profilesError)setMembers((profiles??[]) as MemberProfile[]);
          if(active&&profilesError)setError(profilesError.message);
        }
      }
      if(active)setLoading(false);
    }
    void load();
    return ()=>{active=false;};
  },[]);

  const grouped=Object.keys(categories).map(key=>({key,label:categories[key][en?"en":"fr"],items:entries.filter(e=>e.category===key)}));

  return <main className="directory-page">
    <header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/" className="back-link-inline">{en?"Back to portal":"Retour au portail"}</Link></div></header>
    <div className="directory-content">
      <p className="eyebrow">{en?"JEC PEOPLE & ORGANIZATION":"LES PERSONNES ET LES STRUCTURES DE LA JEC"}</p>
      <h1>{en?"JEC directory":"Annuaire de la JEC"}</h1>
      <p className="directory-lead">{en?"Find the right institutional contact, understand the organization and connect with members who have chosen to be listed.":"Trouve le bon interlocuteur, comprends l'organisation et retrouve les membres qui ont choisi de figurer dans l'annuaire."}</p>
      {loading?<p className="muted">{en?"Loading directory…":"Chargement de l'annuaire…"}</p>:<>
        <section className="directory-section">
          <div className="directory-section-heading"><div><p className="eyebrow">{en?"OFFICIAL ROLES":"FONCTIONS OFFICIELLES"}</p><h2>{en?"Institutional organization chart":"Organigramme institutionnel"}</h2></div><span>{entries.length} {en?"published roles":"fonctions publiées"}</span></div>
          {grouped.map(group=><div className="directory-group" key={group.key}><h3>{group.label}</h3>{group.items.length?<div className="directory-entry-grid">{group.items.map(entry=><article className="directory-entry-card" key={entry.id}><span className="directory-entry-icon">✧</span><h4>{entry.role_title}</h4><strong>{entry.full_name}</strong>{entry.structure_name&&<small>{entry.structure_name}</small>}{entry.description&&<p>{entry.description}</p>}{entry.functional_email&&<a href={"mailto:"+entry.functional_email}>{entry.functional_email}</a>}</article>)}</div>:<p className="directory-category-empty">{en?"Validated names and role holders will be added here.":"Les noms et titulaires des fonctions seront ajoutés ici après validation."}</p>}</div>)}
        </section>
        <section className="directory-section">
          <div className="directory-section-heading"><div><p className="eyebrow">{en?"COMMUNITY":"COMMUNAUTÉ"}</p><h2>{en?"Members who opted in":"Membres ayant choisi d'apparaître"}</h2></div></div>
          {verified?members.length?<div className="directory-entry-grid">{members.map(member=><article className="member-directory-card" key={member.user_id}><div className="directory-member-avatar">{member.avatar_url?<img src={member.avatar_url} alt=""/>:(member.display_name||[member.first_name,member.last_name].filter(Boolean).join(" ")||"JEC").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}</div><strong>{member.display_name||[member.first_name,member.last_name].filter(Boolean).join(" ")}</strong><small>{en?"Verified JEC member":"Membre JEC vérifié"}</small></article>)}</div>:<div className="directory-empty compact"><p>{en?"No verified members have opted in yet.":"Aucun membre vérifié n'a encore choisi d'apparaître dans l'annuaire."}</p></div>:<div className="directory-empty compact"><p>{en?"The member directory is visible to verified JEC members.":"L'annuaire des membres est réservé aux membres JEC dont l'appartenance a été vérifiée."}</p><Link href="/compte">{en?"My account and directory settings →":"Mon compte et mes réglages d'annuaire →"}</Link></div>}
        </section>
      </>}
      {error&&<p className="alert error">{error}</p>}
      <p className="directory-disclaimer">{en?"No names or mandates are fabricated. The directory only displays records explicitly entered and approved by JEC administrators.":"Aucun nom ni mandat n'est inventé. L'annuaire n'affiche que les informations saisies et approuvées explicitement par les administrateurs JEC."}</p>
    </div>
  </main>;
}
