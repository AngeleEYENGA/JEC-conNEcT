"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Meeting = {
  id:string; workspace_id:string; project_id:string|null; title:string; agenda:string|null;
  starts_at:string; ends_at:string|null; location:string|null; meeting_url:string|null;
  meeting_status:string; created_by:string; workspace?:{name:string;slug:string}|null;
};
type Participant = {user_id:string;attendance_status:string;responded_at:string|null};
type AgendaItem = {id:string;title:string;description:string|null;presenter_id:string|null;sort_order:number;item_status:string};
type Decision = {id:string;title:string;detail:string|null;decision_status:string;created_at:string};
type Minutes = {id:string;content:string;minutes_status:string;prepared_by:string;approved_by:string|null;approved_at:string|null};
type Transcript = {id:string;transcript_text:string;language:string;source_type:string;transcript_status:string;created_at:string};
type Task = {id:string;title:string;task_status:string;priority:string;assigned_to:string|null;due_at:string|null};
type Roster = {user_id:string;workspace_role:string;membership_status:string};

type SpeechResultEvent = Event & { resultIndex:number; results: ArrayLike<{isFinal:boolean;[index:number]:{transcript:string}}> };
type SpeechRecognitionLike = {
  lang:string;continuous:boolean;interimResults:boolean;
  onresult:((event:SpeechResultEvent)=>void)|null;
  onerror:((event:Event)=>void)|null;
  onend:(()=>void)|null;
  start:()=>void;stop:()=>void;
};
type SpeechWindow = Window & {SpeechRecognition?:new()=>SpeechRecognitionLike;webkitSpeechRecognition?:new()=>SpeechRecognitionLike};

function date(value:string,en:boolean,time=true){
 return new Date(value).toLocaleString(en?"en-GB":"fr-FR",time?{dateStyle:"full",timeStyle:"short"}:{dateStyle:"medium"});
}

