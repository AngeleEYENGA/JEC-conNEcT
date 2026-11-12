"use client";
import Link from "next/link";
import { LanguageSwitcher,useLanguage } from "@/components/language-provider";

export default function MessagesPage(){
  const {lang}=useLanguage();const en=lang==="en";
  return <main className="collab-page"><header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/workspace" className="back-link-inline">{en?"Workspaces":"Espaces de travail"}</Link></div></header>
    <div className="collab-content"><p className="eyebrow">{en?"COLLABORATION":"COLLABORATION"}</p><h1>{en?"Messaging":"Messagerie"}</h1><p className="collab-lead">{en?"Private conversations and group discussions are the next collaboration module.":"Les conversations privées et discussions de groupe constituent la prochaine brique du volet Collaboration."}</p>
      <section className="collab-section"><div className="collab-empty"><span>▤</span><h2>{en?"Messaging is being prepared":"La messagerie est en préparation"}</h2><p>{en?"The secure workspace foundation is now in place. The messaging module will add direct conversations, group chats, participant invitations, unread indicators and notifications, with access restricted to conversation members.":"Le socle sécurisé des espaces de travail est en place. La messagerie ajoutera les conversations directes, les groupes, les invitations de participants, les indicateurs de messages non lus et les notifications, avec un accès limité aux participants."}</p><Link href="/workspace" className="primary-button">{en?"Open my workspaces":"Ouvrir mes espaces"}</Link></div></section>
    </div>
  </main>;
}
