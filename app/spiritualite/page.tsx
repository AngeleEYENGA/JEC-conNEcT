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
            {t("Une trame simple pour une rencontre de groupe, une réunion d'équipe ou un moment de retraite.", "A simple outline for a group gathering, team meeting or retreat.") }
          </p>
          <div className="spiritual-steps">
            <article className="spiritual-step">
              <span>01</span>
              <h3>{t("VOIR", "SEE")}</h3>
              <p>{t("Quelle situation de notre vie étudiante, de notre quartier ou du monde nous interpelle aujourd'hui ?", "What situation in student life, our neighbourhood or the world challenges us today?")}</p>
            </article>
            <article className="spiritual-step">
              <span>02</span>
              <h3>{t("JUGER / DISCERNER", "JUDGE / DISCERN")}</h3>
              <p>{t("Que nous dit la Parole ? Quelles valeurs évangéliques peuvent éclairer cette situation ?", "What does Scripture say to us? Which Gospel values can shed light on this situation?")}</p>
            </article>
            <article className="spiritual-step">
              <span>03</span>
              <h3>{t("AGIR", "ACT")}</h3>
              <p>{t("Quel geste concret, réaliste et collectif pouvons-nous poser après ce temps de partage ?", "What concrete, realistic and collective action can we take after this reflection?")}</p>
            </article>
          </div>
          <div className="spiritual-meeting-tip">
            <strong>{t("Suggestion d'animation", "Facilitation suggestion")}</strong>
            <p>{t("Commencer par un court silence, lire le texte biblique, laisser un temps de réflexion personnelle, partager librement, puis terminer par un engagement concret et une prière.", "Begin with a moment of silence, read the biblical text, allow time for personal reflection, share openly, then close with a concrete commitment and a prayer.")}</p>
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
