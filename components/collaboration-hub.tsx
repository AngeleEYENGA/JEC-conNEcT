"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ModuleKey = "workspace" | "messagerie" | "reunions" | "projets" | "documents";
type Workspace = { id:string; name:string; slug:string; workspace_type:string; description:string|null };
type RosterMember = { user_id:string; workspace_role:string; membership_status:string; display_name:string|null; email?:string|null };
type Post = { id:string; body:string; author_id:string; created_at:string };
type Project = { id:string; title:string; description:string|null; project_status:string; priority:string; due_date:string|null };
type Task = { id:string; title:string; description:string|null; task_status:string; priority:string; assigned_to:string|null; due_at:string|null };
type Meeting = { id:string; title:string; agenda:string|null; starts_at:string; ends_at:string|null; location:string|null; meeting_url:string|null; meeting_status:string };
type DocumentRow = { id:string; title:string; description:string|null; file_name:string; storage_path:string; mime_type:string|null; file_size:number|null; created_at:string };
type Conversation = { id:string; title:string|null; conversation_type:string; workspace_id:string|null; created_at:string };
type Message = { id:string; conversation_id:string; sender_id:string; body:string; created_at:string; edited_at:string|null };

const moduleNames:Record<ModuleKey,{fr:string;en:string;subtitleFr:string;subtitleEn:string}> = {
  workspace:{fr:"Workspace",en:"Workspace",subtitleFr:"La vie de ton espace de travail",subtitleEn:"Your workspace home"},
  messagerie:{fr:"Messagerie",en:"Messages",subtitleFr:"Conversations privées et échanges d'équipe",subtitleEn:"Private conversations and team discussions"},
  reunions:{fr:"Réunions",en:"Meetings",subtitleFr:"Préparer, planifier et suivre les réunions",subtitleEn:"Prepare, schedule and follow up meetings"},
  projets:{fr:"Projets",en:"Projects",subtitleFr:"Projets, responsabilités et tâches",subtitleEn:"Projects, ownership and tasks"},
  documents:{fr:"Documents",en:"Documents",subtitleFr:"Fichiers partagés dans un espace privé",subtitleEn:"Files shared inside a private workspace"}
};

function formatDate(value:string,locale:string,withTime=false){
  const d=new Date(value);
  return new Intl.DateTimeFormat(locale,withTime?{dateStyle:"medium",timeStyle:"short"}:{dateStyle:"medium"}).format(d);
}

