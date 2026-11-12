"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { PWAInstallButton } from "@/components/pwa-install-button";

type Milestone = {
  id: string;
  year: string;
  dateLabel: string;
  scope: "France" | "International";
  title: string;
  summary: string;
  detail: string;
  source: string;
  url: string;
  precision: string;
};

const milestones: Milestone[] = [
  {
    id: "jec-1929-origins",
    year: "1929",
    dateLabel: "Mai 1929",
    scope: "France",
    title: "Les premiers jécistes se rassemblent",
    summary: "Des lycéens et étudiants, parmi lesquels Louis Chaudron et Paul Vignaux, lancent le mouvement en France.",
    detail: "La page historique de JEC France situe ce moment en mai 1929, le jour de la fête de Jeanne d’Arc. Les premiers jécistes reçoivent leurs insignes des jocistes. Le récit institutionnel présente ce moment comme le lancement du mouvement français.",
    source: "JEC France — Notre histoire",
    url: "https://jecfrance.org/notre-histoire/",
    precision: "Date précise indiquée par la source"
  },
  {
    id: "jec-1929-brochure",
    year: "1929",
    dateLabel: "Juillet 1929",
    scope: "France",
    title: "Publication de la première brochure",
    summary: "La première édition de « La JEC, esquisse d’un programme général » formalise les premières orientations du mouvement.",
    detail: "La page historique de JEC France indique que Louis Chaudron et Paul Vignaux rédigent la première brochure en 1929 et précise, dans son zoom historique, que la première édition paraît en juillet 1929.",
    source: "JEC France — Notre histoire",
    url: "https://jecfrance.org/notre-histoire/",
    precision: "Mois indiqué par la source"
  },
  {
    id: "jec-1930-appel",
    year: "1930",
    dateLabel: "1930",
    scope: "France",
    title: "Lancement de L’Appel",
    summary: "L’Appel devient l’organe mensuel de la JEC.",
    detail: "La page historique officielle de JEC France indique qu’en 1930 est lancé L’Appel, organe mensuel du mouvement. La date exacte de parution du premier numéro n’est pas précisée sur cette page.",
    source: "JEC France — Notre histoire",
    url: "https://jecfrance.org/notre-histoire/",
    precision: "Année confirmée ; jour et mois non précisés"
  },
  {
    id: "iycs-1946",
    year: "1946",
    dateLabel: "1946",
    scope: "International",
    title: "Naissance de la coordination internationale JECI / IYCS",
    summary: "La coordination internationale du mouvement étudiant chrétien est fondée au lendemain de la Seconde Guerre mondiale.",
    detail: "Le Dicastère pour les Laïcs, la Famille et la Vie décrit la fondation en 1946 de la coordination internationale de l’International Young Catholic Students (IYCS), également désigné comme JECI en français. Son objectif initial inclut l’engagement des étudiants dans la construction d’une paix fondée sur la justice et la liberté.",
    source: "Dicastère pour les Laïcs, la Famille et la Vie — Répertoire",
    url: "https://www.laityfamilylife.va/content/laityfamilylife/fr/associazioni-e-movimenti/repertorio/gioventu-studentesca-cattolica-internazionale-.html",
    precision: "Année de fondation confirmée par une source institutionnelle"
  },
  {
    id: "jec-1968",
    year: "1968",
    dateLabel: "Mai 1968",
    scope: "France",
    title: "La JEC face aux turbulences de Mai 68",
    summary: "Le mouvement accompagne les jeunes dans une période de fortes transformations sociales et de débats.",
    detail: "Dans son survol historique, JEC France évoque son rôle d’éveil et d’accompagnement des jeunes pendant les turbulences du mouvement de Mai 68. La source ne décrit pas ici une date précise de décision ou d’action : la frise situe donc le contexte historique, sans inventer d’événement ponctuel.",
    source: "JEC France — Notre histoire",
    url: "https://jecfrance.org/notre-histoire/",
    precision: "Période historique mentionnée par la source"
  },
  {
    id: "iycs-2009",
    year: "2009",
    dateLabel: "25 mars 2009",
    scope: "International",
    title: "Reconnaissance de l’IYCS comme association internationale de fidèles",
    summary: "Le Conseil pontifical pour les laïcs confirme la reconnaissance de l’International Young Catholic Students.",
    detail: "La notice du Dicastère indique que, le 25 mars 2009, l’IYCS a été reconnue comme association internationale de fidèles. Ce jalon concerne l’organisation internationale et ne doit pas être confondu avec la création de la JEC française.",
    source: "Dicastère pour les Laïcs, la Famille et la Vie — Répertoire",
    url: "https://www.laityfamilylife.va/content/laityfamilylife/fr/associazioni-e-movimenti/repertorio/gioventu-studentesca-cattolica-internazionale-.html",
    precision: "Date précise indiquée par la source institutionnelle"
  }
];


