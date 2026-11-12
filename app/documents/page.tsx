"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { LanguageSwitcher,useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Row={id:string;title:string;description:string|null;file_name:string;storage_path:string;file_size:number|null;document_category:string;created_at:string;workspace_id:string;workspace:{name:string;slug:string}|null};

export default function DocumentsPage(){
  const {lang}=useLanguage();const en=lang==="en";
  const [rows,setRows]=useState<Row[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
  useEffect(()=>{let active=true;async function load(){
    const supabase=getSupabaseBrowserClient();if(!supabase){setLoading(false);return;}
    const {data:{user}}=await supabase.auth.getUser();if(!user){window.location.href="/login";return;}
    const {data,error:queryError}=await supabase.from("jec_documents").select("id,title,description,file_name,storage_path,file_size,document_category,created_at,workspace_id,workspace:jec_workspaces(name,slug)").order("created_at",{ascending:false});
    if(!active)return;if(queryError)setError(queryError.message);setRows((data??[]) as unknown as Row[]);setLoading(false);
  }void load();return()=>{active=false;};},[]);
  async function openFile(row:Row){
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    const {data,error:openError}=await supabase.storage.from("jec-workspace-documents").createSignedUrl(row.storage_path,300);
    if(openError)setError(openError.message);else if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }
  return <main className="collab-page"><header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/workspace" className="back-link-inline">{en?"Workspaces":"Espaces de travail"}</Link></div></header>
    <div className="collab-content"><p className="eyebrow">{en?"PRIVATE DOCUMENT SPACE":"ESPACE DOCUMENTAIRE PRIVÉ"}</p><h1>{en?"Documents":"Documents"}</h1><p className="collab-lead">{en?"Documents shared inside the workspaces you belong to. Downloads use temporary private links.":"Les documents partagés dans les espaces auxquels tu appartiens. Les téléchargements utilisent des liens privés temporaires."}</p>
      {error&&<p className="alert error">{error}</p>}{loading?<p className="muted">{en?"Loading…":"Chargement…"}</p>:rows.length?rows.map(row=><article className="workspace-document-row" key={row.id}><div className="document-file-icon">▱</div><div className="workspace-document-main"><strong>{row.title}</strong><small>{row.file_name} · {row.file_size?Math.ceil(row.file_size/1024)+" Ko":"—"} · {row.workspace?.name}</small>{row.description&&<p>{row.description}</p>}</div><button className="secondary-outline-button" onClick={()=>openFile(row)}>{en?"Open / download":"Ouvrir / télécharger"}</button></article>):<div className="collab-empty"><span>▱</span><h3>{en?"No shared document yet":"Aucun document partagé"}</h3><p>{en?"Documents will appear here when uploaded to one of your workspaces.":"Les documents apparaîtront ici lorsqu'ils seront déposés dans l'un de tes espaces."}</p><Link className="primary-button" href="/workspace">{en?"Open my workspaces":"Voir mes espaces"}</Link></div>}
    </div>
  </main>;
}