export default function CollaborationHub({initialModule}:{initialModule:ModuleKey}){
  const {lang}=useLanguage();
  const en=lang==="en";
  const locale=en?"en-GB":"fr-FR";
  const t=(fr:string,english:string)=>en?english:fr;
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [userId,setUserId]=useState("");
  const [isAdmin,setIsAdmin]=useState(false);
  const [membershipStatus,setMembershipStatus]=useState("pending");
  const [workspaces,setWorkspaces]=useState<Workspace[]>([]);
  const [workspaceId,setWorkspaceId]=useState("");
  const [workspaceRole,setWorkspaceRole]=useState("member");
  const [workspaceStatus,setWorkspaceStatus]=useState("active");
  const [roster,setRoster]=useState<RosterMember[]>([]);
  const [profiles,setProfiles]=useState<Record<string,string>>({});
  const [posts,setPosts]=useState<Post[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const [tasks,setTasks]=useState<Task[]>([]);
  const [meetings,setMeetings]=useState<Meeting[]>([]);
  const [documents,setDocuments]=useState<DocumentRow[]>([]);
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [messages,setMessages]=useState<Message[]>([]);
  const [conversationId,setConversationId]=useState("");
  const [activeModule,setActiveModule]=useState<ModuleKey>(initialModule);

  const [postBody,setPostBody]=useState("");
  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteRole,setInviteRole]=useState("member");
  const [workspaceName,setWorkspaceName]=useState("");
  const [workspaceSlug,setWorkspaceSlug]=useState("");
  const [workspaceType,setWorkspaceType]=useState("temporary_group");
  const [workspaceDescription,setWorkspaceDescription]=useState("");

  const [projectTitle,setProjectTitle]=useState("");
  const [projectDescription,setProjectDescription]=useState("");
  const [taskTitle,setTaskTitle]=useState("");
  const [taskDescription,setTaskDescription]=useState("");
  const [taskAssignee,setTaskAssignee]=useState("");
  const [meetingTitle,setMeetingTitle]=useState("");
  const [meetingAgenda,setMeetingAgenda]=useState("");
  const [meetingStart,setMeetingStart]=useState("");
  const [meetingEnd,setMeetingEnd]=useState("");
  const [meetingLocation,setMeetingLocation]=useState("");
  const [meetingUrl,setMeetingUrl]=useState("");
  const [documentTitle,setDocumentTitle]=useState("");
  const [documentDescription,setDocumentDescription]=useState("");
  const [documentCategory,setDocumentCategory]=useState("general");
  const [selectedFile,setSelectedFile]=useState<File|null>(null);
  const [conversationTitle,setConversationTitle]=useState("");
  const [conversationMembers,setConversationMembers]=useState<string[]>([]);
  const [messageBody,setMessageBody]=useState("");

  const supabase=getSupabaseBrowserClient();
  const activeWorkspace=workspaces.find(w=>w.id===workspaceId)??null;
  const canManage= isAdmin || workspaceRole==="owner" || workspaceRole==="manager";
  const activeConversation=conversations.find(c=>c.id===conversationId)??null;

  const loadWorkspaceData=useCallback(async (targetWorkspaceId:string, currentUserId:string)=>{
    if(!supabase||!targetWorkspaceId)return;
    const [membershipResult,rosterResult,postResult,projectResult,taskResult,meetingResult,documentResult]=await Promise.all([
      supabase.from("jec_workspace_members").select("workspace_role,membership_status").eq("workspace_id",targetWorkspaceId).eq("user_id",currentUserId).maybeSingle(),
      supabase.from("jec_workspace_members").select("user_id,workspace_role,membership_status").eq("workspace_id",targetWorkspaceId).order("created_at"),
      supabase.from("jec_workspace_posts").select("id,body,author_id,created_at").eq("workspace_id",targetWorkspaceId).order("created_at",{ascending:false}).limit(50),
      supabase.from("jec_projects").select("id,title,description,project_status,priority,due_date").eq("workspace_id",targetWorkspaceId).order("created_at",{ascending:false}),
      supabase.from("jec_workspace_tasks").select("id,title,description,task_status,priority,assigned_to,due_at").eq("workspace_id",targetWorkspaceId).order("created_at",{ascending:false}),
      supabase.from("jec_meetings").select("id,title,agenda,starts_at,ends_at,location,meeting_url,meeting_status").eq("workspace_id",targetWorkspaceId).order("starts_at",{ascending:true}),
      supabase.from("jec_documents").select("id,title,description,file_name,storage_path,mime_type,file_size,created_at").eq("workspace_id",targetWorkspaceId).order("created_at",{ascending:false})
    ]);
    if(membershipResult.error)throw membershipResult.error;
    setWorkspaceRole(membershipResult.data?.workspace_role??"member");
    setWorkspaceStatus(membershipResult.data?.membership_status??"invited");
    if(rosterResult.error)throw rosterResult.error;
    const rosterRows=(rosterResult.data??[]) as Omit<RosterMember,"display_name">[];
    const memberIds=rosterRows.map(m=>m.user_id);
    let profileMap:Record<string,string>={};
    if(memberIds.length){
      const {data:profileRows,error:profileError}=await supabase.from("jec_profiles").select("user_id,display_name,first_name,last_name").in("user_id",memberIds);
      if(profileError)throw profileError;
      for(const p of profileRows??[]){
        profileMap[p.user_id]=p.display_name||[p.first_name,p.last_name].filter(Boolean).join(" ")||t("Membre JEC","JEC member");
      }
    }
    setProfiles(profileMap);
    setRoster(rosterRows.map(m=>({...m,display_name:profileMap[m.user_id]??t("Membre JEC","JEC member")})));
    if(postResult.error)throw postResult.error;
    setPosts((postResult.data??[]) as Post[]);
    if(projectResult.error)throw projectResult.error;
    setProjects((projectResult.data??[]) as Project[]);
    if(taskResult.error)throw taskResult.error;
    setTasks((taskResult.data??[]) as Task[]);
    if(meetingResult.error)throw meetingResult.error;
    setMeetings((meetingResult.data??[]) as Meeting[]);
    if(documentResult.error)throw documentResult.error;
    setDocuments((documentResult.data??[]) as DocumentRow[]);
  },[supabase,t]);

  const loadConversations=useCallback(async(currentUserId:string)=>{
    if(!supabase)return;
    const {data:memberRows,error:memberError}=await supabase.from("jec_conversation_members")
      .select("conversation_id,membership_status").eq("user_id",currentUserId).eq("membership_status","active");
    if(memberError)throw memberError;
    const ids=(memberRows??[]).map(x=>x.conversation_id);
    if(!ids.length){setConversations([]);setMessages([]);setConversationId("");return;}
    const {data:conversationRows,error:conversationError}=await supabase.from("jec_conversations")
      .select("id,title,conversation_type,workspace_id,created_at").in("id",ids).order("updated_at",{ascending:false});
    if(conversationError)throw conversationError;
    const rows=(conversationRows??[]) as Conversation[];
    setConversations(rows);
    const selected=rows.some(c=>c.id===conversationId)?conversationId:(rows[0]?.id??"");
    setConversationId(selected);
    if(selected){
      const {data:messageRows,error:messageError}=await supabase.from("jec_messages")
        .select("id,conversation_id,sender_id,body,created_at,edited_at")
        .eq("conversation_id",selected).is("deleted_at",null).order("created_at",{ascending:true}).limit(200);
      if(messageError)throw messageError;
      setMessages((messageRows??[]) as Message[]);
    }else setMessages([]);
  },[supabase,conversationId]);

  const load=useCallback(async()=>{
    if(!supabase){setError(t("Supabase n'est pas configuré.","Supabase is not configured."));setLoading(false);return;}
    setLoading(true);setError("");
    try{
      const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError||!user){window.location.href="/login";return;}
      setUserId(user.id);
      const [adminResult,membershipResult,workspaceResult,ownMembershipResult]=await Promise.all([
        supabase.rpc("is_jec_admin"),
        supabase.from("jec_memberships").select("membership_status").eq("user_id",user.id).maybeSingle(),
        supabase.from("jec_workspaces").select("id,name,slug,workspace_type,description").eq("is_active",true).order("name"),
        supabase.from("jec_workspace_members").select("workspace_id,workspace_role,membership_status").eq("user_id",user.id)
      ]);
      if(workspaceResult.error)throw workspaceResult.error;
      if(ownMembershipResult.error)throw ownMembershipResult.error;
      setIsAdmin(adminResult.data===true);
      setMembershipStatus(membershipResult.data?.membership_status??"pending");
      const workspaceRows=(workspaceResult.data??[]) as Workspace[];
      const ownRows=ownMembershipResult.data??[];
      const allowedIds=new Set(ownRows.map(m=>m.workspace_id));
      const allowedWorkspaces=workspaceRows.filter(w=>allowedIds.has(w.id)||(adminResult.data===true));
      setWorkspaces(allowedWorkspaces);
      const preferred=allowedWorkspaces.some(w=>w.id===workspaceId)?workspaceId:
        allowedWorkspaces.find(w=>ownRows.some(m=>m.workspace_id===w.id&&m.membership_status==="active"))?.id??
        allowedWorkspaces[0]?.id??"";
      setWorkspaceId(preferred);
      if(preferred)await loadWorkspaceData(preferred,user.id);
      await loadConversations(user.id);
    }catch(e){
      setError(e instanceof Error?e.message:t("Une erreur est survenue.","Something went wrong."));
    }finally{setLoading(false);}
  },[supabase,t,workspaceId,loadWorkspaceData,loadConversations]);

  useEffect(()=>{void load();},[load]);

  useEffect(()=>{
    if(!supabase||!conversationId)return;
    const channel=supabase.channel("jec-messages-"+conversationId)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"jec_messages",filter:"conversation_id=eq."+conversationId},payload=>{
        const next=payload.new as Message;
        setMessages(current=>current.some(m=>m.id===next.id)?current:[...current,next]);
      }).subscribe();
    return ()=>{void supabase.removeChannel(channel);};
  },[supabase,conversationId]);

  async function refreshWorkspace(){
    if(!workspaceId||!userId)return;
    try{await loadWorkspaceData(workspaceId,userId);setNotice(t("Espace actualisé.","Workspace refreshed."));}
    catch(e){setError(e instanceof Error?e.message:"Refresh failed.");}
  }

  async function acceptInvitation(){
    if(!supabase||!workspaceId)return;
    setBusy(true);setError("");setNotice("");
    try{
      const {error:e}=await supabase.rpc("jec_workspace_accept_invitation",{target_workspace_id:workspaceId});
      if(e)throw e;
      setNotice(t("Invitation acceptée. Bienvenue dans l'espace !","Invitation accepted. Welcome to the workspace!"));
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Unable to accept invitation.");}
    finally{setBusy(false);}
  }

  async function createWorkspace(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase)return;
    setBusy(true);setError("");setNotice("");
    const slug=workspaceSlug.trim()||workspaceName.trim().toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    try{
      const {data:id,error:e}=await supabase.rpc("jec_create_workspace",{
        target_name:workspaceName.trim(),target_slug:slug,target_type:workspaceType,target_description:workspaceDescription.trim()||null
      });
      if(e)throw e;
      setWorkspaceName("");setWorkspaceSlug("");setWorkspaceDescription("");
      setNotice(t("Espace de travail créé.","Workspace created."));
      await load();
      if(id)setWorkspaceId(id);
    }catch(e){setError(e instanceof Error?e.message:"Unable to create workspace.");}
    finally{setBusy(false);}
  }

  async function inviteMember(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase||!workspaceId)return;
    setBusy(true);setError("");setNotice("");
    try{
      const {error:e}=await supabase.rpc("jec_workspace_invite_by_email",{
        target_workspace_id:workspaceId,target_email:inviteEmail.trim(),target_role:inviteRole
      });
      if(e)throw e;
      setInviteEmail("");setNotice(t("Invitation enregistrée. Le membre la verra dans son Workspace.","Invitation saved. The member will see it in their Workspace."));
      await refreshWorkspace();
    }catch(e){setError(e instanceof Error?e.message:"Unable to invite member.");}
    finally{setBusy(false);}
  }

  async function createPost(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase||!workspaceId||!postBody.trim())return;
    setBusy(true);setError("");
    const {error:e}=await supabase.from("jec_workspace_posts").insert({workspace_id:workspaceId,author_id:userId,body:postBody.trim()});
    if(e)setError(e.message);else{setPostBody("");setNotice(t("Publication envoyée à l'espace.","Update posted to the workspace."));await refreshWorkspace();}
    setBusy(false);
  }

  async function createProject(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase||!workspaceId||!projectTitle.trim())return;
    setBusy(true);setError("");
    const {error:e}=await supabase.from("jec_projects").insert({workspace_id:workspaceId,title:projectTitle.trim(),description:projectDescription.trim()||null,owner_id:userId,created_by:userId});
    if(e)setError(e.message);else{setProjectTitle("");setProjectDescription("");setNotice(t("Projet créé.","Project created."));await refreshWorkspace();}
    setBusy(false);
  }

  async function createTask(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase||!workspaceId||!taskTitle.trim())return;
    setBusy(true);setError("");
    const {error:e}=await supabase.from("jec_workspace_tasks").insert({workspace_id:workspaceId,title:taskTitle.trim(),description:taskDescription.trim()||null,assigned_to:taskAssignee||null,created_by:userId});
    if(e)setError(e.message);else{setTaskTitle("");setTaskDescription("");setTaskAssignee("");setNotice(t("Tâche créée.","Task created."));await refreshWorkspace();}
    setBusy(false);
  }

  async function updateTaskStatus(taskId:string,status:string){
    if(!supabase)return;
    const {error:e}=await supabase.from("jec_workspace_tasks").update({task_status:status,updated_at:new Date().toISOString()}).eq("id",taskId);
    if(e)setError(e.message);else await refreshWorkspace();
  }

  async function createMeeting(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase||!workspaceId||!meetingTitle.trim()||!meetingStart)return;
    setBusy(true);setError("");
    const {data:meeting,error:e}=await supabase.from("jec_meetings").insert({
      workspace_id:workspaceId,title:meetingTitle.trim(),agenda:meetingAgenda.trim()||null,
      starts_at:new Date(meetingStart).toISOString(),ends_at:meetingEnd?new Date(meetingEnd).toISOString():null,
      location:meetingLocation.trim()||null,meeting_url:meetingUrl.trim()||null,created_by:userId
    }).select("id").single();
    if(e)setError(e.message);else if(meeting){
      const attendeeRows=roster.filter(r=>r.membership_status==="active").map(r=>({meeting_id:meeting.id,user_id:r.user_id,attendance_status:"invited"}));
      if(attendeeRows.length){
        const {error:participantsError}=await supabase.from("jec_meeting_participants").insert(attendeeRows);
        if(participantsError)setError(participantsError.message);
      }
      setMeetingTitle("");setMeetingAgenda("");setMeetingStart("");setMeetingEnd("");setMeetingLocation("");setMeetingUrl("");
      setNotice(t("Réunion planifiée et invitations préparées.","Meeting scheduled and invitations prepared."));await refreshWorkspace();
    }
    setBusy(false);
  }

  async function respondMeeting(meetingId:string,status:"accepted"|"declined"){
    if(!supabase)return;
    const {error:e}=await supabase.from("jec_meeting_participants").update({attendance_status:status,responded_at:new Date().toISOString()}).eq("meeting_id",meetingId).eq("user_id",userId);
    if(e)setError(e.message);else{setNotice(t("Réponse enregistrée.","Response saved."));await refreshWorkspace();}
  }

  async function uploadDocument(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase||!workspaceId||!selectedFile||!documentTitle.trim())return;
    if(selectedFile.size>50*1024*1024){setError(t("Le fichier dépasse 50 Mo.","File exceeds 50 MB."));return;}
    setBusy(true);setError("");
    const safeName=selectedFile.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"_").slice(-120)||"document";
    const path=workspaceId+"/"+userId+"/"+crypto.randomUUID()+"-"+safeName;
    const {error:uploadError}=await supabase.storage.from("jec-workspace-documents").upload(path,selectedFile,{contentType:selectedFile.type||"application/octet-stream",upsert:false});
    if(uploadError){setError(uploadError.message);setBusy(false);return;}
    const {error:rowError}=await supabase.from("jec_documents").insert({
      workspace_id:workspaceId,document_category:documentCategory,title:documentTitle.trim(),
      description:documentDescription.trim()||null,file_name:selectedFile.name,storage_path:path,
      mime_type:selectedFile.type||null,file_size:selectedFile.size,uploaded_by:userId
    });
    if(rowError){
      await supabase.storage.from("jec-workspace-documents").remove([path]);
      setError(rowError.message);
    }else{
      setDocumentTitle("");setDocumentDescription("");setSelectedFile(null);
      setNotice(t("Document déposé dans l'espace privé.","Document uploaded to the private workspace."));
      await refreshWorkspace();
    }
    setBusy(false);
  }

  async function downloadDocument(row:DocumentRow){
    if(!supabase)return;
    const {data,error:e}=await supabase.storage.from("jec-workspace-documents").createSignedUrl(row.storage_path,300,{download:row.file_name});
    if(e){setError(e.message);return;}
    if(data?.signedUrl)window.open(data.signedUrl,"_blank","noopener,noreferrer");
  }

  async function createConversation(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase||!workspaceId)return;
    setBusy(true);setError("");
    const {data:id,error:e2}=await supabase.rpc("jec_create_conversation",{
      target_type:"workspace",target_title:conversationTitle.trim()||activeWorkspace?.name||t("Discussion d'équipe","Team discussion"),
      target_workspace_id:workspaceId,target_member_ids:conversationMembers
    });
    if(e2)setError(e2.message);else if(id){
      setConversationTitle("");setConversationMembers([]);
      setNotice(t("Conversation créée. Les personnes invitées devront l'accepter.","Conversation created. Invited people must accept it."));
      await loadConversations(userId);
      setConversationId(id);
    }
    setBusy(false);
  }

  async function acceptConversation(conversationIdToAccept:string){
    if(!supabase)return;
    const {error:e}=await supabase.rpc("jec_accept_conversation_invitation",{target_conversation_id:conversationIdToAccept});
    if(e)setError(e.message);else{setNotice(t("Invitation à la conversation acceptée.","Conversation invitation accepted."));await loadConversations(userId);}
  }

  async function sendMessage(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase||!conversationId||!messageBody.trim())return;
    const body=messageBody.trim();setMessageBody("");
    const {error:e2}=await supabase.from("jec_messages").insert({conversation_id:conversationId,sender_id:userId,body});
    if(e2){setMessageBody(body);setError(e2.message);}else await loadConversations(userId);
  }

  if(loading)return <main className="collab-page"><div className="collab-loading">{t("Chargement de ton espace collaboratif…","Loading your collaboration space…")}</div></main>;
  if(membershipStatus!=="verified"&&!isAdmin)return <main className="collab-page"><div className="collab-locked"><div className="collab-lock-icon">⌑</div><p className="eyebrow">{t("ACCÈS COLLABORATIF","COLLABORATION ACCESS")}</p><h1>{t("Appartenance JEC à confirmer","JEC membership needs verification")}</h1><p>{t("Ton compte est bien connecté, mais l'accès aux espaces de collaboration est réservé aux membres dont l'appartenance à la JEC a été vérifiée.","Your account is connected, but collaboration spaces are reserved for verified JEC members.")}</p><Link href="/compte" className="primary-button">{t("Consulter mon compte","View my account")}</Link></div></main>;

  const title=moduleNames[activeModule];
  return <main className="collab-page">
    <header className="collab-topbar">
      <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link>
      <div className="collab-top-actions"><span className="collab-user-label">{t("Connecté·e","Signed in")} · {isAdmin?t("Administratrice","Administrator"):t("Membre vérifié","Verified member")}</span><LanguageSwitcher/><Link href="/" className="back-link-inline">{t("Portail JEC","JEC portal")}</Link></div>
    </header>
    <div className="collab-layout">
      <aside className="collab-sidebar">
        <p className="eyebrow">{t("COLLABORATION","COLLABORATION")}</p>
        <h2>{t("Espace de travail","Workspace")}</h2>
        {(["workspace","messagerie","reunions","projets","documents"] as ModuleKey[]).map(key=><Link key={key} href={"/"+key} className={activeModule===key?"collab-nav active":"collab-nav"}><span>{key==="workspace"?"⌘":key==="messagerie"?"▤":key==="reunions"?"▣":key==="projets"?"◫":"▱"}</span>{moduleNames[key][en?"en":"fr"]}</Link>)}
        <div className="collab-workspace-picker">
          <label>{t("Espace sélectionné","Selected workspace")}</label>
          <select value={workspaceId} onChange={e=>setWorkspaceId(e.target.value)}>
            {workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          {activeWorkspace&&<small>{workspaceRole==="owner"?"Owner":workspaceRole==="manager"?"Manager":t("Membre","Member")} · {activeWorkspace.visibility==="private"?t("Privé","Private"):t("Restreint","Restricted")}</small>}
        </div>
        {isAdmin&&<div className="collab-admin-note"><strong>{t("Administration","Administration")}</strong><Link href="/gestion">{t("Gérer les comptes et les rôles →","Manage accounts and roles →")}</Link></div>}
      </aside>
      <section className="collab-main">
        <div className="collab-heading">
          <div><p className="eyebrow">{t("JEC FRANCE · ESPACE PRIVÉ","JEC FRANCE · PRIVATE SPACE")}</p><h1>{title[en?"en":"fr"]}</h1><p>{title[en?"subtitleEn":"subtitleFr"]}</p></div>
          <button className="secondary-outline-button" onClick={()=>void refreshWorkspace()} disabled={!workspaceId}>↻ {t("Actualiser","Refresh")}</button>
        </div>
        {error&&<div className="collab-alert error">{error}<button onClick={()=>setError("")}>×</button></div>}
        {notice&&<div className="collab-alert success">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
        {!workspaces.length?<div className="collab-empty"><h2>{t("Aucun espace de travail pour le moment","No workspace yet")}</h2><p>{t("Un administrateur doit créer un espace puis inviter ses membres vérifiés. Tu pourras ensuite retrouver ici les échanges et les documents de ton équipe.","An administrator must create a workspace and invite verified members. You can then find your team's discussions and documents here.")}</p></div>:
        <>
          {workspaceStatus==="invited"&&<div className="collab-invitation"><div><strong>{t("Tu as été invité·e dans cet espace.","You've been invited to this workspace.")}</strong><p>{activeWorkspace?.name}</p></div><button className="primary-button" onClick={()=>void acceptInvitation()} disabled={busy}>{t("Accepter l'invitation","Accept invitation")}</button></div>}
          {workspaceStatus==="suspended"&&<div className="collab-alert error">{t("Ton accès à cet espace est suspendu. Contacte son responsable.","Your access to this workspace is suspended. Contact its manager.")}</div>}
          {workspaceStatus==="active"&&activeModule==="workspace"&&<WorkspaceView
            en={en} t={t} posts={posts} roster={roster} profiles={profiles} canManage={canManage} isAdmin={isAdmin}
            postBody={postBody} setPostBody={setPostBody} createPost={createPost} busy={busy}
            inviteEmail={inviteEmail} setInviteEmail={setInviteEmail} inviteRole={inviteRole} setInviteRole={setInviteRole}
            inviteMember={inviteMember} workspaceName={workspaceName} setWorkspaceName={setWorkspaceName}
            workspaceSlug={workspaceSlug} setWorkspaceSlug={setWorkspaceSlug} workspaceType={workspaceType} setWorkspaceType={setWorkspaceType}
            workspaceDescription={workspaceDescription} setWorkspaceDescription={setWorkspaceDescription} createWorkspace={createWorkspace}
            />
          }
          {workspaceStatus==="active"&&activeModule==="projets"&&<ProjectsView
            en={en} t={t} projects={projects} tasks={tasks} roster={roster} canManage={canManage}
            projectTitle={projectTitle} setProjectTitle={setProjectTitle} projectDescription={projectDescription} setProjectDescription={setProjectDescription} createProject={createProject}
            taskTitle={taskTitle} setTaskTitle={setTaskTitle} taskDescription={taskDescription} setTaskDescription={setTaskDescription} taskAssignee={taskAssignee} setTaskAssignee={setTaskAssignee}
            createTask={createTask} updateTaskStatus={updateTaskStatus} busy={busy}
          />}
          {workspaceStatus==="active"&&activeModule==="reunions"&&<MeetingsView
            en={en} t={t} meetings={meetings} roster={roster} canManage={canManage}
            meetingTitle={meetingTitle} setMeetingTitle={setMeetingTitle} meetingAgenda={meetingAgenda} setMeetingAgenda={setMeetingAgenda}
            meetingStart={meetingStart} setMeetingStart={setMeetingStart} meetingEnd={meetingEnd} setMeetingEnd={setMeetingEnd}
            meetingLocation={meetingLocation} setMeetingLocation={setMeetingLocation} meetingUrl={meetingUrl} setMeetingUrl={setMeetingUrl}
            createMeeting={createMeeting} respondMeeting={respondMeeting} userId={userId} busy={busy}
          />}
          {workspaceStatus==="active"&&activeModule==="documents"&&<DocumentsView
            en={en} t={t} documents={documents} documentTitle={documentTitle} setDocumentTitle={setDocumentTitle}
            documentDescription={documentDescription} setDocumentDescription={setDocumentDescription} documentCategory={documentCategory} setDocumentCategory={setDocumentCategory}
            selectedFile={selectedFile} setSelectedFile={setSelectedFile} uploadDocument={uploadDocument} downloadDocument={downloadDocument} busy={busy}
          />}
          {workspaceStatus==="active"&&activeModule==="messagerie"&&<MessagesView
            en={en} t={t} conversations={conversations.filter(c=>c.workspace_id===workspaceId||c.workspace_id===null)} messages={messages}
            roster={roster} userId={userId} conversationId={conversationId} setConversationId={setConversationId}
            conversationTitle={conversationTitle} setConversationTitle={setConversationTitle} conversationMembers={conversationMembers} setConversationMembers={setConversationMembers}
            createConversation={createConversation} messageBody={messageBody} setMessageBody={setMessageBody} sendMessage={sendMessage}
            acceptConversation={acceptConversation} supabase={supabase} busy={busy}
          />}
        </>
        }
      </section>
    </div>
  </main>;
}

function WorkspaceView(props:any){
 const {en,t,posts,roster,profiles,canManage,isAdmin,postBody,setPostBody,createPost,busy,inviteEmail,setInviteEmail,inviteRole,setInviteRole,inviteMember,workspaceName,setWorkspaceName,workspaceSlug,setWorkspaceSlug,workspaceType,setWorkspaceType,workspaceDescription,setWorkspaceDescription,createWorkspace}=props;
 return <div className="collab-stack">
  <div className="collab-stat-grid">
   <StatCard label={t("Membres de l'espace","Workspace members")} value={roster.filter((m:RosterMember)=>m.membership_status==="active").length} detail={t("Accès actifs","Active access")}/>
   <StatCard label={t("Publications","Updates")} value={posts.length} detail={t("Dans le fil de l'équipe","In the team feed")}/>
   <StatCard label={t("Responsables","Managers")} value={roster.filter((m:RosterMember)=>["owner","manager"].includes(m.workspace_role)&&m.membership_status==="active").length} detail={t("Owner / manager","Owner / manager")}/>
  </div>
  <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{t("FIL D'ÉQUIPE","TEAM FEED")}</p><h2>{t("Actualités de l'espace","Workspace updates")}</h2></div></div>
   <form className="collab-form inline-form" onSubmit={createPost}><textarea rows={3} value={postBody} onChange={e=>setPostBody(e.target.value)} placeholder={t("Partager une information avec les membres de l'espace…","Share an update with workspace members…")} required/><button className="primary-button" disabled={busy||!postBody.trim()}>{t("Publier","Post update")}</button></form>
   <div className="collab-feed">{posts.length?posts.map((p:Post)=><article className="collab-post" key={p.id}><div className="collab-post-avatar">{(profiles[p.author_id]||"J").slice(0,1).toUpperCase()}</div><div><div className="collab-post-meta"><strong>{profiles[p.author_id]||t("Membre JEC","JEC member")}</strong><small>{formatDate(p.created_at,en?"en-GB":"fr-FR",true)}</small></div><p>{p.body}</p></div></article>):<EmptyState title={t("Aucune publication pour le moment","No updates yet")} body={t("Le fil d'équipe accueillera les annonces, informations et échanges utiles aux membres de cet espace.","The team feed will host announcements, information and useful discussions for this workspace.")}/>}</div>
  </section>
  <div className="collab-two-col">
   <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{t("MEMBRES","MEMBERS")}</p><h2>{t("Qui fait partie de cet espace ?","Who belongs to this workspace?")}</h2></div></div>
    {roster.map((m:RosterMember)=><div className="collab-roster-row" key={m.user_id}><div className="collab-mini-avatar">{(m.display_name||"J").slice(0,1).toUpperCase()}</div><div><strong>{m.display_name}</strong><small>{m.workspace_role} · {m.membership_status}</small></div></div>)}
   </section>
   <div className="collab-stack">
    {canManage&&<section className="collab-card"><p className="eyebrow">{t("INVITATIONS","INVITATIONS")}</p><h2>{t("Inviter un membre vérifié","Invite a verified member")}</h2><form className="collab-form" onSubmit={inviteMember}><label>{t("Adresse e-mail du compte JEC-conNEcT","JEC-conNEcT account email")}<input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} required/></label><label>{t("Rôle dans l'espace","Workspace role")}<select value={inviteRole} onChange={e=>setInviteRole(e.target.value)}><option value="member">{t("Membre","Member")}</option><option value="manager">{t("Responsable d'espace","Workspace manager")}</option></select></label><button className="primary-button" disabled={busy}>{t("Envoyer l'invitation","Send invitation")}</button></form></section>}
    {isAdmin&&<section className="collab-card"><p className="eyebrow">{t("ADMINISTRATION","ADMINISTRATION")}</p><h2>{t("Créer un espace de travail","Create a workspace")}</h2><form className="collab-form" onSubmit={createWorkspace}><label>{t("Nom de l'espace","Workspace name")}<input value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} required minLength={2}/></label><label>{t("Identifiant","Slug")}<input value={workspaceSlug} onChange={e=>setWorkspaceSlug(e.target.value)} placeholder="equipe-nationale"/></label><label>{t("Type d'espace","Workspace type")}<select value={workspaceType} onChange={e=>setWorkspaceType(e.target.value)}><option value="national_team">{t("Équipe nationale","National team")}</option><option value="federation">{t("Fédération","Federation")}</option><option value="local_team">{t("Équipe locale","Local team")}</option><option value="commission">{t("Commission","Commission")}</option><option value="service">{t("Service","Service")}</option><option value="project">{t("Projet","Project")}</option><option value="temporary_group">{t("Groupe temporaire","Temporary group")}</option></select></label><label>{t("Description","Description")}<textarea rows={2} value={workspaceDescription} onChange={e=>setWorkspaceDescription(e.target.value)}/></label><button className="primary-button" disabled={busy}>{t("Créer l'espace privé","Create private workspace")}</button></form></section>}
   </div>
  </div>
 </div>;
}