const milestoneEnglish: Record<string,{dateLabel:string;title:string;summary:string;detail:string;precision:string}> = {
  "jec-1929-origins": {dateLabel:"May 1929",title:"The first JEC students gather",summary:"High-school and university students, including Louis Chaudron and Paul Vignaux, launch the movement in France.",detail:"The JEC France history page places this moment in May 1929, on the feast of Joan of Arc. The first JEC members receive their insignia from JOC members. The institutional account presents this as the launch of the French movement.",precision:"Exact month stated by the source"},
  "jec-1929-brochure": {dateLabel:"July 1929",title:"Publication of the first booklet",summary:"The first edition of “La JEC, esquisse d’un programme général” sets out the movement’s initial orientations.",detail:"The JEC France history page says Louis Chaudron and Paul Vignaux wrote the first booklet in 1929 and specifies in its historical feature that the first edition appeared in July 1929.",precision:"Month stated by the source"},
  "jec-1930-appel": {dateLabel:"1930",title:"Launch of L’Appel",summary:"L’Appel becomes the JEC’s monthly publication.",detail:"The official JEC France history page states that L’Appel, the movement’s monthly publication, was launched in 1930. The exact date of its first issue is not given on that page.",precision:"Year confirmed; day and month not specified"},
  "iycs-1946": {dateLabel:"1946",title:"Creation of the international JECI / IYCS coordination",summary:"The international coordination of the Christian student movement is founded after the Second World War.",detail:"The Dicastery for Laity, Family and Life describes the foundation in 1946 of the International Young Catholic Students (IYCS) international coordination, also known in French as JECI. Its initial purpose included engaging students in building peace based on justice and freedom.",precision:"Founding year confirmed by an institutional source"},
  "jec-1968": {dateLabel:"May 1968",title:"JEC amid the turmoil of May 1968",summary:"The movement accompanies young people during a period of major social change and debate.",detail:"In its historical overview, JEC France refers to its role in awakening and accompanying young people during the upheavals of May 1968. The source does not describe a specific decision or action date here, so the timeline presents this as a historical period rather than an invented event.",precision:"Historical period mentioned by the source"},
  "iycs-2009": {dateLabel:"25 March 2009",title:"IYCS recognized as an international association of the faithful",summary:"The Pontifical Council for the Laity confirms the recognition of International Young Catholic Students.",detail:"The Dicastery’s entry states that on 25 March 2009, IYCS was recognized as an international association of the faithful. This milestone concerns the international organization and must not be confused with the founding of JEC France.",precision:"Exact date stated by the institutional source"}
};

const resources = [
  { label: "Histoire de la JEC France", url: "https://jecfrance.org/notre-histoire/", publisher: "JEC France" },
  { label: "Démarche Voir-Juger-Agir", url: "https://jecfrance.org/notre-demarche/", publisher: "JEC France" },
  { label: "Les piliers de la JEC", url: "https://jecfrance.org/les-piliers-de-la-jec/", publisher: "JEC France" },
  { label: "Nos équipes et fédérations", url: "https://jecfrance.org/nos-equipes/", publisher: "JEC France" },
  { label: "JECI / IYCS — notice institutionnelle", url: "https://www.laityfamilylife.va/content/laityfamilylife/fr/associazioni-e-movimenti/repertorio/gioventu-studentesca-cattolica-internazionale-.html", publisher: "Dicastère pour les Laïcs, la Famille et la Vie" }
];

const pillars = [
  ["École / Université", "Le milieu scolaire et universitaire comme lieu de vie, de réflexion et d’action."],
  ["Église", "La vie spirituelle et l’engagement chrétien dans le quotidien."],
  ["Société", "L’attention aux réalités sociales et la participation à leur transformation."],
  ["International", "L’ouverture aux autres mouvements et aux solidarités au-delà des frontières."],
  ["Environnement", "La prise en compte des enjeux écologiques et de l’avenir commun."]
];