export default function MeetingDetailPage(){
 const params=useParams<{id:string}>(); const meetingId=params.id;
 const {lang}=useLanguage(); const en=lang==="en";
 const [loading,setLoading]=useState(true); const [meeting,setMeeting]=useState<Meeting|null>(null);
 const [userId,setUserId]=useState(""); const [manager,setManager]=useState(false);
 const [participants,setParticipants]=useState<Participant[]>([]);
 const [roster,setRoster]=useState<Roster[]>([]);
 const [names,setNames]=useState<Record<string,string>>({});
 const [agendaItems,setAgendaItems]=useState<AgendaItem[]>([]);
 const [decisions,setDecisions]=useState<Decision[]>([]);
 const [minutes,setMinutes]=useState<Minutes|null>(null);
 const [minutesText,setMinutesText]=useState("");
 const [transcripts,setTranscripts]=useState<Transcript[]>([]);
 const [tasks,setTasks]=useState<Task[]>([]);
 const [error,setError]=useState(""); const [notice,setNotice]=useState(""); const [busy,setBusy]=useState(false);
 const [agendaTitle,setAgendaTitle]=useState(""); const [agendaDescription,setAgendaDescription]=useState(""); const [agendaPresenter,setAgendaPresenter]=useState("");
 const [decisionTitle,setDecisionTitle]=useState(""); const [decisionDetail,setDecisionDetail]=useState("");
 const [taskTitle,setTaskTitle]=useState(""); const [taskAssignee,setTaskAssignee]=useState(""); const [taskDue,setTaskDue]=useState("");
 const [transcriptText,setTranscriptText]=useState(""); const [transcriptConsent,setTranscriptConsent]=useState(false);
 const [transcriptLanguage,setTranscriptLanguage]=useState(en?"en-GB":"fr-FR");
 const [recognizing,setRecognizing]=useState(false);
 const [transcriptSource,setTranscriptSource]=useState<"manual"|"browser_speech_api">("manual");
 const [transcriptSupported,setTranscriptSupported]=useState(false);
 const [activeTab,setActiveTab]=useState<"agenda"|"minutes"|"transcript"|"actions"|"participants">("agenda");
 const recognitionRef=useState<{current:SpeechRecognitionLike|null}>({current:null})[0];

 const load=useCallback(async()=>{
  const supabase=getSupabaseBrowserClient();
  if(!supabase){setError("Supabase n'est pas configuré.");setLoading(false);return;}
  setLoading(true);setError("");
  const {data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user){window.location.href="/login";return;}
  setUserId(user.id);
  const {data:meetingRow,error:meetingError}=await supabase.from("jec_meetings")
   .select("id,workspace_id,project_id,title,agenda,starts_at,ends_at,location,meeting_url,meeting_status,created_by,workspace:jec_workspaces(name,slug)")
   .eq("id",meetingId).maybeSingle();
  if(meetingError||!meetingRow){setError(en?"This meeting is unavailable.":"Cette réunion n'est pas accessible.");setMeeting(null);setLoading(false);return;}
  const mt=meetingRow as unknown as Meeting;setMeeting(mt);
  const [memberResult,rosterResult,participantResult,agendaResult,decisionResult,minutesResult,transcriptResult,taskResult]=await Promise.all([
   supabase.from("jec_workspace_members").select("workspace_role,membership_status").eq("workspace_id",mt.workspace_id).eq("user_id",user.id).maybeSingle(),
   supabase.from("jec_workspace_members").select("user_id,workspace_role,membership_status").eq("workspace_id",mt.workspace_id).eq("membership_status","active"),
   supabase.from("jec_meeting_participants").select("user_id,attendance_status,responded_at").eq("meeting_id",meetingId),
   supabase.from("jec_meeting_agenda_items").select("id,title,description,presenter_id,sort_order,item_status").eq("meeting_id",meetingId).order("sort_order"),
   supabase.from("jec_meeting_decisions").select("id,title,detail,decision_status,created_at").eq("meeting_id",meetingId).order("created_at",{ascending:false}),
   supabase.from("jec_meeting_minutes").select("id,content,minutes_status,prepared_by,approved_by,approved_at").eq("meeting_id",meetingId).maybeSingle(),
   supabase.from("jec_meeting_transcripts").select("id,transcript_text,language,source_type,transcript_status,created_at").eq("meeting_id",meetingId).order("created_at",{ascending:false}),
   supabase.from("jec_workspace_tasks").select("id,title,task_status,priority,assigned_to,due_at").eq("meeting_id",meetingId).order("created_at",{ascending:false})
  ]);
  const failures=[memberResult.error,rosterResult.error,participantResult.error,agendaResult.error,decisionResult.error,minutesResult.error,transcriptResult.error,taskResult.error].filter(Boolean);
  if(failures.length)setError(failures[0]!.message);
  const role=memberResult.data?.workspace_role??"member";
  setManager(mt.created_by===user.id||role==="owner"||role==="manager");
  setRoster((rosterResult.data??[]) as Roster[]);
  setParticipants((participantResult.data??[]) as Participant[]);
  setAgendaItems((agendaResult.data??[]) as AgendaItem[]);
  setDecisions((decisionResult.data??[]) as Decision[]);
  const savedMinutes=(minutesResult.data??null) as Minutes|null;
  setMinutes(savedMinutes);setMinutesText(savedMinutes?.content??"");
  setTranscripts((transcriptResult.data??[]) as Transcript[]);
  setTasks((taskResult.data??[]) as Task[]);
  const ids=[...new Set([...(rosterResult.data??[]).map((x:{user_id:string})=>x.user_id),...(participantResult.data??[]).map((x:{user_id:string})=>x.user_id)])];
  if(ids.length){
   const {data:profiles,error:profileError}=await supabase.from("jec_profiles").select("user_id,display_name,first_name,last_name").in("user_id",ids);
   if(profileError)setError(profileError.message);
   const map:Record<string,string>={};
   for(const profile of profiles??[])map[profile.user_id]=profile.display_name||[profile.first_name,profile.last_name].filter(Boolean).join(" ")||(en?"JEC member":"Membre JEC");
   setNames(map);
  }
  setLoading(false);
 },[meetingId,en]);

 useEffect(()=>{void load();},[load]);
 useEffect(()=>{
  const w=window as SpeechWindow;
  setTranscriptSupported(Boolean(w.SpeechRecognition||w.webkitSpeechRecognition));
  return ()=>{recognitionRef.current?.stop();};
 },[recognitionRef]);

 const isAccepted=participants.some(p=>p.user_id===userId&&(p.attendance_status==="accepted"||p.attendance_status==="attended"));
 const ownAttendance=participants.find(p=>p.user_id===userId)?.attendance_status;

 async function respond(status:"accepted"|"declined"){
  const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);setError("");setNotice("");
  const {error:e}=await supabase.from("jec_meeting_participants").update({attendance_status:status,responded_at:new Date().toISOString()}).eq("meeting_id",meetingId).eq("user_id",userId);
  if(e)setError(e.message);else{setNotice(en?"Response saved.":"Réponse enregistrée.");await load();}
  setBusy(false);
 }

 async function addAgenda(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!meeting)return;const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);setError("");
  const {error:e2}=await supabase.from("jec_meeting_agenda_items").insert({workspace_id:meeting.workspace_id,meeting_id:meetingId,title:agendaTitle.trim(),description:agendaDescription.trim()||null,presenter_id:agendaPresenter||null,sort_order:agendaItems.length*10+10,created_by:userId});
  if(e2)setError(e2.message);else{setAgendaTitle("");setAgendaDescription("");setAgendaPresenter("");setNotice(en?"Agenda item added.":"Point ajouté à l'ordre du jour.");await load();}
  setBusy(false);
 }

 async function updateAgenda(id:string,status:string){
  const supabase=getSupabaseBrowserClient();if(!supabase)return;
  const {error:e}=await supabase.from("jec_meeting_agenda_items").update({item_status:status,updated_at:new Date().toISOString()}).eq("id",id);
  if(e)setError(e.message);else await load();
 }

 async function addDecision(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!meeting)return;const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);setError("");
  const {error:e2}=await supabase.from("jec_meeting_decisions").insert({workspace_id:meeting.workspace_id,meeting_id:meetingId,title:decisionTitle.trim(),detail:decisionDetail.trim()||null,created_by:userId});
  if(e2)setError(e2.message);else{setDecisionTitle("");setDecisionDetail("");setNotice(en?"Decision recorded.":"Décision enregistrée.");await load();}
  setBusy(false);
 }

 async function saveMinutes(status:"draft"|"shared"){
  if(!meeting)return;
  const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);setError("");
  let saveError="";
  if(minutes){
   const {error:e}=await supabase.from("jec_meeting_minutes").update({content:minutesText,minutes_status:status,updated_at:new Date().toISOString()}).eq("id",minutes.id);
   if(e)saveError=e.message;
  }else{
   const {error:e}=await supabase.from("jec_meeting_minutes").insert({workspace_id:meeting.workspace_id,meeting_id:meetingId,content:minutesText,minutes_status:status,prepared_by:userId});
   if(e)saveError=e.message;
  }
  if(saveError)setError(saveError);
  else{setNotice(status==="shared"?(en?"Minutes shared with meeting participants.":"Compte rendu partagé aux participants."):(en?"Draft saved.":"Brouillon enregistré."));await load();}
  setBusy(false);
 }
 async function approveMinutes(){
  if(!minutes)return;const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);const {error:e}=await supabase.rpc("jec_approve_meeting_minutes",{target_minutes_id:minutes.id});
  if(e)setError(e.message);else{setNotice(en?"Minutes approved and locked.":"Compte rendu approuvé et verrouillé.");await load();}
  setBusy(false);
 }

 async function addTranscript(source:"manual"|"browser_speech_api"){
  if(!meeting||!transcriptText.trim()||!transcriptConsent)return;
  const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);setError("");
  const {error:e}=await supabase.from("jec_meeting_transcripts").insert({
   workspace_id:meeting.workspace_id,meeting_id:meetingId,transcript_text:transcriptText.trim(),
   language:transcriptLanguage,source_type:source,transcript_status:"draft",consent_confirmed:true,
   created_by:userId
  });
  if(e)setError(e.message);else{setTranscriptText("");setTranscriptConsent(false);setTranscriptSource("manual");setNotice(en?"Transcript saved privately.":"Transcription enregistrée en privé.");await load();}
  setBusy(false);
 }

 function startRecognition(){
  if(!transcriptConsent){setError(en?"Confirm consent before starting transcription.":"Confirme le consentement avant de démarrer la transcription.");return;}
  const w=window as SpeechWindow;const Recognition=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Recognition){setError(en?"Speech recognition is not supported by this browser.":"La reconnaissance vocale n'est pas prise en charge par ce navigateur.");return;}
  const recognition=new Recognition();recognition.lang=transcriptLanguage;recognition.continuous=true;recognition.interimResults=true;
  setTranscriptSource("browser_speech_api");
  recognition.onresult=(event)=>{
   let finalText="";
   for(let i=event.resultIndex;i<event.results.length;i++)if(event.results[i].isFinal)finalText+=event.results[i][0].transcript+" ";
   if(finalText)setTranscriptText(current=>current+(current.endsWith(" ")||!current?"":" ")+finalText.trim());
  };
  recognition.onerror=()=>{setRecognizing(false);setError(en?"Speech recognition stopped. You can continue with manual notes.":"La reconnaissance vocale s'est interrompue. Tu peux continuer en saisie manuelle.");};
  recognition.onend=()=>setRecognizing(false);
  recognitionRef.current=recognition;setError("");setRecognizing(true);recognition.start();
 }

 async function addActionTask(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(!meeting)return;const supabase=getSupabaseBrowserClient();if(!supabase)return;
  setBusy(true);setError("");
  const {error:e2}=await supabase.from("jec_workspace_tasks").insert({workspace_id:meeting.workspace_id,meeting_id:meetingId,title:taskTitle.trim(),assigned_to:taskAssignee||null,due_at:taskDue?new Date(taskDue+"T12:00:00").toISOString():null,created_by:userId,priority:"normal"});
  if(e2)setError(e2.message);else{setTaskTitle("");setTaskAssignee("");setTaskDue("");setNotice(en?"Action item added.":"Action à réaliser ajoutée.");await load();}
  setBusy(false);
 }

 async function updateTask(taskId:string,status:string){
  const supabase=getSupabaseBrowserClient();if(!supabase)return;
  const {error:e}=await supabase.from("jec_workspace_tasks").update({task_status:status,updated_at:new Date().toISOString()}).eq("id",taskId);
  if(e)setError(e.message);else await load();
 }

 async function updateMeetingStatus(status:"completed"|"cancelled"){
  const supabase=getSupabaseBrowserClient();if(!supabase)return;
  const {error:e}=await supabase.from("jec_meetings").update({meeting_status:status,updated_at:new Date().toISOString()}).eq("id",meetingId);
  if(e)setError(e.message);else{setNotice(en?"Meeting status updated.":"Statut de la réunion mis à jour.");await load();}
 }

 if(loading)return <main className="collab-page"><p className="muted">{en?"Loading meeting…":"Chargement de la réunion…"}</p></main>;
 if(!meeting)return <main className="collab-page"><div className="collab-content"><p className="alert error">{error||"Réunion indisponible."}</p><Link href="/reunions">Retour aux réunions</Link></div></main>;

 const tabs=[["agenda",en?"Agenda":"Ordre du jour"],["minutes",en?"Minutes":"Compte rendu"],["transcript",en?"Transcript":"Transcription"],["actions",en?"Action items":"Actions"],["participants",en?"Participants":"Participants"]] as const;
 const canCall=isAccepted;
 return <main className="collab-page">
  <header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href={meeting.workspace?.slug?"/workspace/"+meeting.workspace.slug:"/reunions"} className="back-link-inline">{en?"Back to workspace":"Retour à l'espace"}</Link></div></header>
  <div className="collab-content meeting-detail-content">
   <p className="eyebrow">{en?"COLLABORATION · MEETING":"COLLABORATION · RÉUNION"}</p>
   <div className="meeting-detail-header"><div><h1>{meeting.title}</h1><p className="collab-lead">{date(meeting.starts_at,en)}{meeting.ends_at?" — "+date(meeting.ends_at,en):""}</p><p className="meeting-workspace-link">{meeting.workspace?.name}</p></div><span className={"project-status "+meeting.meeting_status}>{meeting.meeting_status}</span></div>
   {error&&<p className="alert error">{error}</p>}{notice&&<p className="alert success">{notice}</p>}
   <div className="meeting-detail-actions">
    {canCall?<Link href={"/reunions/"+meetingId+"/appel"} className="primary-button">◉ {en?"Join audio / video call":"Rejoindre l'appel audio / vidéo"}</Link>:<span className="call-not-available">{en?"Accept the invitation to join the call.":"Accepte l'invitation pour rejoindre l'appel."}</span>}
    {meeting.meeting_url&&<a className="secondary-outline-button" href={meeting.meeting_url} target="_blank" rel="noreferrer">{en?"External video link":"Lien externe"}</a>}
    {manager&&meeting.meeting_status==="scheduled"&&<button className="secondary-outline-button" onClick={()=>void updateMeetingStatus("completed")}>{en?"Mark completed":"Marquer comme terminée"}</button>}
    {manager&&meeting.meeting_status==="scheduled"&&<button className="danger-outline-button" onClick={()=>void updateMeetingStatus("cancelled")}>{en?"Cancel meeting":"Annuler la réunion"}</button>}
   </div>
   {ownAttendance==="invited"&&<div className="collab-invitation"><strong>{en?"Your response is expected":"Ta réponse est attendue"}</strong><div><button className="primary-button" onClick={()=>void respond("accepted")} disabled={busy}>{en?"Attend":"Je participe"}</button><button className="quiet-button" onClick={()=>void respond("declined")} disabled={busy}>{en?"Decline":"Je décline"}</button></div></div>}
   {meeting.agenda&&<section className="collab-card"><p className="eyebrow">{en?"MEETING PURPOSE":"OBJET DE LA RÉUNION"}</p><p className="meeting-agenda-text">{meeting.agenda}</p>{meeting.location&&<small>{en?"Location":"Lieu"} : {meeting.location}</small>}</section>}
   <nav className="meeting-detail-tabs">{tabs.map(([key,label])=><button key={key} onClick={()=>setActiveTab(key)} className={activeTab===key?"active":""}>{label}</button>)}</nav>

   {activeTab==="agenda"&&<div className="collab-stack">
    <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"DISCUSSION PLAN":"DÉROULÉ DE LA RÉUNION"}</p><h2>{en?"Agenda items":"Points à traiter"}</h2></div><span className="collab-count">{agendaItems.length}</span></div>
     {agendaItems.length?agendaItems.map((item,i)=><article className="meeting-agenda-item" key={item.id}><div className="agenda-item-number">{i+1}</div><div className="agenda-item-main"><strong>{item.title}</strong>{item.description&&<p>{item.description}</p>}<small>{item.presenter_id?(names[item.presenter_id]||"Membre JEC"):""}</small></div><span className={"project-status "+item.item_status}>{item.item_status}</span>{manager&&<select value={item.item_status} onChange={e=>void updateAgenda(item.id,e.target.value)}><option value="pending">À traiter</option><option value="discussed">Traité</option><option value="deferred">Reporté</option></select>}</article>):<p className="collab-muted">{en?"No agenda item yet.":"Aucun point inscrit pour le moment."}</p>}
     {manager&&<form className="collab-form agenda-create-form" onSubmit={addAgenda}><h3>{en?"Add an agenda item":"Ajouter un point"}</h3><label>{en?"Title":"Intitulé"}<input value={agendaTitle} onChange={e=>setAgendaTitle(e.target.value)} required/></label><label>{en?"Details":"Détails"}<textarea rows={2} value={agendaDescription} onChange={e=>setAgendaDescription(e.target.value)}/></label><label>{en?"Presenter":"Présentateur"}<select value={agendaPresenter} onChange={e=>setAgendaPresenter(e.target.value)}><option value="">—</option>{roster.map(m=><option key={m.user_id} value={m.user_id}>{names[m.user_id]||"Membre JEC"}</option>)}</select></label><button className="primary-button" disabled={busy}>{en?"Add item":"Ajouter le point"}</button></form>}
    </section>
    <section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"DECISIONS":"DÉCISIONS"}</p><h2>{en?"Meeting decisions":"Décisions prises"}</h2></div><span className="collab-count">{decisions.filter(d=>d.decision_status==="confirmed").length}</span></div>
     {decisions.length?decisions.map(d=><article className="meeting-decision-row" key={d.id}><span className="decision-check">✓</span><div><strong>{d.title}</strong>{d.detail&&<p>{d.detail}</p>}<small>{d.decision_status}</small></div></article>):<p className="collab-muted">{en?"Decisions will be recorded here.":"Les décisions seront consignées ici."}</p>}
     {manager&&<form className="collab-form" onSubmit={addDecision}><h3>{en?"Record a decision":"Consigner une décision"}</h3><label>{en?"Decision":"Décision"}<input value={decisionTitle} onChange={e=>setDecisionTitle(e.target.value)} required/></label><label>{en?"Details / context":"Détails / contexte"}<textarea rows={2} value={decisionDetail} onChange={e=>setDecisionDetail(e.target.value)}/></label><button className="primary-button" disabled={busy}>{en?"Save decision":"Enregistrer la décision"}</button></form>}
    </section>
   </div>}

   {activeTab==="minutes"&&<section className="collab-card">
    <div className="collab-card-heading"><div><p className="eyebrow">{en?"OFFICIAL MEETING RECORD":"DOCUMENT DE SUIVI"}</p><h2>{en?"Minutes / report":"Compte rendu"}</h2></div>{minutes&&<span className={"project-status "+minutes.minutes_status}>{minutes.minutes_status}</span>}</div>
    {minutes?.minutes_status==="approved"?<div className="minutes-approved"><p>{en?"Approved minutes — read only":"Compte rendu approuvé — lecture seule"}</p><div className="minutes-text-render">{minutes.content}</div><small>{en?"Approved by":"Approuvé par"} : {names[minutes.approved_by||""]||"Responsable JEC"} · {minutes.approved_at?date(minutes.approved_at,en):""}</small></div>:<>
      <p className="collab-muted">{en?"Structure the report with context, discussion, decisions and follow-up.":"Structure le compte rendu autour du contexte, des échanges, des décisions et du suivi."}</p>
      <textarea className="minutes-editor" rows={18} value={minutesText} onChange={e=>setMinutesText(e.target.value)} placeholder={en?"Meeting date and participants\\n1. Context\\n2. Discussion\\n3. Decisions\\n4. Action owners and deadlines":"Date et participants\\n1. Contexte\\n2. Échanges\\n3. Décisions\\n4. Responsables et échéances"}/>
      <div className="minutes-actions"><button className="secondary-outline-button" onClick={()=>void saveMinutes("draft")} disabled={busy||!minutesText.trim()}>{en?"Save draft":"Enregistrer le brouillon"}</button><button className="primary-button" onClick={()=>void saveMinutes("shared")} disabled={busy||!minutesText.trim()}>{en?"Share with participants":"Partager aux participants"}</button>{manager&&minutes&&minutes.minutes_status==="shared"&&<button className="approve-minutes-button" onClick={()=>void approveMinutes()} disabled={busy}>{en?"Approve and lock":"Approuver et verrouiller"}</button>}</div>
    </>}
    {minutes?.minutes_status==="draft"&&manager&&<button className="approve-minutes-button" onClick={()=>void approveMinutes()} disabled={busy}>{en?"Approve and lock":"Approuver et verrouiller"}</button>}
   </section>}

   {activeTab==="transcript"&&<div className="collab-stack">
    <section className="collab-card"><p className="eyebrow">{en?"CONSENT-BASED TRANSCRIPTION":"TRANSCRIPTION AVEC CONSENTEMENT"}</p><h2>{en?"Meeting transcript":"Transcription de la réunion"}</h2>
     <p className="transcript-privacy-warning">⚠️ {en?"Browser speech recognition may send audio to a browser or external speech service depending on the browser. Inform all participants and obtain their consent first. JEC-conNEcT stores only the resulting text, not raw audio.":"La reconnaissance vocale du navigateur peut transmettre l'audio au navigateur ou à un service externe selon l'outil utilisé. Informe les participants et recueille leur consentement avant de démarrer. JEC-conNEcT ne conserve que le texte, pas l'audio brut."}</p>
     <label className="collab-form-label">{en?"Transcript language":"Langue de transcription"}<select value={transcriptLanguage} onChange={e=>setTranscriptLanguage(e.target.value)}><option value="fr-FR">Français</option><option value="en-GB">English</option><option value="de-DE">Deutsch</option><option value="es-ES">Español</option></select></label>
     <label className="call-consent"><input type="checkbox" checked={transcriptConsent} onChange={e=>setTranscriptConsent(e.target.checked)}/><span>{en?"I confirm that all participants have been informed and consent to transcription.":"Je confirme que tous les participants ont été informés et consentent à la transcription."}</span></label>
     <div className="transcript-capture-controls">{transcriptSupported?<button className="secondary-outline-button" disabled={!transcriptConsent||recognizing} onClick={startRecognition}>{recognizing?(en?"Recognition running":"Reconnaissance en cours"):(en?"Start browser speech recognition":"Démarrer la reconnaissance vocale")}</button>:<span className="collab-muted">{en?"Speech recognition is unavailable in this browser; use manual notes.":"La reconnaissance vocale n'est pas disponible ; utilise la saisie manuelle."}</span>}
      {recognizing&&<button className="danger-outline-button" onClick={()=>recognitionRef.current?.stop()}>{en?"Stop":"Arrêter"}</button>}</div>
     <textarea className="minutes-editor" rows={12} value={transcriptText} onChange={e=>setTranscriptText(e.target.value)} placeholder={en?"Paste or type the transcript here…":"Colle ou saisis ici la transcription…"}/>
     <div className="minutes-actions"><button className="primary-button" onClick={()=>void addTranscript(transcriptSource)} disabled={busy||!transcriptConsent||!transcriptText.trim()}>{en?"Save private transcript":"Enregistrer la transcription privée"}</button></div>
    </section>
    {transcripts.map(item=><section className="collab-card" key={item.id}><div className="collab-card-heading"><strong>{date(item.created_at,en)}</strong><span className="project-status">{item.source_type}</span></div><p className="transcript-saved-text">{item.transcript_text}</p></section>)}
   </div>}

   {activeTab==="actions"&&<section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"FOLLOW-UP":"SUIVI"}</p><h2>{en?"Action items":"Actions à réaliser"}</h2></div><span className="collab-count">{tasks.length}</span></div>
    {tasks.map(task=><article className="workspace-task-row" key={task.id}><div className="task-status-dot" data-status={task.task_status}/><div className="workspace-task-main"><strong>{task.title}</strong><small>{task.assigned_to?(names[task.assigned_to]||"Membre JEC"):(en?"Unassigned":"Non attribuée")}{task.due_at?" · "+date(task.due_at,en,false):""}</small></div><select value={task.task_status} onChange={e=>void updateTask(task.id,e.target.value)}><option value="todo">À faire</option><option value="in_progress">En cours</option><option value="blocked">Bloquée</option><option value="done">Terminée</option><option value="cancelled">Annulée</option></select></article>)}
    {manager&&<form className="collab-form" onSubmit={addActionTask}><h3>{en?"Create an action item":"Créer une action"}</h3><label>{en?"Action":"Action à réaliser"}<input value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} required/></label><label>{en?"Responsible member":"Responsable"}<select value={taskAssignee} onChange={e=>setTaskAssignee(e.target.value)}><option value="">—</option>{roster.map(m=><option key={m.user_id} value={m.user_id}>{names[m.user_id]||"Membre JEC"}</option>)}</select></label><label>{en?"Due date":"Échéance"}<input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/></label><button className="primary-button" disabled={busy}>{en?"Add action":"Ajouter l'action"}</button></form>}
   </section>}

   {activeTab==="participants"&&<section className="collab-card"><div className="collab-card-heading"><div><p className="eyebrow">{en?"ATTENDANCE":"PARTICIPATION"}</p><h2>{en?"Participants":"Participants"}</h2></div><span className="collab-count">{participants.length}</span></div>
    {participants.map(p=><article className="workspace-roster-row" key={p.user_id}><div className="roster-avatar">{(names[p.user_id]||"J").slice(0,1).toUpperCase()}</div><div className="workspace-roster-name"><strong>{names[p.user_id]||"Membre JEC"}</strong><small>{p.user_id===userId?(en?"You":"Toi"):"JEC-conNEcT"}</small></div><span className={"project-status "+p.attendance_status}>{p.attendance_status}</span></article>)}
   </section>}
  </div>
 </main>;
}