function ProjectsView(props:any){
 const {en,t,projects,tasks,roster,canManage,projectTitle,setProjectTitle,projectDescription,setProjectDescription,createProject,taskTitle,setTaskTitle,taskDescription,setTaskDescription,taskAssignee,setTaskAssignee,createTask,updateTaskStatus,busy}=props;
 return <div className="collab-stack">
  <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{t("SUIVI DE PROJETS","PROJECT TRACKING")}</p><h2>{t("Projets de l'espace","Workspace projects")}</h2></div><span className="collab-count">{projects.length}</span></div>
   {canManage&&<form className="collab-form collab-inline-create" onSubmit={createProject}><label>{t("Nom du projet","Project title")}<input value={projectTitle} onChange={e=>setProjectTitle(e.target.value)} required/></label><label>{t("Objectif / description","Objective / description")}<input value={projectDescription} onChange={e=>setProjectDescription(e.target.value)}/></label><button className="primary-button" disabled={busy}>{t("Créer le projet","Create project")}</button></form>}
   {projects.length?<div className="collab-project-grid">{projects.map((p:Project)=><article className="collab-project-card" key={p.id}><span className={"status-pill "+p.project_status}>{p.project_status}</span><h3>{p.title}</h3><p>{p.description||t("Aucune description fournie.","No description provided.")}</p><small>{t("Priorité","Priority")} : {p.priority}{p.due_date?" · "+formatDate(p.due_date,en?"en-GB":"fr-FR"):""}</small></article>)}</div>:<EmptyState title={t("Aucun projet créé","No projects yet")} body={t("Les projets approuvés ou lancés par les responsables de cet espace seront affichés ici.","Projects started by this workspace's managers will appear here.")}/>}
  </section>
  <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{t("À FAIRE","TASKS")}</p><h2>{t("Tableau des tâches","Task board")}</h2></div><span className="collab-count">{tasks.length}</span></div>
   <form className="collab-form collab-inline-create" onSubmit={createTask}><label>{t("Nouvelle tâche","New task")}<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required/></label><label>{t("Description","Description")}<input value={taskDescription} onChange={e=>setTaskDescription(e.target.value)}/></label><label>{t("Attribuer à","Assign to")}<select value={taskAssignee} onChange={e=>setTaskAssignee(e.target.value)}><option value="">{t("Non attribuée","Unassigned")}</option>{roster.filter((m:RosterMember)=>m.membership_status==="active").map((m:RosterMember)=><option value={m.user_id} key={m.user_id}>{m.display_name}</option>)}</select></label><button className="primary-button" disabled={busy}>{t("Ajouter","Add task")}</button></form>
   {tasks.length?<div className="collab-task-list">{tasks.map((task:Task)=><article className="collab-task-row" key={task.id}><div><strong>{task.title}</strong><p>{task.description}</p><small>{task.assigned_to?roster.find((m:RosterMember)=>m.user_id===task.assigned_to)?.display_name||t("Membre assigné","Assigned member"):t("Non attribuée","Unassigned")}</small></div><select value={task.task_status} onChange={e=>void updateTaskStatus(task.id,e.target.value)}><option value="todo">{t("À faire","To do")}</option><option value="in_progress">{t("En cours","In progress")}</option><option value="blocked">{t("Bloquée","Blocked")}</option><option value="done">{t("Terminée","Done")}</option><option value="cancelled">{t("Annulée","Cancelled")}</option></select></article>)}</div>:<EmptyState title={t("Aucune tâche","No tasks")} body={t("Ajoute les premières actions à réaliser et attribue-les aux membres de l'espace.","Add the first actions and assign them to workspace members.")}/>}
  </section>
 </div>;
}

