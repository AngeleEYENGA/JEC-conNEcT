"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type AppLanguage = "fr" | "en";
const LanguageContext = createContext<{lang:AppLanguage;setLang:(v:AppLanguage)=>void}>({
  lang:"fr",
  setLang:()=>{}
});

export function LanguageProvider({children}:{children:React.ReactNode}) {
  const [lang,setLang] = useState<AppLanguage>("fr");
  useEffect(()=>{
    const saved = window.localStorage.getItem("jec-connect-language");
    if(saved === "fr" || saved === "en") setLang(saved);
  },[]);
  useEffect(()=>{
    document.documentElement.lang = lang;
    window.localStorage.setItem("jec-connect-language",lang);
  },[lang]);
  return <LanguageContext.Provider value={{lang,setLang}}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSwitcher() {
  const {lang,setLang}=useLanguage();
  return (
    <div className="language-switch" role="group" aria-label="Language / Langue">
      <button className={lang==="fr"?"selected":""} onClick={()=>setLang("fr")} aria-pressed={lang==="fr"}>FR</button>
      <span/>
      <button className={lang==="en"?"selected":""} onClick={()=>setLang("en")} aria-pressed={lang==="en"}>EN</button>
    </div>
  );
}
