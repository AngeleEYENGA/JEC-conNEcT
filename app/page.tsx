"use client";

import { useState } from "react";
import Link from "next/link";

const nav = [
  { label: "Vue d'ensemble", icon: "▦", group: "ESPACE MEMBRE" },
  { label: "Actualités", icon: "◉" },
  { label: "Communauté", icon: "◎" },
  { label: "Messagerie", icon: "▤", count: "3" },
  { label: "Équipes & canaux", icon: "⌘", group: "COLLABORER" },
  { label: "Réunions", icon: "▣" },
  { label: "Projets", icon: "◫" },
  { label: "Agenda", icon: "▦" },
  { label: "Documents", icon: "▱", group: "RESSOURCES" },
  { label: "Archives JEC", icon: "▤" },
  { label: "JEC AI", icon: "✳", special: true },
  { label: "Administration", icon: "⚙" }
];

const initialPosts = [
  { initials: "BN", name: "Bureau national", role: "Communication officielle", time: "Il y a 2 h", tag: "ANNONCE NATIONALE", color: "violet", text: "Bienvenue sur JEC-conNEcT, le nouvel espace de démonstration de notre communauté ! Ici, nous pourrons partager les nouvelles du mouvement, retrouver les ressources et faire avancer nos projets ensemble.", likes: 24, comments: 8 },
  { initials: "IDF", name: "AGEC Île-de-France", role: "Actualité régionale", time: "Hier", tag: "VIE DES RÉGIONS", color: "blue", text: "La préparation de notre prochaine rencontre régionale avance. Retrouvez bientôt le programme et les modalités de participation dans l'espace Événements.", likes: 16, comments: 4 },
  { initials: "COM", name: "Commission Formation", role: "Ressource partagée", time: "Il y a 2 jours", tag: "FORMATION", color: "orange", text: "Nouvelle ressource disponible : introduction à la démarche Voir – Juger – Agir et outils pour animer un temps de réflexion en équipe.", likes: 31, comments: 6 }
];

