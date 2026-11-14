"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type WorkspaceType="national_team"|"federation"|"local_team"|"commission"|"service"|"project"|"temporary_group";
type Workspace={id:string;name:string;slug:string;workspace_type:WorkspaceType;description:string|null;is_active:boolean};
type WorkspaceMembership={workspace_id:string;workspace_role:"owner"|"manager"|"member";membership_status:"invited"|"active"|"suspended"};

const typeLabels:Record<WorkspaceType,{fr:string;en:string}>={
  national_team:{fr:"Équipe nationale",en:"National team"},
  federation:{fr:"Fédération",en:"Federation"},
  local_team:{fr:"Équipe locale",en:"Local team"},
  commission:{fr:"Commission",en:"Commission"},
  service:{fr:"Service",en:"Service"},
  project:{fr:"Projet",en:"Project"},
  temporary_group:{fr:"Groupe temporaire",en:"Temporary group"}
};

function slugify(value:string){
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

export default function WorkspaceIndexPage(){
  const {lang}=useLanguage();
  const en=lang==="en";
  const [userId,setUserId]=useState("");
  const [isAdmin,setIsAdmin]=useState(false);
  const [workspaces,setWorkspaces]=useState<Workspace[]>([]);
  const [memberships,setMemberships]=useState<WorkspaceMembership[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [name,setName]=useState("");
  const [type,setType]=useState<WorkspaceType>("national_team");
  const [description,setDescription]=useState("");
  const [creating,setCreating]=useState(false);

  async function load(){
    const supabase=getSupabaseBrowserClient();
    if(!supabase){setError(en?"Supabase is not configured.":"Supabase n'est pas configuré.");setLoading(false);return;}
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user){window.location.href="/login";return;}
    setUserId(user.id);
    const {data:adminFlag}=await supabase.rpc("is_jec_admin");
    const admin=adminFlag===true;
    setIsAdmin(admin);
    const {data:memberRows,error:memberError}=await supabase.from("jec_workspace_members")
      .select("workspace_id,workspace_role,membership_status")
      .eq("user_id",user.id);
    if(memberError)setError(memberError.message);
    setMemberships((memberRows??[]) as WorkspaceMembership[]);
    let query=supabase.from("jec_workspaces")
      .select("id,name,slug,workspace_type,description,is_active")
      .eq("is_active",true).order("name");
    if(!admin){
      const ids=(memberRows??[]).map((row:{workspace_id:string})=>row.workspace_id);
      if(!ids.length){setWorkspaces([]);setLoading(false);return;}
      query=query.in("id",ids);
    }
    const {data:rows,error:workspaceError}=await query;
    if(workspaceError)setError(workspaceError.message);
    setWorkspaces((rows??[]) as Workspace[]);
    setLoading(false);
  }

  useEffect(()=>{void load();},[]);

  const membershipByWorkspace=useMemo(()=>new Map(memberships.map(m=>[m.workspace_id,m])),[memberships]);
  const invitations=workspaces.filter(w=>membershipByWorkspace.get(w.id)?.membership_status==="invited");
  const activeWorkspaces=workspaces.filter(w=>{
    const status=membershipByWorkspace.get(w.id)?.membership_status;
    return isAdmin||status==="active";
  });

  async function createWorkspace(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError("");setNotice("");
    const supabase=getSupabaseBrowserClient();
    if(!supabase||!userId)return;
    if(!isAdmin){setError(en?"Only a JEC-conNEcT administrator can create a workspace at this stage.":"Seule une administratrice JEC-conNEcT peut créer un espace à ce stade.");return;}
    const slug=slugify(name);
    if(!slug){setError(en?"Please enter a valid workspace name.":"Saisis un nom d'espace valide.");return;}
    setCreating(true);
    const {error:createError}=await supabase.rpc("jec_create_workspace",{
      target_name:name.trim(),
      target_slug:slug,
      target_type:type,
      target_description:description.trim()||null
    });
    if(createError){setError(createError.message);setCreating(false);return;}
    window.location.href="/workspace/"+slug;
  }

  async function acceptInvitation(workspaceId:string){
    const supabase=getSupabaseBrowserClient();
    if(!supabase)return;
    setError("");setNotice("");
    const {error:acceptError}=await supabase.rpc("jec_workspace_accept_invitation",{target_workspace_id:workspaceId});
    if(acceptError)setError(acceptError.message);
    else {setNotice(en?"Invitation accepted.":"Invitation acceptée.");await load();}
  }

  return <main className="collab-page">
    <header className="account-header">
      <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link>
      <div><LanguageSwitcher/><Link href="/" className="back-link-inline">{en?"Back to portal":"Retour au portail"}</Link></div>
    </header>
    <div className="collab-content">
      <p className="eyebrow">{en?"COLLABORATION":"COLLABORATION"}</p>
      <h1>{en?"My workspaces":"Mes espaces de travail"}</h1>
      <p className="collab-lead">{en?"Dedicated spaces for national teams, federations, local teams, commissions and services. Each space has its own members, discussions, projects, tasks, meetings and private documents.":"Des espaces dédiés aux équipes nationales, fédérations, équipes locales, commissions et services. Chaque espace possède ses membres, échanges, projets, tâches, réunions et documents privés."}</p>

      {error&&<p className="alert error">{error}</p>}
      {notice&&<p className="alert success">{notice}</p>}

      {invitations.length>0&&<section className="collab-section">
        <div className="collab-section-heading"><div><p className="eyebrow">{en?"INVITATIONS":"INVITATIONS"}</p><h2>{en?"Waiting for your response":"En attente de ta réponse"}</h2></div><span>{invitations.length}</span></div>
        <div className="collab-grid">{invitations.map(workspace=><article className="collab-card invitation-card" key={workspace.id}>
          <div className="collab-card-icon">✉</div><span className="collab-type">{typeLabels[workspace.workspace_type][en?"en":"fr"]}</span>
          <h3>{workspace.name}</h3><p>{workspace.description|| (en?"You have been invited to join this JEC workspace.":"Tu as été invité·e à rejoindre cet espace JEC.")}</p>
          <button className="primary-button" onClick={()=>acceptInvitation(workspace.id)}>{en?"Accept invitation":"Accepter l'invitation"}</button>
        </article>)}</div>
      </section>}

      <section className="collab-section">
        <div className="collab-section-heading"><div><p className="eyebrow">{en?"YOUR SPACES":"TES ESPACES"}</p><h2>{en?"Active workspaces":"Espaces actifs"}</h2></div><span>{activeWorkspaces.length}</span></div>
        {loading?<p className="muted">{en?"Loading workspaces…":"Chargement des espaces…"}</p>:activeWorkspaces.length?<div className="collab-grid">{activeWorkspaces.map(workspace=>{
          const role=membershipByWorkspace.get(workspace.id)?.workspace_role;
          return <Link className="collab-card" href={"/workspace/"+workspace.slug} key={workspace.id}>
            <div className="collab-card-icon">⌘</div><span className="collab-type">{typeLabels[workspace.workspace_type][en?"en":"fr"]}</span>
            <h3>{workspace.name}</h3><p>{workspace.description|| (en?"Private JEC workspace.":"Espace de travail privé JEC.")}</p>
            <div className="collab-card-footer"><span>{role==="owner"?(en?"Owner":"Propriétaire"):role==="manager"?(en?"Manager":"Responsable"):(en?"Member":"Membre")}</span><strong>{en?"Open space →":"Ouvrir l'espace →"}</strong></div>
          </Link>;
        })}</div>:<div className="collab-empty"><span>⌘</span><h3>{en?"No workspace yet":"Aucun espace pour le moment"}</h3><p>{en?"Your workspaces will appear here once a JEC administrator creates them or invites you.":"Tes espaces apparaîtront ici lorsqu'un administrateur JEC en aura créé un ou t'y aura invité·e."}</p></div>}
      </section>

      {isAdmin&&<section className="collab-section">
        <div className="collab-section-heading"><div><p className="eyebrow">{en?"ADMINISTRATION":"ADMINISTRATION"}</p><h2>{en?"Create a workspace":"Créer un espace de travail"}</h2></div></div>
        <form className="collab-form" onSubmit={createWorkspace}>
          <label>{en?"Workspace name":"Nom de l'espace"}<input value={name} onChange={e=>setName(e.target.value)} required maxLength={120} placeholder={en?"e.g. National Coordination":"Ex. Coordination nationale"}/></label>
          <label>{en?"Type":"Type d'espace"}<select value={type} onChange={e=>setType(e.target.value as WorkspaceType)}>{Object.entries(typeLabels).map(([value,label])=><option value={value} key={value}>{label[en?"en":"fr"]}</option>)}</select></label>
          <label>{en?"Description":"Description"}<textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} maxLength={2000} placeholder={en?"Purpose and scope of this workspace":"Objet et périmètre de cet espace"}/></label>
          <p className="collab-private-note">🔒 {en?"Every workspace is private. Only invited, active members can view its content.":"Chaque espace est privé. Seuls les membres invités et actifs peuvent consulter son contenu."}</p>
          <button className="primary-button" disabled={creating}>{creating?(en?"Creating…":"Création…"):(en?"Create workspace":"Créer l'espace")}</button>
        </form>
      </section>}
      <p className="collab-footnote">{en?"Membership is distinct from sign-in: only JEC-verified members (or platform administrators) can be invited.":"L'appartenance à un espace est distincte de la connexion : seuls les membres JEC vérifiés (ou les administrateurs de la plateforme) peuvent être invités."}</p>
    </div>
  </main>;
}