function MeetingsView(props:any){
 const {en,t,meetings,roster,canManage,meetingTitle,setMeetingTitle,meetingAgenda,setMeetingAgenda,meetingStart,setMeetingStart,meetingEnd,setMeetingEnd,meetingLocation,setMeetingLocation,meetingUrl,setMeetingUrl,createMeeting,respondMeeting,userId,busy}=props;
 return <div className="collab-stack">
  {canManage&&<section className="collab-card"><p className="eyebrow">{t("PLANIFICATION","SCHEDULING")}</p><h2>{t("Planifier une réunion","Schedule a meeting")}</h2><form className="collab-form meeting-form" onSubmit={createMeeting}><label>{t("Titre","Title")}<input value={meetingTitle} onChange={e=>setMeetingTitle(e.target.value)} required/></label><label>{t("Ordre du jour","Agenda")}<textarea rows={3} value={meetingAgenda} onChange={e=>setMeetingAgenda(e.target.value)}/></label><div className="collab-form-two"><label>{t("Début","Starts")}<input type="datetime-local" value={meetingStart} onChange={e=>setMeetingStart(e.target.value)} required/></label><label>{t("Fin","Ends")}<input type="datetime-local" value={meetingEnd} onChange={e=>setMeetingEnd(e.target.value)}/></label></div><div className="collab-form-two"><label>{t("Lieu","Location")}<input value={meetingLocation} onChange={e=>setMeetingLocation(e.target.value)}/></label><label>{t("Lien visioconférence","Video meeting link")}<input type="url" value={meetingUrl} onChange={e=>setMeetingUrl(e.target.value)} placeholder="https://…"/></label></div><button className="primary-button" disabled={busy}>{t("Planifier et inviter l'espace","Schedule and invite workspace")}</button></form></section>}
  <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{t("AGENDA PRIVÉ","PRIVATE CALENDAR")}</p><h2>{t("Réunions de l'espace","Workspace meetings")}</h2></div><span className="collab-count">{meetings.length}</span></div>
   {meetings.length?meetings.map((meeting:Meeting)=><article className="collab-meeting-row" key={meeting.id}><div className="meeting-date-tile"><strong>{new Date(meeting.starts_at).getDate()}</strong><small>{new Date(meeting.starts_at).toLocaleDateString(en?"en-GB":"fr-FR",{month:"short"})}</small></div><div className="meeting-main"><span className={"status-pill "+meeting.meeting_status}>{meeting.meeting_status}</span><h3>{meeting.title}</h3><p>{formatDate(meeting.starts_at,en?"en-GB":"fr-FR",true)}{meeting.location?" · "+meeting.location:""}</p>{meeting.agenda&&<small>{meeting.agenda}</small>}{meeting.meeting_url&&<a href={meeting.meeting_url} target="_blank" rel="noreferrer">{t("Rejoindre la visioconférence →","Join video meeting →")}</a>}</div><div className="meeting-actions"><button className="secondary-outline-button" onClick={()=>void respondMeeting(meeting.id,"accepted")}>{t("Participer","Attend")}</button><button className="quiet-button" onClick={()=>void respondMeeting(meeting.id,"declined")}>{t("Décliner","Decline")}</button></div></article>):<EmptyState title={t("Aucune réunion planifiée","No meetings scheduled")} body={t("Les réunions de ton espace apparaîtront ici avec leur ordre du jour et les informations de connexion.","Workspace meetings will appear here with agendas and joining details.")}/>}
  </section>
 </div>;
}

