"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";

export default function LoginPage() {
  const router = useRouter();
  const {lang}=useLanguage();
  const en=lang==="en";
  const [mode,setMode]=useState<"login"|"signup">("login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [message,setMessage]=useState("");
  const [configured,setConfigured]=useState(false);

  useEffect(()=>{
    setConfigured(Boolean(getSupabaseBrowserClient()));
    const params=new URLSearchParams(window.location.search);
    const code=params.get("error");
    if(code==="oauth_config_or_code_missing") setError(en?"OAuth setup is incomplete. Check the Supabase URL, public key and callback URL.":"La configuration OAuth est incomplète. Vérifie l’URL Supabase, la clé publique et l’URL de retour.");
    if(code==="oauth_exchange_failed") setError(en?"Google sign-in could not be completed. Check that the Google provider is enabled in Supabase and that redirect URLs match.":"La connexion Google n’a pas abouti. Vérifie que le fournisseur Google est activé dans Supabase et que les URL de redirection correspondent.");
    if(code==="access_denied") setError(en?"Sign-in was cancelled or denied.":"La connexion a été annulée ou refusée.");
    if(code==="oauth_session_missing") setError(en?"Google confirmed the sign-in, but JEC-conNEcT could not establish the application session. Please try again or use the same browser tab.":"Google a confirmé la connexion, mais JEC-conNEcT n'a pas pu établir la session de l'application. Réessaie depuis le même navigateur.");
    if(code==="membership_pending") setMessage(en?"Your account is connected. Your JEC membership is still awaiting review; access to private workspaces will be available once approved and invited.":"Ton compte est connecté. Ton adhésion JEC est encore en cours de validation ; l'accès aux espaces privés sera disponible après validation et invitation.");
  },[en]);

  function authErrorText(value:string) {
    if(value.toLowerCase().includes("provider is not enabled")) return en?"Google sign-in is not enabled in Supabase yet.":"La connexion Google n’est pas encore activée dans Supabase.";
    if(value.toLowerCase().includes("redirect")) return en?"The callback URL is not allowed in Supabase. Add this app's /auth/callback URL to the redirect allow list.":"L’URL de retour n’est pas autorisée dans Supabase. Ajoute l’URL /auth/callback de cette application à la liste des redirections.";
    return value;
  }

  async function signInWithGoogle() {
    setError("");setMessage("");
    const supabase=getSupabaseBrowserClient();
    if(!supabase) {
      setError(en?"Supabase is not fully configured on Vercel. The project URL is present, but the publishable key is still missing.":"Supabase n’est pas entièrement configuré sur Vercel. L’URL du projet est présente, mais la clé publique manque encore.");
      return;
    }
    setLoading(true);
    const {error:authError}=await supabase.auth.signInWithOAuth({
      provider:"google",
      options:{redirectTo:`${window.location.origin}/auth/callback`}
    });
    if(authError){setError(authErrorText(authError.message));setLoading(false);}
  }

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setMessage("");
    const supabase=getSupabaseBrowserClient();
    if(!supabase){setError(en?"Supabase is not configured on this deployment yet.":"Supabase n’est pas encore configuré sur ce déploiement.");return;}
    setLoading(true);
    if(mode==="signup") {
      const {data,error:authError}=await supabase.auth.signUp({
        email,password,
        options:{emailRedirectTo:`${window.location.origin}/auth/callback`}
      });
      if(authError){
        setError(authErrorText(authError.message));
      }else if(data.session){
        router.push("/");
      }else if(data.user && Array.isArray(data.user.identities) && data.user.identities.length===0){
        setError(en
          ?"An account already exists for this address. Use the same sign-in method as before (for this account, Google). Repeating sign-up does not create a password or send a new confirmation email."
          :"Un compte existe déjà pour cette adresse. Utilise la même méthode de connexion qu'auparavant (pour ce compte, Google). Refaire une inscription ne crée pas de mot de passe et ne déclenche pas un nouvel e-mail de confirmation.");
        setMode("login");
      }else{
        setMessage(en
          ?"The sign-up request was accepted. Email delivery is not guaranteed yet: JEC-conNEcT still needs a production SMTP sender. If no message arrives, do not create the account again; contact the platform administrator."
          :"La demande d'inscription a été enregistrée. L'envoi du mail n'est pas encore garanti : JEC-conNEcT doit encore disposer d'un serveur SMTP de production. Si aucun message n'arrive, ne recrée pas le compte ; contacte l'administrateur de la plateforme.");
      }
    } else {
      const {error:authError}=await supabase.auth.signInWithPassword({email,password});
      if(authError)setError(authErrorText(authError.message));
      else router.push("/");
    }
    setLoading(false);
  }

  async function resetPassword() {
    setError("");setMessage("");
    if(!email.trim()){setError(en?"Enter your email address first.":"Saisis d’abord ton adresse e-mail.");return;}
    const supabase=getSupabaseBrowserClient();
    if(!supabase){setError(en?"Supabase is not configured yet.":"Supabase n’est pas encore configuré.");return;}
    setLoading(true);
    const {error:authError}=await supabase.auth.resetPasswordForEmail(email,{
      redirectTo:`${window.location.origin}/auth/callback?next=/update-password`
    });
    if(authError)setError(authErrorText(authError.message));
    else setMessage(en?"If the address is registered, a password-reset email has been sent.":"Si cette adresse est enregistrée, un e-mail de réinitialisation vient d’être envoyé.");
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-decoration">
        <div className="brand-lockup"><div className="brand-mark"><span>JEC</span><i>✳</i></div><span>conNEcT</span></div>
        <div className="auth-pitch">
          <p className="eyebrow light">{en?"ONE MOVEMENT · ONE COMMUNITY":"UN MOUVEMENT · UNE COMMUNAUTÉ"}</p>
          <h1>{en?"The link that brings us together.":"Le lien qui nous rassemble."}<br/><em>{en?"The action that unites us.":"L’action qui nous unit."}</em></h1>
          <p>{en?"Discover the news, teams, projects and community life of JEC in one space.":"Retrouve les actualités, les équipes, les projets et toute la vie de la JEC dans un seul espace."}</p>
          <div className="auth-visual-note">{en?"Connect · Share · Take action":"Se connecter · Partager · Agir"}</div>
        </div>
        <div className="color-ribbon"><span/><span/><span/><span/><span/><span/></div>
      </div>
      <section className="auth-panel">
        <div className="auth-top-controls"><Link href="/" className="back-link">{en?"← Back to JEC-conNEcT":"← Retour à JEC-conNEcT"}</Link><LanguageSwitcher/></div>
        <div className="auth-card">
          <p className="eyebrow">{en?"WELCOME TO THE COMMUNITY":"BIENVENUE DANS LA COMMUNAUTÉ"}</p>
          <h2>{mode==="login"?(en?"Welcome back.":"Heureuse de te retrouver."):(en?"Join JEC-conNEcT.":"Rejoins JEC-conNEcT.")}</h2>
          <p className="muted">{mode==="login"?(en?"Sign in to access your member space.":"Connecte-toi pour retrouver ton espace."):(en?"Create an account to access the community.":"Crée ton compte pour accéder à ton espace membre.")}</p>
          <button className="google-button" onClick={signInWithGoogle} disabled={loading}>
            <span className="google-g">G</span> {en?"Continue with Google":"Continuer avec Google"}
          </button>
          {!configured && <p className="auth-config-note">{en?"Google and email sign-in are waiting for the public Supabase key and provider setup.":"La connexion Google et e-mail attendent la clé publique Supabase et la configuration du fournisseur."}</p>}
          {mode==="signup"&&<p className="auth-config-note">{en?"Email confirmation is currently not production-ready. A custom SMTP sender must be configured before public email sign-up can reliably deliver confirmation messages.":"La confirmation par e-mail n'est pas encore prête pour la production. Un serveur SMTP personnalisé doit être configuré pour garantir l'envoi des messages de confirmation."}</p>}
          <div className="or-divider"><span/>{en?"or use your email address":"ou avec ton adresse e-mail"}<span/></div>
          <form onSubmit={submit} className="auth-form">
            <label>{en?"Email address":"Adresse e-mail"}<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="prenom@exemple.fr"/></label>
            <label>{en?"Password":"Mot de passe"}<input type="password" autoComplete={mode==="login"?"current-password":"new-password"} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder={en?"At least 8 characters":"8 caractères minimum"}/></label>
            <button className="primary-button full" disabled={loading}>{loading?(en?"Please wait…":"Patiente un instant…"):(mode==="login"?(en?"Sign in":"Se connecter"):(en?"Create my account":"Créer mon compte"))}</button>
          </form>
          {mode==="login" && <button className="forgot-password" onClick={resetPassword} disabled={loading}>{en?"Forgot your password?":"Mot de passe oublié ?"}</button>}
          {error && <p className="alert error">{error}</p>}
          {message && <p className="alert success">{message}</p>}
          <p className="switch-auth">{mode==="login"?(en?"New to JEC-conNEcT?":"Pas encore de compte ?"):(en?"Already have an account?":"Tu as déjà un compte ?")} <button onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");setMessage("");}}>{mode==="login"?(en?"Create an account":"Créer un compte"):(en?"Sign in":"Se connecter")}</button></p>
          <p className="auth-note">{en?"By continuing, you agree to the platform's terms of use and privacy policy.":"En continuant, tu acceptes les règles d’utilisation et la politique de confidentialité de la plateforme."}</p>
        </div>
      </section>
    </main>
  );
}
