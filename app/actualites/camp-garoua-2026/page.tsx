"use client";

import Link from "next/link";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";

const days=[
 {date:"26 juillet 2026",en:"26 July 2026",title:"Accueil et lancement du camp",titleEn:"Arrival and camp opening",items:["Accueil et installation par le Bureau national et le secteur hôte","Grande animation, installation et lancement du camp"],itemsEn:["Welcome and installation by the National Office and host sector","Community activities and official camp opening"]},
 {date:"27 juillet 2026",en:"27 July 2026",title:"Spiritualité JEC et économie bleue durable",titleEn:"YCS spirituality and sustainable blue economy",items:["Messe d’ouverture et attentes des jécistes","Révision de vie individuelle et collective par la méthode Voir–Juger–Agir — Père Alain Tega, scj","Économie bleue durable, bassin de la Bénoué et lac de Lagdo — Tchopwe Damou Ezechiel Arnaud","Présentation des compétitions et lancement des activités sportives"],itemsEn:["Opening Mass and participants’ expectations","Individual and collective review of life through See–Judge–Act — Father Alain Tega, scj","Sustainable blue economy, Benue Basin and Lake Lagdo — Tchopwe Damou Ezechiel Arnaud","Competition presentations and launch of sports activities"]},
 {date:"28 juillet 2026",en:"28 July 2026",title:"Bible, discernement et intelligence artificielle",titleEn:"The Bible, discernment and artificial intelligence",items:["Laudes, messe, silence dans la nature, adoration et confessions","La Bible, parole de vie pour l’étudiant chrétien — Abbé Jules Badawe Komo","Intelligence artificielle, dignité humaine et discernement chrétien à l’université — Abbé Didier Gueneyora et Ndiba Ahmadou Patrick","Concours d’art oratoire et compétition sportive inter-secteur"],itemsEn:["Lauds, Mass, silence in nature, adoration and confession","The Bible as a source of life for Christian students — Father Jules Badawe Komo","Artificial intelligence, human dignity and Christian discernment at university — Father Didier Gueneyora and Ndiba Ahmadou Patrick","Public-speaking contest and inter-sector sports competition"]},
 {date:"29 juillet 2026",en:"29 July 2026",title:"Planification, chant et expression",titleEn:"Planning, singing and expression",items:["Planification des activités annuelles et rédaction d’un rapport JEC — Nodém Paul Valdès","Premières phases des concours de chant et de génie théâtral","Concours d’art oratoire, chasse au trésor et compétitions sportives"],itemsEn:["Planning annual activities and writing a JEC report — Nodém Paul Valdès","First rounds of the singing and theatre competitions","Public-speaking contest, treasure hunt and sports competitions"]},
 {date:"30 juillet 2026",en:"30 July 2026",title:"Leadership féminin et valeurs",titleEn:"Women’s leadership and values",items:["Éducation aux valeurs chrétiennes et sociales, leadership féminin et prise de responsabilités — Mme Doudou Françoise","Classe des chants, jeux de mots et préparation de la cérémonie d’engagement","Ateliers pratiques, compétitions et projection cinématographique"],itemsEn:["Christian and social values, women’s leadership and taking responsibility — Doudou Françoise","Singing class, word games and preparation for the commitment ceremony","Practical workshops, competitions and a film screening"]},
 {date:"31 juillet 2026",en:"31 July 2026",title:"Marche pour la paix et 72 ans de la JEC au Cameroun",titleEn:"Peace walk and 72 years of YCS in Cameroon",items:["Marche de sensibilisation sur la paix, visite et action concrète","Célébration des 72 ans de la JEC au Cameroun, telle qu’annoncée dans le livret","Finale du concours de chant et soirée culturelle"],itemsEn:["Peace-awareness walk, visit and practical action","Celebration of 72 years of YCS in Cameroon, as stated in the booklet","Singing competition final and cultural evening"]},
 {date:"1er août 2026",en:"1 August 2026",title:"Journée culturelle et entrepreneuriat numérique",titleEn:"Cultural day and digital entrepreneurship",items:["72 ans d’engagement des jécistes dans l’Église et la société au Cameroun — Dr Vandou Richard","Jeunesse et entrepreneuriat numérique : stratégies et défis — Association VISANTE","Présentation des cultures locales, objets symboliques, mariage traditionnel, mets, danses et langues du secteur hôte"],itemsEn:["72 years of YCS commitment in the Church and society in Cameroon — Dr Vandou Richard","Youth and digital entrepreneurship: strategies and challenges — VISANTE Association","Presentation of local cultures, symbolic objects, traditional marriage, dishes, dances and languages of the host sector"]},
 {date:"2 août 2026",en:"2 August 2026",title:"Célébration, engagement et clôture",titleEn:"Celebration, commitment and closing",items:["Messe et cérémonie d’engagement","Évaluation du camp et lecture du rapport final","Remise des parchemins et photo de famille"],itemsEn:["Mass and commitment ceremony","Camp evaluation and reading of the final report","Certificate presentation and group photo"]}
];

