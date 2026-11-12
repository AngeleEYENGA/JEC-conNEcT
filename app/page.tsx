"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const news = [
  {
    date: "13 avril 2026",
    image: "/images/news-wellbeing.svg",
    category: "Santé et mieux-vivre",
    categoryEn: "Health & well-being",
    title: "3 vidéos pour un mieux-être et un mieux-vivre ensemble !",
    titleEn: "Three videos for well-being and living better together",
    summary: "La JEC France présente trois vidéos consacrées à la santé mentale et aux compétences psychosociales, issues d'un travail mené au sein du mouvement.",
    summaryEn: "JEC France presents three videos about mental health and psychosocial skills, produced as part of the movement’s work.",
    url: "https://jecfrance.org/3-videos-pour-un-mieux-etre-et-un-mieux-vivre-ensemble/"
  },
  {
    date: "7 avril 2026",
    image: "/images/news-learning.svg",
    category: "Ressources pédagogiques",
    categoryEn: "Learning resources",
    title: "Un jeu pour découvrir l’utilisation des compétences psychosociales",
    titleEn: "A game to discover psychosocial skills",
    summary: "Un outil conçu dans le cadre d'un partenariat avec la JEC du Liban, pour sensibiliser les jeunes aux différentes situations de crise.",
    summaryEn: "A tool developed with JEC Lebanon to help young people understand and respond to different crisis situations.",
    url: "https://jecfrance.org/un-jeu-pour-decouvrir-lutilisation-des-competences-psycho-sociales/"
  },
  {
    date: "7 avril 2026",
    image: "/images/news-leaders.svg",
    category: "Vie du mouvement",
    categoryEn: "Movement life",
    title: "Les responsables se rencontrent et se forment !",
    titleEn: "JEC leaders meet and learn together",
    summary: "La JEC France revient sur une rencontre de responsables d'équipes organisée le 21 février à Chevilly-Larue, autour de sujets liés à leur engagement et à leur rôle.",
    summaryEn: "JEC France reports on a team leaders’ gathering held on 21 February in Chevilly-Larue, focusing on their commitment and responsibilities.",
    url: "https://jecfrance.org/les-responsables-se-rencontrent-et-se-forment/"
  }
];

const structures = [
  {name:"Équipe nationale",nameEn:"National team",detail:"Coordination et animation au niveau national",detailEn:"National coordination and animation",icon:"EN",color:"purple"},
  {name:"Fédération de Paris",nameEn:"Paris federation",detail:"Rencontres et débats autour des sujets de société",detailEn:"Meetings and discussions on social issues",icon:"PA",color:"blue"},
  {name:"Fédération de Metz",nameEn:"Metz federation",detail:"Rencontres régulières à la Maison diocésaine",detailEn:"Regular meetings at the diocesan centre",icon:"ME",color:"orange"},
  {name:"Fédération de Rouen",nameEn:"Rouen federation",detail:"Rencontres, films-débats, actions caritatives et événements culturels",detailEn:"Meetings, film discussions, charitable actions and cultural events",icon:"RO",color:"green"},
  {name:"Fédération de Nancy",nameEn:"Nancy federation",detail:"Rencontres, débats et partage autour de l'engagement",detailEn:"Meetings, discussions and sharing around commitment",icon:"NA",color:"pink"}
];

const nav = [
  ["Vue d'ensemble","Overview","▦","ESPACE PUBLIC"],
  ["Actualités JEC","JEC News","◉",""],
  ["Découvrir la JEC","Discover JEC","✳",""],
  ["Structures","Structures","◎",""],
  ["Annuaire JEC","JEC directory","♙",""],
  ["Agenda public","Public calendar","▣",""],
  ["Workspace","Workspace","⌘","COLLABORATION"],
  ["Messagerie","Messages","▤",""],
  ["Réunions","Meetings","▣",""],
  ["Projets","Projects","◫",""],
  ["Documents","Documents","▱",""],
  ["Archives JEC","JEC Archives","▤","PATRIMOINE"],
  ["Chants & hymnes","Songs & anthems","♫",""],
  ["JEC AI","JEC AI","✧",""]
];

