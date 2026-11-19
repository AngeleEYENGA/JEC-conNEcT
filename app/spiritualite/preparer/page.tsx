"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";

type Theme = {
  id: string;
  labelFr: string;
  labelEn: string;
  passage: string;
  objectiveFr: string;
  objectiveEn: string;
  questionFr: string[];
  questionEn: string[];
  actionFr: string;
  actionEn: string;
  prayerFr: string;
  prayerEn: string;
};

const themes: Theme[] = [
  {
    id: "student-life",
    labelFr: "Vie étudiante et espérance",
    labelEn: "Student life and hope",
    passage: "Matthieu 5, 13–16",
    objectiveFr: "Relire notre vie étudiante et discerner comment contribuer à un milieu d'étude plus juste, accueillant et porteur d'espérance.",
    objectiveEn: "Reflect on student life and discern how to contribute to a more just, welcoming and hopeful learning environment.",
    questionFr: ["Qu'est-ce qui donne du goût et du sens à ma vie étudiante ?", "Qui, autour de nous, a besoin d'écoute ou de soutien ?", "Quel geste peut rendre notre lieu d'étude plus humain ?"],
    questionEn: ["What gives flavour and meaning to my student life?", "Who around us needs someone to listen or offer support?", "What action could make our place of study more humane?"],
    actionFr: "Choisir une initiative simple d'accueil, d'entraide ou de sensibilisation dans le milieu d'étude.",
    actionEn: "Choose a simple initiative for welcome, mutual support or awareness in the learning environment.",
    prayerFr: "Seigneur, ouvre nos yeux sur celles et ceux que nous croisons chaque jour. Donne-nous le courage d'encourager, d'accueillir et de contribuer à une communauté où chacun trouve sa place. Amen.",
    prayerEn: "Lord, open our eyes to the people we meet each day. Give us the courage to encourage, welcome and help build a community where everyone can find their place. Amen."
  },
  {
    id: "solidarity",
    labelFr: "Fraternité et solidarité",
    labelEn: "Fraternity and solidarity",
    passage: "Luc 10, 25–37",
    objectiveFr: "Passer d'une compassion ressentie à une solidarité concrète, construite avec les personnes concernées.",
    objectiveEn: "Move from compassion to concrete solidarity, shaped together with the people concerned.",
    questionFr: ["Qui est parfois laissé au bord du chemin dans notre environnement ?", "Qu'est-ce qui nous empêche de nous rapprocher ?", "Quelle action pouvons-nous mener sans parler à la place des personnes concernées ?"],
    questionEn: ["Who is sometimes left by the roadside in our environment?", "What prevents us from drawing closer?", "What action can we take without speaking on behalf of those concerned?"],
    actionFr: "Identifier une initiative locale et demander aux personnes concernées comment l'équipe peut être utile.",
    actionEn: "Identify a local initiative and ask the people concerned how the team can be helpful.",
    prayerFr: "Dieu de bonté, apprends-nous à ne pas détourner le regard. Fais grandir en nous l'écoute, le respect et la fraternité, afin que notre engagement devienne un signe concret d'espérance. Amen.",
    prayerEn: "God of goodness, teach us not to look away. Deepen in us listening, respect and fraternity, so that our commitment may become a concrete sign of hope. Amen."
  },
  {
    id: "creation",
    labelFr: "Création et maison commune",
    labelEn: "Creation and our common home",
    passage: "Genèse 2, 15",
    objectiveFr: "Relire notre rapport à la création et identifier une responsabilité individuelle et collective réaliste.",
    objectiveEn: "Reflect on our relationship with creation and identify a realistic individual and collective responsibility.",
    questionFr: ["Quelles réalités environnementales observons-nous autour de nous ?", "Qui en subit le plus les conséquences ?", "Quelle habitude de notre équipe pouvons-nous faire évoluer ?"],
    questionEn: ["What environmental realities do we observe around us?", "Who bears the greatest consequences?", "What team habit could we change?"],
    actionFr: "Définir une action mesurable : mobilité, sobriété numérique, réduction des déchets ou protection du vivant.",
    actionEn: "Define a measurable action: mobility, digital sobriety, waste reduction or protection of biodiversity.",
    prayerFr: "Créateur de toute vie, rends-nous attentifs à la beauté et à la fragilité du monde. Aide-nous à faire des choix sobres, solidaires et durables, au service des générations présentes et futures. Amen.",
    prayerEn: "Creator of all life, make us attentive to the beauty and fragility of the world. Help us make mindful, caring and sustainable choices for present and future generations. Amen."
  },
  {
    id: "peace",
    labelFr: "Paix, dialogue et réconciliation",
    labelEn: "Peace, dialogue and reconciliation",
    passage: "Matthieu 5, 9",
    objectiveFr: "Identifier ce qui nourrit les tensions et discerner des attitudes concrètes de dialogue et de paix.",
    objectiveEn: "Identify what fuels tensions and discern practical attitudes of dialogue and peace.",
    questionFr: ["Quelles tensions traversent notre milieu ?", "Quelles paroles ou habitudes aggravent les conflits ?", "Quel premier pas de dialogue est possible sans nier les désaccords ?"],
    questionEn: ["What tensions affect our environment?", "Which words or habits make conflicts worse?", "What first step toward dialogue is possible without denying disagreement?"],
    actionFr: "Choisir une démarche de dialogue, d'écoute ou de médiation adaptée à une situation concrète.",
    actionEn: "Choose a dialogue, listening or mediation step suited to a real situation.",
    prayerFr: "Dieu de paix, apprends-nous à écouter sans mépriser, à parler sans blesser et à rechercher la vérité avec respect. Fais de nos équipes des lieux de dialogue et de réconciliation. Amen.",
    prayerEn: "God of peace, teach us to listen without contempt, speak without hurting and seek truth with respect. Make our teams places of dialogue and reconciliation. Amen."
  },
  {
    id: "justice",
    labelFr: "Justice et dignité humaine",
    labelEn: "Justice and human dignity",
    passage: "Michée 6, 8",
    objectiveFr: "Relier la réflexion sur la dignité humaine à une action juste, inclusive et respectueuse des personnes.",
    objectiveEn: "Connect reflection on human dignity with action that is just, inclusive and respectful.",
    questionFr: ["Quelles injustices sont visibles ou invisibles dans notre milieu ?", "Qui est peu entendu dans les décisions qui le concernent ?", "Comment notre équipe peut-elle agir sans exposer ni stigmatiser ?"],
    questionEn: ["Which injustices are visible or invisible in our environment?", "Who is rarely heard in decisions that concern them?", "How can our team act without exposing or stigmatising anyone?"],
    actionFr: "Formuler une proposition d'amélioration avec les personnes concernées et vérifier qu'elle ne crée pas de nouveaux risques.",
    actionEn: "Develop an improvement proposal with those concerned and check that it does not create new risks.",
    prayerFr: "Dieu de justice, rends-nous attentifs à la dignité de chaque personne. Donne-nous le courage de défendre ce qui est juste avec humilité, discernement et persévérance. Amen.",
    prayerEn: "God of justice, make us attentive to every person's dignity. Give us the courage to stand for what is right with humility, discernment and perseverance. Amen."
  }
];

