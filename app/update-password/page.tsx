"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useLanguage } from "@/components/language-provider";

export default function UpdatePasswordPage() {
  const router=useRouter();
  const {lang}=useLanguage();
  const en=lang==="en";
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setMessage("");
    if(password!==confirm){setError(en?"The passwords do not match.":"Les mots de passe ne correspondent pas.");return;}
    const supabase=getSupabaseBrowserClient();
    if(!supabase){setError(en?"Supabase is not configured.":"Supabase n’est pas configuré.");return;}
    setLoading(true);
    const {error:authError}=await supabase.auth.updateUser({password});
    if(authError)setError(authError.message);
    else {setMessage(en?"Your password has been updated.":"Ton mot de passe a été mis à jour.");setTimeout(()=>router.replace("/login"),1200);}
    setLoading(false);
  }

  return <main className="callback-shell"><section className="password-card"><div className="brand-mark"><span>JEC</span><i>✳</i></div><h1>{en?"Choose a new password":"Choisir un nouveau mot de passe"}</h1><p>{en?"Enter and confirm your new password.":"Saisis et confirme ton nouveau mot de passe."}</p><form onSubmit={submit} className="auth-form"><label>{en?"New password":"Nouveau mot de passe"}<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><label>{en?"Confirm password":"Confirmer le mot de passe"}<input type="password" minLength={8} autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button className="primary-button full" disabled={loading}>{loading?(en?"Saving…":"Enregistrement…"):(en?"Save password":"Enregistrer le mot de passe")}</button></form>{error&&<p className="alert error">{error}</p>}{message&&<p className="alert success">{message}</p>}<Link href="/login" className="password-back">{en?"Back to sign in":"Retour à la connexion"}</Link></section></main>;
}
