"use client";

import Link from "next/link";
import { useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";

const news = [
  {
    date: "13 avril 2026",
    category: "Santé et mieux-vivre",
    title: "3 vidéos pour un mieux-être et un mieux-vivre ensemble !",
    summary: "La JEC France présente trois vidéos consacrées à la santé mentale et aux compétences psychosociales, issues d'un travail mené au sein du mouvement.",
    url: "https://jecfrance.org/3-videos-pour-un-mieux-etre-et-un-mieux-vivre-ensemble/",
    source: "JEC France",
    sourceUrl: "https://jecfrance.org/"
  },
  {
    date: "7 avril 2026",
    category: "Ressources pédagogiques",
    title: "Un jeu pour découvrir l’utilisation des compétences psychosociales",
    summary: "Un outil conçu dans le cadre d'un partenariat avec la JEC du Liban, pour sensibiliser les jeunes aux différentes situations de crise.",
    url: "https://jecfrance.org/un-jeu-pour-decouvrir-lutilisation-des-competences-psycho-sociales/",
    source: "JEC France",
    sourceUrl: "https://jecfrance.org/"
  },
  {
    date: "7 avril 2026",
    category: "Vie du mouvement",
    title: "Les responsables se rencontrent et se forment !",
    summary: "La JEC France revient sur une rencontre de responsables d'équipes organisée le 21 février à Chevilly-Larue, autour de sujets liés à leur engagement et à leur rôle.",
    url: "https://jecfrance.org/les-responsables-se-rencontrent-et-se-forment/",
    source: "JEC France",
    sourceUrl: "https://jecfrance.org/"
  }
];

const structures = [
  { name: "Équipe nationale", detail: "Coordination et animation au niveau national", icon: "EN", color: "purple" },
  { name: "Fédération de Paris", detail: "Rencontres et débats autour des sujets de société", icon: "PA", color: "blue" },
  { name: "Fédération de Metz", detail: "Rencontres régulières à la Maison diocésaine", icon: "ME", color: "orange" },
  { name: "Fédération de Rouen", detail: "Rencontres, films-débats, actions caritatives et événements culturels", icon: "RO", color: "green" },
  { name: "Fédération de Nancy", detail: "Rencontres, débats et partage autour de l'engagement", icon: "NA", color: "pink" }
];

const sources = [
  { label: "Histoire de la JEC France", url: "https://jecfrance.org/notre-histoire/" },
  { label: "Démarche Voir-Juger-Agir", url: "https://jecfrance.org/notre-demarche/" },
  { label: "Équipes et fédérations", url: "https://jecfrance.org/nos-equipes/" },
  { label: "Orientations de la JEC France", url: "https://jecfrance.org/nos-orientations/" },
  { label: "JECI / IYCS — présentation officielle", url: "https://www.laityfamilylife.va/content/laityfamilylife/fr/associazioni-e-movimenti/repertorio/gioventu-studentesca-cattolica-internazionale-.html" }
];

const nav = [
  { label: "Vue d'ensemble", icon: "▦", group: "ESPACE PUBLIC" },
  { label: "Actualités JEC", icon: "◉" },
  { label: "Découvrir la JEC", icon: "✳" },
  { label: "Structures", icon: "◎" },
  { label: "Agenda public", icon: "▣" },
  { label: "Workspace", icon: "⌘", group: "ESPACE MEMBRE" },
  { label: "Messagerie", icon: "▤" },
  { label: "Réunions", icon: "▣" },
  { label: "Projets", icon: "◫" },
  { label: "Documents", icon: "▱" },
  { label: "Archives JEC", icon: "▤" },
  { label: "JEC AI", icon: "✧" }
];

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a className="source-link" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

function NewsCard({ item }: { item: typeof news[number] }) {
  return (
    <article className="post-card verified-news-card">
      <div className="post-header">
        <div className="avatar violet">JEC</div>
        <div className="post-author">
          <strong>{item.source}</strong>
          <small>Publication publique vérifiée · {item.date}</small>
        </div>
        <span className="verified-pill">Source</span>
      </div>
      <span className="post-tag violet">{item.category}</span>
      <h3 className="verified-news-title">{item.title}</h3>
      <p className="post-text">{item.summary}</p>
      <div className="source-footer">
        <span>Publié sur le site officiel</span>
        <SourceLink href={item.url}>Lire l'article</SourceLink>
      </div>
    </article>
  );
}

export default function Home() {
  const {lang}=useLanguage();
  const en=lang==="en";
  const [active, setActive] = useState("Vue d'ensemble");
  const [liked, setLiked] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const filteredNews = news.filter(item =>
    (item.title + " " + item.summary + " " + item.category).toLowerCase().includes(search.toLowerCase())
  );

  function renderContent() {
    if (active === "Actualités JEC") {
      return (
        <section>
          <div className="section-heading"><div><p className="eyebrow">PUBLICATIONS SOURCÉES</p><h2>Actualités publiées par la JEC France</h2></div><span className="source-count">{filteredNews.length} articles</span></div>
          <p className="section-intro">Les contenus ci-dessous proviennent du site public de la JEC France. Chaque carte conserve sa date de publication et son lien d'origine.</p>
          {filteredNews.map(item => <NewsCard key={item.url} item={item}/>)}
          <p className="source-note">Périmètre : publications officielles accessibles lors de la vérification du 11 novembre 2026. Ce prototype n'agrège pas encore automatiquement le flux du site.</p>
        </section>
      );
    }

    if (active === "Découvrir la JEC") {
      return (
        <section className="widget-card discover-panel">
          <p className="eyebrow">HISTOIRE · MISSION · DÉMARCHE</p>
          <h2>Découvrir la Jeunesse Étudiante Chrétienne</h2>
          <p>La JEC France se présente comme un mouvement de jeunes, par les jeunes et pour les jeunes. Son histoire française remonte à 1929 ; sa démarche éducative s'appuie notamment sur le Voir-Juger-Agir.</p>
          <div className="timeline-row"><b>1929</b><span>Premiers groupes et lancement du mouvement en France, autour notamment de Louis Chaudron et Paul Vignaux.</span></div>
          <div className="timeline-row"><b>1930</b><span>Lancement de <i>L’Appel</i>, organe mensuel de la JEC, selon la page historique de JEC France.</span></div>
          <div className="timeline-row"><b>1946</b><span>Fondation de la coordination internationale JECI / IYCS, après la Seconde Guerre mondiale.</span></div>
          <div className="discover-actions"><Link href="/decouvrir#frise-chronologique" className="primary-button">Explorer la frise chronologique interactive →</Link><SourceLink href="https://jecfrance.org/notre-histoire/">Source historique JEC France</SourceLink></div>
        </section>
      );
    }

    if (active === "Structures") {
      return (
        <section>
          <div className="section-heading"><div><p className="eyebrow">REPÈRES PUBLICS</p><h2>Structures référencées par JEC France</h2></div></div>
          <p className="section-intro">Cette liste reprend les structures citées sur la page publique « Nos équipes ». Elle ne constitue pas un annuaire actualisé des membres ni une validation de l'activité opérationnelle à cette date.</p>
          <div className="structure-grid">
            {structures.map(s => <article className="widget-card structure-card" key={s.name}><div className={"team-icon "+s.color}>{s.icon}</div><h3>{s.name}</h3><p>{s.detail}</p></article>)}
          </div>
          <p className="source-note"><SourceLink href="https://jecfrance.org/nos-equipes/">Consulter la page officielle des équipes</SourceLink></p>
        </section>
      );
    }

    if (active === "Agenda public") {
      return (
        <section>
          <div className="section-heading"><div><p className="eyebrow">RENDEZ-VOUS PUBLICS</p><h2>Agenda et événements à suivre</h2></div></div>
          <article className="event-feature">
            <div className="event-feature-date"><span>29 JUIL.</span><b>—</b><span>08 AOÛT</span><small>2027</small></div>
            <div className="event-feature-body">
              <span className="post-tag blue">ÉVÉNEMENT INTERNATIONAL · SOURCE EXTERNE</span>
              <h3>Journées Mondiales de la Jeunesse — Séoul 2027</h3>
              <p>Le site JMJ 2027 en France annonce le rendez-vous du 29 juillet au 8 août 2027 à Séoul, en Corée du Sud. Les dates précises de départ et de retour peuvent dépendre du groupe organisateur.</p>
              <SourceLink href="https://www.jmj2027.fr/">Consulter le site officiel JMJ 2027 France</SourceLink>
            </div>
          </article>
          <p className="source-note">Aucune réunion interne de la JEC France n'est affichée ici sans annonce publique vérifiable. Les événements internes seront ajoutés par les responsables habilités dans la future version authentifiée.</p>
        </section>
      );
    }

    if (active !== "Vue d'ensemble") {
      return (
        <section className="module-placeholder widget-card">
          <div className="module-icon">✧</div>
          <p className="eyebrow">MODULE EN CONCEPTION</p>
          <h2>{active}</h2>
          <p>Ce module fait partie du périmètre fonctionnel de JEC-conNEcT. Il sera activé progressivement après validation des besoins, des droits d'accès et des règles de gouvernance par la JEC France.</p>
          <div className="prototype-banner">Aucune donnée interne ou confidentielle n'est utilisée dans cette démonstration.</div>
        </section>
      );
    }

    return (
      <>
        <section className="welcome-banner">
          <div className="welcome-copy">
            <p className="eyebrow light">UN MOUVEMENT DE JEUNES, PAR LES JEUNES ET POUR LES JEUNES</p>
            <h1>La JEC, son histoire et son actualité.</h1>
            <p>Un espace pour découvrir le mouvement, retrouver les informations publiques et préparer une communauté mieux connectée.</p>
            <div className="welcome-actions">
              <button className="white-button" onClick={()=>setActive("Découvrir la JEC")}>Découvrir la JEC</button>
              <button className="outline-light" onClick={()=>setActive("Actualités JEC")}>Voir les actualités →</button>
            </div>
          </div>
          <div className="banner-art"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core">JEC<br/><span>✳</span></div><div className="orbit-dot dot-one"/><div className="orbit-dot dot-two"/><div className="orbit-dot dot-three"/></div>
        </section>

        <div className="content-grid">
          <section className="feed-column">
            <div className="section-heading"><div><p className="eyebrow">PUBLICATIONS OFFICIELLES</p><h2>Les dernières actualités repérées</h2></div><button className="text-button" onClick={()=>setActive("Actualités JEC")}>Toutes les actualités ↗</button></div>
            {news.map(item=><NewsCard key={item.url} item={item}/>)}
            <div className="widget-card source-directory">
              <div className="widget-heading"><h3>Sources publiques de référence</h3></div>
              {sources.map(s=><div className="source-directory-row" key={s.url}><span>{s.label}</span><SourceLink href={s.url}>Ouvrir</SourceLink></div>)}
            </div>
          </section>

          <aside className="right-column">
            <section className="widget-card">
              <div className="widget-heading"><h3>Repères vérifiés</h3><button onClick={()=>setActive("Découvrir la JEC")}>Histoire</button></div>
              <div className="fact-item"><b>1929</b><div><strong>Origines de la JEC en France</strong><small>Premiers groupes autour de Louis Chaudron et Paul Vignaux.</small></div></div>
              <div className="fact-item"><b>1930</b><div><strong>Lancement de L’Appel</strong><small>Organe mensuel historique du mouvement.</small></div></div>
              <div className="fact-item"><b>1946</b><div><strong>Coordination internationale</strong><small>Fondation de la JECI / IYCS.</small></div></div>
              <SourceLink href="https://jecfrance.org/notre-histoire/">Histoire JEC France</SourceLink>
            </section>

            <section className="widget-card">
              <div className="widget-heading"><h3>Événement à suivre</h3><button onClick={()=>setActive("Agenda public")}>Agenda</button></div>
              <div className="event-item"><div className="event-date"><b>2027</b><span>JUIL.–AOÛT</span></div><div><strong>JMJ Séoul 2027</strong><small>29 juillet – 8 août · Corée du Sud</small><SourceLink href="https://www.jmj2027.fr/">Site officiel</SourceLink></div></div>
              <p className="source-note">Événement public externe — aucune participation de la JEC France n'est présumée.</p>
            </section>

            <section className="widget-card">
              <div className="widget-heading"><h3>Structures référencées</h3><button onClick={()=>setActive("Structures")}>Explorer</button></div>
              {structures.slice(0,4).map(s=><div className="team-item" key={s.name}><div className={"team-icon "+s.color}>{s.icon}</div><div><strong>{s.name}</strong><small>Référencée sur le site public JEC France</small></div></div>)}
              <SourceLink href="https://jecfrance.org/nos-equipes/">Source : JEC France</SourceLink>
            </section>

            <section className="ai-card"><div className="ai-spark">✧</div><p className="eyebrow">JEC CONNECT</p><h3>Un espace à construire ensemble</h3><p>La future plateforme réunira actualités, coordination, réunions, documents et mémoire institutionnelle.</p><button onClick={()=>setActive("Workspace")}>Découvrir les modules <span>→</span></button></section>
            <p className="prototype-note">Prototype de présentation · Informations publiques sourcées<br/>Les espaces privés ne sont pas encore opérationnels.</p>
          </aside>
        </div>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-lockup side-brand"><div className="brand-mark"><span>JEC</span><i>✳</i></div><span>conNEcT</span></Link>
        <div className="workspace-switch"><div className="workspace-avatar">J</div><div><strong>JEC France</strong><small>Portail public</small></div><span className="chevron">⌄</span></div>
        <nav className="main-nav">
          {nav.map((item) => <div key={item.label}>
            {item.group && <p className="nav-group">{item.group}</p>}
            <button onClick={()=>setActive(item.label)} className={active===item.label?"nav-item active":"nav-item"}>
              <span className={item.label==="JEC AI"?"nav-icon sparkle":"nav-icon"}>{item.icon}</span><span>{item.label}</span>
            </button>
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon">✧</div><strong>Sources vérifiables</strong><p>Les faits publics affichés renvoient à leurs publications d'origine.</p><button onClick={()=>setActive("Actualités JEC")}>Voir les sources →</button></div>
          <div className="profile-mini"><div className="avatar user">VP</div><div><strong>Visiteur</strong><small>Aperçu public · non connecté</small></div><span>•••</span></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">JEC France <span>/</span> <strong>{active}</strong></div>
          <div className="top-actions">
            <label className="search-box"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher dans les sources publiques"/><kbd>⌘ K</kbd></label>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={()=>setNotifOpen(!notifOpen)}>♧</button>
            <Link className="top-login" href="/login">Connexion</Link>
          </div>
        </header>
        {notifOpen && <div className="notification-popover"><strong>Notifications</strong><p>Les notifications personnelles seront disponibles après activation de l'espace membre.</p><p className="muted">Aucune notification individuelle n'est simulée sur cette page publique.</p></div>}
        <div className="page-content">{renderContent()}</div>
      </main>
    </div>
  );
}