function DocumentsView(props:any){
 const {en,t,documents,documentTitle,setDocumentTitle,documentDescription,setDocumentDescription,documentCategory,setDocumentCategory,selectedFile,setSelectedFile,uploadDocument,downloadDocument,busy}=props;
 return <div className="collab-stack">
  <section className="collab-card"><p className="eyebrow">{t("BIBLIOTHÈQUE PRIVÉE","PRIVATE LIBRARY")}</p><h2>{t("Déposer un document","Upload a document")}</h2><p className="collab-muted">{t("Les fichiers sont conservés dans un stockage privé et accessibles uniquement aux membres actifs de cet espace.","Files are stored privately and accessible only to active members of this workspace.")}</p><form className="collab-form collab-doc-form" onSubmit={uploadDocument}><label>{t("Titre du document","Document title")}<input value={documentTitle} onChange={e=>setDocumentTitle(e.target.value)} required/></label><label>{t("Catégorie","Category")}<select value={documentCategory} onChange={e=>setDocumentCategory(e.target.value)}><option value="general">{t("Général","General")}</option><option value="meeting_minutes">{t("Compte rendu","Meeting minutes")}</option><option value="agenda">{t("Ordre du jour","Agenda")}</option><option value="project">{t("Projet","Project")}</option><option value="report">{t("Rapport","Report")}</option><option value="template">{t("Modèle","Template")}</option><option value="administrative">{t("Administratif","Administrative")}</option><option value="other">{t("Autre","Other")}</option></select></label><label>{t("Description","Description")}<textarea rows={2} value={documentDescription} onChange={e=>setDocumentDescription(e.target.value)}/></label><label className="collab-file-label">{t("Fichier (50 Mo maximum)","File (50 MB maximum)")}<input type="file" onChange={e=>setSelectedFile(e.target.files?.[0]??null)} required/><small>{selectedFile?selectedFile.name:t("PDF, Office, texte, image ou archive ZIP","PDF, Office, text, image or ZIP archive")}</small></label><button className="primary-button" disabled={busy||!selectedFile}>{t("Déposer dans l'espace privé","Upload to private workspace")}</button></form></section>
  <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{t("FICHIERS PARTAGÉS","SHARED FILES")}</p><h2>{t("Documents de l'espace","Workspace documents")}</h2></div><span className="collab-count">{documents.length}</span></div>
   {documents.length?documents.map((d:DocumentRow)=><article className="collab-document-row" key={d.id}><div className="document-type-icon">▤</div><div><strong>{d.title}</strong><small>{d.file_name} · {d.file_size?Math.round(d.file_size/1024)+" Ko":"—"} · {formatDate(d.created_at,en?"en-GB":"fr-FR")}</small>{d.description&&<p>{d.description}</p>}</div><button className="secondary-outline-button" onClick={()=>void downloadDocument(d)}>{t("Télécharger","Download")}</button></article>):<EmptyState title={t("Aucun document partagé","No shared documents")} body={t("Dépose les premiers comptes rendus, ordres du jour, modèles ou dossiers utiles à ton équipe.","Upload the first minutes, agendas, templates or files useful to your team.")}/>}
  </section>
 </div>;
}