export default function Home() {
  const [active, setActive] = useState("Vue d'ensemble");
  const [posts, setPosts] = useState(initialPosts);
  const [composer, setComposer] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [liked, setLiked] = useState<number[]>([]);
  const title = active === "Vue d'ensemble" ? "Bonjour, la communauté 👋" : active;

  function publish() {
    if (!draft.trim()) return;
    setPosts([{ initials: "MOI", name: "Compte de démonstration", role: "Membre JEC", time: "À l'instant", tag: "PUBLICATION", color: "green", text: draft.trim(), likes: 0, comments: 0 }, ...posts]);
    setDraft(""); setComposer(false); setNotice("Ta publication de démonstration a été ajoutée au fil d'actualité.");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-lockup side-brand"><div className="brand-mark"><span>JEC</span><i>✳</i></div><span>conNEcT</span></Link>
        <div className="workspace-switch"><div className="workspace-avatar">F</div><div><strong>JEC France</strong><small>Espace national</small></div><span className="chevron">⌄</span></div>
        <nav className="main-nav">
          {nav.map((item) => <div key={item.label}>
            {item.group && <p className="nav-group">{item.group}</p>}
            <button onClick={()=>{setActive(item.label);setNotice("");}} className={active===item.label?"nav-item active":"nav-item"}>
              <span className={item.special?"nav-icon sparkle":"nav-icon"}>{item.icon}</span><span>{item.label}</span>{item.count && <b className="nav-count">{item.count}</b>}
            </button>
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon">✳</div><strong>Un coup de main ?</strong><p>Découvre les ressources pour bien démarrer.</p><button onClick={()=>setActive("JEC AI")}>Explorer les ressources →</button></div>
          <div className="profile-mini"><div className="avatar user">ME</div><div><strong>Membre de démonstration</strong><small>JEC France · Invité</small></div><span>•••</span></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">JEC France <span>/</span> <strong>{active}</strong></div>
          <div className="top-actions">
            <label className="search-box"><span>⌕</span><input placeholder="Rechercher dans JEC-conNEcT"/><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={()=>setNotifOpen(!notifOpen)}>♧<i/></button>
            <Link className="top-login" href="/login">Se connecter</Link>
          </div>
        </header>

        {notifOpen && <div className="notification-popover"><strong>Notifications</strong><p><b>Nouvelle annonce nationale</b><br/><small>Le Bureau national a publié une actualité.</small></p><p><b>Réunion à venir</b><br/><small>Commission Formation · Jeudi, 18 h 30</small></p><p className="muted">Centre de notifications de démonstration</p></div>}

        <div className="page-content">
          {notice && <div className="toast">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
          <section className="welcome-banner">
            <div className="welcome-copy"><p className="eyebrow light">LA COMMUNAUTÉ JEC, UNIE</p><h1>{title}</h1><p>Un même espace pour se retrouver, partager, s'organiser et faire vivre le mouvement.</p><div className="welcome-actions"><button className="white-button" onClick={()=>setComposer(true)}>＋ Créer une publication</button><button className="outline-light" onClick={()=>setActive("Agenda")}>Voir l'agenda →</button></div></div>
            <div className="banner-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core">JEC<br/><span>✳</span></div><div className="orbit-dot dot-one"/><div className="orbit-dot dot-two"/><div className="orbit-dot dot-three"/></div>
          </section>

          <div className="content-grid">
            <section className="feed-column">
              <div className="section-heading"><div><p className="eyebrow">RESTE CONNECTÉ·E</p><h2>Le fil de la communauté</h2></div><button className="text-button" onClick={()=>setActive("Actualités")}>Tout voir ↗</button></div>
              {composer && <div className="composer-card"><div className="composer-head"><div className="avatar user">ME</div><strong>Partager avec la communauté</strong><button onClick={()=>setComposer(false)}>×</button></div><textarea value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Quoi de neuf dans ta JEC ?" rows={3}/><div className="composer-foot"><span>Publication de démonstration · aucune donnée réelle</span><button className="primary-button" onClick={publish} disabled={!draft.trim()}>Publier</button></div></div>}
              {posts.map((post, index)=><article className="post-card" key={index}>
                <div className="post-header"><div className={"avatar "+post.color}>{post.initials}</div><div className="post-author"><strong>{post.name}</strong><small>{post.role} · {post.time}</small></div><button className="more-button">•••</button></div>
                <span className={"post-tag "+post.color}>{post.tag}</span>
                <p className="post-text">{post.text}</p>
                <div className="post-media-placeholder"><div className="media-symbol">✳</div><span>La vie du mouvement, en images</span><small>Visuel de démonstration</small></div>
                <div className="post-stats"><span>{post.likes + (liked.includes(index)?1:0)} réactions</span><span>{post.comments} commentaires</span></div>
                <div className="post-actions"><button className={liked.includes(index)?"is-liked":""} onClick={()=>setLiked(old=>old.includes(index)?old.filter(x=>x!==index):[...old,index])}>♡ J'aime</button><button onClick={()=>setNotice("Les commentaires seront activés dans la prochaine itération du prototype.")}>▢ Commenter</button><button onClick={()=>setNotice("Le partage sera disponible dans la prochaine itération.")}>↗ Partager</button></div>
              </article>)}
            </section>

            <aside className="right-column">
              <section className="widget-card"><div className="widget-heading"><h3>À venir</h3><button onClick={()=>setActive("Agenda")}>Tout voir</button></div>
                <div className="event-item"><div className="event-date"><b>20</b><span>NOV.</span></div><div><strong>Réunion du Bureau national</strong><small>18:30 – En ligne</small><span className="event-label">Réunion</span></div></div>
                <div className="event-item"><div className="event-date orange-date"><b>28</b><span>NOV.</span></div><div><strong>Atelier Voir – Juger – Agir</strong><small>14:00 – Île-de-France</small><span className="event-label">Formation</span></div></div>
                <div className="event-item"><div className="event-date green-date"><b>06</b><span>DÉC.</span></div><div><strong>Préparation Summer Camp</strong><small>10:00 – En ligne</small><span className="event-label">Projet</span></div></div>
                <button className="widget-link" onClick={()=>setActive("Agenda")}>＋ Ajouter un événement</button>
              </section>

              <section className="widget-card"><div className="widget-heading"><h3>Mes espaces</h3><button onClick={()=>setActive("Équipes & canaux")}>Explorer</button></div>
                <div className="team-item"><div className="team-icon purple">BN</div><div><strong>Bureau national</strong><small>12 membres · 4 canaux</small></div><span className="online-dot"/></div>
                <div className="team-item"><div className="team-icon blue">IDF</div><div><strong>AGEC Île-de-France</strong><small>18 membres · 3 canaux</small></div></div>
                <div className="team-item"><div className="team-icon orange">COM</div><div><strong>Communication</strong><small>7 membres · 2 canaux</small></div></div>
                <button className="widget-link" onClick={()=>setActive("Équipes & canaux")}>Voir toutes les équipes →</button>
              </section>

              <section className="ai-card"><div className="ai-spark">✳</div><p className="eyebrow">TON ASSISTANT JEC</p><h3>Une idée à organiser ?</h3><p>Prépare un événement, structure un compte rendu ou retrouve une ressource.</p><button onClick={()=>setActive("JEC AI")}>Découvrir JEC AI <span>→</span></button></section>
              <p className="prototype-note">Prototype interactif · Données fictives<br/>JEC-conNEcT n'est pas encore un service officiel.</p>
            </aside>
          </div>
        </div>
      </main>

      {composer && <div className="mobile-compose-hint">Écris ta publication dans le formulaire affiché dans le fil.</div>}
    </div>
  );
}
