"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("Finalisation de la connexion…");

  useEffect(() => {
    let active = true;
    async function finish() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage("Configuration Supabase manquante. Reviens à l'écran de connexion.");
        return;
      }
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setMessage("La connexion n'a pas pu être finalisée : " + error.message);
          return;
        }
      }
      if (active) {
        setMessage("Connexion réussie. Redirection…");
        router.replace("/");
      }
    }
    finish();
    return () => { active = false; };
  }, [params, router]);

  return <main className="callback-shell"><div className="callback-card"><div className="brand-mark"><span>JEC</span><i>✳</i></div><h1>JEC-conNEcT</h1><p>{message}</p><a href="/login">Retour à la connexion</a></div></main>;
}
