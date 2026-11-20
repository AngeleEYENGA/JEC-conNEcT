"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { LanguageSwitcher,useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { jecPhotos, projectPhotos } from "@/lib/image-library";

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
    <div className="collab-content projects-overview-content">
      <section className="collab-visual-hero projects-visual-hero">
        <div className="collab-visual-copy">
          <p className="eyebrow">{en?"COLLECTIVE INITIATIVES":"INITIATIVES COLLECTIVES"}</p>
          <h1>{en?"Turn shared ideas into real projects.":"Des idées partagées aux projets concrets."}</h1>
          <p>{en?"Find the initiatives being shaped across your JEC workspaces, follow their progress and contribute to the next milestones.":"Retrouve les initiatives portées dans tes espaces JEC, suis leur avancement et contribue aux prochaines étapes."}</p>
          <div className="collab-hero-actions"><Link href="/workspace" className="collab-hero-button">{en?"Explore my workspaces":"Explorer mes espaces"} <span>↗</span></Link><span className="collab-hero-note">✦ {en?"Plan · Build · Celebrate":"Imaginer · Construire · Célébrer"}</span></div>
        </div>
        <div className="collab-visual-art"><img src={jecPhotos.studyGroup.src} alt={en?jecPhotos.studyGroup.altEn:jecPhotos.studyGroup.altFr}/><a className="photo-credit" href={jecPhotos.studyGroup.sourceUrl} target="_blank" rel="noreferrer">{en?jecPhotos.studyGroup.captionEn:jecPhotos.studyGroup.captionFr}</a><span className="collab-art-chip">{en?"Ideas in action":"Des idées en action"}</span></div>
      </section>
      <div className="collab-metric-strip">
        <article><strong>{loading?"—":rows.length}</strong><span>{en?"Projects in your spaces":"Projets dans tes espaces"}</span></article>
        <article><strong>{loading?"—":rows.filter(row=>row.project_status==="active").length}</strong><span>{en?"Active projects":"Projets actifs"}</span></article>
        <article><strong>{loading?"—":new Set(rows.map(row=>row.workspace_id)).size}</strong><span>{en?"Workspaces involved":"Espaces impliqués"}</span></article>
      </div>
      <div className="collab-section-heading projects-list-heading"><div><p className="eyebrow">{en?"YOUR COLLECTIVE MOMENTUM":"TON ÉLAN COLLECTIF"}</p><h2>{en?"Projects to move forward":"Les projets à faire avancer"}</h2></div><Link href="/workspace" className="project-open-link">{en?"Manage spaces →":"Gérer les espaces →"}</Link></div>
      <p className="collab-lead projects-list-intro">{en?"Projects across the workspaces you belong to. Open a workspace to create or manage its projects.":"Retrouve les projets des espaces auxquels tu appartiens. Ouvre un espace pour créer ou gérer ses projets."}</p>
      {error&&<p className="alert error">{error}</p>}{loading?<p className="muted">{en?"Loading…":"Chargement…"}</p>:rows.length?<div className="collab-grid">{rows.map((row,index)=>{const photo=projectPhotos[index%projectPhotos.length];return <article className="collab-card project-list-card project-visual-card" key={row.id}>
        <div className="project-list-art"><img src={photo.src} alt={en?photo.altEn:photo.altFr} loading="lazy"/><a className="photo-credit" href={photo.sourceUrl} target="_blank" rel="noreferrer">{en?photo.captionEn:photo.captionFr}</a><span className={"project-status "+row.project_status}>{row.project_status.replace("_"," ")}</span></div>
        <div className="project-list-card-copy"><h3>{row.title}</h3><p>{row.objective|| (en?"No objective provided.":"Aucun objectif renseigné.")}</p><div className="collab-card-footer"><span>{row.workspace?.name??(en?"Workspace":"Espace")}</span><span>{row.due_date??(en?"No due date":"Sans échéance")}</span></div><Link href={"/projets/"+row.id} className="project-open-link">{en?"Open project workspace →":"Ouvrir l'espace projet →"}</Link></div>
      </article>})}</div>:<div className="collab-empty"><span>◫</span><h3>{en?"No project yet":"Aucun projet pour le moment"}</h3><p>{en?"Projects will appear here when they are created in one of your workspaces.":"Les projets apparaîtront ici lorsqu'ils seront créés dans l'un de tes espaces de travail."}</p><Link className="primary-button" href="/workspace">{en?"Open my workspaces":"Voir mes espaces"}</Link></div>}
    </div>
  </main>;
}