const sessionDurations = [
  { value: 45, label: "45 min" },
  { value: 60, label: "1 h" },
  { value: 90, label: "1 h 30" }
];

function buildSchedule(duration: number, t: (fr: string, en: string) => string) {
  if (duration === 45) return [
    { minutes: 5, step: t("Accueil et mise en présence", "Welcome and settling in"), prompt: t("Un mot pour dire comment j'arrive aujourd'hui.", "One word to say how I arrive today.") },
    { minutes: 5, step: t("Lecture et silence", "Reading and silence"), prompt: t("Lire le passage lentement, puis garder un court silence.", "Read the passage slowly, then keep a short silence.") },
    { minutes: 8, step: t("VOIR", "SEE"), prompt: t("Décrire les faits et les expériences sans juger trop vite.", "Describe facts and experiences without rushing to judgement.") },
    { minutes: 10, step: t("JUGER / DISCERNER", "JUDGE / DISCERN"), prompt: t("Éclairer la situation par la Parole, les valeurs et les expériences du groupe.", "Reflect on the situation through Scripture, values and the group's experiences.") },
    { minutes: 10, step: t("AGIR", "ACT"), prompt: t("Choisir une action concrète, faisable et construite avec les personnes concernées.", "Choose a concrete, realistic action shaped with those concerned.") },
    { minutes: 5, step: t("Prière et envoi", "Prayer and sending forth"), prompt: t("Confier l'engagement et les personnes concernées dans la prière.", "Entrust the commitment and those concerned in prayer.") },
    { minutes: 2, step: t("ÉVALUER", "EVALUATE"), prompt: t("Un apprentissage et une prochaine étape.", "One learning and one next step.") }
  ];
  if (duration === 90) return [
    { minutes: 10, step: t("Accueil et météo du groupe", "Welcome and group check-in"), prompt: t("Créer un climat d'écoute et poser le cadre de l'échange.", "Create a listening atmosphere and set the ground rules.") },
    { minutes: 15, step: t("VOIR", "SEE"), prompt: t("Partir d'observations, de faits et d'expériences vécues dans le milieu.", "Start from observations, facts and experiences in the environment.") },
    { minutes: 10, step: t("Écoute de la Parole", "Listening to Scripture"), prompt: t("Lire le texte, reformuler ce qui touche le groupe et garder un silence.", "Read the text, share what speaks to the group and keep a moment of silence.") },
    { minutes: 20, step: t("JUGER / DISCERNER", "JUDGE / DISCERN"), prompt: t("Croiser la Parole, les valeurs, les savoirs et les points de vue.", "Bring Scripture, values, knowledge and perspectives into conversation.") },
    { minutes: 15, step: t("AGIR", "ACT"), prompt: t("Co-construire une action, ses responsables, ses moyens et son échéance.", "Co-design an action, its responsibilities, resources and deadline.") },
    { minutes: 10, step: t("Prière et engagement", "Prayer and commitment"), prompt: t("Relire l'engagement et prier librement ou avec la prière proposée.", "Review the commitment and pray freely or with the suggested prayer.") },
    { minutes: 10, step: t("ÉVALUER", "EVALUATE"), prompt: t("Faire le tour des apprentissages, limites et suites à donner.", "Review learnings, limits and follow-up steps.") }
  ];
  return [
    { minutes: 5, step: t("Accueil et ouverture", "Welcome and opening"), prompt: t("Installer un climat d'écoute et présenter l'objectif.", "Create a listening atmosphere and introduce the objective.") },
    { minutes: 10, step: t("VOIR", "SEE"), prompt: t("Décrire la situation, écouter plusieurs expériences et distinguer faits et interprétations.", "Describe the situation, listen to different experiences and distinguish facts from interpretations.") },
    { minutes: 8, step: t("Écoute de la Parole", "Listening to Scripture"), prompt: t("Lire le passage biblique et laisser un temps de silence.", "Read the biblical passage and allow a moment of silence.") },
    { minutes: 15, step: t("JUGER / DISCERNER", "JUDGE / DISCERN"), prompt: t("Mettre en dialogue la Parole, les valeurs et les réalités observées.", "Bring Scripture, values and observed realities into dialogue.") },
    { minutes: 10, step: t("AGIR", "ACT"), prompt: t("Décider d'un engagement concret avec une personne référente et une échéance.", "Decide on a concrete commitment with an owner and a deadline.") },
    { minutes: 7, step: t("Prière et envoi", "Prayer and sending forth"), prompt: t("Confier le groupe, les personnes concernées et l'action à venir.", "Entrust the group, those concerned and the planned action in prayer.") },
    { minutes: 5, step: t("ÉVALUER", "EVALUATE"), prompt: t("Dire ce qui a été utile et ce qui sera à reprendre.", "Share what was useful and what needs revisiting.") }
  ];
}

