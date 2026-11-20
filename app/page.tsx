"use client";

import Link from "next/link";
import JecAiAssistant from "@/components/jec-ai-assistant";
import { useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { PWAInstallButton } from "@/components/pwa-install-button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { jecPhotos } from "@/lib/image-library";

const news = [
  {
    date: "13 avril 2026",
    image: jecPhotos.peerStudy.src,
    category: "Santé et mieux-vivre",
    categoryEn: "Health & well-being",
    title: "3 vidéos pour un mieux-être et un mieux-vivre ensemble !",
    titleEn: "Three videos for well-being and living better together",
    summary: "La JEC France présente trois vidéos consacrées à la santé mentale et aux compétences psychosociales, issues d'un travail mené au sein du mouvement.",
    summaryEn: "JEC France presents three videos about mental health and psychosocial skills, produced as part of the movement’s work.",
    url: "https://jecfrance.org/3-videos-pour-un-mieux-etre-et-un-mieux-vivre-ensemble/",
    publisher: "JEC France", sourceKind: "article", sourceLabel: "Publication officielle JEC France", detailPath: null
  },
  {
    date: "7 avril 2026",
    image: jecPhotos.africanClassroom.src,
    category: "Ressources pédagogiques",
    categoryEn: "Learning resources",
    title: "Un jeu pour découvrir l’utilisation des compétences psychosociales",
    titleEn: "A game to discover psychosocial skills",
    summary: "Un outil conçu dans le cadre d'un partenariat avec la JEC du Liban, pour sensibiliser les jeunes aux différentes situations de crise.",
    summaryEn: "A tool developed with JEC Lebanon to help young people understand and respond to different crisis situations.",
    url: "https://jecfrance.org/un-jeu-pour-decouvrir-lutilisation-des-competences-psycho-sociales/",
    publisher: "JEC France", sourceKind: "article", sourceLabel: "Publication officielle JEC France", detailPath: null
  },
  {
    date: "7 avril 2026",
    image: jecPhotos.studentTeam.src,
    category: "Vie du mouvement",
    categoryEn: "Movement life",
    title: "Les responsables se rencontrent et se forment !",
    titleEn: "JEC leaders meet and learn together",
    summary: "La JEC France revient sur une rencontre de responsables d'équipes organisée le 21 février à Chevilly-Larue, autour de sujets liés à leur engagement et à leur rôle.",
    summaryEn: "JEC France reports on a team leaders’ gathering held on 21 February in Chevilly-Larue, focusing on their commitment and responsibilities.",
    url: "https://jecfrance.org/les-responsables-se-rencontrent-et-se-forment/",
    publisher: "JEC France", sourceKind: "article", sourceLabel: "Publication officielle JEC France", detailPath: null
  },
  {
    date: "26 juillet – 2 août 2026",
    image: jecPhotos.community.src,
    category: "Vie du mouvement · Cameroun",
    categoryEn: "Movement life · Cameroon",
    title: "Camp National Universitaire de Garoua 2026 : spiritualité active et citoyenneté responsable",
    titleEn: "Garoua 2026 National University Camp: active spirituality and responsible citizenship",
    summary: "Le livret du camp présente huit journées de formation, de prière, de débats, de compétitions et d’activités culturelles au Centre Jeunesse Lumière de Ngalbidjie. Le thème reliait spiritualité active, citoyenneté responsable, numérique et développement durable au Cameroun.",
    summaryEn: "The camp booklet documents eight days of formation, prayer, discussions, competitions and cultural activities at the Centre Jeunesse Lumière de Ngalbidjie. Its theme connected active spirituality, responsible citizenship, digital technology and sustainable development in Cameroon.",
    url: null,
    publisher: "JEC Cameroun — Bureau national",
    sourceKind: "booklet",
    sourceLabel: "Source : livret du campiste transmis par la JEC du Cameroun",
    detailPath: "/actualites/camp-garoua-2026"
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
  ["Spiritualité","Spirituality","✧",""],
  ["Workspace","Workspace","⌘","COLLABORATION"],
  ["Messagerie","Messages","▤",""],
  ["Communauté","Community","◎",""],
  ["Réunions","Meetings","▣",""],
  ["Décisions & votes","Decisions & votes","◉",""],
  ["Projets","Projects","◫",""],
  ["Documents","Documents","▱",""],
  ["Partenaires","Partners","◎","COLLABORATION"],
  ["Archives JEC","JEC Archives","▤","PATRIMOINE"],
  ["Chants & hymnes","Songs & anthems","♫",""],
  ["JEC AI","JEC AI","✧",""]
];

const privateNavItems = new Set([
  "Workspace",
  "Messagerie",
  "Communauté",
  "Réunions",
  "Décisions & votes",
  "Projets",
  "Documents",
  "Partenaires"
]);

function SourceLink({href,children}:{href:string;children:React.ReactNode}) {
  return <a className="source-link" href={href} target="_blank" rel="noreferrer">{children} ↗</a>;
}

type PublicContentRecord = {
  id: string; content_type: "news" | "event";
  title: string; title_en: string | null; summary: string; summary_en: string | null;
  category: string | null; category_en: string | null;
  content_date: string; date_label: string | null; date_label_en: string | null;
  starts_on: string | null; ends_on: string | null;
  source_name: string; source_label: string; source_label_en: string | null;
  source_kind: string; source_url: string | null; image_url: string | null; detail_path: string | null;
};
type NewsItem = {
  date: string;
  image: string;
  category: string;
  categoryEn: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  url: string | null;
  publisher: string;
  sourceKind: string;
  sourceLabel: string;
  detailPath: string | null;
};
function formatPublicDate(value: string, en: boolean) {
  return new Date(value + "T12:00:00").toLocaleDateString(en ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function formatAgendaDate(value: string, en: boolean) {
  return new Date(value + "T12:00:00").toLocaleDateString(en ? "en-GB" : "fr-FR", { day: "2-digit", month: "short" }).toUpperCase();
}

export default function Home() {
  const {lang}=useLanguage();
  const en=lang==="en";
  const t=(fr:string,english:string)=>en?english:fr;
  const heroSlides=[
    {
      eyebrow:t("LA JEC EN MOUVEMENT","YCS IN MOTION"),
      title:t("Grandir ensemble. Agir pour transformer le monde.","Grow together. Act to transform the world."),
      description:t("Un mouvement de jeunes qui apprennent à lire leur réalité, à dialoguer et à construire des réponses collectives.","A youth movement learning to understand its reality, share ideas and build collective responses."),
      image:jecPhotos.community.src,
      photoUrl:jecPhotos.community.sourceUrl,
      photoCredit:en?jecPhotos.community.captionEn:jecPhotos.community.captionFr,
      imageAlt:t("Des jeunes échangent autour d’un ordinateur et de documents","Young people sharing ideas around a laptop and documents"),
      action:t("Découvrir la JEC","Discover YCS")
    },
    {
      eyebrow:t("PRENDRE SOIN DE SOI ET DES AUTRES","CARE FOR OURSELVES AND OTHERS"),
      title:news[0].title,
      description:news[0].summary,
      image:jecPhotos.peerStudy.src,
      photoUrl:jecPhotos.peerStudy.sourceUrl,
      photoCredit:en?jecPhotos.peerStudy.captionEn:jecPhotos.peerStudy.captionFr,
      imageAlt:t("Deux étudiantes travaillent ensemble sur le campus","Two students working together on campus"),
      action:t("Lire les actualités","Explore the news")
    },
    {
      eyebrow:t("APPRENDRE ET PARTAGER","LEARN AND SHARE"),
      title:news[1].title,
      description:news[1].summary,
      image:jecPhotos.library.src,
      photoUrl:jecPhotos.library.sourceUrl,
      photoCredit:en?jecPhotos.library.captionEn:jecPhotos.library.captionFr,
      imageAlt:t("Un groupe d’étudiants échange dans une bibliothèque universitaire","A group of students sharing ideas in a university library"),
      action:t("Explorer les ressources","Explore resources")
    },
    {
      eyebrow:t("S’ENGAGER ET SE FORMER","LEAD AND LEARN"),
      title:news[2].title,
      description:news[2].summary,
      image:jecPhotos.studentTeam.src,
      photoUrl:jecPhotos.studentTeam.sourceUrl,
      photoCredit:en?jecPhotos.studentTeam.captionEn:jecPhotos.studentTeam.captionFr,
      imageAlt:t("Des étudiants de différentes origines collaborent sur des ordinateurs","Students from different backgrounds collaborating on laptops"),
      action:t("Voir les actualités","View the news")
    }
  ];
  const [active,setActive]=useState("Vue d'ensemble");
  const [search,setSearch]=useState("");
  const [publicContent,setPublicContent]=useState<PublicContentRecord[]|null>(null);
  const [heroIndex,setHeroIndex]=useState(0);
  const [heroPaused,setHeroPaused]=useState(false);

  useEffect(()=>{
    if(heroPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer=window.setInterval(()=>setHeroIndex(current=>(current+1)%heroSlides.length),6500);
    return ()=>window.clearInterval(timer);
  },[heroPaused]);

  useEffect(()=>{
    const supabase=getSupabaseBrowserClient();
    if(!supabase)return;
    let active=true;
    void (async()=>{
      const {data,error}=await supabase.from("jec_public_content")
        .select("id,content_type,title,title_en,summary,summary_en,category,category_en,content_date,date_label,date_label_en,starts_on,ends_on,source_name,source_label,source_label_en,source_kind,source_url,image_url,detail_path")
        .eq("is_published",true)
        .order("content_date",{ascending:false});
      if(!active||error||!data)return;
      setPublicContent(data as PublicContentRecord[]);
    })();
    return ()=>{active=false;};
  },[]);

  const [identity,setIdentity]=useState<{
    id:string; email:string; displayName:string; avatarUrl:string|null;
    membershipStatus:"pending"|"verified"|"rejected"; isAdmin:boolean;
  }|null>(null);
  const [authResolved,setAuthResolved]=useState(false);

  useEffect(()=>{
    const supabase=getSupabaseBrowserClient();
    if(!supabase){setIdentity(null);setAuthResolved(true);return;}

    let mounted=true;
    let currentUser:{id:string;email?:string;user_metadata?:Record<string,unknown>}|null=null;
    let membershipChannel:ReturnType<typeof supabase.channel>|null=null;
    let authEventVersion=0;
    let identityRequestVersion=0;

    const loadIdentity=async(user:{id:string;email?:string;user_metadata?:Record<string,unknown>})=>{
      const requestVersion=++identityRequestVersion;
      try{
        const [profileResult,membershipResult,adminResult]=await Promise.all([
          supabase.from("jec_profiles").select("first_name,last_name,display_name,avatar_url").eq("user_id",user.id).maybeSingle(),
          supabase.from("jec_memberships").select("membership_status").eq("user_id",user.id).maybeSingle(),
          supabase.rpc("is_jec_admin")
        ]);
        if(!mounted||currentUser?.id!==user.id||requestVersion!==identityRequestVersion)return;

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
          isAdmin:adminResult.data===true&&!adminResult.error
        });
        setAuthResolved(true);
      }catch{
        if(!mounted||currentUser?.id!==user.id||requestVersion!==identityRequestVersion)return;
        const meta=user.user_metadata??{};
        const fallback=typeof meta.full_name==="string"?meta.full_name:typeof meta.name==="string"?meta.name:"";
        setIdentity({
          id:user.id,
          email:user.email??"",
          displayName:fallback||user.email||"Compte JEC",
          avatarUrl:typeof meta.avatar_url==="string"?meta.avatar_url:null,
          membershipStatus:"pending",
          isAdmin:false
        });
        setAuthResolved(true);
      }
    };

    const watchMembership=(user:{id:string;email?:string;user_metadata?:Record<string,unknown>})=>{
      if(membershipChannel) void supabase.removeChannel(membershipChannel);
      membershipChannel=supabase.channel("jec-membership-status:"+user.id)
        .on("postgres_changes",{event:"*",schema:"public",table:"jec_memberships",filter:"user_id=eq."+user.id},()=>{
          if(currentUser?.id===user.id) void loadIdentity(user);
        })
        .subscribe();
    };

    const refreshOnReturn=()=>{
      if(!document.hidden&&currentUser) void loadIdentity(currentUser);
    };

    // Subscribe before reading the initial session so a sign-in/sign-out occurring
    // during page hydration cannot be overwritten by an older getUser() response.
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event:string,session:{user:{id:string;email?:string;user_metadata?:Record<string,unknown>}}|null)=>{
      authEventVersion+=1;
      if(!session?.user){
        identityRequestVersion+=1;
        currentUser=null;
        setIdentity(null);
        setAuthResolved(true);
        if(membershipChannel){void supabase.removeChannel(membershipChannel);membershipChannel=null;}
        return;
      }
      const user=session.user;
      const changedUser=currentUser?.id!==user.id;
      currentUser=user;
      if(changedUser){setIdentity(null);setAuthResolved(false);}
      void Promise.resolve().then(()=>loadIdentity(user));
      if(changedUser||!membershipChannel) watchMembership(user);
    });

    const initialAuthVersion=authEventVersion;
    void supabase.auth.getUser().then(({data:{user}}:{data:{user:{id:string;email?:string;user_metadata?:Record<string,unknown>}|null}})=>{
      if(!mounted||authEventVersion!==initialAuthVersion)return;
      if(!user){
        currentUser=null;
        setIdentity(null);
        setAuthResolved(true);
        return;
      }
      currentUser=user;
      setAuthResolved(false);
      void loadIdentity(user);
      watchMembership(user);
    }).catch(()=>{
      if(!mounted||authEventVersion!==initialAuthVersion)return;
      currentUser=null;
      setIdentity(null);
      setAuthResolved(true);
    });

    window.addEventListener("focus",refreshOnReturn);
    document.addEventListener("visibilitychange",refreshOnReturn);
    return ()=>{
      mounted=false;
      subscription.unsubscribe();
      window.removeEventListener("focus",refreshOnReturn);
      document.removeEventListener("visibilitychange",refreshOnReturn);
      if(membershipChannel) void supabase.removeChannel(membershipChannel);
    };
  },[]);

  async function signOut(){
    const supabase=getSupabaseBrowserClient();
    if(!supabase) return;
    const {error}=await supabase.auth.signOut({scope:"local"});
    if(error){window.alert(en?"Unable to sign out: "+error.message:"Impossible de se déconnecter : "+error.message);return;}
    setIdentity(null);
    window.location.href="/";
  }


  const filteredNews=useMemo<NewsItem[]>(()=>{
    const records=publicContent===null?news:publicContent.filter(item=>item.content_type==="news").map(item=>({
      date:en?(item.date_label_en||formatPublicDate(item.content_date,en)):(item.date_label||formatPublicDate(item.content_date,en)),
      image:item.image_url||jecPhotos.community.src,
      category:item.category||(en?"JEC news":"Actualité JEC"),
      categoryEn:item.category_en||item.category||"JEC news",
      title:item.title,titleEn:item.title_en||item.title,
      summary:item.summary,summaryEn:item.summary_en||item.summary,
      url:item.source_url,publisher:item.source_name,sourceKind:item.source_kind,
      sourceLabel:en?(item.source_label_en||item.source_label):item.source_label,
      detailPath:item.detail_path
    }));
    return records.filter(item=>(item.title+" "+item.titleEn+" "+item.summary+" "+item.summaryEn+" "+item.category+" "+item.categoryEn).toLowerCase().includes(search.toLowerCase()));
  },[publicContent,search,en]);

  const featuredEvent=useMemo(()=>{
    if(publicContent===null) return null;
    const now=new Date();
    const today=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);
    return publicContent
      .filter(item=>item.content_type==="event"&&(item.ends_on||item.starts_on||item.content_date)>=today)
      .sort((a,b)=>(a.starts_on||a.content_date).localeCompare(b.starts_on||b.content_date))[0]??null;
  },[publicContent]);

  // Private collaboration modules are shown only to JEC-verified members or platform admins.
  const canAccessMemberNavigation = Boolean(
    identity && (identity.membershipStatus === "verified" || identity.isAdmin)
  );
  // Keep Community discoverable to every visitor. Its contents remain protected
  // by the route proxy and database RLS; the link guides unauthorized users to sign-in/account.
  const visibleNav = canAccessMemberNavigation
    ? nav
    : nav.filter(([fr]) => !privateNavItems.has(fr) || fr === "Communauté");
  const workspaceNavHref = canAccessMemberNavigation
    ? "/workspace"
    : identity ? "/compte" : "/login?next=%2Fworkspace";
  const communityNavHref = canAccessMemberNavigation
    ? "/communaute"
    : identity ? "/compte" : "/login?next=%2Fcommunaute";
  const communityNavTitle = !authResolved
    ? t("Vérification de la connexion…", "Checking sign-in…")
    : canAccessMemberNavigation
      ? t("Ouvrir la communauté JEC", "Open the JEC community")
      : identity?.membershipStatus === "rejected"
        ? t("Adhésion non validée — consulter mon compte", "Membership not approved — view your account")
        : identity
          ? t("Adhésion JEC à confirmer — consulter mon compte", "JEC membership pending — view your account")
          : t("Connecte-toi pour accéder à la communauté", "Sign in to access the community");
  const workspaceNavTitle = !authResolved
    ? t("Vérification de la connexion…", "Checking sign-in…")
    : canAccessMemberNavigation
      ? t("Ouvrir mes espaces de travail", "Open my workspaces")
      : identity?.membershipStatus === "rejected"
        ? t("Adhésion non validée — consulter mon compte", "Membership not approved — view your account")
        : identity
          ? t("Adhésion JEC à confirmer — consulter mon compte", "JEC membership pending — view your account")
          : t("Connecte-toi pour accéder au Workspace", "Sign in to access Workspace");

  function NewsCard({item}:{item:NewsItem}) {
    const photo=Object.values(jecPhotos).find(candidate=>candidate.src===item.image);
    return <article className="post-card verified-news-card">
      <div className="post-header">
        <div className="avatar violet">JEC</div>
        <div className="post-author"><strong>{item.publisher}</strong><small>{item.sourceKind==="booklet"?(en?"Source document · event dates":"Document source · dates de l’événement"):t("Publication publique vérifiée","Verified public publication")} · {item.date}</small></div>
        <span className="verified-pill">{t("Source","Source")}</span>
      </div>
      <div className="verified-news-thumb"><img src={item.image} alt="" loading="lazy"/>
        {photo&&<a className="photo-credit" href={photo.sourceUrl} target="_blank" rel="noreferrer">{en?photo.captionEn:photo.captionFr}</a>}
      </div>
      <span className="post-tag violet">{en?item.categoryEn:item.category}</span>
      <h3 className="verified-news-title">{en?item.titleEn:item.title}</h3>
      <p className="post-text">{en?item.summaryEn:item.summary}</p>
      <div className="source-footer"><span>{item.sourceLabel}</span>{item.url?<SourceLink href={item.url}>{t("Lire l'article","Read article")}</SourceLink>:null}{item.detailPath?<Link className="source-link" href={item.detailPath}>{t("Consulter le dossier","Read the feature")} →</Link>:null}</div>
    </article>;
  }

  function renderContent() {
    if(active==="JEC AI") return <JecAiAssistant/>;
    if(active==="Chants & hymnes") return <section className="songs-preview-card">
      <div className="songs-preview-art"><span>♫</span><i>♪</i><b>JEC</b></div>
      <div className="songs-preview-copy"><p className="eyebrow">{t("PATRIMOINE MUSICAL","MUSICAL HERITAGE")}</p><h2>{t("Les chants et hymnes du mouvement","Songs and anthems of the movement")}</h2><p>{t("Retrouve le chant de ralliement et l’hymne JEC en français et en anglais. Consulte les paroles, ajoute les couplets validés et écoute les enregistrements lorsqu’ils sont disponibles.","Find the rallying song and the JEC anthem in French and English. Explore the lyrics, add approved verses and listen to recordings when available.")}</p><Link href="/chants" className="primary-button">{t("Ouvrir la bibliothèque musicale →","Open the music library →")}</Link></div>
    </section>;

    if(active==="Actualités JEC") return <section>
      <div className="section-heading"><div><p className="eyebrow">{t("PUBLICATIONS SOURCÉES","SOURCED PUBLICATIONS")}</p><h2>{t("Actualités du mouvement JEC","News from the JEC movement")}</h2></div><span className="source-count">{filteredNews.length} {t("articles","articles")}</span></div>
      <p className="section-intro">{t("Cette rubrique rassemble des publications publiques de structures JEC et des documents transmis par les mouvements locaux et nationaux. Chaque contenu précise sa source et sa date ou période.","This section brings together public publications from JEC organisations and documents shared by local and national movements. Each item identifies its source and its publication date or event period.")}</p>
      {filteredNews.map(item=><NewsCard key={item.url ?? item.detailPath ?? item.title} item={item}/>)}
      <p className="source-note">{t("Les contenus sont ajoutés après vérification de leur provenance. L'agrégation automatique des flux n'est pas encore activée.","Content is added after its provenance has been checked. Automatic feed aggregation is not yet enabled.")}</p>
    </section>;

    if(active==="Découvrir la JEC") return <section className="discover-preview">
      <div className="discover-preview-art real-photo-frame"><img src={jecPhotos.library.src} alt={en?jecPhotos.library.altEn:jecPhotos.library.altFr}/><a className="photo-credit" href={jecPhotos.library.sourceUrl} target="_blank" rel="noreferrer">{en?jecPhotos.library.captionEn:jecPhotos.library.captionFr}</a></div>
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

    if(active==="Agenda public") {
      const agendaEvents=publicContent===null?[]:publicContent.filter(item=>item.content_type==="event").sort((a,b)=>(a.starts_on||"").localeCompare(b.starts_on||""));
      if(publicContent===null) return <section>
        <div className="section-heading"><div><p className="eyebrow">{t("RENDEZ-VOUS PUBLICS","PUBLIC EVENTS")}</p><h2>{t("Agenda et mémoire des événements JEC","JEC calendar and event memory")}</h2></div></div>
        <article className="event-feature"><div className="event-feature-date"><span>26 JUIL.</span><b>—</b><span>02 AOÛT</span><small>2026</small></div><div className="event-feature-body"><span className="post-tag violet">{t("ÉVÉNEMENT PASSÉ · RÉTROSPECTIVE","PAST EVENT · RECAP")}</span><h3>{t("Camp National Universitaire de Garoua 2026","Garoua 2026 National University Camp")}</h3><p>{t("Huit journées de formation, spiritualité, citoyenneté, vie culturelle et engagement au Centre Jeunesse Lumière de Ngalbidjie. Le livret du camp est désormais conservé dans la mémoire publique de JEC-conNEcT.","Eight days of formation, spirituality, citizenship, cultural life and commitment at the Centre Jeunesse Lumière de Ngalbidjie. The camp booklet is now preserved in JEC-conNEcT’s public memory.")}</p><Link className="source-link" href="/actualites/camp-garoua-2026">{t("Voir le programme et les temps forts","View the programme and highlights")} →</Link></div></article>
        <article className="event-feature"><div className="event-feature-date"><span>29 JUL.</span><b>—</b><span>08 AUG.</span><small>2027</small></div><div className="event-feature-body"><span className="post-tag blue">{t("ÉVÉNEMENT INTERNATIONAL · SOURCE EXTERNE","INTERNATIONAL EVENT · EXTERNAL SOURCE")}</span><h3>{t("Journées Mondiales de la Jeunesse — Séoul 2027","World Youth Day — Seoul 2027")}</h3><p>{t("Le site JMJ 2027 en France annonce le rendez-vous du 29 juillet au 8 août 2027 à Séoul, en Corée du Sud. Aucune participation de la JEC France n'est présumée.","The French WYD 2027 website lists the event from 29 July to 8 August 2027 in Seoul, South Korea. No participation by JEC France is implied.")}</p><SourceLink href="https://www.jmj2027.fr/">{t("Site officiel JMJ 2027 France","Official WYD 2027 France website")}</SourceLink></div></article>
      </section>;
      return <section>
        <div className="section-heading"><div><p className="eyebrow">{t("RENDEZ-VOUS PUBLICS","PUBLIC EVENTS")}</p><h2>{t("Agenda et mémoire des événements JEC","JEC calendar and event memory")}</h2></div><span className="source-count">{agendaEvents.length} {t("événements","events")}</span></div>
        <p className="section-intro">{t("Les rendez-vous publiés par l’équipe éditoriale sont affichés ici avec leur provenance. Les événements passés restent consultables comme mémoire du mouvement.","Events published by the editorial team appear here with their sources. Past events remain available as part of the movement’s history.")}</p>
        {agendaEvents.length?agendaEvents.map(item=><article className="event-feature" key={item.id}>
          <div className="event-feature-date"><span>{formatAgendaDate(item.starts_on||item.content_date,en)}</span>{item.ends_on&&item.ends_on!==item.starts_on?<><b>—</b><span>{formatAgendaDate(item.ends_on,en)}</span></>:null}<small>{new Date((item.starts_on||item.content_date)+"T12:00:00").getFullYear()}</small></div>
          <div className="event-feature-body"><span className={"post-tag "+(item.source_kind==="booklet"?"violet":"blue")}>{en?(item.category_en||item.category||"JEC event"):(item.category||"Événement JEC")}</span><h3>{en?(item.title_en||item.title):item.title}</h3><p>{en?(item.summary_en||item.summary):item.summary}</p>
            <div className="source-footer"><span>{en?(item.source_label_en||item.source_label):item.source_label}</span>{item.detail_path?<Link className="source-link" href={item.detail_path}>{t("Consulter le dossier","View event details")} →</Link>:null}{item.source_url?<SourceLink href={item.source_url}>{t("Source officielle","Official source")}</SourceLink>:null}</div>
          </div>
        </article>):<div className="directory-empty compact"><p>{t("Aucun événement public n’est publié pour le moment.","No public event has been published yet.")}</p></div>}
      </section>;
    }

    return <section className="module-placeholder widget-card"><div className="module-icon">✧</div><p className="eyebrow">{t("MODULE EN CONCEPTION","MODULE IN DEVELOPMENT")}</p><h2>{nav.find(item=>item[0]===active)?.[en?1:0]??active}</h2><p>{t("Ce module fait partie du périmètre de JEC-conNEcT. Il sera activé progressivement après validation des besoins, des droits d'accès et des règles de gouvernance par la JEC France.","This module is part of JEC-conNEcT. It will be activated progressively after JEC France validates requirements, access rights and governance rules.")}</p><div className="prototype-banner">{t("Aucune donnée interne ou confidentielle n'est utilisée dans cette démonstration.","No internal or confidential information is used in this demonstration.")}</div></section>;
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/" className="brand-lockup side-brand"><div className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></div><span>conNEcT</span></Link>
      <div className="workspace-switch"><div className="workspace-avatar">J</div><div><strong>JEC France</strong><small>{t("Portail public","Public portal")}</small></div><span className="chevron">⌄</span></div>
      <nav className="main-nav">
        {visibleNav.map(([fr,english,icon,group])=><div key={fr}>
          {group&&<p className="nav-group">{t(group==="ESPACE PUBLIC"?"ESPACE PUBLIC":group==="COLLABORATION"?"COLLABORATION":"PATRIMOINE",group==="ESPACE PUBLIC"?"PUBLIC SPACE":group==="COLLABORATION"?"COLLABORATION":"HERITAGE")}</p>}
          {fr==="Workspace" ? (
            !authResolved
              ? <span className="nav-item nav-item-loading" aria-disabled="true" title={workspaceNavTitle}><span className="nav-icon">{icon}</span><span>{en?english:fr}</span></span>
              : <Link href={workspaceNavHref} className={canAccessMemberNavigation?"nav-item":"nav-item nav-item-locked"} title={workspaceNavTitle} aria-label={workspaceNavTitle}>
                  <span className="nav-icon">{canAccessMemberNavigation?icon:"🔒"}</span><span>{en?english:fr}</span>
                </Link>
          ) : fr==="Communauté" ? (
            <Link href={communityNavHref} className={canAccessMemberNavigation?"nav-item":"nav-item nav-item-locked"} title={communityNavTitle} aria-label={communityNavTitle}>
              <span className="nav-icon">{canAccessMemberNavigation?icon:"🔒"}</span><span>{en?english:fr}</span>
            </Link>
          ) : fr==="Spiritualité" ? (
            <Link href="/spiritualite" className="nav-item"><span className="nav-icon">{icon}</span><span>{en?english:fr}</span></Link>
          ) : (["Messagerie","Communauté","Réunions","Décisions & votes","Projets","Documents","Partenaires","Archives JEC"].includes(fr)) ? (
            <Link href={fr==="Messagerie"?"/messagerie":fr==="Communauté"?"/communaute":fr==="Réunions"?"/reunions":fr==="Décisions & votes"?"/decisions":fr==="Projets"?"/projets":fr==="Partenaires"?"/partenaires":fr==="Archives JEC"?"/archives":"/documents"} className="nav-item"><span className="nav-icon">{icon}</span><span>{en?english:fr}</span></Link>
          ) : (
            <button onClick={()=>setActive(fr)} className={active===fr?"nav-item active":"nav-item"}><span className={fr==="JEC AI"?"nav-icon sparkle":"nav-icon"}>{icon}</span><span>{en?english:fr}</span></button>
          )}
        </div>)}
      </nav>
      {identity?.isAdmin&&<div className="admin-nav-group"><p className="nav-group">{t("ADMINISTRATION","ADMINISTRATION")}</p><Link href="/gestion" className="nav-item admin-nav-link"><span className="nav-icon">⚙</span><span>{t("Espace administrateur","Administrator area")}</span></Link><Link href="/gestion/veille" className="nav-item admin-nav-link"><span className="nav-icon">⌕</span><span>{t("Veille éditoriale","Editorial watch")}</span></Link></div>}
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">✧</div><strong>{t("Sources vérifiables","Verifiable sources")}</strong><p>{t("Les faits publics renvoient à leurs publications d'origine.","Public facts link to their original publications.")}</p><button onClick={()=>setActive("Actualités JEC")}>{t("Voir les sources →","Browse sources →")}</button></div>{identity?<div className="profile-mini profile-mini-auth"><Link href="/compte" className="profile-avatar-link"><div className="avatar user">{identity.avatarUrl?<img src={identity.avatarUrl} alt=""/>:identity.displayName.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}</div></Link><Link href="/compte" className="profile-identity"><strong>{identity.displayName}</strong><small>{identity.isAdmin?t("Administrateur JEC-conNEcT","JEC-conNEcT administrator"):identity.membershipStatus==="verified"?t("Membre JEC vérifié","Verified JEC member"):identity.membershipStatus==="rejected"?t("Adhésion non validée","Membership not approved"):t("Compte connecté · adhésion à confirmer","Signed in · membership pending")}</small></Link><button className="profile-signout" onClick={signOut} title={t("Se déconnecter","Sign out")} aria-label={t("Se déconnecter","Sign out")}>↪</button></div>:authResolved?<div className="profile-mini"><div className="avatar user">VP</div><div><strong>{t("Visiteur","Visitor")}</strong><small>{t("Aperçu public · non connecté","Public preview · signed out")}</small></div><Link className="profile-signin" href="/login">{t("Connexion","Sign in")}</Link></div>:<div className="profile-mini profile-mini-loading"><div className="avatar user">…</div><div><strong>{t("Vérification…","Checking…")}</strong><small>{t("Chargement de la session","Loading session")}</small></div></div>}</div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">JEC France <span>/</span> <strong>{en?(nav.find(item=>item[0]===active)?.[1]??active):active}</strong></div><div className="top-actions"><label className="search-box"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Rechercher dans les sources publiques","Search public sources")}/><kbd>⌘ K</kbd></label><PWAInstallButton/><LanguageSwitcher/>{identity?.isAdmin&&<><Link className="admin-top-link" href="/gestion">{t("Administration","Administration")}</Link><Link className="admin-top-link" href="/gestion/contenus">{t("Contenus publics","Public content")}</Link><Link className="admin-top-link" href="/gestion/veille">{t("Veille éditoriale","Editorial watch")}</Link></>}<Link className="top-login" href={authResolved?(identity?"/compte":"/login"):"#"} onClick={event=>{if(!authResolved)event.preventDefault();}} aria-disabled={!authResolved} title={!authResolved?t("Vérification de la connexion…","Checking sign-in…"):undefined}>{!authResolved?t("Vérification…","Checking…"):identity?t("Mon compte","My account"):t("Connexion","Sign in")}</Link></div></header>
      <div className="page-content">
        {identity?.membershipStatus==="pending"&&<p className="auth-config-note">Ton compte est connecté, mais ton adhésion JEC attend encore une validation. Une fois vérifié, l'administrateur devra aussi t'inviter dans les espaces de travail concernés.</p>}
        {identity?.membershipStatus==="rejected"&&<p className="alert error">Ton adhésion JEC n'a pas été validée. Contacte l'équipe responsable pour obtenir des précisions.</p>}
        {active==="Vue d'ensemble"?<>
          <section
            className="welcome-banner welcome-carousel"
            aria-roledescription="carousel"
            aria-label={t("À la découverte de la JEC","Discover the YCS")}
            onMouseEnter={()=>setHeroPaused(true)}
            onMouseLeave={()=>setHeroPaused(false)}
            onFocusCapture={()=>setHeroPaused(true)}
            onBlurCapture={()=>setHeroPaused(false)}
          >
            {heroSlides.map((slide,index)=><article
              key={slide.eyebrow}
              className={"welcome-slide welcome-slide--"+(index+1)+(heroIndex===index?" is-active":"")}
              aria-hidden={heroIndex!==index}
            >
              <div className="welcome-slide-copy">
                <p className="eyebrow light">{slide.eyebrow}</p>
                <h1>{identity
                  ? (index===0 && !identity.displayName.includes("@")
                    ? (en?"Welcome, "+identity.displayName.split(" ")[0]+".":"Bienvenue, "+identity.displayName.split(" ")[0]+".")
                    : slide.title)
                  : slide.title}</h1>
                <p>{slide.description}</p>
                <div className="welcome-actions">
                  <button className="white-button" onClick={()=>setActive(index===0?"Découvrir la JEC":"Actualités JEC")}>{slide.action}</button>
                  <button className="outline-light" onClick={()=>setActive("Agenda public")}>{t("Explorer l’agenda →","Explore the calendar →")}</button>
                </div>
              </div>
              <div className="welcome-slide-visual">
                <div className="welcome-visual-glow"/>
                <img src={slide.image} alt={slide.imageAlt} loading={index===0?"eager":"lazy"}/>
                <a className="photo-credit hero-photo-credit" href={slide.photoUrl} target="_blank" rel="noreferrer">{slide.photoCredit}</a>
                <div className="welcome-visual-stamp"><span>✝</span><b>JEC</b><small>{t("Voir · Juger · Agir","See · Judge · Act")}</small></div>
              </div>
            </article>)}
            <div className="welcome-carousel-controls">
              <button type="button" className="welcome-carousel-arrow" aria-label={t("Diapositive précédente","Previous slide")} onClick={()=>setHeroIndex(current=>(current-1+heroSlides.length)%heroSlides.length)}>‹</button>
              <div className="welcome-carousel-dots">
                {heroSlides.map((slide,index)=><button key={slide.eyebrow} type="button" className={heroIndex===index?"is-active":""} aria-label={t("Afficher la diapositive ","Show slide ")+(index+1)} aria-pressed={heroIndex===index} onClick={()=>setHeroIndex(index)}/>)}
              </div>
              <span className="welcome-carousel-count">{String(heroIndex+1).padStart(2,"0")} / {String(heroSlides.length).padStart(2,"0")}</span>
              <button type="button" className="welcome-carousel-arrow" aria-label={t("Diapositive suivante","Next slide")} onClick={()=>setHeroIndex(current=>(current+1)%heroSlides.length)}>›</button>
            </div>
            <div className="welcome-carousel-progress"><span style={{transform:"scaleX("+(heroIndex+1)/heroSlides.length+")"}}/></div>
          </section>
          <div className="home-quick-links">
            <button onClick={()=>setActive("Découvrir la JEC")}><span className="home-quick-icon">✳</span><span><b>{t("Notre démarche","Our approach")}</b><small>{t("Voir · Juger · Agir","See · Judge · Act")}</small></span><i>↗</i></button>
            <button onClick={()=>setActive("Actualités JEC")}><span className="home-quick-icon peach">◉</span><span><b>{t("La vie du mouvement","Movement life")}</b><small>{t("Actualités et initiatives","News and initiatives")}</small></span><i>↗</i></button>
            <button onClick={()=>setActive("Agenda public")}><span className="home-quick-icon mint">▣</span><span><b>{t("Les rendez-vous JEC","YCS calendar")}</b><small>{t("Événements et rencontres","Events and gatherings")}</small></span><i>↗</i></button>
          </div>
          <div className="content-grid"><section className="feed-column"><div className="section-heading"><div><p className="eyebrow">{t("PUBLICATIONS OFFICIELLES","OFFICIAL PUBLICATIONS")}</p><h2>{t("Les dernières actualités repérées","Latest verified news")}</h2></div><button className="text-button" onClick={()=>setActive("Actualités JEC")}>{t("Toutes les actualités ↗","All news ↗")}</button></div>{filteredNews.slice(0,3).map(item=><NewsCard key={item.url ?? item.detailPath ?? item.title} item={item}/>)}</section>
          <aside className="right-column"><section className="widget-card"><div className="widget-heading"><h3>{t("Repères historiques","Historical milestones")}</h3><button onClick={()=>setActive("Découvrir la JEC")}>{t("Explorer","Explore")}</button></div><div className="fact-item"><b>1929</b><div><strong>{t("Origines de la JEC en France","Origins of JEC in France")}</strong><small>{t("Premiers groupes autour de Louis Chaudron et Paul Vignaux.","First groups around Louis Chaudron and Paul Vignaux.")}</small></div></div><div className="fact-item"><b>1946</b><div><strong>{t("Coordination internationale","International coordination")}</strong><small>{t("Fondation de la JECI / IYCS.","Foundation of JECI / IYCS.")}</small></div></div><Link className="widget-link" href="/decouvrir#frise-chronologique">{t("Voir la frise chronologique →","Explore the timeline →")}</Link></section>
          <section className="widget-card"><div className="widget-heading"><h3>{t("Événement à suivre","Event to follow")}</h3><button onClick={()=>setActive("Agenda public")}>{t("Agenda","Calendar")}</button></div>{publicContent===null?<div className="event-item"><div className="event-date"><b>2027</b><span>JUL–AUG</span></div><div><strong>{t("JMJ Séoul 2027","WYD Seoul 2027")}</strong><small>29 juillet – 8 août · Corée du Sud</small><SourceLink href="https://www.jmj2027.fr/">{t("Site officiel","Official website")}</SourceLink></div></div>:featuredEvent?<div className="event-item"><div className="event-date"><b>{formatAgendaDate(featuredEvent.starts_on||featuredEvent.content_date,en)}</b>{featuredEvent.ends_on&&featuredEvent.ends_on!==featuredEvent.starts_on?<span>{formatAgendaDate(featuredEvent.ends_on,en)}</span>:null}</div><div><strong>{en?(featuredEvent.title_en||featuredEvent.title):featuredEvent.title}</strong><small>{new Date((featuredEvent.starts_on||featuredEvent.content_date)+"T12:00:00").getFullYear()} · {en?(featuredEvent.category_en||featuredEvent.category||"JEC event"):(featuredEvent.category||"Événement JEC")}</small>{featuredEvent.source_url?<SourceLink href={featuredEvent.source_url}>{t("Source officielle","Official source")}</SourceLink>:null}{featuredEvent.detail_path?<Link className="source-link" href={featuredEvent.detail_path}>{t("Consulter le dossier","View event details")} →</Link>:null}</div></div>:<div className="event-item"><div className="event-date"><b>—</b></div><div><strong>{t("Aucun événement à venir publié","No upcoming event published")}</strong><small>{t("Consulte l’agenda public pour retrouver les événements archivés.","Visit the public calendar to explore past events.")}</small></div></div>}</section>
          {canAccessMemberNavigation&&<section className="community-launch-card"><div className="community-launch-art real-photo-frame"><img src={jecPhotos.peerStudy.src} alt={en?jecPhotos.peerStudy.altEn:jecPhotos.peerStudy.altFr}/><a className="photo-credit" href={jecPhotos.peerStudy.sourceUrl} target="_blank" rel="noreferrer">{en?jecPhotos.peerStudy.captionEn:jecPhotos.peerStudy.captionFr}</a></div><div><p className="eyebrow">{t("VIE COMMUNAUTAIRE","COMMUNITY LIFE")}</p><h3>{t("La communauté JEC vit ici","The JEC community lives here")}</h3><p>{t("Partage tes nouvelles, tes idées et tes humeurs avec les autres membres.","Share your news, ideas and moods with other members.")}</p><Link href="/communaute" className="community-launch-link">{t("Rejoindre la communauté →","Join the community →")}</Link></div></section>}
          {canAccessMemberNavigation&&<><section className="ai-card"><div className="ai-spark">✧</div><p className="eyebrow">JEC CONNECT</p><h3>{t("Un espace à construire ensemble","A space to build together")}</h3><p>{t("JEC-conNEcT relie les espaces de travail, projets, tâches, réunions et échanges de ses membres. Les archives avancées et l’assistant IA viendront dans une prochaine phase.","JEC-conNEcT connects members’ workspaces, projects, tasks, meetings and conversations. Advanced archives and the AI assistant are planned for a later phase.")}</p><button onClick={()=>setActive("Workspace")}>{t("Découvrir les modules →","Explore modules →")}</button></section><p className="prototype-note">{t("Prototype de présentation · Contenus publics sourcés","Presentation prototype · Public sourced content")}<br/>{t("Les espaces privés sont accessibles aux membres autorisés selon les droits de chaque équipe.","Private workspaces are available to authorized members according to each team’s permissions.")}</p></>}</aside></div>
        </>:renderContent()}
      </div>
    </main>
  </div>;
}
