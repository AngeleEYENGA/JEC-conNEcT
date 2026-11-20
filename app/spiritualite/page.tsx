"use client";

import Link from "next/link";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";

export default function SpiritualityPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const t = (fr: string, english: string) => en ? english : fr;

  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const calendarUrl = `https://www.aelf.org/calendrier/romain/${today.getFullYear()}/${month}`;

  return (
    <main className="collab-page spirituality-page">
      <header className="account-header">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span>
          <span>conNEcT</span>
        </Link>
        <div>
          <LanguageSwitcher />
          <Link href="/" className="back-link-inline">{t("Retour au portail", "Back to portal")}</Link>
        </div>
      </header>

      <div className="collab-content spiritual-content">
        <p className="eyebrow">{t("FOI · VIE · ENGAGEMENT", "FAITH · LIFE · COMMITMENT")}</p>
        <h1>{t("Spiritualité JEC", "JEC spirituality")}</h1>
        <p className="collab-lead">
          {t(
            "Un espace pour nourrir sa foi, prendre du recul, prier ensemble et relier la Parole à nos engagements dans la vie étudiante et dans la société.",
            "A space to nurture faith, pause and reflect, pray together, and connect the Word with our commitments in student life and society."
          )}
        </p>

        <section className="spiritual-hero">
          <div className="spiritual-hero-symbol" aria-hidden="true">✧</div>
          <p className="eyebrow light">{t("PRENDRE UN TEMPS POUR L'ESSENTIEL", "MAKE ROOM FOR WHAT MATTERS")}</p>
          <h2>{t("Voir, discerner, agir : une foi qui se vit", "See, discern, act: a faith put into practice")}</h2>
          <p>
            {t(
              "La spiritualité JEC ne se limite pas à un moment de prière : elle éclaire notre regard sur le monde et soutient un engagement concret, responsable et fraternel.",
              "JEC spirituality is more than a moment of prayer: it shapes how we see the world and supports concrete, responsible and fraternal action."
            )}
          </p>
          <div className="spiritual-hero-footer">
            <span>{t("Un espace ouvert à toutes et tous", "An open space for everyone")}</span>
            <span>{t("Ressources publiques", "Public resources")}</span>
          </div>
        </section>

        <section className="spiritual-calendar-promo">
          <div>
            <p className="eyebrow">{t("REPÈRES DE L'ANNÉE", "YEARLY HIGHLIGHTS")}</p>
            <h2>{t("Le calendrier spirituel JEC 2026–2027", "The 2026–2027 JEC spiritual calendar")}</h2>
            <p>{t("Temps liturgiques, fêtes chrétiennes et journées internationales, avec des pistes pour animer la vie de nos équipes.", "Liturgical seasons, Christian celebrations and international days, with ideas to animate our teams.")}</p>
          </div>
          <Link href="/spiritualite/calendrier" className="spiritual-cta">{t("Explorer le calendrier", "Explore the calendar")} →</Link>
        </section>

        <section className="spiritual-calendar-promo spiritual-builder-promo">
          <div>
            <p className="eyebrow">{t("ANIMER UNE RENCONTRE", "FACILITATE A GATHERING")}</p>
            <h2>{t("Préparer un temps spi avec son équipe", "Prepare a spiritual gathering with your team")}</h2>
            <p>{t("Construis ton déroulé, choisis une méditation, adapte les questions et imprime une fiche prête à animer.", "Build your agenda, choose a reflection, adapt the questions and print a ready-to-use session sheet.")}</p>
          </div>
          <Link href="/spiritualite/preparer" className="spiritual-cta">{t("Préparer un temps spi", "Prepare a gathering")} →</Link>
        </section>

        <section className="spiritual-calendar-promo spiritual-share-promo">
          <div>
            <p className="eyebrow">{t("PARTAGE ENTRE ÉQUIPES", "SHARE BETWEEN TEAMS")}</p>
            <h2>{t("Partager prières et méditations", "Share prayers and reflections")}</h2>
            <p>{t("Découvre les ressources proposées par les équipes JEC et soumets tes propres contributions pour relecture.", "Discover resources shared by JEC teams and submit your own contributions for review.")}</p>
          </div>
          <Link href="/spiritualite/partager" className="spiritual-cta">{t("Espace de partage", "Sharing space")} →</Link>
        </section>

        <section className="collab-section spiritual-section">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("PAROLE ET LITURGIE", "SCRIPTURE & LITURGY")}</p>
              <h2>{t("Se nourrir de la Parole", "Nourish yourself with the Word")}</h2>
            </div>
          </div>
          <div className="spiritual-resource-grid">
            <article className="spiritual-resource-card">
              <span className="spiritual-resource-icon">📖</span>
              <p className="collab-type">{t("LECTURES QUOTIDIENNES", "DAILY READINGS")}</p>
              <h3>{t("Les lectures du jour", "Daily readings")}</h3>
              <p>{t("Retrouve la première lecture, le psaume et l'Évangile du jour sur le site liturgique de référence en français.", "Read the first reading, psalm and Gospel of the day on the official French-language liturgical resource.")}</p>
              <a className="spiritual-cta" href="https://www.aelf.org/" target="_blank" rel="noopener noreferrer">
                {t("Consulter les lectures", "Open daily readings")} ↗
              </a>
            </article>

            <article className="spiritual-resource-card">
              <span className="spiritual-resource-icon">🗓</span>
              <p className="collab-type">{t("ANNÉE LITURGIQUE", "LITURGICAL YEAR")}</p>
              <h3>{t("Calendrier liturgique", "Liturgical calendar")}</h3>
              <p>{t("Repère les temps liturgiques, les fêtes et les mémoires célébrées au fil de l'année.", "Explore liturgical seasons, feasts and memorials throughout the year.")}</p>
              <a className="spiritual-cta" href={calendarUrl} target="_blank" rel="noopener noreferrer">
                {t("Voir le calendrier", "View the calendar")} ↗
              </a>
            </article>

            <article className="spiritual-resource-card">
              <span className="spiritual-resource-icon">🕯</span>
              <p className="collab-type">{t("PRIÈRE DE L'ÉGLISE", "PRAYER OF THE CHURCH")}</p>
              <h3>{t("Liturgie des Heures", "Liturgy of the Hours")}</h3>
              <p>{t("Accède aux offices de prière : laudes, vêpres et autres heures pour rythmer la journée.", "Access the Church's daily prayer: morning prayer, evening prayer and the other hours.")}</p>
              <a className="spiritual-cta" href="https://www.aelf.org/" target="_blank" rel="noopener noreferrer">
                {t("Prier avec l'AELF", "Pray with AELF")} ↗
              </a>
            </article>
          </div>
          <p className="spiritual-source-note">
            {t("Les textes liturgiques sont consultés auprès de l'AELF. JEC-conNEcT renvoie vers la source afin de respecter ses conditions de diffusion.", "Liturgical texts are consulted from AELF. JEC-conNEcT links to the source and respects its distribution terms.")}
          </p>
        </section>

        <section className="collab-section spiritual-section">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("ANIMATION DE GROUPE", "GROUP REFLECTION")}</p>
              <h2>{t("Préparer un temps spi JEC", "Prepare a JEC spiritual reflection")}</h2>
            </div>
            <span>{t("Démarche Voir – Juger – Agir", "See – Judge – Act approach")}</span>
          </div>
          <p className="spiritual-intro">
            {t("Une trame simple pour une rencontre de groupe, une réunion d'équipe ou un moment de retraite. L'évaluation accompagne chaque étape, puis permet de relire l'action menée.", "A simple outline for a group gathering, team meeting or retreat. Evaluation accompanies every stage and helps the group reflect on what it has done.")}
          </p>
          <div className="spiritual-steps">
            <article className="spiritual-step">
              <span>01</span>
              <h3>{t("VOIR", "SEE")}</h3>
              <p>{t("Regarder le réel dans notre milieu d'étude et la société : qu'est-ce qui nous interpelle, nous réjouit ou nous blesse ?", "Look at reality in our place of study and in society: what challenges, encourages or hurts us?")}</p>
            </article>
            <article className="spiritual-step">
              <span>02</span>
              <h3>{t("JUGER / DISCERNER", "JUDGE / DISCERN")}</h3>
              <p>{t("Comprendre la situation avec nos connaissances et nos expériences, puis l'éclairer par la Parole et les valeurs humanistes et chrétiennes.", "Understand the situation through our knowledge and experience, then reflect on it in the light of Scripture and humanist and Christian values.")}</p>
            </article>
            <article className="spiritual-step">
              <span>03</span>
              <h3>{t("AGIR", "ACT")}</h3>
              <p>{t("Choisir un engagement concret, individuel ou collectif, réaliste et adapté à la situation.", "Choose a concrete, individual or collective commitment that is realistic and suited to the situation.")}</p>
            </article>
            <article className="spiritual-step">
              <span>04</span>
              <h3>{t("ÉVALUER", "EVALUATE")}</h3>
              <p>{t("Relire ce qui a été tenté : qu'avons-nous appris, quel effet cela a-t-il eu et quelle sera la prochaine étape ?", "Review what was attempted: what did we learn, what difference did it make, and what comes next?")}</p>
            </article>
          </div>
          <div className="spiritual-method-source">
            {t("Cette présentation reprend la démarche publiée par la JEC France : l'évaluation accompagne tout le processus. Le VJA reste un outil souple, pas un carcan.", "This presentation follows the approach published by JEC France: evaluation accompanies the whole process. See–Judge–Act is a flexible tool, not a rigid framework.")}
            {" "}<a href="https://jecfrance.org/notre-demarche/" target="_blank" rel="noopener noreferrer">{t("Lire la démarche officielle", "Read the official approach")} ↗</a>
          </div>
          <div className="spiritual-meeting-tip">
            <strong>{t("Suggestion d'animation", "Facilitation suggestion")}</strong>
            <p>{t("Commencer par un court silence, lire le texte biblique, laisser un temps de réflexion personnelle, partager librement, puis terminer par un engagement concret et une prière.", "Begin with a moment of silence, read the biblical text, allow time for personal reflection, share openly, then close with a concrete commitment and a prayer.")}</p>
          </div>
        </section>

        <section className="collab-section spiritual-section">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("PARCOURS DE MÉDITATION", "GUIDED REFLECTIONS")}</p>
              <h2>{t("Relier la foi à la vie étudiante", "Connecting faith with student life")}</h2>
            </div>
            <span>{t("3 propositions · 15 à 20 min", "3 ideas · 15–20 min")}</span>
          </div>
          <p className="spiritual-intro">
            {t("Ces trames sont des propositions originales de JEC-conNEcT, inspirées des orientations publiques de la JEC France. Elles ne sont pas présentées comme des textes officiellement adoptés : chaque équipe peut les adapter et les faire relire par ses responsables.", "These outlines are original JEC-conNEcT suggestions inspired by JEC France's public orientations. They are not presented as officially adopted texts: each team may adapt them and have them reviewed by its leaders.")}
          </p>
          <div className="spiritual-meditation-grid">
            <article className="spiritual-meditation-card">
              <div className="spiritual-meditation-top">
                <span className="spiritual-resource-icon">🎓</span>
                <span className="spiritual-duration">{t("15–20 MIN", "15–20 MIN")}</span>
              </div>
              <p className="collab-type">{t("ÉCOLE & VOCATION", "STUDIES & VOCATION")}</p>
              <h3>{t("Être lumière dans son milieu d'études", "Being a light in our place of study")}</h3>
              <p className="spiritual-scripture">{t("Parole à lire : Matthieu 5, 13–16", "Scripture: Matthew 5:13–16")}</p>
              <p>{t("Prendre conscience de ce que nous vivons à l'école ou à l'université : réussite, pression, solitude, injustices, entraide et espérance.", "Notice what we experience at school or university: success, pressure, loneliness, injustice, mutual support and hope.")}</p>
              <div className="spiritual-reflection">
                <strong>{t("Pour le partage", "For sharing")}</strong>
                <ul>
                  <li>{t("Qu'est-ce qui donne du goût et du sens à ma vie étudiante ?", "What gives flavour and meaning to my student life?")}</li>
                  <li>{t("Qui, autour de moi, a besoin d'écoute ou de soutien ?", "Who around me needs someone to listen or offer support?")}</li>
                  <li>{t("Quel petit geste peut rendre notre lieu d'étude plus humain ?", "What small action could make our place of study more humane?")}</li>
                </ul>
              </div>
              <div className="spiritual-practice">
                <strong>{t("Prière proposée", "Suggested prayer")}</strong>
                <p>{t("Seigneur, ouvre nos yeux sur celles et ceux que nous croisons chaque jour. Donne-nous le courage d'encourager, d'accueillir et de contribuer à une communauté où chacun trouve sa place. Amen.", "Lord, open our eyes to the people we meet each day. Give us the courage to encourage, welcome and help build a community where everyone can find their place. Amen.")}</p>
              </div>
            </article>

            <article className="spiritual-meditation-card">
              <div className="spiritual-meditation-top">
                <span className="spiritual-resource-icon">🤝</span>
                <span className="spiritual-duration">{t("15–20 MIN", "15–20 MIN")}</span>
              </div>
              <p className="collab-type">{t("ÉGLISE & SOCIÉTÉ", "CHURCH & SOCIETY")}</p>
              <h3>{t("De la compassion à la fraternité active", "From compassion to active solidarity")}</h3>
              <p className="spiritual-scripture">{t("Parole à lire : Luc 10, 25–37", "Scripture: Luke 10:25–37")}</p>
              <p>{t("Méditer sur l'attention portée à l'autre et sur la manière dont la foi peut inspirer des gestes concrets de solidarité, sans exclure celles et ceux qui ne partagent pas la même croyance.", "Reflect on care for others and on how faith can inspire concrete acts of solidarity, while welcoming people who do not share the same beliefs.")}</p>
              <div className="spiritual-reflection">
                <strong>{t("Pour le partage", "For sharing")}</strong>
                <ul>
                  <li>{t("Qui est parfois laissé au bord du chemin dans notre environnement ?", "Who is sometimes left by the roadside in our environment?")}</li>
                  <li>{t("Qu'est-ce qui nous empêche de nous rapprocher de cette personne ou de ce groupe ?", "What prevents us from drawing closer to this person or group?")}</li>
                  <li>{t("Quelle action de solidarité pouvons-nous mener ensemble ?", "What act of solidarity can we carry out together?")}</li>
                </ul>
              </div>
              <div className="spiritual-practice">
                <strong>{t("Prière proposée", "Suggested prayer")}</strong>
                <p>{t("Dieu de bonté, apprends-nous à ne pas détourner le regard. Fais grandir en nous l'écoute, le respect et la fraternité, afin que notre engagement devienne un signe concret d'espérance. Amen.", "God of goodness, teach us not to look away. Deepen in us listening, respect and fraternity, so that our commitment may become a concrete sign of hope. Amen.")}</p>
              </div>
            </article>

            <article className="spiritual-meditation-card">
              <div className="spiritual-meditation-top">
                <span className="spiritual-resource-icon">🌱</span>
                <span className="spiritual-duration">{t("15–20 MIN", "15–20 MIN")}</span>
              </div>
              <p className="collab-type">{t("ESPÉRANCE & ENVIRONNEMENT", "HOPE & ENVIRONMENT")}</p>
              <h3>{t("Prendre soin de la maison commune", "Caring for our common home")}</h3>
              <p className="spiritual-scripture">{t("Parole à lire : Genèse 2, 15", "Scripture: Genesis 2:15")}</p>
              <p>{t("Relire notre rapport à la création, aux ressources et aux personnes les plus exposées aux crises environnementales. Passer de l'inquiétude à une responsabilité partagée.", "Reflect on our relationship with creation, resources and people most exposed to environmental crises. Move from anxiety to shared responsibility.")}</p>
              <div className="spiritual-reflection">
                <strong>{t("Pour le partage", "For sharing")}</strong>
                <ul>
                  <li>{t("Quelles réalités environnementales observons-nous autour de nous ?", "What environmental realities do we observe around us?")}</li>
                  <li>{t("Qui en subit le plus les conséquences ?", "Who bears the greatest consequences?")}</li>
                  <li>{t("Quelle habitude ou action collective pouvons-nous faire évoluer ?", "What habit or collective action could we change?")}</li>
                </ul>
              </div>
              <div className="spiritual-practice">
                <strong>{t("Prière proposée", "Suggested prayer")}</strong>
                <p>{t("Créateur de toute vie, rends-nous attentifs à la beauté et à la fragilité du monde. Aide-nous à faire des choix sobres, solidaires et durables, au service des générations présentes et futures. Amen.", "Creator of all life, make us attentive to the beauty and fragility of the world. Help us make choices that are mindful, caring and sustainable, for present and future generations. Amen.")}</p>
              </div>
            </article>
          </div>
        </section>

        <section className="spiritual-intentions-grid">
          <article className="spiritual-intentions-card">
            <p className="eyebrow">{t("PORTER DANS LA PRIÈRE", "HOLD IN PRAYER")}</p>
            <h2>{t("Intentions pour nos équipes et le monde", "Intentions for our teams and the world")}</h2>
            <p>{t("Quelques pistes à reprendre librement au début ou à la fin d'une rencontre. Elles sont proposées par JEC-conNEcT et peuvent être reformulées par chaque équipe.", "A few prompts to use freely at the beginning or end of a gathering. They are suggested by JEC-conNEcT and can be adapted by each team.")}</p>
            <ul className="spiritual-intention-list">
              <li><strong>{t("Vie étudiante", "Student life")}</strong><span>{t("Pour les jeunes qui traversent la précarité, l'isolement, le doute ou des difficultés dans leurs études.", "For young people facing hardship, isolation, uncertainty or difficulties in their studies.")}</span></li>
              <li><strong>{t("Vie des équipes", "Team life")}</strong><span>{t("Pour que nos équipes soient des lieux d'écoute, d'accueil, de formation, de confiance et d'engagement.", "That our teams may be places of listening, welcome, formation, trust and commitment.")}</span></li>
              <li><strong>{t("Paix et fraternité", "Peace and fraternity")}</strong><span>{t("Pour les personnes touchées par les conflits, les injustices et les discriminations, et pour celles et ceux qui œuvrent au dialogue.", "For people affected by conflict, injustice and discrimination, and for all who work for dialogue.")}</span></li>
              <li><strong>{t("Création", "Creation")}</strong><span>{t("Pour que nous prenions soin de notre environnement et construisions des modes de vie plus solidaires.", "That we may care for our environment and build more supportive ways of living.")}</span></li>
            </ul>
          </article>
          <article className="spiritual-contribute-card">
            <span className="spiritual-resource-icon">✉</span>
            <p className="collab-type">{t("PARTAGER UNE RESSOURCE", "SHARE A RESOURCE")}</p>
            <h2>{t("Une méditation à proposer ?", "Have a reflection to share?")}</h2>
            <p>{t("Les témoignages, fiches d'animation, prières et intentions proposés par les groupes pourront enrichir cet espace après relecture et validation par les responsables concernés.", "Testimonies, activity sheets, prayers and intentions from local groups can enrich this space after review and approval by the relevant leaders.")}</p>
            <a className="spiritual-cta" href="https://jecfrance.org/contact/" target="_blank" rel="noopener noreferrer">
              {t("Contacter la JEC France", "Contact JEC France")} ↗
            </a>
            <small>{t("Ce lien ouvre le formulaire officiel de contact ; aucune contribution n'est publiée automatiquement.", "This link opens the official contact form; no contribution is published automatically.")}</small>
          </article>
        </section>

        <section className="collab-section spiritual-section">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("RESSOURCES DU MOUVEMENT", "MOVEMENT RESOURCES")}</p>
              <h2>{t("Pour aller plus loin", "Explore further")}</h2>
            </div>
          </div>
          <div className="spiritual-official-links">
            <a href="https://jecfrance.org/notre-demarche/" target="_blank" rel="noopener noreferrer">
              <strong>{t("La démarche Voir, Juger, Agir", "The See, Judge, Act approach")}</strong>
              <span>{t("Comprendre les étapes et la place de l'évaluation.", "Understand the stages and the role of evaluation.")}</span>
              <b>↗</b>
            </a>
            <a href="https://jecfrance.org/nos-orientations/" target="_blank" rel="noopener noreferrer">
              <strong>{t("Les orientations de la JEC France", "JEC France orientations")}</strong>
              <span>{t("Église, société, international, environnement et vie du mouvement.", "Church, society, international, environment and movement life.")}</span>
              <b>↗</b>
            </a>
            <a href="https://jecfrance.org/boite-a-outils/" target="_blank" rel="noopener noreferrer">
              <strong>{t("La boîte à outils JEC", "JEC toolkit")}</strong>
              <span>{t("Fiches d'animation et ressources classées par thématique.", "Activity sheets and resources organised by topic.")}</span>
              <b>↗</b>
            </a>
          </div>
        </section>

        <section className="spiritual-bottom-grid">
          <article className="spiritual-prayer-card">
            <p className="eyebrow light">{t("PRIÈRE À MÉDITER", "A PRAYER TO MEDITATE ON")}</p>
            <h2>{t("Prière pour notre engagement", "A prayer for our commitment")}</h2>
            <p className="spiritual-prayer-text">
              {t(
                "Seigneur, apprends-nous à regarder le monde avec attention, à discerner ce qui construit la dignité de chacun et à agir avec courage et fraternité. Que notre foi éclaire nos choix et soutienne notre engagement au service des autres. Amen.",
                "Lord, teach us to look at the world with care, to discern what upholds the dignity of each person, and to act with courage and fraternity. May our faith enlighten our choices and sustain our commitment to serving others. Amen."
              )}
            </p>
            <small>{t("Proposition de méditation originale pour JEC-conNEcT.", "An original prayer proposal for JEC-conNEcT.")}</small>
          </article>

          <article className="spiritual-music-card">
            <span className="spiritual-resource-icon">♫</span>
            <p className="collab-type">{t("PATRIMOINE MUSICAL", "MUSICAL HERITAGE")}</p>
            <h2>{t("Prier et chanter ensemble", "Pray and sing together")}</h2>
            <p>{t("Retrouve le chant de ralliement et l'hymne JEC, leurs paroles et les enregistrements publiés.", "Find the JEC rallying song and anthem, their lyrics and published recordings.")}</p>
            <Link href="/chants" className="spiritual-cta">{t("Ouvrir les chants & hymnes", "Open songs & anthems")} →</Link>
          </article>
        </section>

        <section className="spiritual-validation-note">
          <strong>{t("Un espace appelé à grandir avec les mouvements", "A space that will grow with the movements")}</strong>
          <p>{t("Les méditations, intentions de prière, ressources de formation et propositions des groupes JEC pourront être ajoutées ici après vérification et validation par les responsables concernés.", "Meditations, prayer intentions, formation resources and proposals from JEC groups can be added here after review and approval by the relevant leaders.")}</p>
        </section>
      </div>
    </main>
  );
}
