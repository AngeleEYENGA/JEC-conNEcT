"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { LanguageSwitcher,useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Row={id:string;title:string;objective:string|null;project_status:string;priority:string;due_date:string|null;workspace_id:string;workspace:{name:string;slug:string}|null};

export default function ProjectsPage(){
  const {lang}=useLanguage();const en=lang==="en";
  const [rows,setRows]=useState<Row[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{let active=true;async function load(){
    const supabase=getSupabaseBrowserClient();if(!supabase){setLoading(false);return;}
    const {data:{user}}=await supabase.auth.getUser();if(!user){window.location.href="/login";return;}
    const {data,error:queryError}=await supabase.from("jec_projects").select("id,title,objective,project_status,priority,due_date,workspace_id,workspace:jec_workspaces(name,slug)").order("created_at",{ascending:false});
    if(!active)return;if(queryError)setError(queryError.message);setRows((data??[]) as unknown as Row[]);setLoading(false);
  }void load();return()=>{active=false;};},[]);
  return <main className="collab-page"><header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/workspace" className="back-link-inline">{en?"Workspaces":"Espaces de travail"}</Link></div></header>
    <div className="collab-content"><p className="eyebrow">{en?"COLLECTIVE INITIATIVES":"INITIATIVES COLLECTIVES"}</p><h1>{en?"Projects":"Projets"}</h1><p className="collab-lead">{en?"Projects across the workspaces you belong to. Open a workspace to create or manage its projects.":"Retrouve les projets des espaces auxquels tu appartiens. Ouvre un espace pour créer ou gérer ses projets."}</p>
      {error&&<p className="alert error">{error}</p>}{loading?<p className="muted">{en?"Loading…":"Chargement…"}</p>:rows.length?<div className="collab-grid">{rows.map(row=><article className="collab-card project-list-card" key={row.id}><span className={"project-status "+row.project_status}>{row.project_status.replace("_"," ")}</span><h3>{row.title}</h3><p>{row.objective|| (en?"No objective provided.":"Aucun objectif renseigné.")}</p><div className="collab-card-footer"><span>{row.workspace?.name??(en?"Workspace":"Espace")}</span><span>{row.due_date??(en?"No due date":"Sans échéance")}</span></div><Link href={"/projets/"+row.id} className="project-open-link">{en?"Open project workspace →":"Ouvrir l'espace projet →"}</Link></article>)}</div>:<div className="collab-empty"><span>◫</span><h3>{en?"No project yet":"Aucun projet pour le moment"}</h3><p>{en?"Projects will appear here when they are created in one of your workspaces.":"Les projets apparaîtront ici lorsqu'ils seront créés dans l'un de tes espaces de travail."}</p><Link className="primary-button" href="/workspace">{en?"Open my workspaces":"Voir mes espaces"}</Link></div>}
    </div>
  </main>;
}