function MessagesView(props:any){
 const {en,t,conversations,messages,roster,userId,conversationId,setConversationId,conversationTitle,setConversationTitle,conversationMembers,setConversationMembers,createConversation,messageBody,setMessageBody,sendMessage,acceptConversation,busy}=props;
 const [showCreate,setShowCreate]=useState(false);
 return <div className="collab-message-layout">
  <aside className="collab-conversation-list"><div className="collab-card-heading"><div><p className="eyebrow">{t("MESSAGERIE","MESSAGES")}</p><h2>{t("Conversations","Conversations")}</h2></div><button className="icon-button" onClick={()=>setShowCreate(!showCreate)}>＋</button></div>
   {showCreate&&<form className="collab-form" onSubmit={async e=>{await createConversation(e);setShowCreate(false);}}><label>{t("Nom de la discussion","Conversation name")}<input value={conversationTitle} onChange={e=>setConversationTitle(e.target.value)} placeholder={t("Ex. Organisation de l'équipe","E.g. Team organization")}/></label><label>{t("Inviter les membres","Invite members")}<select multiple value={conversationMembers} onChange={e=>setConversationMembers(Array.from(e.target.selectedOptions).map(o=>o.value))}>{roster.filter((m:RosterMember)=>m.user_id!==userId&&m.membership_status==="active").map((m:RosterMember)=><option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}</select><small>{t("Utilise Ctrl/Cmd pour sélectionner plusieurs personnes.","Use Ctrl/Cmd to select multiple people.")}</small></label><button className="primary-button" disabled={busy}>{t("Créer la conversation","Create conversation")}</button></form>}
   {conversations.map((c:Conversation)=><button key={c.id} className={conversationId===c.id?"collab-conversation active":"collab-conversation"} onClick={()=>setConversationId(c.id)}><span className="conversation-avatar">{c.conversation_type==="direct"?"●":"◉"}</span><span><strong>{c.title||t("Discussion directe","Direct chat")}</strong><small>{c.conversation_type==="workspace"?t("Discussion d'espace","Workspace discussion"):c.conversation_type==="group"?t("Groupe","Group"):t("Direct","Direct")}</small></span></button>)}
   {!conversations.length&&<p className="collab-muted">{t("Aucune conversation active. Crée une discussion avec des membres de ton espace.","No active conversations. Start a discussion with workspace members.")}</p>}
  </aside>
  <section className="collab-card collab-chat-panel">
   {conversationId?<><div className="collab-chat-heading"><div><strong>{conversations.find((c:Conversation)=>c.id===conversationId)?.title||t("Conversation","Conversation")}</strong><small>{t("Espace privé · membres invités uniquement","Private space · invited members only")}</small></div></div><div className="collab-chat-messages">{messages.filter((m:Message)=>m.conversation_id===conversationId).map((m:Message)=><article className={m.sender_id===userId?"chat-message own":"chat-message"} key={m.id}><div className="chat-message-bubble"><p>{m.body}</p><small>{formatDate(m.created_at,en?"en-GB":"fr-FR",true)}</small></div></article>)}</div><form className="collab-chat-compose" onSubmit={sendMessage}><textarea rows={2} value={messageBody} onChange={e=>setMessageBody(e.target.value)} placeholder={t("Écrire un message…","Write a message…")} required/><button className="primary-button" disabled={busy||!messageBody.trim()}>{t("Envoyer","Send")}</button></form></>:<EmptyState title={t("Choisis une conversation","Select a conversation")} body={t("Tes échanges privés ou ceux de ton espace apparaîtront ici.","Your private or workspace discussions will appear here.")}/>}
  </section>
 </div>;
}

function StatCard({label,value,detail}:{label:string;value:number;detail:string}){
 return <article className="collab-stat-card"><strong>{value}</strong><span>{label}</span><small>{detail}</small></article>;
}

function EmptyState({title,body}:{title:string;body:string}){
 return <div className="collab-empty-state"><span>✧</span><strong>{title}</strong><p>{body}</p></div>;
}