function SourceLink({href,children}:{href:string;children:React.ReactNode}) {
  return <a className="source-link" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

export default function Home() {
  const {lang}=useLanguage();
  const en=lang==="en";
  const t=(fr:string,english:string)=>en?english:fr;
  const [active,setActive]=useState("Vue d'ensemble");
  const [search,setSearch]=useState("");
  const [notificationsOpen,setNotificationsOpen]=useState(false);

  const [identity,setIdentity]=useState<{
    id:string; email:string; displayName:string; avatarUrl:string|null;
    membershipStatus:"pending"|"verified"|"rejected"; isAdmin:boolean;
  }|null>(null);

  useEffect(()=>{
    const supabase=getSupabaseBrowserClient();
    if(!supabase) return;
    let mounted=true;
    const loadIdentity=async(user:{id:string;email?:string;user_metadata?:Record<string,unknown>})=>{
      const [profileResult,membershipResult,adminResult]=await Promise.all([
        supabase.from("jec_profiles").select("first_name,last_name,display_name,avatar_url").eq("user_id",user.id).maybeSingle(),
        supabase.from("jec_memberships").select("membership_status").eq("user_id",user.id).maybeSingle(),
        supabase.rpc("is_jec_admin")
      ]);
      if(!mounted) return;
      const p=profileResult.data;
      const meta=user.user_metadata??{};
      const fallback=typeof meta.full_name==="string"?meta.full_name:typeof meta.name==="string"?meta.name:"";
      const display=typeof p?.display_name==="string"&&p.display_name.trim()?p.display_name:(fallback||user.email||"Compte JEC");
      setIdentity({
        id:user.id,
        email:user.email??"",
        displayName:display,
        avatarUrl:typeof p?.avatar_url==="string"?p.avatar_url:(typeof meta.avatar_url==="string"?meta.avatar_url:null),
        membershipStatus:membershipResult.data?.membership_status==="verified"?"verified":membershipResult.data?.membership_status==="rejected"?"rejected":"pending",
        isAdmin:adminResult.data===true
      });
    };
    void supabase.auth.getUser().then(({data})=>{
      if(data.user) void loadIdentity(data.user);
      else if(mounted) setIdentity(null);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
      if(!session?.user){setIdentity(null);return;}
      const user=session.user;
      Promise.resolve().then(()=>loadIdentity(user));
    });
    return ()=>{mounted=false;subscription.unsubscribe();};
  },[]);

  async function signOut(){
    const supabase=getSupabaseBrowserClient();
    if(!supabase) return;
    const {error}=await supabase.auth.signOut({scope:"local"});
    if(error){window.alert(en?"Unable to sign out: "+error.message:"Impossible de se déconnecter : "+error.message);return;}
    setIdentity(null);
    window.location.href="/";
  }


  const filteredNews=useMemo(()=>news.filter(item=>
    (item.title+" "+item.titleEn+" "+item.summary+" "+item.summaryEn+" "+item.category).toLowerCase().includes(search.toLowerCase())
  ),[search]);

  function NewsCard({item}:{item:typeof news[number]}) {
    return <article className="post-card verified-news-card">
      <div className="post-header">
        <div className="avatar violet">JEC</div>
        <div className="post-author"><strong>JEC France</strong><small>{t("Publication publique vérifiée","Verified public publication")} · {item.date}</small></div>
        <span className="verified-pill">{t("Source","Source")}</span>
      </div>
      <span className="post-tag violet">{en?item.categoryEn:item.category}</span>
      <h3 className="verified-news-title">{en?item.titleEn:item.title}</h3>
      <p className="post-text">{en?item.summaryEn:item.summary}</p>
      <div className="source-footer"><span>{t("Publié sur le site officiel","Published on the official website")}</span><SourceLink href={item.url}>{t("Lire l'article","Read article")}</SourceLink></div>
    </article>;
  }

  function renderContent() {
    if(active==="Chants & hymnes") return <section className="songs-preview-card">
      <div className="songs-preview-art"><span>♫</span><i>♪</i><b>JEC</b></div>
      <div className="songs-preview-copy"><p className="eyebrow">{t("PATRIMOINE MUSICAL","MUSICAL HERITAGE")}</p><h2>{t("Les chants et hymnes du mouvement","Songs and anthems of the movement")}</h2><p>{t("Retrouve le chant de ralliement et l’hymne JEC en français et en anglais. Consulte les paroles, ajoute les couplets validés et écoute les enregistrements lorsqu’ils sont disponibles.","Find the rallying song and the JEC anthem in French and English. Explore the lyrics, add approved verses and listen to recordings when available.")}</p><Link href="/chants" className="primary-button">{t("Ouvrir la bibliothèque musicale →","Open the music library →")}</Link></div>
    </section>;

    if(active==="Actualités JEC") return <section>
      <div className="section-heading"><div><p className="eyebrow">{t("PUBLICATIONS SOURCÉES","SOURCED PUBLICATIONS")}</p><h2>{t("Actualités publiées par la JEC France","News published by JEC France")}</h2></div><span className="source-count">{filteredNews.length} {t("articles","articles")}</span></div>
      <p className="section-intro">{t("Ces contenus proviennent du site public de la JEC France. Chaque carte conserve sa date de publication et son lien d'origine.","These items come from JEC France’s public website. Each card keeps its publication date and original source link.")}</p>
      {filteredNews.map(item=><NewsCard key={item.url} item={item}/>)}
      <p className="source-note">{t("Vérification initiale : 11 novembre 2026. L'agrégation automatique des flux n'est pas encore activée.","Initial verification: 11 November 2026. Automatic feed aggregation is not yet enabled.")}</p>
    </section>;

    if(active==="Découvrir la JEC") return <section className="discover-preview">
      <div className="discover-preview-art"><img src="/images/jec-community-illustration.svg" alt={t("Illustration de jeunes qui échangent et apprennent ensemble","Illustration of young people learning and sharing together")}/></div>
      <div className="discover-preview-copy"><p className="eyebrow">{t("HISTOIRE · MISSION · DÉMARCHE","HISTORY · MISSION · APPROACH")}</p><h2>{t("Découvrir la Jeunesse Étudiante Chrétienne","Discover the Young Christian Students")}</h2><p>{t("Des premiers groupes en France en 1929 à la coordination internationale, explore les repères historiques, la pédagogie Voir-Juger-Agir et les piliers du mouvement.","From the first groups in France in 1929 to the international coordination, explore the timeline, the See-Judge-Act approach and the movement’s pillars.")}</p><Link href="/decouvrir#frise-chronologique" className="primary-button">{t("Explorer la frise chronologique →","Explore the interactive timeline →")}</Link></div>
    </section>;


    if(active==="Annuaire JEC") return <section>
      <div className="section-heading"><div><p className="eyebrow">{t("ORGANISATION ET CONTACTS","ORGANIZATION & CONTACTS")}</p><h2>{t("Annuaire et organigramme de la JEC","JEC directory and organization chart")}</h2></div></div>
      <p className="section-intro">{t("Retrouve les fonctions institutionnelles, les structures et les membres qui ont choisi d'apparaître dans l'annuaire. Les noms et responsabilités officiels seront publiés après validation par la JEC.","Find institutional roles, structures and members who have chosen to appear in the directory. Official names and responsibilities will be published after JEC validation.")}</p>
      <div className="directory-callout"><strong>{t("Tu cherches le bon interlocuteur ?","Looking for the right contact?")}</strong><p>{t("L'annuaire indiquera les responsables et leurs domaines de compétence, avec les coordonnées fonctionnelles validées.","The directory will list leaders and areas of responsibility, with validated functional contact details.")}</p><Link href="/annuaire" className="primary-button">{t("Ouvrir l'annuaire complet →","Open the full directory →")}</Link></div>
      <div className="directory-empty-grid">
        {[
          [t("Bureau national","National board"),t("Présidence, secrétariat, trésorerie et autres responsabilités nationales.","Presidency, secretariat, treasury and other national responsibilities.")],
          [t("Équipe nationale","National team"),t("Coordination et animation du mouvement au niveau national.","National coordination and movement leadership.")],
          [t("Fédérations et équipes locales","Federations and local teams"),t("Repérer les structures territoriales et leurs contacts validés.","Find local structures and their validated contacts.")],
          [t("Commissions et services","Commissions and services"),t("Identifier le service compétent selon ta demande.","Find the right service for your request.")]
        ].map(([name,description])=><article className="widget-card directory-placeholder" key={name}><span>✧</span><h3>{name}</h3><p>{description}</p><small>{t("Informations officielles à compléter","Official information to be completed")}</small></article>)}
      </div>
      <p className="source-note">{t("Aucun nom ni mandat n'est inventé. Les fonctions et personnes seront ajoutées après validation par les responsables nationaux.","No names or mandates are invented. Roles and people will be added after validation by national leaders.")}</p>
    </section>;

    if(active==="Structures") return <section>
      <div className="section-heading"><div><p className="eyebrow">{t("REPÈRES PUBLICS","PUBLIC INFORMATION")}</p><h2>{t("Structures référencées par JEC France","Structures listed by JEC France")}</h2></div></div>
      <p className="section-intro">{t("Cette sélection reprend les structures citées sur la page publique « Nos équipes ». Elle ne constitue pas un annuaire actualisé des membres.","This selection reflects structures listed on the public “Our teams” page. It is not an up-to-date member directory.")}</p>
      <div className="structure-grid">{structures.map(item=><article className="widget-card structure-card" key={item.name}><div className={"team-icon "+item.color}>{item.icon}</div><h3>{en?item.nameEn:item.name}</h3><p>{en?item.detailEn:item.detail}</p></article>)}</div>
      <p className="source-note"><SourceLink href="https://jecfrance.org/nos-equipes/">{t("Consulter la page officielle des équipes","View the official teams page")}</SourceLink></p>
    </section>;

    if(active==="Agenda public") return <section>
      <div className="section-heading"><div><p className="eyebrow">{t("RENDEZ-VOUS PUBLICS","PUBLIC EVENTS")}</p><h2>{t("Agenda et événements à suivre","Upcoming events and dates")}</h2></div></div>
      <article className="event-feature"><div className="event-feature-date"><span>29 JUL.</span><b>—</b><span>08 AUG.</span><small>2027</small></div><div className="event-feature-body"><span className="post-tag blue">{t("ÉVÉNEMENT INTERNATIONAL · SOURCE EXTERNE","INTERNATIONAL EVENT · EXTERNAL SOURCE")}</span><h3>{t("Journées Mondiales de la Jeunesse — Séoul 2027","World Youth Day — Seoul 2027")}</h3><p>{t("Le site JMJ 2027 en France annonce le rendez-vous du 29 juillet au 8 août 2027 à Séoul, en Corée du Sud. Aucune participation de la JEC France n'est présumée.","The French WYD 2027 website lists the event from 29 July to 8 August 2027 in Seoul, South Korea. No participation by JEC France is implied.")}</p><SourceLink href="https://www.jmj2027.fr/">{t("Site officiel JMJ 2027 France","Official WYD 2027 France website")}</SourceLink></div></article>
    </section>;

    return <section className="module-placeholder widget-card"><div className="module-icon">✧</div><p className="eyebrow">{t("MODULE EN CONCEPTION","MODULE IN DEVELOPMENT")}</p><h2>{nav.find(item=>item[0]===active)?.[en?1:0]??active}</h2><p>{t("Ce module fait partie du périmètre de JEC-conNEcT. Il sera activé progressivement après validation des besoins, des droits d'accès et des règles de gouvernance par la JEC France.","This module is part of JEC-conNEcT. It will be activated progressively after JEC France validates requirements, access rights and governance rules.")}</p><div className="prototype-banner">{t("Aucune donnée interne ou confidentielle n'est utilisée dans cette démonstration.","No internal or confidential information is used in this demonstration.")}</div></section>;
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand-lockup side-brand"><div className="brand-mark"><span>JEC</span><i>✳</i></div><span>conNEcT</span></Link>
      <div className="workspace-switch"><div className="workspace-avatar">J</div><div><strong>JEC France</strong><small>{t("Portail public","Public portal")}</small></div><span className="chevron">⌄</span></div>
      <nav className="main-nav">{nav.map(([fr,english,icon,group])=><div key={fr}>{group&&<p className="nav-group">{t(group==="ESPACE PUBLIC"?"ESPACE PUBLIC":group==="COLLABORATION"?"COLLABORATION":"PATRIMOINE",group==="ESPACE PUBLIC"?"PUBLIC SPACE":group==="COLLABORATION"?"COLLABORATION":"HERITAGE")}</p>}<button onClick={()=>setActive(fr)} className={active===fr?"nav-item active":"nav-item"}><span className={fr==="JEC AI"?"nav-icon sparkle":"nav-icon"}>{icon}</span><span>{en?english:fr}</span></button></div>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✧</div><strong>{t("Sources vérifiables","Verifiable sources")}</strong><p>{t("Les faits publics renvoient à leurs publications d'origine.","Public facts link to their original publications.")}</p><button onClick={()=>setActive("Actualités JEC")}>{t("Voir les sources →","Browse sources →")}</button></div>{identity?<div className="profile-mini profile-mini-auth"><Link href="/compte" className="profile-avatar-link"><div className="avatar user">{identity.avatarUrl?<img src={identity.avatarUrl} alt=""/>:identity.displayName.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}</div></Link><Link href="/compte" className="profile-identity"><strong>{identity.displayName}</strong><small>{identity.isAdmin?t("Administrateur JEC-conNEcT","JEC-conNEcT administrator"):identity.membershipStatus==="verified"?t("Membre JEC vérifié","Verified JEC member"):identity.membershipStatus==="rejected"?t("Adhésion non validée","Membership not approved"):t("Compte connecté · adhésion à confirmer","Signed in · membership pending")}</small></Link><button className="profile-signout" onClick={signOut} title={t("Se déconnecter","Sign out")} aria-label={t("Se déconnecter","Sign out")}>↪</button></div>:<div className="profile-mini"><div className="avatar user">VP</div><div><strong>{t("Visiteur","Visitor")}</strong><small>{t("Aperçu public · non connecté","Public preview · signed out")}</small></div><Link className="profile-signin" href="/login">{t("Connexion","Sign in")}</Link></div>}</div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">JEC France <span>/</span> <strong>{en?(nav.find(item=>item[0]===active)?.[1]??active):active}</strong></div><div className="top-actions"><label className="search-box"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Rechercher dans les sources publiques","Search public sources")}/><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label={t("Notifications","Notifications")} onClick={()=>setNotificationsOpen(!notificationsOpen)}>♧</button><PWAInstallButton/><LanguageSwitcher/><Link className="top-login" href={identity?"/compte":"/login"}>{identity?t("Mon compte","My account"):t("Connexion","Sign in")}</Link></div></header>
      {notificationsOpen&&<div className="notification-popover"><strong>{t("Notifications","Notifications")}</strong><p>{t("Les notifications personnelles seront disponibles après activation de l'espace membre.","Personal notifications will be available when the member area is enabled.")}</p><p className="muted">{t("Aucune notification individuelle n'est simulée sur cette page publique.","No personal notifications are simulated on this public page.")}</p></div>}
      <div className="page-content">
        {active==="Vue d'ensemble"?<>
          <section className="welcome-banner"><div className="welcome-copy"><p className="eyebrow light">{t("UN MOUVEMENT DE JEUNES, PAR LES JEUNES ET POUR LES JEUNES","A MOVEMENT OF YOUNG PEOPLE, BY YOUNG PEOPLE, FOR YOUNG PEOPLE")}</p><h1>{t("La JEC, son histoire et son actualité.","JEC: its story and its news.")}</h1><p>{t("Un espace pour découvrir le mouvement, retrouver les informations publiques et préparer une communauté mieux connectée.","Discover the movement, explore verified public information and build a more connected community.")}</p><div className="welcome-actions"><button className="white-button" onClick={()=>setActive("Découvrir la JEC")}>{t("Découvrir la JEC","Discover JEC")}</button><button className="outline-light" onClick={()=>setActive("Actualités JEC")}>{t("Voir les actualités →","Explore news →")}</button></div></div><div className="banner-art"><img className="home-community-image" src="/images/jec-community-illustration.svg" alt={t("Des jeunes échangent, apprennent et font de la musique ensemble","Young people learn, share ideas and make music together")}/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit-core">JEC<br/><span>✳</span></div><div className="orbit-dot dot-one"/><div className="orbit-dot dot-two"/><div className="orbit-dot dot-three"/></div></section>
          <div className="content-grid"><section className="feed-column"><div className="section-heading"><div><p className="eyebrow">{t("PUBLICATIONS OFFICIELLES","OFFICIAL PUBLICATIONS")}</p><h2>{t("Les dernières actualités repérées","Latest verified news")}</h2></div><button className="text-button" onClick={()=>setActive("Actualités JEC")}>{t("Toutes les actualités ↗","All news ↗")}</button></div>{filteredNews.slice(0,3).map(item=><NewsCard key={item.url} item={item}/>)}</section>
          <aside className="right-column"><section className="widget-card"><div className="widget-heading"><h3>{t("Repères historiques","Historical milestones")}</h3><button onClick={()=>setActive("Découvrir la JEC")}>{t("Explorer","Explore")}</button></div><div className="fact-item"><b>1929</b><div><strong>{t("Origines de la JEC en France","Origins of JEC in France")}</strong><small>{t("Premiers groupes autour de Louis Chaudron et Paul Vignaux.","First groups around Louis Chaudron and Paul Vignaux.")}</small></div></div><div className="fact-item"><b>1946</b><div><strong>{t("Coordination internationale","International coordination")}</strong><small>{t("Fondation de la JECI / IYCS.","Foundation of JECI / IYCS.")}</small></div></div><Link className="widget-link" href="/decouvrir#frise-chronologique">{t("Voir la frise chronologique →","Explore the timeline →")}</Link></section>
          <section className="widget-card"><div className="widget-heading"><h3>{t("Événement à suivre","Event to follow")}</h3><button onClick={()=>setActive("Agenda public")}>{t("Agenda","Calendar")}</button></div><div className="event-item"><div className="event-date"><b>2027</b><span>JUL–AUG</span></div><div><strong>{t("JMJ Séoul 2027","WYD Seoul 2027")}</strong><small>29 juillet – 8 août · Corée du Sud</small><SourceLink href="https://www.jmj2027.fr/">{t("Site officiel","Official website")}</SourceLink></div></div></section>
          <section className="ai-card"><div className="ai-spark">✧</div><p className="eyebrow">JEC CONNECT</p><h3>{t("Un espace à construire ensemble","A space to build together")}</h3><p>{t("La future plateforme réunira actualités, coordination, réunions, documents et mémoire institutionnelle.","The platform will bring together news, coordination, meetings, documents and institutional memory.")}</p><button onClick={()=>setActive("Workspace")}>{t("Découvrir les modules →","Explore modules →")}</button></section><p className="prototype-note">{t("Prototype de présentation · Contenus publics sourcés","Presentation prototype · Public sourced content")}<br/>{t("Les espaces privés ne sont pas encore opérationnels.","Private areas are not yet active.")}</p></aside></div>
        </>:renderContent()}
      </div>
    </main>
  </div>;
}