export default function PrepareSpiritualTimePage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const t = (fr: string, english: string) => en ? english : fr;
  const [themeId, setThemeId] = useState("student-life");
  const [duration, setDuration] = useState(60);
  const [date, setDate] = useState("");
  const [group, setGroup] = useState("");
  const [objective, setObjective] = useState("");
  const [context, setContext] = useState("");
  const [action, setAction] = useState("");
  const [prepared, setPrepared] = useState([false, false, false, false]);
  const theme = themes.find((item) => item.id === themeId) ?? themes[0];
  const schedule = useMemo(() => buildSchedule(duration, t), [duration, en]);
  const readyCount = prepared.filter(Boolean).length;

  const printSheet = () => window.print();

  return (
    <main className="collab-page spirituality-page">
      <header className="account-header no-print">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark"><span>JEC</span><i aria-hidden="true">✝</i></span>
          <span>conNEcT</span>
        </Link>
        <div>
          <LanguageSwitcher />
          <Link href="/spiritualite" className="back-link-inline">{t("Retour à la spiritualité", "Back to spirituality")}</Link>
        </div>
      </header>

      <div className="collab-content spiritual-content">
        <div className="no-print">
          <p className="eyebrow">{t("OUTIL D'ANIMATION", "FACILITATION TOOL")}</p>
          <h1>{t("Préparer un temps spi JEC", "Prepare a JEC spiritual gathering")}</h1>
          <p className="collab-lead">{t("Construis une trame de rencontre adaptée à ton équipe. Choisis un thème et une durée : le déroulé se met à jour automatiquement. Tu peux ensuite imprimer ta fiche.", "Build a meeting outline adapted to your team. Choose a theme and duration: the agenda updates automatically. You can then print your sheet.")}</p>
          <div className="spiritual-privacy-note">
            <strong>{t("Brouillon temporaire", "Temporary draft")}</strong>
            <span>{t("Cette page ne sauvegarde pas tes notes. Évite d'y inscrire des noms, des informations sensibles ou des situations permettant d'identifier une personne.", "This page does not save your notes. Avoid entering names, sensitive information or details that could identify a person.")}</span>
          </div>
        </div>

        <section className="collab-section spiritual-section no-print">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("1 · PARAMÈTRES", "1 · SETTINGS")}</p>
              <h2>{t("Ta rencontre", "Your gathering")}</h2>
            </div>
          </div>
          <div className="spiritual-builder-grid">
            <label>
              <span>{t("Thème", "Theme")}</span>
              <select value={themeId} onChange={(event) => setThemeId(event.target.value)}>
                {themes.map((item) => <option key={item.id} value={item.id}>{en ? item.labelEn : item.labelFr}</option>)}
              </select>
            </label>
            <label>
              <span>{t("Durée", "Duration")}</span>
              <select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
                {sessionDurations.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label>
              <span>{t("Date (facultatif)", "Date (optional)")}</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              <span>{t("Équipe ou groupe (facultatif)", "Team or group (optional)")}</span>
              <input value={group} onChange={(event) => setGroup(event.target.value)} placeholder={t("Ex. équipe locale", "e.g. local team")} />
            </label>
            <label className="spiritual-builder-full">
              <span>{t("Objectif de la rencontre (personnalisable)", "Gathering objective (editable)")}</span>
              <textarea value={objective || (en ? theme.objectiveEn : theme.objectiveFr)} onChange={(event) => setObjective(event.target.value)} rows={3} />
            </label>
            <label className="spiritual-builder-full">
              <span>{t("Situation observée / contexte (sans données nominatives)", "Observed situation / context (no identifying details)")}</span>
              <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={3} placeholder={t("Quelques éléments factuels pour aider le groupe à partir du réel…", "A few factual elements to help the group start from reality…")} />
            </label>
          </div>
        </section>

        <section className="collab-section spiritual-section spiritual-print-area">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("2 · FICHE DE RENCONTRE", "2 · GATHERING SHEET")}</p>
              <h2>{en ? theme.labelEn : theme.labelFr}</h2>
            </div>
            <span>{duration} {t("minutes", "minutes")}</span>
          </div>
          <div className="spiritual-sheet-meta">
            <span>{t("Date", "Date")} : {date || t("À compléter", "To be filled in")}</span>
            <span>{t("Équipe", "Team")} : {group || t("À compléter", "To be filled in")}</span>
            <span>{t("Passage biblique", "Bible passage")} : {theme.passage}</span>
          </div>
          <div className="spiritual-sheet-objective">
            <strong>{t("Objectif", "Objective")}</strong>
            <p>{objective || (en ? theme.objectiveEn : theme.objectiveFr)}</p>
          </div>
          {context.trim() && (
            <div className="spiritual-sheet-context">
              <strong>{t("Point de départ", "Starting point")}</strong>
              <p>{context}</p>
            </div>
          )}
          <div className="spiritual-agenda">
            <h3>{t("Déroulé proposé", "Suggested agenda")}</h3>
            {schedule.map((item, index) => (
              <article className="spiritual-agenda-item" key={item.step}>
                <div className="spiritual-agenda-time">{String(item.minutes).padStart(2, "0")}’</div>
                <div>
                  <strong>{item.step}</strong>
                  <p>{item.prompt}</p>
                </div>
              </article>
            ))}
            <div className="spiritual-agenda-total">{t("Durée totale", "Total duration")} : {schedule.reduce((sum, item) => sum + item.minutes, 0)} {t("minutes", "minutes")}</div>
          </div>
          <div className="spiritual-sheet-objective">
            <strong>{t("Questions pour le partage", "Questions for sharing")}</strong>
            <ol>{(en ? theme.questionEn : theme.questionFr).map((question) => <li key={question}>{question}</li>)}</ol>
          </div>
          <div className="spiritual-sheet-context">
            <strong>{t("Engagement concret à préciser", "Concrete commitment to define")}</strong>
            <p>{action || (en ? theme.actionEn : theme.actionFr)}</p>
            <label className="no-print">
              <span>{t("Adapter la proposition pour votre équipe", "Adapt the suggestion for your team")}</span>
              <textarea value={action} onChange={(event) => setAction(event.target.value)} rows={2} placeholder={t("Qui fait quoi ? Pour quand ? Avec quels moyens ?", "Who does what? By when? With what resources?")} />
            </label>
          </div>
          <div className="spiritual-sheet-context">
            <strong>{t("Prière proposée", "Suggested prayer")}</strong>
            <p>{en ? theme.prayerEn : theme.prayerFr}</p>
            <small>{t("Proposition originale JEC-conNEcT, à adapter librement. Ce texte n'est pas présenté comme une prière officielle adoptée par la JEC.", "Original JEC-conNEcT suggestion, freely adaptable. This text is not presented as an official prayer adopted by JEC.")}</small>
          </div>
        </section>

        <section className="collab-section spiritual-section no-print">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("3 · AVANT LA RENCONTRE", "3 · BEFORE THE GATHERING")}</p>
              <h2>{t("Liste de préparation", "Preparation checklist")}</h2>
            </div>
            <span>{readyCount}/4</span>
          </div>
          <div className="spiritual-prep-checks">
            {[
              t("Lire le passage biblique et vérifier sa référence.", "Read the Bible passage and verify its reference."),
              t("Prévoir une personne pour faciliter et une autre pour garder le temps.", "Plan for one facilitator and another person to keep time."),
              t("Préparer un cadre d'écoute : confidentialité, respect, droit de passer son tour.", "Set listening guidelines: confidentiality, respect and the right to pass."),
              t("S'assurer que l'action retenue est réaliste et construite avec les personnes concernées.", "Ensure the chosen action is realistic and shaped with those concerned.")
            ].map((item, index) => (
              <label key={item}>
                <input type="checkbox" checked={prepared[index]} onChange={(event) => setPrepared((current) => current.map((value, i) => i === index ? event.target.checked : value))} />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <div className="spiritual-builder-actions">
            <button type="button" className="spiritual-cta" onClick={printSheet}>{t("Imprimer / enregistrer en PDF", "Print / save as PDF")} ↗</button>
            <Link href="/spiritualite/calendrier" className="spiritual-cta">{t("Voir les dates du calendrier", "View calendar dates")} →</Link>
            <Link href="/spiritualite" className="spiritual-cta">{t("Retour à la spiritualité", "Back to spirituality")}</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
