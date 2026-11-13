"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { LanguageSwitcher,useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Row={id:string;title:string;agenda:string|null;starts_at:string;ends_at:string|null;meeting_url:string|null;meeting_status:string;workspace_id:string;workspace:{name:string;slug:string}|null};

export default function MeetingsPage(){
  const {lang}=useLanguage();const en=lang==="en";
  const [rows,setRows]=useState<Row[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{let active=true;async function load(){
    const supabase=getSupabaseBrowserClient();if(!supabase){setLoading(false);return;}
    const {data:{user}}=await supabase.auth.getUser();if(!user){window.location.href="/login";return;}
    const {data,error:queryError}=await supabase.from("jec_meetings").select("id,title,agenda,starts_at,ends_at,meeting_url,meeting_status,workspace_id,workspace:jec_workspaces(name,slug)").order("starts_at",{ascending:true});
    if(!active)return;if(queryError)setError(queryError.message);setRows((data??[]) as unknown as Row[]);setLoading(false);
  }void load();return()=>{active=false;};},[]);
  return <main className="collab-page"><header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/workspace" className="back-link-inline">{en?"Workspaces":"Espaces de travail"}</Link></div></header>
    <div className="collab-content"><p className="eyebrow">{en?"TEAM MEETINGS":"RENCONTRES DES ÉQUIPES"}</p><h1>{en?"Meetings":"Réunions"}</h1><p className="collab-lead">{en?"Meetings scheduled in your workspaces, with agendas and video-call links.":"Les réunions programmées dans tes espaces, avec leurs ordres du jour et liens de visioconférence."}</p>
      {error&&<p className="alert error">{error}</p>}{loading?<p className="muted">{en?"Loading…":"Chargement…"}</p>:rows.length?rows.map(row=><article className="workspace-meeting-row" key={row.id}><div className="meeting-date-block"><strong>{new Date(row.starts_at).toLocaleDateString(en?"en-GB":"fr-FR",{day:"2-digit"})}</strong><span>{new Date(row.starts_at).toLocaleDateString(en?"en-GB":"fr-FR",{month:"short"})}</span></div><div className="workspace-meeting-main"><strong>{row.title}</strong><small>{new Date(row.starts_at).toLocaleString(en?"en-GB":"fr-FR",{dateStyle:"medium",timeStyle:"short"})} · <Link href={"/workspace/"+(row.workspace?.slug??"")}>{row.workspace?.name??"Workspace"}</Link></small>{row.agenda&&<p>{row.agenda}</p>}{row.meeting_url&&<a href={row.meeting_url} target="_blank" rel="noreferrer">{en?"External video link →":"Lien externe →"}</a>}<Link href={"/reunions/"+row.id} className="project-open-link">{en?"Open meeting workspace →":"Ouvrir l'espace réunion →"}</Link></div><span className={"project-status "+row.meeting_status}>{row.meeting_status}</span></article>):<div className="collab-empty"><span>▣</span><h3>{en?"No meeting scheduled":"Aucune réunion programmée"}</h3><p>{en?"Meetings created in your workspaces will appear here.":"Les réunions créées dans tes espaces apparaîtront ici."}</p><Link className="primary-button" href="/workspace">{en?"Open my workspaces":"Voir mes espaces"}</Link></div>}
    </div>
  </main>;
}