export default function GarouaCampPage(){
 const {lang}=useLanguage();const en=lang==="en";
 return <main className="collab-page">
  <header className="account-header"><Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span><span>conNEcT</span></Link><div><LanguageSwitcher/><Link href="/" className="back-link-inline">{en?"Home":"Accueil"}</Link></div></header>
  <div className="collab-content garoua-feature">
   <Link href="/" className="project-open-link">← {en?"Back to JEC news":"Retour aux actualités JEC"}</Link>
   <p className="eyebrow">{en?"JEC CAMEROON · EVENT MEMORY":"JEC CAMEROUN · MÉMOIRE DU MOUVEMENT"}</p>
   <h1>{en?"Garoua 2026 National University Camp":"Camp National Universitaire Garoua 2026"}</h1>
   <p className="collab-lead">{en?"Active spirituality and responsible citizenship serving a sustainable Cameroon in the digital age":"Éveil de la jeunesse à une spiritualité active et une citoyenneté responsable au service d’un Cameroun durable à l’ère du numérique"}</p>
   <div className="garoua-meta">
    <span>26 juillet – 2 août 2026</span><span>Centre Jeunesse Lumière de Ngalbidjie</span><span>Garoua · Cameroun</span>
   </div>
   <section className="collab-card garoua-source-card">
    <p className="eyebrow">{en?"SOURCE AND SCOPE":"SOURCE ET PÉRIMÈTRE"}</p>
    <p>{en?"This retrospective is based on the camper booklet issued under the heading of the National Office of the Young Christian Students of Cameroon. The booklet states that the programme could be modified; the page therefore presents the published programme, not proof that every activity took place exactly as scheduled.":"Cette rétrospective repose sur le livret du campiste portant l’en-tête du Bureau national de la Jeunesse Étudiante Chrétienne du Cameroun. Le livret précise que le programme était susceptible de modifications : cette page présente donc le programme publié, et non la preuve que chaque activité s’est déroulée exactement comme prévu."}</p>
    <small>{en?"Source: Garoua 2026 camper booklet supplied to JEC-conNEcT.":"Source : livret du campiste de Garoua 2026 transmis à JEC-conNEcT."}</small>
   </section>
   <div className="garoua-highlight-grid">
    <article className="partner-kpi"><strong>8</strong><span>{en?"days in the programme":"journées au programme"}</span></article>
    <article className="partner-kpi"><strong>8</strong><span>{en?"talks and thematic sessions":"exposés et sessions thématiques"}</span></article>
    <article className="partner-kpi"><strong>72 ans</strong><span>{en?"of YCS in Cameroon celebrated in the booklet":"de la JEC au Cameroun célébrés selon le livret"}</span></article>
   </div>
   <section className="collab-card">
    <p className="eyebrow">{en?"GENERAL THEME":"THÈME GÉNÉRAL"}</p>
    <h2>{en?"Active spirituality, responsible citizenship and digital transformation":"Spiritualité active, citoyenneté responsable et transformation numérique"}</h2>
    <p>{en?"The camp connected personal and collective spirituality with civic responsibility, local development, the digital world, human dignity and Christian discernment.":"Le camp reliait la spiritualité personnelle et collective à la responsabilité citoyenne, au développement local, au monde numérique, à la dignité humaine et au discernement chrétien."}</p>
   </section>
   <section className="garoua-days">
    <div className="section-heading"><div><p className="eyebrow">{en?"PUBLISHED PROGRAMME":"PROGRAMME PUBLIÉ"}</p><h2>{en?"Eight days in Garoua":"Huit journées à Garoua"}</h2></div></div>
    {days.map((day,index)=><article className="collab-card garoua-day" key={day.date}>
      <div className="garoua-day-heading"><span>{String(index+1).padStart(2,"0")}</span><div><small>{en?day.en:day.date}</small><h3>{en?day.titleEn:day.title}</h3></div></div>
      <ul>{(en?day.itemsEn:day.items).map(item=><li key={item}>{item}</li>)}</ul>
    </article>)}
   </section>
   <section className="collab-card garoua-speakers">
    <p className="eyebrow">{en?"CONTRIBUTORS NAMED IN THE BOOKLET":"INTERVENANTS CITÉS DANS LE LIVRET"}</p>
    <div className="garoua-speaker-list">
     {["Père Alain Tega, scj","Tchopwe Damou Ezechiel Arnaud","Abbé Jules Badawe Komo","Abbé Didier Gueneyora","Ndiba Ahmadou Patrick","Nodem Paul Valdès","Doudou Françoise","Dr Vandou Richard","Association VISANTE"].map(x=><span key={x}>{x}</span>)}
    </div>
   </section>
   <section className="collab-card garoua-caveat">
    <strong>{en?"Institutional note":"Précision institutionnelle"}</strong>
    <p>{en?"The booklet identifies the National Office of YCS Cameroon, the Centre Jeunesse Lumière de Ngalbidjie and a “host sector”. It does not provide the official name, address or contact persons of the Garoua local structure. The Garoua partner record is therefore awaiting confirmation.":"Le livret identifie le Bureau national de la JEC du Cameroun, le Centre Jeunesse Lumière de Ngalbidjie et un « secteur hôte ». Il ne fournit pas le nom officiel, l’adresse ni les responsables de la structure locale de Garoua. La fiche partenaire de Garoua est donc en attente de confirmation."}</p>
   </section>
   <Link href="/partenaires" className="primary-button">{en?"Open the JEC partner directory →":"Ouvrir l’annuaire des partenaires JEC →"}</Link>
  </div>
 </main>;
}
