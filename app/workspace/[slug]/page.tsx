"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Tab="feed"|"tasks"|"projects"|"meetings"|"documents"|"members";
type Workspace={id:string;name:string;slug:string;workspace_type:string;description:string|null};
type RosterRow={user_id:string;workspace_role:"owner"|"manager"|"member";membership_status:"invited"|"active"|"suspended"};
type Profile={user_id:string;first_name:string|null;last_name:string|null;display_name:string|null;avatar_url:string|null};
type Post={id:string;author_id:string;body:string;is_pinned:boolean;created_at:string};
type Task={id:string;title:string;description:string|null;task_status:string;priority:string;assigned_to:string|null;due_at:string|null;created_by:string};
type Project={id:string;title:string;objective:string|null;project_status:string;priority:string;owner_id:string;due_date:string|null};
type Meeting={id:string;title:string;agenda:string|null;starts_at:string;ends_at:string|null;location:string|null;meeting_url:string|null;meeting_status:string};
type MeetingParticipant={meeting_id:string;user_id:string;attendance_status:"invited"|"accepted"|"declined"|"attended"|"absent";responded_at:string|null};
type DocumentRow={id:string;title:string;description:string|null;file_name:string;storage_path:string;mime_type:string|null;file_size:number|null;document_category:string;uploaded_by:string;created_at:string};

const tabs:Record<Tab,{fr:string;en:string;icon:string}>={
  feed:{fr:"Fil d'échanges",en:"Discussion feed",icon:"▤"},
  tasks:{fr:"Tâches",en:"Tasks",icon:"☑"},
  projects:{fr:"Projets",en:"Projects",icon:"◫"},
  meetings:{fr:"Réunions",en:"Meetings",icon:"▣"},
  documents:{fr:"Documents",en:"Documents",icon:"▱"},
  members:{fr:"Membres",en:"Members",icon:"♙"}
};

function formatDate(value:string,en:boolean,withTime=false){
  return new Date(value).toLocaleString(en?"en-GB":"fr-FR",withTime?{dateStyle:"medium",timeStyle:"short"}:{dateStyle:"medium"});
}
function initials(value:string){
  return value.trim().split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase()||"J";
}
function safeName(value:string){
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(-110)||"document";
}

