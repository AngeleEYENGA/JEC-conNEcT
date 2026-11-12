"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PWAInstallButton() {
  const {lang}=useLanguage();
  const en=lang==="en";
  const [installPrompt,setInstallPrompt]=useState<BeforeInstallPromptEvent|null>(null);
  const [installed,setInstalled]=useState(false);
  const [showHelp,setShowHelp]=useState(false);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & {standalone?:boolean}).standalone === true;
    setInstalled(isStandalone);

    const onBeforeInstall=(event:Event)=>{
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled=()=>{
      setInstalled(true);
      setInstallPrompt(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt",onBeforeInstall);
    window.addEventListener("appinstalled",onInstalled);

    if("serviceWorker" in navigator){
      navigator.serviceWorker.register("/sw.js").catch(()=>undefined);
    }

    return ()=>{
      window.removeEventListener("beforeinstallprompt",onBeforeInstall);
      window.removeEventListener("appinstalled",onInstalled);
    };
  },[]);

  async function install(){
    if(!installPrompt){
      setShowHelp(value=>!value);
      return;
    }
    setBusy(true);
    try{
      await installPrompt.prompt();
      const choice=await installPrompt.userChoice;
      if(choice.outcome==="accepted") setInstalled(true);
      setInstallPrompt(null);
    } finally {
      setBusy(false);
    }
  }

  if(installed){
    return <span className="pwa-installed-label">✓ {en?"App installed":"Application installée"}</span>;
  }

  return (
    <div className="pwa-install-wrap">
      <button className="pwa-install-button" onClick={install} disabled={busy}>
        <span className="pwa-download-icon">↓</span>
        {busy?(en?"Installing…":"Installation…"):(en?"Install app":"Installer l’application")}
      </button>
      {showHelp && <div className="pwa-help-popover" role="dialog">
        <button className="pwa-help-close" aria-label={en?"Close":"Fermer"} onClick={()=>setShowHelp(false)}>×</button>
        <strong>{en?"Add JEC-conNEcT to your device":"Ajouter JEC-conNEcT à ton appareil"}</strong>
        <p>{en?"On iPhone or iPad: tap Share, then “Add to Home Screen”. On a computer or Android device, use the browser menu and choose “Install app” or “Add to Home Screen”.":"Sur iPhone ou iPad : touche Partager, puis « Sur l’écran d’accueil ». Sur ordinateur ou Android, ouvre le menu du navigateur et choisis « Installer l’application » ou « Ajouter à l’écran d’accueil »."}</p>
      </div>}
    </div>
  );
}