export default function DecouvrirPage() {
  const {lang}=useLanguage();
  const en=lang==="en";
  const t=(fr:string,english:string)=>en?english:fr;
  const [scope, setScope] = useState<"Tous" | "France" | "International">("Tous");
  const [selected, setSelected] = useState("jec-1929-origins");
  const visible = useMemo(
    () => milestones.filter(item => scope === "Tous" || item.scope === scope),
    [scope]
  );
  const active = visible.find(item => item.id === selected) ?? visible[0];

  return (
    <main className="discover-public">
      <header className="discover-public-header">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link>
        <div className="discover-header-actions"><PWAInstallButton/><LanguageSwitcher/><Link href="/" className="back-link-inline">{t("← Retour à l’espace public","← Back to public home")}</Link></div>
      </header>

      <section className="discover-hero">
        <p className="eyebrow light">{t("DÉCOUVRIR LE MOUVEMENT","DISCOVER THE MOVEMENT")}</p>
        <h1>{t("Une histoire à transmettre.","A story to pass on.")}<br/><em>{t("Un avenir à construire.","A future to build.")}</em></h1>
        <p>{t("Découvre les origines, les engagements et les grandes étapes de la JEC, à travers des repères historiques reliés à leurs sources.","Explore JEC’s origins, commitments and key milestones through historical records linked to their sources.")}</p>
        <div className="discover-hero-actions">
          <a href="https://jecfrance.org/" target="_blank" rel="noreferrer" className="white-button">{t("Site officiel JEC France ↗","Official JEC France website ↗")}</a>
          <a href="https://jecfrance.org/notre-demarche/" target="_blank" rel="noreferrer" className="outline-light">{t("Comprendre la démarche","Understand the approach")}</a>
        </div>
      </section>

      <section id="frise-chronologique" className="discover-public-section chronology-section">
        <div className="discover-public-section-heading">
          <p className="eyebrow">{t("MÉMOIRE DU MOUVEMENT","MOVEMENT MEMORY")}</p>
          <h2>{t("La frise chronologique de la JEC","The JEC historical timeline")}</h2>
          <p>{t("Une mémoire vivante, de la naissance du mouvement en France à son histoire internationale. Sélectionne une date pour découvrir le contexte et consulter la source.","A living record, from the movement’s beginnings in France to its international history. Select a date to explore the context and view the source.")}</p>
        </div>

        <div className="timeline-toolbar">
          <div className="timeline-filters" role="group" aria-label="Filtrer la chronologie">
            {(["Tous", "France", "International"] as const).map(value =>
              <button key={value} className={scope===value?"timeline-filter active":"timeline-filter"} onClick={() => {setScope(value); const first=milestones.find(x=>value==="Tous"||x.scope===value); if(first) setSelected(first.id);}}>{value}</button>
            )}
          </div>
          <span className="timeline-meta">{visible.length} {t("repères documentés","documented milestones")} · {t("Vérification initiale : 11 novembre 2026","Initial review: 11 November 2026")}</span>
        </div>

        <div className="timeline-layout">
          <div className="timeline-track" aria-label="Repères chronologiques">
            <div className="timeline-axis"/>
            {visible.map((item,index) =>
              <button key={item.id} className={selected===item.id?"timeline-node selected":"timeline-node"} onClick={()=>setSelected(item.id)} aria-pressed={selected===item.id}>
                <span className="timeline-node-dot"/>
                <span className="timeline-node-year">{item.year}</span>
                <span className="timeline-node-title">{en?milestoneEnglish[item.id].title:item.title}</span>
                <span className="timeline-node-scope">{item.scope === "France" ? "JEC France" : t("JEC internationale","International JEC")}</span>
              </button>
            )}
          </div>

          {active && <article className="timeline-detail" aria-live="polite">
            <div className="timeline-detail-top"><span className="timeline-detail-date">{en?milestoneEnglish[active.id].dateLabel:active.dateLabel}</span><span className="timeline-detail-scope">{active.scope === "France" ? t("Histoire de la JEC France","JEC France history") : t("Histoire internationale","International history")}</span></div>
            <h3>{en?milestoneEnglish[active.id].title:active.title}</h3>
            <p className="timeline-summary">{en?milestoneEnglish[active.id].summary:active.summary}</p>
            <p>{en?milestoneEnglish[active.id].detail:active.detail}</p>
            <div className="timeline-detail-bottom"><span>{en?milestoneEnglish[active.id].precision:active.precision}</span><a href={active.url} target="_blank" rel="noreferrer">{active.source} ↗</a></div>
          </article>}
        </div>

        <div className="timeline-editorial-note">
          <strong>Une chronologie appelée à grandir.</strong>
          <span>Les étapes sont ajoutées uniquement lorsqu’une source permet de les dater et de les contextualiser. Les archives, anciens logos, témoignages et documents des différentes générations pourront enrichir la frise après vérification et validation par la JEC.</span>
        </div>
      </section>

      <section className="discover-public-section tinted">
        <div className="discover-public-section-heading">
          <p className="eyebrow">{t("LA PÉDAGOGIE JEC","THE JEC APPROACH")}</p>
          <h2>{t("Voir · Juger · Agir","See · Judge · Act")}</h2>
          <p>{t("La démarche invite à partir du réel, à le comprendre et à choisir des actions concrètes. L’évaluation permet ensuite de relire le chemin parcouru.","The approach starts from real life, seeks to understand it and choose concrete actions. Evaluation then helps the group reflect on what it has achieved.")}</p>
        </div>
        <div className="vja-cards">
          <article><span>01</span><h3>{t("Voir","See")}</h3><p>{t("Observer son milieu d’étude et la société, repérer les situations, les injustices, les questions et les signes d’espérance.","Observe school, university and society; identify situations, injustices, questions and signs of hope.")}</p></article>
          <article><span>02</span><h3>{t("Juger","Judge")}</h3><p>{t("Comprendre ce qui se passe à partir des connaissances, des expériences et des valeurs qui animent le mouvement.","Understand what is happening through knowledge, experience and the values that inspire the movement.")}</p></article>
          <article><span>03</span><h3>{t("Agir","Act")}</h3><p>{t("Construire des actions individuelles ou collectives, à court, moyen ou long terme, pour contribuer au changement.","Develop individual or collective actions, in the short, medium or long term, to contribute to change.")}</p></article>
        </div>
        <a className="discover-public-source-link" href="https://jecfrance.org/notre-demarche/" target="_blank" rel="noreferrer">{t("Source : Notre démarche JEC France ↗","Source: JEC France approach ↗")}</a>
      </section>

      <section className="discover-public-section">
        <div className="discover-public-section-heading">
          <p className="eyebrow">{t("LES PILIERS","THE PILLARS")}</p>
          <h2>{t("Cinq regards pour comprendre le monde","Five lenses to understand the world")}</h2>
          <p>{t("Les piliers présentés sur le site de JEC France structurent des terrains de vie, de réflexion et d’action.","The pillars presented on JEC France’s website structure key areas of life, reflection and action.")}</p>
        </div>
        <div className="discover-pillars">
          {pillars.map((p, i)=><article key={p[0]}><span className={"pillar-number p"+i}>0{i+1}</span><h3>{p[0]}</h3><p>{p[1]}</p></article>)}
        </div>
        <a className="discover-public-source-link" href="https://jecfrance.org/les-piliers-de-la-jec/" target="_blank" rel="noreferrer">{t("Source : Les piliers de la JEC ↗","Source: The JEC pillars ↗")}</a>
      </section>

      <section className="discover-public-section tinted">
        <div className="discover-public-section-heading">
          <p className="eyebrow">{t("ALLER PLUS LOIN","EXPLORE MORE")}</p>
          <h2>{t("Explorer les ressources et les structures","Explore resources and structures")}</h2>
          <p>{t("Les pages institutionnelles de référence permettent d’approfondir l’histoire, la démarche et les structures publiquement présentées.","These institutional reference pages provide more information about the history, approach and publicly listed structures.")}</p>
        </div>
        <div className="discover-public-resource-grid">
          {resources.map(s=><a href={s.url} target="_blank" rel="noreferrer" key={s.url}><small>{s.publisher}</small><strong>{s.label}</strong><span>{t("Consulter la source ↗","View source ↗")}</span></a>)}
        </div>
      </section>

      <footer className="discover-public-footer">
        <strong>JEC-conNEcT</strong>
        <span>{t("Portail de découverte en cours de construction · Contenus publics sourcés · Mise à jour initiale : 11 novembre 2026","Discovery portal in progress · Public content with sources · Initial review: 11 November 2026")}</span>
        <Link href="/">{t("Retour à l’accueil","Back to home")}</Link>
      </footer>
    </main>
  );
}