export default function WorkspaceDetailPage(){
  const params=useParams<{slug:string}>();
  const slug=decodeURIComponent(params.slug);
  const {lang}=useLanguage();
  const en=lang==="en";
  const [loading,setLoading]=useState(true);
  const [userId,setUserId]=useState("");
  const [isAdmin,setIsAdmin]=useState(false);
  const [workspace,setWorkspace]=useState<Workspace|null>(null);
  const [myRole,setMyRole]=useState<"owner"|"manager"|"member"|null>(null);
  const [invitePending,setInvitePending]=useState(false);
  const [roster,setRoster]=useState<RosterRow[]>([]);
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [posts,setPosts]=useState<Post[]>([]);
  const [tasks,setTasks]=useState<Task[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const [meetings,setMeetings]=useState<Meeting[]>([]);
  const [meetingParticipants,setMeetingParticipants]=useState<MeetingParticipant[]>([]);
  const [documents,setDocuments]=useState<DocumentRow[]>([]);
  const [activeTab,setActiveTab]=useState<Tab>("feed");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [busy,setBusy]=useState(false);
  const [postBody,setPostBody]=useState("");
  const [taskTitle,setTaskTitle]=useState("");
  const [taskDue,setTaskDue]=useState("");
  const [taskPriority,setTaskPriority]=useState("normal");
  const [projectTitle,setProjectTitle]=useState("");
  const [projectObjective,setProjectObjective]=useState("");
  const [projectDue,setProjectDue]=useState("");
  const [meetingTitle,setMeetingTitle]=useState("");
  const [meetingAgenda,setMeetingAgenda]=useState("");
  const [meetingStart,setMeetingStart]=useState("");
  const [meetingEnd,setMeetingEnd]=useState("");
  const [meetingLocation,setMeetingLocation]=useState("");
  const [meetingUrl,setMeetingUrl]=useState("");
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteRole,setInviteRole]=useState<"member"|"manager">("member");
  const [documentTitle,setDocumentTitle]=useState("");
  const [documentCategory,setDocumentCategory]=useState("general");
  const [documentDescription,setDocumentDescription]=useState("");
  const [selectedFile,setSelectedFile]=useState<File|null>(null);

  const manager= isAdmin||myRole==="owner"||myRole==="manager";
  const profileById=useMemo(()=>new Map(profiles.map(profile=>[profile.user_id,profile])),[profiles]);
  const canCollaborate=Boolean(workspace)&&(isAdmin||myRole!==null);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    const supabase=getSupabaseBrowserClient();
    if(!supabase){setError(en?"Supabase is not configured.":"Supabase n'est pas configuré.");setLoading(false);return;}
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user){window.location.href="/login";return;}
    setUserId(user.id);
    const {data:adminFlag}=await supabase.rpc("is_jec_admin");
    const admin=adminFlag===true;setIsAdmin(admin);
    const {data:space,error:spaceError}=await supabase.from("jec_workspaces")
      .select("id,name,slug,workspace_type,description").eq("slug",slug).maybeSingle();
    if(spaceError||!space){setError(en?"This workspace does not exist or you do not have access.":"Cet espace n'existe pas ou tu n'y as pas accès.");setWorkspace(null);setLoading(false);return;}
    setWorkspace(space as Workspace);
    const {data:myMembership}=await supabase.from("jec_workspace_members")
      .select("workspace_role,membership_status").eq("workspace_id",space.id).eq("user_id",user.id).maybeSingle();
    const myStatus=myMembership?.membership_status;
    setInvitePending(myStatus==="invited");
    setMyRole(myStatus==="active"?(myMembership?.workspace_role as "owner"|"manager"|"member"):null);
    if(!admin&&myStatus!=="active"){
      setRoster([]);setPosts([]);setTasks([]);setProjects([]);setMeetings([]);setDocuments([]);
      setLoading(false);return;
    }
    const [rosterResult,postResult,taskResult,projectResult,meetingResult,documentResult]=await Promise.all([
      supabase.from("jec_workspace_members").select("user_id,workspace_role,membership_status").eq("workspace_id",space.id).eq("membership_status","active"),
      supabase.from("jec_workspace_posts").select("id,author_id,body,is_pinned,created_at").eq("workspace_id",space.id).order("created_at",{ascending:false}).limit(100),
      supabase.from("jec_workspace_tasks").select("id,title,description,task_status,priority,assigned_to,due_at,created_by").eq("workspace_id",space.id).order("created_at",{ascending:false}).limit(150),
      supabase.from("jec_projects").select("id,title,objective,project_status,priority,owner_id,due_date").eq("workspace_id",space.id).order("created_at",{ascending:false}),
      supabase.from("jec_meetings").select("id,title,agenda,starts_at,ends_at,location,meeting_url,meeting_status").eq("workspace_id",space.id).order("starts_at",{ascending:true}),
      supabase.from("jec_documents").select("id,title,description,file_name,storage_path,mime_type,file_size,document_category,uploaded_by,created_at").eq("workspace_id",space.id).order("created_at",{ascending:false})
    ]);
    const queryError=rosterResult.error||postResult.error||taskResult.error||projectResult.error||meetingResult.error||documentResult.error;
    if(queryError)setError(queryError.message);
    const rosterRows=(rosterResult.data??[]) as RosterRow[];
    setRoster(rosterRows);
    setPosts((postResult.data??[]) as Post[]);
    setTasks((taskResult.data??[]) as Task[]);
    setProjects((projectResult.data??[]) as Project[]);
    setMeetings((meetingResult.data??[]) as Meeting[]);
    const meetingIds=(meetingResult.data??[]).map((row:{id:string})=>row.id);
    if(meetingIds.length){
      const {data:participantRows,error:participantError}=await supabase.from("jec_meeting_participants")
        .select("meeting_id,user_id,attendance_status,responded_at").in("meeting_id",meetingIds);
      if(participantError)setError(participantError.message);
      setMeetingParticipants((participantRows??[]) as MeetingParticipant[]);
    }else setMeetingParticipants([]);
    setDocuments((documentResult.data??[]) as DocumentRow[]);
    const ids=rosterRows.map(row=>row.user_id);
    if(ids.length){
      const {data:profileRows,error:profileError}=await supabase.from("jec_profiles")
        .select("user_id,first_name,last_name,display_name,avatar_url").in("user_id",ids);
      if(profileError)setError(profileError.message);
      setProfiles((profileRows??[]) as Profile[]);
    }else setProfiles([]);
    setLoading(false);
  },[slug,en]);

  useEffect(()=>{void load();},[load]);

  async function acceptInvitation(){
    const supabase=getSupabaseBrowserClient();
    if(!supabase||!workspace)return;
    setBusy(true);setError("");setNotice("");
    const {error:acceptError}=await supabase.rpc("jec_workspace_accept_invitation",{target_workspace_id:workspace.id});
    if(acceptError)setError(acceptError.message);
    else {setNotice(en?"Invitation accepted. Welcome to the workspace!":"Invitation acceptée. Bienvenue dans l'espace !");await load();}
    setBusy(false);
  }

  async function createPost(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!workspace||!userId)return;
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setBusy(true);setError("");setNotice("");
    const {error:insertError}=await supabase.from("jec_workspace_posts").insert({workspace_id:workspace.id,author_id:userId,body:postBody.trim()});
    if(insertError)setError(insertError.message);
    else {setPostBody("");await load();}
    setBusy(false);
  }

  async function createTask(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!workspace||!userId)return;
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setBusy(true);setError("");setNotice("");
    const {error:insertError}=await supabase.from("jec_workspace_tasks").insert({
      workspace_id:workspace.id,title:taskTitle.trim(),task_status:"todo",priority:taskPriority,
      due_at:taskDue?new Date(taskDue).toISOString():null,created_by:userId
    });
    if(insertError)setError(insertError.message);
    else {setTaskTitle("");setTaskDue("");setTaskPriority("normal");setNotice(en?"Task added.":"Tâche ajoutée.");await load();}
    setBusy(false);
  }

  async function updateTaskStatus(task:Task,status:string){
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    const {error:updateError}=await supabase.from("jec_workspace_tasks").update({task_status:status,updated_at:new Date().toISOString()}).eq("id",task.id);
    if(updateError)setError(updateError.message);else await load();
  }

  async function createProject(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!workspace||!userId)return;
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setBusy(true);setError("");setNotice("");
    const {error:insertError}=await supabase.from("jec_projects").insert({
      workspace_id:workspace.id,title:projectTitle.trim(),objective:projectObjective.trim()||null,
      project_status:"draft",priority:"normal",owner_id:userId,created_by:userId,due_date:projectDue||null
    });
    if(insertError)setError(insertError.message);
    else {setProjectTitle("");setProjectObjective("");setProjectDue("");setNotice(en?"Project created.":"Projet créé.");await load();}
    setBusy(false);
  }

  async function createMeeting(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!workspace||!userId)return;
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setBusy(true);setError("");setNotice("");
    const {data:createdMeeting,error:insertError}=await supabase.from("jec_meetings").insert({
      workspace_id:workspace.id,title:meetingTitle.trim(),agenda:meetingAgenda.trim()||null,
      starts_at:new Date(meetingStart).toISOString(),ends_at:meetingEnd?new Date(meetingEnd).toISOString():null,
      location:meetingLocation.trim()||null,meeting_url:meetingUrl.trim()||null,
      meeting_status:"scheduled",created_by:userId
    }).select("id").single();
    if(insertError)setError(insertError.message);
    else if(createdMeeting){
      const participants=roster.filter(member=>member.membership_status==="active").map(member=>({
        meeting_id:createdMeeting.id,
        user_id:member.user_id,
        attendance_status:member.user_id===userId?"accepted" as const:"invited" as const,
        responded_at:member.user_id===userId?new Date().toISOString():null
      }));
      if(participants.length){
        const {error:participantError}=await supabase.from("jec_meeting_participants").insert(participants);
        if(participantError)setError(participantError.message);
      }
      setMeetingTitle("");setMeetingAgenda("");setMeetingStart("");setMeetingEnd("");setMeetingLocation("");setMeetingUrl("");
      setNotice(en?"Meeting scheduled and workspace members invited.":"Réunion programmée et invitations envoyées aux membres de l'espace.");
      await load();
    }
    setBusy(false);
  }

  async function respondToMeeting(meetingId:string,status:"accepted"|"declined"){
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setError("");setNotice("");
    const {error:responseError}=await supabase.from("jec_meeting_participants").update({
      attendance_status:status,responded_at:new Date().toISOString()
    }).eq("meeting_id",meetingId).eq("user_id",userId);
    if(responseError)setError(responseError.message);
    else{setNotice(en?"Your response has been saved.":"Ta réponse a été enregistrée.");await load();}
  }

  async function inviteMember(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!workspace)return;
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setBusy(true);setError("");setNotice("");
    const {error:inviteError}=await supabase.rpc("jec_workspace_invite_by_email",{
      target_workspace_id:workspace.id,target_email:inviteEmail.trim(),target_role:inviteRole
    });
    if(inviteError)setError(inviteError.message);
    else {setInviteEmail("");setNotice(en?"Invitation created. The member will see it in their workspaces.":"Invitation créée. Le membre la retrouvera dans ses espaces.");await load();}
    setBusy(false);
  }

  async function uploadDocument(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!workspace||!userId||!selectedFile)return;
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    if(selectedFile.size>50*1024*1024){setError(en?"Files are limited to 50 MB.":"Les fichiers sont limités à 50 Mo.");return;}
    setBusy(true);setError("");setNotice("");
    const path=workspace.id+"/"+userId+"/"+Date.now()+"-"+safeName(selectedFile.name);
    const {error:storageError}=await supabase.storage.from("jec-workspace-documents").upload(path,selectedFile,{
      contentType:selectedFile.type||"application/octet-stream",upsert:false
    });
    if(storageError){setError(storageError.message);setBusy(false);return;}
    const {error:metadataError}=await supabase.from("jec_documents").insert({
      workspace_id:workspace.id,title:documentTitle.trim()||selectedFile.name,
      description:documentDescription.trim()||null,document_category:documentCategory,
      file_name:selectedFile.name,storage_path:path,mime_type:selectedFile.type||null,
      file_size:selectedFile.size,uploaded_by:userId
    });
    if(metadataError){
      await supabase.storage.from("jec-workspace-documents").remove([path]);
      setError(metadataError.message);
    }else{
      setDocumentTitle("");setDocumentDescription("");setDocumentCategory("general");setSelectedFile(null);setNotice(en?"Document stored privately in this workspace.":"Document enregistré dans l'espace privé.");await load();
    }
    setBusy(false);
  }

  async function openDocument(document:DocumentRow){
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    const {data,error:downloadError}=await supabase.storage.from("jec-workspace-documents").createSignedUrl(document.storage_path,300);
    if(downloadError){setError(downloadError.message);return;}
    if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  async function removeDocument(document:DocumentRow){
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    if(!window.confirm(en?"Delete this private document permanently?":"Supprimer définitivement ce document privé ?"))return;
    const {error:storageError}=await supabase.storage.from("jec-workspace-documents").remove([document.storage_path]);
    if(storageError){setError(storageError.message);return;}
    const {error:rowError}=await supabase.from("jec_documents").delete().eq("id",document.id);
    if(rowError)setError(rowError.message);else {setNotice(en?"Document deleted.":"Document supprimé.");await load();}
  }

  const personName=(id:string)=>{
    const profile=profileById.get(id);
    return profile?.display_name||[profile?.first_name,profile?.last_name].filter(Boolean).join(" ")||(en?"JEC member":"Membre JEC");
  };

  return <main className="collab-page">
    <header className="account-header">
      <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link>
      <div><LanguageSwitcher/><Link href="/workspace" className="back-link-inline">{en?"All workspaces":"Tous les espaces"}</Link></div>
    </header>
    <div className="workspace-detail-content">
      {loading?<p className="muted">{en?"Loading workspace…":"Chargement de l'espace…"}</p>:!workspace?<div className="collab-empty"><h1>{en?"Workspace unavailable":"Espace indisponible"}</h1><p>{error}</p><Link href="/workspace" className="primary-button">{en?"Back to workspaces":"Retour aux espaces"}</Link></div>:<>
        <div className="workspace-title-row">
          <div><p className="eyebrow">{en?"PRIVATE WORKSPACE":"ESPACE PRIVÉ"}</p><h1>{workspace.name}</h1><p className="collab-lead">{workspace.description}</p></div>
          <span className={"workspace-role-pill "+(manager?"manager":"member")}>{isAdmin?(en?"Administrator": "Administratrice"):myRole==="owner"?(en?"Owner":"Propriétaire"):myRole==="manager"?(en?"Manager":"Responsable"):(en?"Member":"Membre")}</span>
        </div>

        {invitePending?<section className="collab-empty"><span>✉</span><h2>{en?"You have been invited":"Tu as reçu une invitation"}</h2><p>{en?"Accept this invitation to view the workspace feed, tasks, projects, meetings and documents.":"Accepte l'invitation pour accéder au fil d'échanges, aux tâches, projets, réunions et documents."}</p><button className="primary-button" disabled={busy} onClick={acceptInvitation}>{en?"Accept invitation":"Accepter l'invitation"}</button></section>:!canCollaborate?<div className="collab-empty"><h2>{en?"Access required":"Accès requis"}</h2><p>{en?"You are not an active member of this workspace.":"Tu n'es pas membre actif de cet espace."}</p></div>:<>
          <nav className="workspace-tabs">{(Object.keys(tabs) as Tab[]).map(tab=><button key={tab} onClick={()=>setActiveTab(tab)} className={activeTab===tab?"active":""}><span>{tabs[tab].icon}</span>{tabs[tab][en?"en":"fr"]}</button>)}</nav>
          {error&&<p className="alert error">{error}</p>}
          {notice&&<p className="alert success">{notice}</p>}

          {activeTab==="feed"&&<section className="workspace-panel">
            <div className="collab-section-heading"><div><p className="eyebrow">{en?"TEAM DISCUSSION":"ÉCHANGES DE L'ÉQUIPE"}</p><h2>{en?"Workspace feed":"Fil d'échanges"}</h2></div><span>{posts.length} {en?"posts":"publications"}</span></div>
            <form className="collab-form compact" onSubmit={createPost}><label>{en?"Share an update with this workspace":"Partager une information avec cet espace"}<textarea rows={3} value={postBody} onChange={e=>setPostBody(e.target.value)} required maxLength={12000} placeholder={en?"News, questions, progress…":"Actualité, question, avancement…"} /></label><button className="primary-button" disabled={busy||!postBody.trim()}>{en?"Publish":"Publier"}</button></form>
            {posts.length?posts.map(post=><article className="workspace-post" key={post.id}><div className="workspace-post-avatar">{initials(personName(post.author_id))}</div><div className="workspace-post-content"><div className="workspace-post-meta"><strong>{post.author_id===userId?(en?"You":"Toi"):personName(post.author_id)}</strong><time>{formatDate(post.created_at,en,true)}</time></div><p>{post.body}</p>{post.is_pinned&&<span className="post-tag violet">{en?"Pinned":"Épinglé"}</span>}</div></article>):<div className="collab-empty compact"><p>{en?"No message yet. Start the conversation.":"Aucun message pour le moment. Lance la discussion."}</p></div>}
          </section>}

          {activeTab==="tasks"&&<section className="workspace-panel">
            <div className="collab-section-heading"><div><p className="eyebrow">{en?"ACTION TRACKING":"SUIVI DES ACTIONS"}</p><h2>{en?"Tasks":"Tâches"}</h2></div><span>{tasks.length}</span></div>
            <form className="collab-form task-create-form" onSubmit={createTask}>
              <label>{en?"Task title":"Intitulé de la tâche"}<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required maxLength={180}/></label>
              <label>{en?"Priority":"Priorité"}<select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)}><option value="low">{en?"Low":"Basse"}</option><option value="normal">{en?"Normal":"Normale"}</option><option value="high">{en?"High":"Haute"}</option><option value="critical">{en?"Critical":"Critique"}</option></select></label>
              <label>{en?"Due date":"Échéance"}<input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label>
              <button className="primary-button" disabled={busy}>{en?"Add task":"Ajouter la tâche"}</button>
            </form>
            {tasks.length?tasks.map(task=><article className="workspace-task-row" key={task.id}><div className="task-status-dot" data-status={task.task_status}/><div className="workspace-task-main"><strong>{task.title}</strong><small>{task.priority.toUpperCase()}{task.due_at?" · "+formatDate(task.due_at,en):""}</small>{task.description&&<p>{task.description}</p>}</div>{manager||task.created_by===userId||task.assigned_to===userId?<select value={task.task_status} onChange={e=>updateTaskStatus(task,e.target.value)} aria-label={en?"Task status":"Statut de la tâche"}><option value="todo">{en?"To do":"À faire"}</option><option value="in_progress">{en?"In progress":"En cours"}</option><option value="blocked">{en?"Blocked":"Bloquée"}</option><option value="done">{en?"Done":"Terminée"}</option><option value="cancelled">{en?"Cancelled":"Annulée"}</option></select>:<span className="project-status">{task.task_status.replace("_"," ")}</span>}</article>):<div className="collab-empty compact"><p>{en?"No tasks yet.":"Aucune tâche pour le moment."}</p></div>}
          </section>}

          {activeTab==="projects"&&<section className="workspace-panel">
            <div className="collab-section-heading"><div><p className="eyebrow">{en?"COLLECTIVE INITIATIVES":"INITIATIVES COLLECTIVES"}</p><h2>{en?"Projects":"Projets"}</h2></div><span>{projects.length}</span></div>
            {manager&&<form className="collab-form" onSubmit={createProject}>
              <label>{en?"Project name":"Nom du projet"}<input value={projectTitle} onChange={e=>setProjectTitle(e.target.value)} required maxLength={180}/></label>
              <label>{en?"Objective":"Objectif"}<textarea rows={2} value={projectObjective} onChange={e=>setProjectObjective(e.target.value)}/></label>
              <label>{en?"Target date":"Date cible"}<input type="date" value={projectDue} onChange={e=>setProjectDue(e.target.value)}/></label>
              <button className="primary-button" disabled={busy}>{en?"Create project":"Créer le projet"}</button>
            </form>}
            {projects.length?<div className="collab-grid">{projects.map(project=><article className="collab-card project-card" key={project.id}><span className={"project-status "+project.project_status}>{project.project_status.replace("_"," ")}</span><h3>{project.title}</h3><p>{project.objective|| (en?"No objective provided.":"Aucun objectif renseigné.")}</p><div className="collab-card-footer"><span>{project.priority}</span><span>{project.due_date?formatDate(project.due_date,en):(en?"No due date":"Sans échéance")}</span></div></article>)}</div>:<div className="collab-empty compact"><p>{en?"No project has been created in this workspace.":"Aucun projet n'a encore été créé dans cet espace."}</p></div>}
          </section>}

          {activeTab==="meetings"&&<section className="workspace-panel">
            <div className="collab-section-heading"><div><p className="eyebrow">{en?"TEAM MEETINGS":"RENCONTRES DE L'ÉQUIPE"}</p><h2>{en?"Meetings":"Réunions"}</h2></div><span>{meetings.length}</span></div>
            {manager&&<form className="collab-form" onSubmit={createMeeting}>
              <label>{en?"Meeting title":"Intitulé de la réunion"}<input value={meetingTitle} onChange={e=>setMeetingTitle(e.target.value)} required maxLength={180}/></label>
              <label>{en?"Agenda":"Ordre du jour"}<textarea rows={3} value={meetingAgenda} onChange={e=>setMeetingAgenda(e.target.value)}/></label>
              <div className="task-create-form"><label>{en?"Starts at":"Début"}<input type="datetime-local" value={meetingStart} onChange={e=>setMeetingStart(e.target.value)} required/></label><label>{en?"Ends at":"Fin"}<input type="datetime-local" value={meetingEnd} onChange={e=>setMeetingEnd(e.target.value)}/></label></div>
              <label>{en?"Location (optional)":"Lieu (facultatif)"}<input value={meetingLocation} onChange={e=>setMeetingLocation(e.target.value)}/></label>
              <label>{en?"Video meeting link (optional)":"Lien de visioconférence (facultatif)"}<input type="url" value={meetingUrl} onChange={e=>setMeetingUrl(e.target.value)} placeholder="https://…"/></label>
              <button className="primary-button" disabled={busy}>{en?"Schedule meeting":"Programmer la réunion"}</button>
            </form>}
            {meetings.length?meetings.map(meeting=>{
              const participation=meetingParticipants.find(item=>item.meeting_id===meeting.id&&item.user_id===userId);
              return <article className="workspace-meeting-row" key={meeting.id}>
                <div className="meeting-date-block"><strong>{new Date(meeting.starts_at).toLocaleDateString(en?"en-GB":"fr-FR",{day:"2-digit"})}</strong><span>{new Date(meeting.starts_at).toLocaleDateString(en?"en-GB":"fr-FR",{month:"short"})}</span></div>
                <div className="workspace-meeting-main"><strong>{meeting.title}</strong><small>{formatDate(meeting.starts_at,en,true)}{meeting.location?" · "+meeting.location:""}</small>{meeting.agenda&&<p>{meeting.agenda}</p>}{meeting.meeting_url&&<a href={meeting.meeting_url} target="_blank" rel="noreferrer">{en?"Join video meeting →":"Rejoindre la visioconférence →"}</a>}
                  {participation&&<div className="meeting-participation">
                    {participation.attendance_status==="invited"?<><span>{en?"Your response is pending":"Ta réponse est attendue"}</span><button className="primary-button" onClick={()=>void respondToMeeting(meeting.id,"accepted")}>{en?"Attend":"Participer"}</button><button className="quiet-button" onClick={()=>void respondToMeeting(meeting.id,"declined")}>{en?"Decline":"Décliner"}</button></>:<span className="project-status">{participation.attendance_status==="accepted"?(en?"Attending":"Présence confirmée"):participation.attendance_status==="declined"?(en?"Declined":"Décliné"):participation.attendance_status}</span>}
                  </div>}
                </div><span className={"project-status "+meeting.meeting_status}>{meeting.meeting_status}</span>
              </article>;
            }):<div className="collab-empty compact"><p>{en?"No meeting scheduled.":"Aucune réunion programmée."}</p></div>}
          </section>}

          {activeTab==="documents"&&<section className="workspace-panel">
            <div className="collab-section-heading"><div><p className="eyebrow">{en?"PRIVATE FILE SPACE":"ESPACE DOCUMENTAIRE PRIVÉ"}</p><h2>{en?"Documents":"Documents"}</h2></div><span>{documents.length}</span></div>
            <form className="collab-form" onSubmit={uploadDocument}>
              <label>{en?"Document title":"Titre du document"}<input value={documentTitle} onChange={e=>setDocumentTitle(e.target.value)} placeholder={en?"Leave blank to use the file name":"Laisser vide pour utiliser le nom du fichier"}/></label>
              <label>{en?"Category":"Catégorie"}<select value={documentCategory} onChange={e=>setDocumentCategory(e.target.value)}><option value="general">{en?"General":"Général"}</option><option value="agenda">{en?"Agenda":"Ordre du jour"}</option><option value="meeting_minutes">{en?"Meeting minutes":"Compte rendu"}</option><option value="project">{en?"Project":"Projet"}</option><option value="report">{en?"Report":"Rapport"}</option><option value="administrative">{en?"Administrative":"Administratif"}</option><option value="template">{en?"Template":"Modèle"}</option><option value="other">{en?"Other":"Autre"}</option></select></label>
              <label>{en?"Description":"Description"}<textarea rows={2} value={documentDescription} onChange={e=>setDocumentDescription(e.target.value)}/></label>
              <label>{en?"File (50 MB maximum)":"Fichier (50 Mo maximum)"}<input type="file" required onChange={e=>setSelectedFile(e.target.files?.[0]??null)}/></label>
              <p className="collab-private-note">🔒 {en?"Files are private to active members of this workspace.":"Les fichiers sont privés et réservés aux membres actifs de cet espace."}</p>
              <button className="primary-button" disabled={busy||!selectedFile}>{en?"Upload document":"Déposer le document"}</button>
            </form>
            {documents.length?documents.map(document=><article className="workspace-document-row" key={document.id}><div className="document-file-icon">▱</div><div className="workspace-document-main"><strong>{document.title}</strong><small>{document.file_name} · {document.file_size?Math.ceil(document.file_size/1024)+" Ko":"—"} · {formatDate(document.created_at,en)}</small>{document.description&&<p>{document.description}</p>}</div><button className="secondary-outline-button" onClick={()=>openDocument(document)}>{en?"Open / download":"Ouvrir / télécharger"}</button>{(document.uploaded_by===userId||manager)&&<button className="danger-outline-button" onClick={()=>removeDocument(document)}>{en?"Delete":"Supprimer"}</button>}</article>):<div className="collab-empty compact"><p>{en?"No document has been uploaded to this workspace.":"Aucun document n'a été déposé dans cet espace."}</p></div>}
          </section>}

          {activeTab==="members"&&<section className="workspace-panel">
            <div className="collab-section-heading"><div><p className="eyebrow">{en?"WORKSPACE ROSTER":"MEMBRES DE L'ESPACE"}</p><h2>{en?"Members":"Membres"}</h2></div><span>{roster.length}</span></div>
            {manager&&<form className="collab-form invite-form" onSubmit={inviteMember}>
              <label>{en?"Invite a verified JEC member by email":"Inviter un membre JEC vérifié par e-mail"}<input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} required placeholder="membre@exemple.fr"/></label>
              <label>{en?"Workspace role":"Rôle dans l'espace"}<select value={inviteRole} onChange={e=>setInviteRole(e.target.value as "member"|"manager")}><option value="member">{en?"Member":"Membre"}</option><option value="manager">{en?"Manager":"Responsable"}</option></select></label>
              <button className="primary-button" disabled={busy}>{en?"Send invitation":"Envoyer l'invitation"}</button>
            </form>}
            <div className="workspace-roster">{roster.map(member=><article className="workspace-roster-row" key={member.user_id}><div className="roster-avatar">{initials(personName(member.user_id))}</div><div className="workspace-roster-name"><strong>{personName(member.user_id)}</strong><small>{member.user_id===userId?(en?"You":"Toi"):"JEC-conNEcT"}</small></div><span className="workspace-role-pill">{member.workspace_role==="owner"?(en?"Owner":"Propriétaire"):member.workspace_role==="manager"?(en?"Manager":"Responsable"):(en?"Member":"Membre")}</span></article>)}</div>
          </section>}
        </>}
      </>}
    </div>
  </main>;
}
