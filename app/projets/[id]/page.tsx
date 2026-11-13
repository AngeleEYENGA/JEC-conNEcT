"use client";

import Link from "next/link";
import { FormEvent,useCallback,useEffect,useMemo,useState } from "react";
import { useParams } from "next/navigation";
import { LanguageSwitcher,useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Project={id:string;workspace_id:string;title:string;objective:string|null;description:string|null;project_status:string;priority:string;owner_id:string;start_date:string|null;due_date:string|null;created_by:string};
type Task={id:string;title:string;description:string|null;task_status:string;priority:string;assigned_to:string|null;due_at:string|null;created_by:string};
type Milestone={id:string;title:string;description:string|null;due_date:string|null;milestone_status:string;owner_id:string|null};
type Comment={id:string;task_id:string;author_id:string;body:string;created_at:string};
type Roster={user_id:string;workspace_role:string;membership_status:string};

function fmt(value:string|null,en:boolean){return value?new Date(value).toLocaleDateString(en?"en-GB":"fr-FR"):"—";}

export default function ProjectDetailPage(){
 const params=useParams<{id:string}>();const projectId=params.id;
 const {lang}=useLanguage();const en=lang==="en";
 const [project,setProject]=useState<Project|null>(null);const [loading,setLoading]=useState(true);
 const [userId,setUserId]=useState("");const [manager,setManager]=useState(false);const [canEdit,setCanEdit]=useState(false);
 const [roster,setRoster]=useState<Roster[]>([]);const [names,setNames]=useState<Record<string,string>>({});
 const [tasks,setTasks]=useState<Task[]>([]);const [milestones,setMilestones]=useState<Milestone[]>([]);
 const [comments,setComments]=useState<Comment[]>([]);const [selectedTask,setSelectedTask]=useState("");
 const [error,setError]=useState("");const [notice,setNotice]=useState("");const [busy,setBusy]=useState(false);
 const [taskTitle,setTaskTitle]=useState("");const [taskDescription,setTaskDescription]=useState("");const [taskAssignee,setTaskAssignee]=useState("");const [taskDue,setTaskDue]=useState("");const [taskPriority,setTaskPriority]=useState("normal");
 const [milestoneTitle,setMilestoneTitle]=useState("");const [milestoneDescription,setMilestoneDescription]=useState("");const [milestoneDue,setMilestoneDue]=useState("");const [milestoneOwner,setMilestoneOwner]=useState("");
 const [commentBody,setCommentBody]=useState("");
 const [editObjective,setEditObjective]=useState("");const [editDescription,setEditDescription]=useState("");const [editStatus,setEditStatus]=useState("draft");const [editPriority,setEditPriority]=useState("normal");const [editStart,setEditStart]=useState("");const [editDue,setEditDue]=useState("");

 const selected=tasks.find(t=>t.id===selectedTask)??null;
 const activeMembers=useMemo(()=>roster.filter(m=>m.membership_status==="active"),[roster]);

 const load=useCallback(async()=>{
  const supabase=getSupabaseBrowserClient();
  if(!supabase){setError("Supabase n'est pas configuré.");setLoading(false);return;}
  setLoading(true);setError("");
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user){window.location.href="/login";return;}
  setUserId(user.id);
  const {data:pr,error:projectError}=await supabase.from("jec_projects").select("id,workspace_id,title,objective,description,project_status,priority,owner_id,start_date,due_date,created_by").eq("id",projectId).maybeSingle();
  if(projectError||!pr){setError(en?"This project is unavailable.":"Ce projet n'est pas accessible.");setProject(null);setLoading(false);return;}
  const p=pr as Project;setProject(p);
  setEditObjective(p.objective??"");setEditDescription(p.description??"");setEditStatus(p.project_status);setEditPriority(p.priority);setEditStart(p.start_date??"");setEditDue(p.due_date??"");
  const [membership,rosterResult,taskResult,milestoneResult]=await Promise.all([
   supabase.from("jec_workspace_members").select("workspace_role,membership_status").eq("workspace_id",p.workspace_id).eq("user_id",user.id).maybeSingle(),
   supabase.from("jec_workspace_members").select("user_id,workspace_role,membership_status").eq("workspace_id",p.workspace_id).eq("membership_status","active"),
   supabase.from("jec_workspace_tasks").select("id,title,description,task_status,priority,assigned_to,due_at,created_by").eq("project_id",projectId).order("due_at"),
   supabase.from("jec_project_milestones").select("id,title,description,due_date,milestone_status,owner_id").eq("project_id",projectId).order("due_date")
  ]);
  const role=membership.data?.workspace_role??"member";const isManager=role==="owner"||role==="manager";
  setManager(isManager);setCanEdit(isManager||p.owner_id===user.id);
  const people=(rosterResult.data??[]) as Roster[];setRoster(people);
  if(taskResult.error)setError(taskResult.error.message);
  if(milestoneResult.error)setError(milestoneResult.error.message);
  setTasks((taskResult.data??[]) as Task[]);setMilestones((milestoneResult.data??[]) as Milestone[]);
  if(!selectedTask&&taskResult.data?.length)setSelectedTask(taskResult.data[0].id);
  const ids=people.map(m=>m.user_id);
  if(ids.length){
   const {data:profiles}=await supabase.from("jec_profiles").select("user_id,display_name,first_name,last_name").in("user_id",ids);
   const map:Record<string,string>={};
   for(const row of profiles??[])map[row.user_id]=row.display_name||[row.first_name,row.last_name].filter(Boolean).join(" ")||(en?"JEC member":"Membre JEC");
   setNames(map);
  }
  setLoading(false);
 },[projectId,en,selectedTask]);

 useEffect(()=>{void load();},[load]);

 const loadComments=useCallback(async()=>{
  if(!selectedTask)return;const supabase=getSupabaseBrowserClient();if(!supabase)return;
  const {data,error:e}=await supabase.from("jec_task_comments").select("id,task_id,author_id,body,created_at").eq("task_id",selectedTask).order("created_at");
  if(e)setError(e.message);else setComments((data??[]) as Comment[]);
 },[selectedTask]);
 useEffect(()=>{void loadComments();},[loadComments]);

 async function updateProject(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!project||!canEdit)return;const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);setError("");
  const {error:e2}=await supabase.from("jec_projects").update({
   objective:editObjective.trim()||null,description:editDescription.trim()||null,
   project_status:editStatus,priority:editPriority,start_date:editStart||null,due_date:editDue||null,updated_at:new Date().toISOString()
  }).eq("id",projectId);
  if(e2)setError(e2.message);else{setNotice(en?"Project updated.":"Projet mis à jour.");await load();}
  setBusy(false);
 }

 async function addTask(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!project)return;const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);setError("");
  const {error:e2}=await supabase.from("jec_workspace_tasks").insert({
   workspace_id:project.workspace_id,project_id:projectId,title:taskTitle.trim(),description:taskDescription.trim()||null,
   priority:taskPriority,assigned_to:taskAssignee||null,due_at:taskDue?new Date(taskDue+"T12:00:00").toISOString():null,created_by:userId
  });
  if(e2)setError(e2.message);else{setTaskTitle("");setTaskDescription("");setTaskAssignee("");setTaskDue("");setNotice(en?"Task created.":"Tâche créée.");await load();}
  setBusy(false);
 }

 async function updateTask(id:string,values:Partial<Pick<Task,"task_status"|"priority"|"assigned_to"|"due_at">>){
  const supabase=getSupabaseBrowserClient();if(!supabase)return;
  const {error:e}=await supabase.from("jec_workspace_tasks").update({...values,updated_at:new Date().toISOString()}).eq("id",id);
  if(e)setError(e.message);else await load();
 }

 async function addMilestone(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!project||!manager)return;const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);setError("");
  const {error:e2}=await supabase.from("jec_project_milestones").insert({
   workspace_id:project.workspace_id,project_id:projectId,title:milestoneTitle.trim(),description:milestoneDescription.trim()||null,
   due_date:milestoneDue||null,owner_id:milestoneOwner||null,created_by:userId
  });
  if(e2)setError(e2.message);else{setMilestoneTitle("");setMilestoneDescription("");setMilestoneDue("");setMilestoneOwner("");setNotice(en?"Milestone added.":"Jalon ajouté.");await load();}
  setBusy(false);
 }

 async function updateMilestone(id:string,status:string){
  const supabase=getSupabaseBrowserClient();if(!supabase)return;
  const {error:e}=await supabase.from("jec_project_milestones").update({milestone_status:status,updated_at:new Date().toISOString()}).eq("id",id);
  if(e)setError(e.message);else await load();
 }

 async function addComment(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!project||!selectedTask)return;const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);const {error:e2}=await supabase.from("jec_task_comments").insert({workspace_id:project.workspace_id,task_id:selectedTask,author_id:userId,body:commentBody.trim()});
  if(e2)setError(e2.message);else{setCommentBody("");await loadComments();}
  setBusy(false);
 }

 if(loading)return <main className="collab-page"><p className="muted">{en?"Loading project…":"Chargement du projet…"}</p></main>;
 if(!project)return <main className="collab-page"><div className="collab-content"><p className="alert error">{error||"Projet indisponible."}</p><Link href="/projets">Retour aux projets</Link></div></main>;

 const columns=[["todo",en?"To do":"À faire"],["in_progress",en?"In progress":"En cours"],["blocked",en?"Blocked":"Bloquées"],["done",en?"Done":"Terminées"]] as const;
 const completed=tasks.filter(t=>t.task_status==="done").length;
 const progress=tasks.length?Math.round(completed/tasks.length*100):0;
 return <main className="collab-page">
  <header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/projets" className="back-link-inline">{en?"All projects":"Tous les projets"}</Link></div></header>
  <div className="collab-content project-detail-content">
   <p className="eyebrow">{en?"PROJECT MANAGEMENT":"GESTION DE PROJET"}</p>
   <div className="project-detail-heading"><div><h1>{project.title}</h1><p className="collab-lead">{project.objective|| (en?"No objective defined.":"Aucun objectif défini.")}</p></div><span className={"project-status "+project.project_status}>{project.project_status}</span></div>
   {error&&<p className="alert error">{error}</p>}{notice&&<p className="alert success">{notice}</p>}
   <div className="project-kpi-grid">
    <article className="project-kpi"><strong>{tasks.length}</strong><span>{en?"Tasks":"Tâches"}</span></article>
    <article className="project-kpi"><strong>{completed}</strong><span>{en?"Completed":"Terminées"}</span></article>
    <article className="project-kpi"><strong>{milestones.length}</strong><span>{en?"Milestones":"Jalons"}</span></article>
    <article className="project-kpi"><strong>{progress}%</strong><span>{en?"Progress":"Avancement"}</span></article>
   </div>
   <div className="project-progress"><div><span>{en?"Overall progress":"Avancement global"}</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{width:progress+"%"}}/></div></div>
   {canEdit&&<details className="collab-card project-edit-details"><summary>{en?"Project settings":"Paramètres du projet"}</summary><form className="collab-form" onSubmit={updateProject}>
    <label>{en?"Objective":"Objectif"}<textarea rows={2} value={editObjective} onChange={e=>setEditObjective(e.target.value)}/></label>
    <label>{en?"Description":"Description"}<textarea rows={3} value={editDescription} onChange={e=>setEditDescription(e.target.value)}/></label>
    <div className="task-create-form"><label>{en?"Status":"Statut"}<select value={editStatus} onChange={e=>setEditStatus(e.target.value)}><option value="draft">Brouillon</option><option value="active">Actif</option><option value="on_hold">En pause</option><option value="completed">Terminé</option><option value="archived">Archivé</option></select></label><label>{en?"Priority":"Priorité"}<select value={editPriority} onChange={e=>setEditPriority(e.target.value)}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="critical">Critique</option></select></label></div>
    <div className="task-create-form"><label>{en?"Start date":"Début"}<input type="date" value={editStart} onChange={e=>setEditStart(e.target.value)}/></label><label>{en?"Due date":"Échéance"}<input type="date" value={editDue} onChange={e=>setEditDue(e.target.value)}/></label></div>
    <button className="primary-button" disabled={busy}>{en?"Save project":"Enregistrer le projet"}</button>
   </form></details>}
   <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"DELIVERABLES AND CHECKPOINTS":"LIVRABLES ET ÉCHÉANCES"}</p><h2>{en?"Milestones":"Jalons"}</h2></div><span className="collab-count">{milestones.length}</span></div>
    {milestones.map(m=><article className="project-milestone-row" key={m.id}><span className="milestone-marker">◆</span><div className="milestone-main"><strong>{m.title}</strong>{m.description&&<p>{m.description}</p>}<small>{fmt(m.due_date,en)}{m.owner_id?" · "+(names[m.owner_id]||"Membre JEC"):""}</small></div><span className={"project-status "+m.milestone_status}>{m.milestone_status}</span>{manager&&<select value={m.milestone_status} onChange={e=>void updateMilestone(m.id,e.target.value)}><option value="pending">À venir</option><option value="in_progress">En cours</option><option value="at_risk">À risque</option><option value="completed">Terminé</option></select>}</article>)}
    {!milestones.length&&<p className="collab-muted">{en?"No milestones yet.":"Aucun jalon défini."}</p>}
    {manager&&<form className="collab-form" onSubmit={addMilestone}><h3>{en?"Add a milestone":"Ajouter un jalon"}</h3><label>{en?"Title":"Intitulé"}<input value={milestoneTitle} onChange={e=>setMilestoneTitle(e.target.value)} required/></label><label>{en?"Description":"Description"}<textarea rows={2} value={milestoneDescription} onChange={e=>setMilestoneDescription(e.target.value)}/></label><div className="task-create-form"><label>{en?"Due date":"Échéance"}<input type="date" value={milestoneDue} onChange={e=>setMilestoneDue(e.target.value)}/></label><label>{en?"Owner":"Responsable"}<select value={milestoneOwner} onChange={e=>setMilestoneOwner(e.target.value)}><option value="">—</option>{activeMembers.map(m=><option key={m.user_id} value={m.user_id}>{names[m.user_id]||"Membre JEC"}</option>)}</select></label></div><button className="primary-button" disabled={busy}>{en?"Add milestone":"Ajouter le jalon"}</button></form>}
   </section>
   <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"WORK BREAKDOWN":"PLAN D'ACTION"}</p><h2>{en?"Task board":"Tableau des tâches"}</h2></div><span className="collab-count">{tasks.length}</span></div>
    {tasks.length?<div className="project-kanban">{columns.map(([status,label])=><div className="project-kanban-column" key={status}><h3>{label} <span>{tasks.filter(t=>t.task_status===status).length}</span></h3>{tasks.filter(t=>t.task_status===status).map(task=><button className={selectedTask===task.id?"project-task-card selected":"project-task-card"} key={task.id} onClick={()=>setSelectedTask(task.id)}><strong>{task.title}</strong><small>{task.assigned_to?(names[task.assigned_to]||"Membre JEC"):(en?"Unassigned":"Non attribuée")}</small><small>{task.due_at?fmt(task.due_at,en):"—"}</small><span className={"project-status "+task.priority}>{task.priority}</span></button>)}</div>)}</div>:<p className="collab-muted">{en?"No tasks linked to this project yet.":"Aucune tâche rattachée à ce projet."}</p>}
    {canEdit&&<form className="collab-form project-task-create" onSubmit={addTask}><h3>{en?"Create a task":"Créer une tâche"}</h3><label>{en?"Task title":"Intitulé"}<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required/></label><label>{en?"Details":"Description"}<textarea rows={2} value={taskDescription} onChange={e=>setTaskDescription(e.target.value)}/></label><div className="task-create-form"><label>{en?"Responsible member":"Responsable"}<select value={taskAssignee} onChange={e=>setTaskAssignee(e.target.value)}><option value="">—</option>{activeMembers.map(m=><option key={m.user_id} value={m.user_id}>{names[m.user_id]||"Membre JEC"}</option>)}</select></label><label>{en?"Due date":"Échéance"}<input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label><label>{en?"Priority":"Priorité"}<select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="critical">Critique</option></select></label></div><button className="primary-button" disabled={busy}>{en?"Add task":"Ajouter la tâche"}</button></form>}
   </section>
   {selected&&<section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"TASK WORKSPACE":"ESPACE DE LA TÂCHE"}</p><h2>{selected.title}</h2></div><span className={"project-status "+selected.task_status}>{selected.task_status}</span></div>
    <div className="task-detail-controls"><label>{en?"Status":"Statut"}<select value={selected.task_status} onChange={e=>void updateTask(selected.id,{task_status:e.target.value})}><option value="todo">À faire</option><option value="in_progress">En cours</option><option value="blocked">Bloquée</option><option value="done">Terminée</option><option value="cancelled">Annulée</option></select></label><label>{en?"Priority":"Priorité"}<select value={selected.priority} onChange={e=>void updateTask(selected.id,{priority:e.target.value})}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option><option value="critical">Critique</option></select></label>{manager&&<label>{en?"Assignee":"Responsable"}<select value={selected.assigned_to??""} onChange={e=>void updateTask(selected.id,{assigned_to:e.target.value||null})}><option value="">—</option>{activeMembers.map(m=><option key={m.user_id} value={m.user_id}>{names[m.user_id]||"Membre JEC"}</option>)}</select></label>}</div>
    <div className="task-comment-list"><h3>{en?"Discussion and updates":"Commentaires et échanges"}</h3>{comments.map(c=><article className="task-comment" key={c.id}><div className="roster-avatar">{(names[c.author_id]||"J").slice(0,1)}</div><div><strong>{names[c.author_id]||"Membre JEC"}</strong><small>{fmt(c.created_at,en)}</small><p>{c.body}</p></div></article>)}{!comments.length&&<p className="collab-muted">{en?"No comment yet.":"Aucun commentaire pour le moment."}</p>}
    <form className="collab-form" onSubmit={addComment}><label>{en?"Add a comment":"Ajouter un commentaire"}<textarea rows={3} value={commentBody} onChange={e=>setCommentBody(e.target.value)} required maxLength={8000}/></label><button className="primary-button" disabled={busy}>{en?"Send comment":"Envoyer le commentaire"}</button></form></div>
   </section>}
   <div className="project-related-links"><Link href={project.due_date?"/reunions":"/workspace"}>{en?"Related team meetings":"Réunions d'équipe"}</Link><Link href="/documents">{en?"Shared documents":"Documents partagés"}</Link></div>
  </div>
 </main>;
}
