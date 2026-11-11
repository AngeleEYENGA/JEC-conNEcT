"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function signInWithGoogle() {
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("La connexion Google sera disponible après configuration des variables Supabase sur l'environnement de démonstration.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("L'authentification sera activée après configuration de Supabase sur l'environnement de démonstration.");
      return;
    }
    setLoading(true);
    if (mode === "signup") {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      if (authError) setError(authError.message);
      else if (data.session) router.push("/");
      else setMessage("Un lien de confirmation vient de t'être envoyé par e-mail.");
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
      else router.push("/");
    }
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-decoration">
        <div className="brand-lockup"><div className="brand-mark"><span>JEC</span><i>✳</i></div><span>conNEcT</span></div>
        <div className="auth-pitch">
          <p className="eyebrow light">UN MOUVEMENT · UNE COMMUNAUTÉ</p>
          <h1>Le lien qui nous rassemble.<br/><em>L’action qui nous unit.</em></h1>
          <p>Retrouve les actualités, les équipes, les projets et toute la vie de la JEC dans un seul espace.</p>
        </div>
        <div className="color-ribbon"><span/><span/><span/><span/><span/><span/></div>
      </div>
      <section className="auth-panel">
        <Link href="/" className="back-link">← Retour à la plateforme</Link>
        <div className="auth-card">
          <p className="eyebrow">BIENVENUE DANS LA COMMUNAUTÉ</p>
          <h2>{mode === "login" ? "Heureuse de te retrouver." : "Rejoins JEC-conNEcT."}</h2>
          <p className="muted">{mode === "login" ? "Connecte-toi pour retrouver ton espace." : "Crée ton compte pour accéder à ton espace membre."}</p>
          <button className="google-button" onClick={signInWithGoogle} disabled={loading}>
            <span className="google-g">G</span> Continuer avec Google
          </button>
          <div className="or-divider"><span/>ou avec ton adresse e-mail<span/></div>
          <form onSubmit={submit} className="auth-form">
            <label>Adresse e-mail<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="prenom@exemple.fr"/></label>
            <label>Mot de passe<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="8 caractères minimum"/></label>
            <button className="primary-button full" disabled={loading}>{loading ? "Patiente un instant…" : mode === "login" ? "Se connecter" : "Créer mon compte"}</button>
          </form>
          {error && <p className="alert error">{error}</p>}
          {message && <p className="alert success">{message}</p>}
          <p className="switch-auth">{mode === "login" ? "Pas encore de compte ?" : "Tu as déjà un compte ?"} <button onClick={()=>{setMode(mode === "login" ? "signup" : "login");setError("");setMessage("");}}>{mode === "login" ? "Créer un compte" : "Se connecter"}</button></p>
          <p className="auth-note">En continuant, tu acceptes les règles d’utilisation et la politique de confidentialité de la plateforme.</p>
        </div>
      </section>
    </main>
  );
}
