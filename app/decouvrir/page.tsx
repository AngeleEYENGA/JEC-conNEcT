"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
        <Link href="/" className="back-link-inline">← Retour à l’espace public</Link>
      </header>

      <section className="discover-hero">
        <p className="eyebrow light">DÉCOUVRIR LE MOUVEMENT</p>
        <h1>Une histoire à transmettre.<br/><em>Un avenir à construire.</em></h1>
        <p>Découvre les origines, les engagements et les grandes étapes de la JEC, à travers des repères historiques reliés à leurs sources.</p>
        <div className="discover-hero-actions">
          <a href="https://jecfrance.org/" target="_blank" rel="noreferrer" className="white-button">Site officiel JEC France ↗</a>
          <a href="https://jecfrance.org/notre-demarche/" target="_blank" rel="noreferrer" className="outline-light">Comprendre la démarche</a>
        </div>
      </section>

      <section className="discover-public-section chronology-section">
        <div className="discover-public-section-heading">
          <p className="eyebrow">MÉMOIRE DU MOUVEMENT</p>
          <h2>La frise chronologique de la JEC</h2>
          <p>Une mémoire vivante, de la naissance du mouvement en France à son histoire internationale. Sélectionne une date pour découvrir le contexte et consulter la source.</p>
        </div>

        <div className="timeline-toolbar">
          <div className="timeline-filters" role="group" aria-label="Filtrer la chronologie">
            {(["Tous", "France", "International"] as const).map(value =>
              <button key={value} className={scope===value?"timeline-filter active":"timeline-filter"} onClick={() => {setScope(value); const first=milestones.find(x=>value==="Tous"||x.scope===value); if(first) setSelected(first.id);}}>{value}</button>
            )}
          </div>
          <span className="timeline-meta">{visible.length} repères documentés · Consultation initiale : 11 novembre 2026</span>
        </div>

        <div className="timeline-layout">
          <div className="timeline-track" aria-label="Repères chronologiques">
            <div className="timeline-axis"/>
            {visible.map((item,index) =>
              <button key={item.id} className={selected===item.id?"timeline-node selected":"timeline-node"} onClick={()=>setSelected(item.id)} aria-pressed={selected===item.id}>
                <span className="timeline-node-dot"/>
                <span className="timeline-node-year">{item.year}</span>
                <span className="timeline-node-title">{item.title}</span>
                <span className="timeline-node-scope">{item.scope === "France" ? "JEC France" : "JEC internationale"}</span>
              </button>
            )}
          </div>

          {active && <article className="timeline-detail" aria-live="polite">
            <div className="timeline-detail-top"><span className="timeline-detail-date">{active.dateLabel}</span><span className="timeline-detail-scope">{active.scope === "France" ? "Histoire de la JEC France" : "Histoire internationale"}</span></div>
            <h3>{active.title}</h3>
            <p className="timeline-summary">{active.summary}</p>
            <p>{active.detail}</p>
            <div className="timeline-detail-bottom"><span>{active.precision}</span><a href={active.url} target="_blank" rel="noreferrer">{active.source} ↗</a></div>
          </article>}
        </div>

        <div className="timeline-editorial-note">
          <strong>Une chronologie appelée à grandir.</strong>
          <span>Les étapes sont ajoutées uniquement lorsqu’une source permet de les dater et de les contextualiser. Les archives, anciens logos, témoignages et documents des différentes générations pourront enrichir la frise après vérification et validation par la JEC.</span>
        </div>
      </section>

      <section className="discover-public-section tinted">
        <div className="discover-public-section-heading">
          <p className="eyebrow">LA PÉDAGOGIE JEC</p>
          <h2>Voir · Juger · Agir</h2>
          <p>La démarche invite à partir du réel, à le comprendre et à choisir des actions concrètes. L’évaluation permet ensuite de relire le chemin parcouru.</p>
        </div>
        <div className="vja-cards">
          <article><span>01</span><h3>Voir</h3><p>Observer son milieu d’étude et la société, repérer les situations, les injustices, les questions et les signes d’espérance.</p></article>
          <article><span>02</span><h3>Juger</h3><p>Comprendre ce qui se passe à partir des connaissances, des expériences et des valeurs qui animent le mouvement.</p></article>
          <article><span>03</span><h3>Agir</h3><p>Construire des actions individuelles ou collectives, à court, moyen ou long terme, pour contribuer au changement.</p></article>
        </div>
        <a className="discover-public-source-link" href="https://jecfrance.org/notre-demarche/" target="_blank" rel="noreferrer">Source : Notre démarche JEC France ↗</a>
      </section>

      <section className="discover-public-section">
        <div className="discover-public-section-heading">
          <p className="eyebrow">LES PILIERS</p>
          <h2>Cinq regards pour comprendre le monde</h2>
          <p>Les piliers présentés sur le site de JEC France structurent des terrains de vie, de réflexion et d’action.</p>
        </div>
        <div className="discover-pillars">
          {pillars.map((p, i)=><article key={p[0]}><span className={"pillar-number p"+i}>0{i+1}</span><h3>{p[0]}</h3><p>{p[1]}</p></article>)}
        </div>
        <a className="discover-public-source-link" href="https://jecfrance.org/les-piliers-de-la-jec/" target="_blank" rel="noreferrer">Source : Les piliers de la JEC ↗</a>
      </section>

      <section className="discover-public-section tinted">
        <div className="discover-public-section-heading">
          <p className="eyebrow">ALLER PLUS LOIN</p>
          <h2>Explorer les ressources et les structures</h2>
          <p>Les pages institutionnelles de référence permettent d’approfondir l’histoire, la démarche et les structures publiquement présentées.</p>
        </div>
        <div className="discover-public-resource-grid">
          {resources.map(s=><a href={s.url} target="_blank" rel="noreferrer" key={s.url}><small>{s.publisher}</small><strong>{s.label}</strong><span>Consulter la source ↗</span></a>)}
        </div>
      </section>

      <footer className="discover-public-footer">
        <strong>JEC-conNEcT</strong>
        <span>Portail de découverte en cours de construction · Contenus publics sourcés · Mise à jour initiale : 11 novembre 2026</span>
        <Link href="/">Retour à l’accueil</Link>
      </footer>
    </main>
  );
}
