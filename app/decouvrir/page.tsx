import Link from "next/link";

const milestones = [
  { year: "1929", title: "Naissance de la JEC en France", body: "La page historique de JEC France situe les origines du mouvement en mai 1929, autour de jeunes lycéens et étudiants dont Louis Chaudron et Paul Vignaux." },
  { year: "1930", title: "Lancement de L’Appel", body: "La même page indique que L’Appel, organe mensuel de la JEC, est lancé en 1930." },
  { year: "1946", title: "Coordination internationale JECI / IYCS", body: "Le Dicastère pour les Laïcs, la Famille et la Vie indique que la coordination internationale du mouvement YCS a été établie en 1946, après la Seconde Guerre mondiale." }
];

const pillars = [
  ["École / Université", "Le milieu scolaire et universitaire est le terrain immédiat de la vie des jeunes et un espace d’action et de réflexion."],
  ["Église", "Un espace pour vivre la foi, nourrir une démarche spirituelle et relier engagement et vie quotidienne."],
  ["Société", "Une ouverture sur les réalités sociales et les enjeux qui traversent la vie des jeunes."],
  ["International", "Une invitation à échanger avec d’autres mouvements et à construire des solidarités au-delà des frontières."],
  ["Environnement", "Une réflexion et des actions autour de l’écologie intégrale, de la paix et de l’avenir de la planète."]
];

const sources = [
  { label: "Histoire de la JEC France", url: "https://jecfrance.org/notre-histoire/", publisher: "JEC France" },
  { label: "Notre démarche : Voir, Juger, Agir", url: "https://jecfrance.org/notre-demarche/", publisher: "JEC France" },
  { label: "Les piliers de la JEC", url: "https://jecfrance.org/les-piliers-de-la-jec/", publisher: "JEC France" },
  { label: "Nos équipes", url: "https://jecfrance.org/nos-equipes/", publisher: "JEC France" },
  { label: "International Young Catholic Students", url: "https://www.laityfamilylife.va/content/laityfamilylife/en/associazioni-e-movimenti/repertorio/gioventu-studentesca-cattolica-internazionale-.html", publisher: "Dicastère pour les Laïcs, la Famille et la Vie" }
];

export const metadata = {
  title: "Découvrir la JEC | JEC-conNEcT",
  description: "Histoire, démarche, piliers et ressources publiques de la Jeunesse Étudiante Chrétienne."
};

export default function DecouvrirPage() {
  return (
    <main className="discover-public">
      <header className="discover-public-header">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link>
        <Link href="/" className="back-link-inline">← Retour à l’espace public</Link>
      </header>

      <section className="discover-hero">
        <p className="eyebrow light">DÉCOUVRIR LE MOUVEMENT</p>
        <h1>Un mouvement de jeunes,<br/><em>par les jeunes et pour les jeunes.</em></h1>
        <p>La JEC invite les jeunes à regarder leur milieu de vie, à discerner ce qui s’y joue et à agir pour transformer la société.</p>
        <div className="discover-hero-actions">
          <a href="https://jecfrance.org/" target="_blank" rel="noreferrer" className="white-button">Site officiel JEC France ↗</a>
          <a href="https://jecfrance.org/notre-demarche/" target="_blank" rel="noreferrer" className="outline-light">Comprendre la démarche</a>
        </div>
      </section>

      <section className="discover-public-section">
        <div className="discover-public-section-heading">
          <p className="eyebrow">REPÈRES HISTORIQUES</p>
          <h2>Une histoire qui s’inscrit dans la durée</h2>
          <p>Les repères ci-dessous sont issus des pages institutionnelles de JEC France et du Dicastère pour les Laïcs, la Famille et la Vie. Ils restent rattachés à leurs sources d’origine.</p>
        </div>
        <div className="discover-public-timeline">
          {milestones.map(item => <article className="discover-public-milestone" key={item.year}><b>{item.year}</b><div><h3>{item.title}</h3><p>{item.body}</p></div></article>)}
        </div>
        <div className="discover-public-source-row"><a href={sources[0].url} target="_blank" rel="noreferrer">Histoire de la JEC France ↗</a><a href={sources[4].url} target="_blank" rel="noreferrer">Histoire internationale JECI / IYCS ↗</a></div>
      </section>

      <section className="discover-public-section tinted">
        <div className="discover-public-section-heading">
          <p className="eyebrow">LA PÉDAGOGIE JEC</p>
          <h2>Voir · Juger · Agir</h2>
          <p>La démarche invite à partir du réel, à le comprendre et à choisir des actions concrètes. Elle ne s’arrête pas à l’action : l’évaluation permet de relire le chemin parcouru.</p>
        </div>
        <div className="vja-cards">
          <article><span>01</span><h3>Voir</h3><p>Observer son milieu d’étude et la société, repérer les situations, les injustices, les questions et les signes d’espérance.</p></article>
          <article><span>02</span><h3>Juger</h3><p>Comprendre ce qui se passe à partir des connaissances, des expériences et des valeurs qui animent le mouvement.</p></article>
          <article><span>03</span><h3>Agir</h3><p>Construire des actions individuelles ou collectives, à court, moyen ou long terme, pour contribuer au changement.</p></article>
        </div>
        <a className="discover-public-source-link" href={sources[1].url} target="_blank" rel="noreferrer">Source : Notre démarche JEC France ↗</a>
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
        <a className="discover-public-source-link" href={sources[2].url} target="_blank" rel="noreferrer">Source : Les piliers de la JEC ↗</a>
      </section>

      <section className="discover-public-section tinted">
        <div className="discover-public-section-heading">
          <p className="eyebrow">ALLER PLUS LOIN</p>
          <h2>Explorer les ressources et les structures</h2>
          <p>Les pages officielles présentent l’équipe nationale, des fédérations locales, leurs formes d’engagement et les actualités publiées.</p>
        </div>
        <div className="discover-public-resource-grid">
          {sources.map(s=><a href={s.url} target="_blank" rel="noreferrer" key={s.url}><small>{s.publisher}</small><strong>{s.label}</strong><span>Consulter la source ↗</span></a>)}
        </div>
      </section>

      <footer className="discover-public-footer">
        <strong>JEC-conNEcT</strong>
        <span>Portail de découverte en cours de construction · Contenus publics sourcés · Version de démonstration</span>
        <Link href="/">Retour à l’accueil</Link>
      </footer>
    </main>
  );
}
