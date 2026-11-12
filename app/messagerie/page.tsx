"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher,useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Conversation={id:string;conversation_type:"direct"|"group"|"workspace";title:string|null;workspace_id:string|null;created_at:string};
type ConversationMembership={conversation_id:string;conversation_role:"owner"|"member";membership_status:"invited"|"active"|"left"};
type ConversationParticipant={user_id:string;conversation_role:"owner"|"member";membership_status:"invited"|"active"};
type Message={id:string;conversation_id:string;sender_id:string;body:string;created_at:string;edited_at:string|null;deleted_at:string|null};
type Profile={user_id:string;first_name:string|null;last_name:string|null;display_name:string|null;avatar_url:string|null};
type Workspace={id:string;name:string;slug:string};

function initials(value:string){return value.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"J";}
function formatTime(value:string,en:boolean){return new Date(value).toLocaleString(en?"en-GB":"fr-FR",{dateStyle:"short",timeStyle:"short"});}

export default function MessagesPage(){
  const {lang}=useLanguage();const en=lang==="en";
  const [userId,setUserId]=useState("");
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [myMemberships,setMyMemberships]=useState<ConversationMembership[]>([]);
  const [workspaces,setWorkspaces]=useState<Workspace[]>([]);
  const [selectedId,setSelectedId]=useState("");
  const [participants,setParticipants]=useState<ConversationParticipant[]>([]);
  const [messages,setMessages]=useState<Message[]>([]);
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [loading,setLoading]=useState(true);
  const [messagesLoading,setMessagesLoading]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [newBody,setNewBody]=useState("");
  const [sending,setSending]=useState(false);
  const [creating,setCreating]=useState(false);
  const [showNew,setShowNew]=useState(false);
  const [newType,setNewType]=useState<"direct"|"group"|"workspace">("direct");
  const [newTitle,setNewTitle]=useState("");
  const [memberEmails,setMemberEmails]=useState("");
  const [workspaceId,setWorkspaceId]=useState("");

  const selected=conversations.find(c=>c.id===selectedId)??null;
  const membershipByConversation=useMemo(()=>new Map(myMemberships.map(m=>[m.conversation_id,m.membership_status])),[myMemberships]);
  const profileById=useMemo(()=>new Map(profiles.map(p=>[p.user_id,p])),[profiles]);

  const personName=(id:string)=>{
    const profile=profileById.get(id);
    return profile?.display_name||[profile?.first_name,profile?.last_name].filter(Boolean).join(" ")||(en?"JEC member":"Membre JEC");
  };
  const conversationLabel=(conversation:Conversation)=>{
    if(conversation.title)return conversation.title;
    if(conversation.conversation_type==="workspace"){
      return workspaces.find(w=>w.id===conversation.workspace_id)?.name??(en?"Workspace conversation":"Conversation d'espace");
    }
    if(conversation.conversation_type==="direct"){
      const other=participants.find(p=>p.user_id!==userId&&p.membership_status==="active");
      return other?personName(other.user_id):(en?"Direct conversation":"Conversation directe");
    }
    return en?"Group conversation":"Conversation de groupe";
  };

  const loadList=useCallback(async()=>{
    const supabase=getSupabaseBrowserClient();
    if(!supabase){setError(en?"Supabase is not configured.":"Supabase n'est pas configuré.");setLoading(false);return;}
    const {data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user){window.location.href="/login";return;}
    setUserId(user.id);
    const {data:membershipRows,error:membershipError}=await supabase.from("jec_conversation_members")
      .select("conversation_id,conversation_role,membership_status")
      .eq("user_id",user.id).neq("membership_status","left");
    if(membershipError){setError(membershipError.message);setLoading(false);return;}
    const rows=(membershipRows??[]) as ConversationMembership[];
    setMyMemberships(rows);
    const ids=rows.map(row=>row.conversation_id);
    if(!ids.length){setConversations([]);setLoading(false);return;}
    const [{data:conversationRows,error:conversationError},{data:workspaceRows}]=await Promise.all([
      supabase.from("jec_conversations").select("id,conversation_type,title,workspace_id,created_at").in("id",ids).order("updated_at",{ascending:false}),
      supabase.from("jec_workspaces").select("id,name,slug").order("name")
    ]);
    if(conversationError)setError(conversationError.message);
    setConversations((conversationRows??[]) as Conversation[]);
    setWorkspaces((workspaceRows??[]) as Workspace[]);
    setSelectedId(current=>current&&ids.includes(current)?current:ids[0]);
    setLoading(false);
  },[en]);

  useEffect(()=>{void loadList();},[loadList]);

  useEffect(()=>{
    if(!selectedId||membershipByConversation.get(selectedId)!=="active") {
      setMessages([]);setParticipants([]);setProfiles([]);return;
    }
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    let active=true;
    setMessagesLoading(true);setError("");
    async function loadConversation(){
      const [{data:messageRows,error:messageError},{data:participantRows,error:participantError}]=await Promise.all([
        supabase.from("jec_messages").select("id,conversation_id,sender_id,body,created_at,edited_at,deleted_at").eq("conversation_id",selectedId).is("deleted_at",null).order("created_at",{ascending:true}).limit(300),
        supabase.from("jec_conversation_members").select("user_id,conversation_role,membership_status").eq("conversation_id",selectedId)
      ]);
      if(!active)return;
      if(messageError)setError(messageError.message);
      if(participantError)setError(participantError.message);
      setMessages((messageRows??[]) as Message[]);
      const roster=(participantRows??[]) as ConversationParticipant[];
      setParticipants(roster);
      const ids=roster.filter(row=>row.membership_status==="active").map(row=>row.user_id);
      if(ids.length){
        const {data:profileRows,error:profileError}=await supabase.from("jec_profiles")
          .select("user_id,first_name,last_name,display_name,avatar_url").in("user_id",ids);
        if(active&&profileError)setError(profileError.message);
        if(active)setProfiles((profileRows??[]) as Profile[]);
      }
      if(active)setMessagesLoading(false);
    }
    void loadConversation();

    const channel=supabase.channel("jec-messages-"+selectedId)
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"jec_messages",filter:"conversation_id=eq."+selectedId},payload=>{
        const incoming=payload.new as Message;
        setMessages(current=>current.some(message=>message.id===incoming.id)?current:[...current,incoming]);
      }).subscribe();

    return ()=>{
      active=false;
      void supabase.removeChannel(channel);
    };
  },[selectedId,membershipByConversation]);

  async function acceptInvitation(conversationId:string){
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setError("");setNotice("");
    const {error:acceptError}=await supabase.rpc("jec_accept_conversation_invitation",{target_conversation_id:conversationId});
    if(acceptError)setError(acceptError.message);
    else {setNotice(en?"Conversation invitation accepted.":"Invitation à la conversation acceptée.");await loadList();}
  }

  async function createConversation(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setCreating(true);setError("");setNotice("");
    const emails=memberEmails.split(/[;,\n]/).map(s=>s.trim()).filter(Boolean);
    const {data:newId,error:createError}=await supabase.rpc("jec_create_conversation",{
      target_type:newType,
      target_title:newTitle.trim()||null,
      target_workspace_id:newType==="workspace"?workspaceId:null,
      target_member_emails:newType==="workspace"?[]:emails
    });
    if(createError)setError(createError.message);
    else{
      setShowNew(false);setNewTitle("");setMemberEmails("");setWorkspaceId("");
      await loadList();setSelectedId(newId as string);
      setNotice(en?"Conversation created.":"Conversation créée.");
    }
    setCreating(false);
  }

  async function sendMessage(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!selectedId||!newBody.trim()||!userId)return;
    const supabase=getSupabaseBrowserClient();if(!supabase)return;
    setSending(true);setError("");
    const body=newBody.trim();
    const {data:created,error:sendError}=await supabase.from("jec_messages")
      .insert({conversation_id:selectedId,sender_id:userId,body})
      .select("id,conversation_id,sender_id,body,created_at,edited_at,deleted_at").single();
    if(sendError)setError(sendError.message);
    else{
      setNewBody("");
      if(created)setMessages(current=>current.some(m=>m.id===created.id)?current:[...current,created as Message]);
    }
    setSending(false);
  }

  const invited=conversations.filter(c=>membershipByConversation.get(c.id)==="invited");
  const activeConversations=conversations.filter(c=>membershipByConversation.get(c.id)==="active");
  const otherParticipants=participants.filter(p=>p.user_id!==userId&&p.membership_status==="active");

  return <main className="collab-page">
    <header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/workspace" className="back-link-inline">{en?"Workspaces":"Espaces de travail"}</Link></div></header>
    <div className="messages-content">
      <div className="messages-heading"><div><p className="eyebrow">{en?"COLLABORATION":"COLLABORATION"}</p><h1>{en?"Messaging":"Messagerie"}</h1><p className="collab-lead">{en?"Private discussions with JEC members and teams.":"Échanges privés avec les membres et les équipes de la JEC."}</p></div><button className="primary-button" onClick={()=>setShowNew(v=>!v)}>{showNew?(en?"Close":"Fermer"):(en?"New conversation":"Nouvelle conversation")}</button></div>
      {error&&<p className="alert error">{error}</p>}{notice&&<p className="alert success">{notice}</p>}
      {showNew&&<form className="collab-form new-conversation-form" onSubmit={createConversation}>
        <h2>{en?"Start a conversation":"Démarrer une conversation"}</h2>
        <label>{en?"Conversation type":"Type de conversation"}<select value={newType} onChange={e=>setNewType(e.target.value as "direct"|"group"|"workspace")}><option value="direct">{en?"Direct conversation":"Conversation directe"}</option><option value="group">{en?"Group conversation":"Conversation de groupe"}</option><option value="workspace">{en?"Workspace conversation":"Conversation d'espace"}</option></select></label>
        {newType==="workspace"?<label>{en?"Workspace":"Espace de travail"}<select value={workspaceId} onChange={e=>setWorkspaceId(e.target.value)} required><option value="">{en?"Choose a workspace":"Choisir un espace"}</option>{workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>:<>
          {newType==="group"&&<label>{en?"Group name (optional)":"Nom du groupe (facultatif)"}<input value={newTitle} onChange={e=>setNewTitle(e.target.value)} maxLength={160}/></label>}
          <label>{en?"Participant email address(es)":"Adresse(s) e-mail du ou des participants"}<textarea rows={2} value={memberEmails} onChange={e=>setMemberEmails(e.target.value)} required placeholder={newType==="direct"?"membre@jecfrance.org":"membre1@jecfrance.org, membre2@jecfrance.org"}/></label>
          <small className="muted">{newType==="direct"?(en?"Enter exactly one other verified JEC member.":"Saisis exactement l'adresse d'un autre membre JEC vérifié."):(en?"Separate addresses with commas or semicolons.":"Sépare les adresses par des virgules ou des points-virgules.")}</small>
        </>}
        <button className="primary-button" disabled={creating}>{creating?(en?"Creating…":"Création…"):(en?"Create conversation":"Créer la conversation")}</button>
      </form>}

      {loading?<p className="muted">{en?"Loading conversations…":"Chargement des conversations…"}</p>:<div className="messages-layout">
        <aside className="messages-list">
          {invited.length>0&&<div className="messages-list-group"><p className="eyebrow">{en?"INVITATIONS":"INVITATIONS"}</p>{invited.map(conversation=><article key={conversation.id} className="message-list-item invited"><div className="message-list-avatar">✉</div><div className="message-list-text"><strong>{conversation.title|| (conversation.conversation_type==="direct"?(en?"Direct invitation":"Invitation directe"):(en?"Group invitation":"Invitation de groupe"))}</strong><small>{en?"Awaiting your response":"En attente de ta réponse"}</small><button onClick={()=>acceptInvitation(conversation.id)}>{en?"Accept":"Accepter"}</button></div></article>)}</div>}
          <div className="messages-list-group"><p className="eyebrow">{en?"CONVERSATIONS":"CONVERSATIONS"}</p>
            {activeConversations.length?activeConversations.map(conversation=><button key={conversation.id} className={selectedId===conversation.id?"message-list-item active":"message-list-item"} onClick={()=>setSelectedId(conversation.id)}><div className="message-list-avatar">{conversation.conversation_type==="direct"?"↔":conversation.conversation_type==="workspace"?"⌘":"♧"}</div><div className="message-list-text"><strong>{conversation.title|| (conversation.conversation_type==="direct"?(en?"Direct conversation":"Conversation directe"):conversation.conversation_type==="workspace"?(en?"Workspace discussion":"Discussion d'espace"):(en?"Group conversation":"Conversation de groupe"))}</strong><small>{conversation.conversation_type==="direct"?(en?"Direct":"Privée"):conversation.conversation_type==="workspace"?(en?"Workspace":"Espace"):(en?"Group":"Groupe")}</small></div></button>):<p className="messages-empty-hint">{en?"No conversation yet. Start one above.":"Aucune conversation. Démarre-en une ci-dessus."}</p>}
          </div>
        </aside>
        <section className="message-thread">
          {!selected?<div className="collab-empty"><span>▤</span><h2>{en?"Select a conversation":"Sélectionne une conversation"}</h2><p>{en?"Your private messages will appear here.":"Tes messages privés apparaîtront ici."}</p></div>:membershipByConversation.get(selected.id)==="invited"?<div className="collab-empty"><span>✉</span><h2>{en?"Invitation pending":"Invitation en attente"}</h2><button className="primary-button" onClick={()=>acceptInvitation(selected.id)}>{en?"Accept invitation":"Accepter l'invitation"}</button></div>:<>
            <div className="message-thread-header"><div><strong>{conversationLabel(selected)}</strong><small>{otherParticipants.length+1} {en?"participants":"participants"}</small></div><span className="online-dot-label">{en?"Private conversation":"Conversation privée"}</span></div>
            <div className="message-history">
              {messagesLoading?<p className="muted">{en?"Loading messages…":"Chargement des messages…"}</p>:messages.length?messages.map(message=><article key={message.id} className={message.sender_id===userId?"chat-message own":"chat-message"}><div className="chat-message-avatar">{initials(message.sender_id===userId?(en?"You":"Toi"):personName(message.sender_id))}</div><div className="chat-message-bubble"><div className="chat-message-meta"><strong>{message.sender_id===userId?(en?"You":"Toi"):personName(message.sender_id)}</strong><time>{formatTime(message.created_at,en)}</time></div><p>{message.body}</p></div></article>):<div className="messages-empty-thread"><span>✦</span><p>{en?"No message yet. Say hello!":"Aucun message pour l'instant. Lance la conversation !"}</p></div>}
            </div>
            <form className="message-composer" onSubmit={sendMessage}><textarea rows={2} value={newBody} onChange={e=>setNewBody(e.target.value)} placeholder={en?"Write a message…":"Écris un message…"} required maxLength={12000}/><button className="primary-button" disabled={sending||!newBody.trim()}>{sending?(en?"Sending…":"Envoi…"):(en?"Send":"Envoyer")}</button></form>
          </>}
        </section>
      </div>}
    </div>
  </main>;
}
