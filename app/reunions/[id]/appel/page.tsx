"use client";

import Link from "next/link";
import { useEffect,useState } from "react";
import { useParams } from "next/navigation";
import { LanguageSwitcher,useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import MeetingCallRoom from "@/components/meeting-call-room";

export default function MeetingCallPage(){
 const params=useParams<{id:string}>();const meetingId=params.id;
 const {lang}=useLanguage();const en=lang==="en";
 const [meeting,setMeeting]=useState<{id:string;title:string}|null>(null);
 const [displayName,setDisplayName]=useState("Membre JEC");
 const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 useEffect(()=>{
  let active=true;
  async function load(){
   const supabase=getSupabaseBrowserClient();
   if(!supabase){setError("Supabase n'est pas configuré.");setLoading(false);return;}
   const {data:{user},error:userError}=await supabase.auth.getUser();
   if(userError||!user){window.location.href="/login";return;}
   const [{data:mt,error:mtError},{data:profile}]=await Promise.all([
    supabase.from("jec_meetings").select("id,title").eq("id",meetingId).maybeSingle(),
    supabase.from("jec_profiles").select("display_name,first_name,last_name").eq("user_id",user.id).maybeSingle()
   ]);
   if(!active)return;
   if(mtError||!mt){setError(en?"This meeting is unavailable.":"Cette réunion n'est pas accessible.");setLoading(false);return;}
   setMeeting(mt);
   setDisplayName(profile?.display_name||[profile?.first_name,profile?.last_name].filter(Boolean).join(" ")||"Membre JEC");
   setLoading(false);
  }
  void load();return()=>{active=false;};
 },[meetingId,en]);
 return <main className="collab-page">
  <header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href={"/reunions/"+meetingId} className="back-link-inline">{en?"Back to meeting":"Retour à la réunion"}</Link></div></header>
  <div className="collab-content call-page-content">
   {loading?<p className="muted">{en?"Loading call room…":"Chargement de la salle d'appel…"}</p>:error?<div className="collab-empty"><h1>{en?"Call unavailable":"Appel indisponible"}</h1><p>{error}</p><Link className="primary-button" href="/reunions">{en?"Back to meetings":"Retour aux réunions"}</Link></div>:meeting?<MeetingCallRoom meetingId={meeting.id} meetingTitle={meeting.title} displayName={displayName} onLeave={()=>{window.location.href="/reunions/"+meetingId;}}/>:null}
  </div>
 </main>;
}
