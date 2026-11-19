"use client";

import Link from "next/link";
import { useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";

type CalendarType = "liturgie" | "international" | "eglise";

type CalendarEvent = {
  date: string;
  dateFr: string;
  dateEn: string;
  month: string;
  type: CalendarType;
  titleFr: string;
  titleEn: string;
  contextFr: string;
  contextEn: string;
  reflectionFr: string;
  reflectionEn: string;
  actionFr: string;
  actionEn: string;
  sourceFr: string;
  sourceEn: string;
  url: string;
};

const events: CalendarEvent[] = [
  {
    date: "2026-11-22", dateFr: "Dimanche 22 novembre 2026", dateEn: "Sunday, 22 November 2026", month: "2026-11", type: "liturgie",
    titleFr: "Christ Roi de l'Univers", titleEn: "Christ the King",
    contextFr: "Dernier dimanche de l'année liturgique 2025–2026.",
    contextEn: "The final Sunday of the 2025–2026 liturgical year.",
    reflectionFr: "Quel sens donnons-nous à l'autorité, au service et à la responsabilité dans nos équipes ?",
    reflectionEn: "What do authority, service and responsibility mean in our teams?",
    actionFr: "Relire une responsabilité dans l'équipe et identifier une manière plus fraternelle de l'exercer.",
    actionEn: "Review one team responsibility and identify a more fraternal way to exercise it.",
    sourceFr: "Calendrier liturgique CEF — novembre 2026", sourceEn: "CEF liturgical calendar — November 2026",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2024/12/11-NOVEMBRE-2026-Annee-A.pdf"
  },
  {
    date: "2026-11-29", dateFr: "Dimanche 29 novembre 2026", dateEn: "Sunday, 29 November 2026", month: "2026-11", type: "liturgie",
    titleFr: "1er dimanche de l'Avent", titleEn: "First Sunday of Advent",
    contextFr: "Entrée dans une nouvelle année liturgique — cycle B.",
    contextEn: "Beginning of a new liturgical year — cycle B.",
    reflectionFr: "Quelle espérance voulons-nous faire grandir dans notre milieu étudiant et dans la société ?",
    reflectionEn: "What hope do we want to nurture in our student environment and society?",
    actionFr: "Choisir un geste d'attention ou de solidarité à vivre pendant l'Avent.",
    actionEn: "Choose one act of care or solidarity to practise during Advent.",
    sourceFr: "Calendriers liturgiques — Conférence des évêques de France", sourceEn: "Liturgical calendars — French Bishops' Conference",
    url: "https://liturgie.catholique.fr/celebrer-dans-le-temps/calendriers-liturgiques/"
  },
  {
    date: "2026-12-05", dateFr: "Samedi 5 décembre 2026", dateEn: "Saturday, 5 December 2026", month: "2026-12", type: "international",
    titleFr: "Journée internationale des volontaires", titleEn: "International Volunteer Day",
    contextFr: "Les Nations Unies mettent à l'honneur l'engagement bénévole et la contribution des volontaires.",
    contextEn: "The United Nations recognises voluntary action and the contribution of volunteers.",
    reflectionFr: "Qu'est-ce qui motive notre engagement, et comment éviter que quelques personnes portent seules la charge collective ?",
    reflectionEn: "What motivates our commitment, and how can we avoid leaving the collective workload to only a few people?",
    actionFr: "Remercier une personne engagée et proposer une action ouverte à de nouveaux bénévoles.",
    actionEn: "Thank someone who serves and propose an activity that welcomes new volunteers.",
    sourceFr: "Nations Unies — Journée internationale des volontaires", sourceEn: "United Nations — International Volunteer Day",
    url: "https://www.un.org/fr/observances/volunteer-day"
  },
  {
    date: "2026-12-08", dateFr: "Mardi 8 décembre 2026", dateEn: "Tuesday, 8 December 2026", month: "2026-12", type: "liturgie",
    titleFr: "Immaculée Conception", titleEn: "Immaculate Conception",
    contextFr: "Solennité de la Bienheureuse Vierge Marie.",
    contextEn: "Solemnity of the Blessed Virgin Mary.",
    reflectionFr: "Comment accueillir un appel, une responsabilité ou une personne avec confiance et disponibilité ?",
    reflectionEn: "How can we welcome a calling, a responsibility or another person with trust and openness?",
    actionFr: "Faire un temps de silence, puis partager une situation où l'écoute a permis un engagement.",
    actionEn: "Take a moment of silence, then share a situation where listening made commitment possible.",
    sourceFr: "Calendrier liturgique CEF — décembre 2026", sourceEn: "CEF liturgical calendar — December 2026",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2025/11/DEC-2026.pdf"
  },
  {
    date: "2026-12-10", dateFr: "Jeudi 10 décembre 2026", dateEn: "Thursday, 10 December 2026", month: "2026-12", type: "international",
    titleFr: "Journée des droits de l'homme", titleEn: "Human Rights Day",
    contextFr: "Anniversaire de l'adoption de la Déclaration universelle des droits de l'homme en 1948.",
    contextEn: "Anniversary of the adoption of the Universal Declaration of Human Rights in 1948.",
    reflectionFr: "Quelles personnes voient encore leur dignité ou leurs droits ignorés dans notre environnement ?",
    reflectionEn: "Whose dignity or rights are still overlooked in our environment?",
    actionFr: "Choisir une situation à mieux comprendre et donner la parole aux personnes concernées.",
    actionEn: "Choose one situation to understand better and make space for the voices of those concerned.",
    sourceFr: "Nations Unies — Journée des droits de l'homme", sourceEn: "United Nations — Human Rights Day",
    url: "https://www.un.org/fr/observances/human-rights-day"
  },
  {
    date: "2026-12-18", dateFr: "Vendredi 18 décembre 2026", dateEn: "Friday, 18 December 2026", month: "2026-12", type: "international",
    titleFr: "Journée internationale des migrants", titleEn: "International Migrants Day",
    contextFr: "Un repère pour réfléchir aux parcours migratoires, à l'accueil et aux droits des personnes.",
    contextEn: "An opportunity to reflect on migration journeys, welcome and people's rights.",
    reflectionFr: "Comment notre mouvement accueille-t-il les personnes qui arrivent avec une histoire, une culture ou une langue différentes ?",
    reflectionEn: "How does our movement welcome people with a different story, culture or language?",
    actionFr: "Identifier une initiative locale d'accueil ou de solidarité et prendre contact avec ses acteurs.",
    actionEn: "Identify a local welcome or solidarity initiative and connect with the people involved.",
    sourceFr: "Nations Unies — Liste des journées internationales", sourceEn: "United Nations — List of International Days",
    url: "https://www.un.org/fr/observances/list-days-weeks"
  },
  {
    date: "2026-12-25", dateFr: "Vendredi 25 décembre 2026", dateEn: "Friday, 25 December 2026", month: "2026-12", type: "liturgie",
    titleFr: "Nativité du Seigneur — Noël", titleEn: "The Nativity of the Lord — Christmas",
    contextFr: "Solennité de la Nativité du Seigneur.",
    contextEn: "Solemnity of the Nativity of the Lord.",
    reflectionFr: "Que signifie faire une place à celles et ceux qui sont oubliés ou fragilisés ?",
    reflectionEn: "What does it mean to make room for those who are forgotten or vulnerable?",
    actionFr: "Vivre un geste de visite, de partage ou d'attention auprès d'une personne isolée.",
    actionEn: "Offer a visit, share something or show care to someone who is isolated.",
    sourceFr: "Calendrier liturgique CEF — décembre 2026", sourceEn: "CEF liturgical calendar — December 2026",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2025/11/DEC-2026.pdf"
  },
  {
    date: "2026-12-27", dateFr: "Dimanche 27 décembre 2026", dateEn: "Sunday, 27 December 2026", month: "2026-12", type: "liturgie",
    titleFr: "Sainte Famille", titleEn: "Holy Family",
    contextFr: "Fête célébrée dans l'octave de la Nativité.",
    contextEn: "Feast celebrated within the Octave of Christmas.",
    reflectionFr: "Comment nos équipes peuvent-elles devenir des lieux d'écoute, de confiance et de soutien mutuel ?",
    reflectionEn: "How can our teams become places of listening, trust and mutual support?",
    actionFr: "Organiser un tour de nouvelles où chacun peut partager librement ce dont il a besoin.",
    actionEn: "Organise a check-in where everyone can freely share what support they need.",
    sourceFr: "Calendrier liturgique CEF — décembre 2026", sourceEn: "CEF liturgical calendar — December 2026",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2025/11/DEC-2026.pdf"
  },
  {
    date: "2027-01-01", dateFr: "Vendredi 1er janvier 2027", dateEn: "Friday, 1 January 2027", month: "2027-01", type: "eglise",
    titleFr: "Sainte Marie, Mère de Dieu · Journée mondiale de la paix", titleEn: "Mary, Mother of God · World Day of Peace",
    contextFr: "Solennité mariale et journée de prière et de réflexion pour la paix.",
    contextEn: "Marian solemnity and a day of prayer and reflection for peace.",
    reflectionFr: "Quelles attitudes favorisent la paix dans nos paroles, nos débats et nos relations ?",
    reflectionEn: "Which attitudes foster peace in our words, discussions and relationships?",
    actionFr: "Choisir un engagement concret de dialogue, de réconciliation ou de non-violence.",
    actionEn: "Choose one concrete commitment to dialogue, reconciliation or non-violence.",
    sourceFr: "Calendrier liturgique CEF — janvier 2027", sourceEn: "CEF liturgical calendar — January 2027",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2025/11/JAN-2027.pdf"
  },
  {
    date: "2027-01-24", dateFr: "Dimanche 24 janvier 2027", dateEn: "Sunday, 24 January 2027", month: "2027-01", type: "international",
    titleFr: "Journée internationale de l'éducation", titleEn: "International Day of Education",
    contextFr: "Les Nations Unies rappellent le rôle de l'éducation dans la paix et le développement.",
    contextEn: "The United Nations highlights education's role in peace and development.",
    reflectionFr: "L'éducation donne-t-elle réellement à chacun les moyens de participer à la société ?",
    reflectionEn: "Does education truly give everyone the means to participate in society?",
    actionFr: "Recueillir les obstacles rencontrés par les étudiants et formuler une proposition d'amélioration.",
    actionEn: "Gather students' experiences of barriers and formulate one improvement proposal.",
    sourceFr: "Nations Unies — Journée internationale de l'éducation", sourceEn: "United Nations — International Day of Education",
    url: "https://www.un.org/fr/observances/education-day"
  },
  {
    date: "2027-02-02", dateFr: "Mardi 2 février 2027", dateEn: "Tuesday, 2 February 2027", month: "2027-02", type: "liturgie",
    titleFr: "Présentation du Seigneur au Temple · Vie consacrée", titleEn: "Presentation of the Lord · Consecrated Life",
    contextFr: "La liturgie célèbre la Présentation du Seigneur ; cette date est aussi la Journée mondiale de la vie consacrée.",
    contextEn: "The liturgy celebrates the Presentation of the Lord; this date is also the World Day for Consecrated Life.",
    reflectionFr: "Quelles formes de don de soi, de service et de fidélité inspirent les jeunes aujourd'hui ?",
    reflectionEn: "What forms of self-giving, service and faithfulness inspire young people today?",
    actionFr: "Inviter une personne engagée dans un service ou une vocation à témoigner et échanger avec l'équipe.",
    actionEn: "Invite someone committed to a vocation or service to share their experience with the team.",
    sourceFr: "Calendrier liturgique CEF — février 2027", sourceEn: "CEF liturgical calendar — February 2027",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2025/11/FEV-2027.pdf"
  },
  {
    date: "2027-02-10", dateFr: "Mercredi 10 février 2027", dateEn: "Wednesday, 10 February 2027", month: "2027-02", type: "liturgie",
    titleFr: "Mercredi des Cendres · Entrée en Carême", titleEn: "Ash Wednesday · Beginning of Lent",
    contextFr: "Ouverture du temps du Carême, chemin de conversion, de prière et de partage.",
    contextEn: "Beginning of Lent, a season of conversion, prayer and sharing.",
    reflectionFr: "Qu'est-ce qui doit changer dans nos habitudes pour être davantage attentifs aux autres et au bien commun ?",
    reflectionEn: "What needs to change in our habits so that we pay greater attention to others and the common good?",
    actionFr: "Choisir en équipe un effort réaliste de prière, de sobriété ou de partage pour le Carême.",
    actionEn: "Choose one realistic team commitment to prayer, simplicity or sharing for Lent.",
    sourceFr: "Calendrier liturgique CEF — février 2027", sourceEn: "CEF liturgical calendar — February 2027",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2025/11/FEV-2027.pdf"
  },
  {
    date: "2027-02-11", dateFr: "Jeudi 11 février 2027", dateEn: "Thursday, 11 February 2027", month: "2027-02", type: "eglise",
    titleFr: "Journée mondiale du malade", titleEn: "World Day of the Sick",
    contextFr: "En 2027, le message annoncé par le Saint-Siège met l'accent sur le rôle de la communauté auprès des personnes qui souffrent.",
    contextEn: "For 2027, the Holy See's announced message highlights the community's role in caring for people who suffer.",
    reflectionFr: "Qui, dans notre entourage, vit avec la maladie, le handicap, la solitude ou l'épuisement ?",
    reflectionEn: "Who around us is living with illness, disability, loneliness or exhaustion?",
    actionFr: "Prendre des nouvelles d'une personne, proposer une aide concrète et respecter ses besoins.",
    actionEn: "Check in on someone, offer practical help and respect their needs.",
    sourceFr: "Saint-Siège — Message pour la Journée mondiale du malade 2027", sourceEn: "Holy See — Message for the 2027 World Day of the Sick",
    url: "https://press.vatican.va/content/salastampa/en/bollettino/pubblico/2026/11/05/261105e.html"
  },
  {
    date: "2027-02-20", dateFr: "Samedi 20 février 2027", dateEn: "Saturday, 20 February 2027", month: "2027-02", type: "international",
    titleFr: "Journée mondiale de la justice sociale", titleEn: "World Day of Social Justice",
    contextFr: "Une journée consacrée aux enjeux de développement social, de justice et de paix.",
    contextEn: "A day dedicated to social development, justice and peace.",
    reflectionFr: "Quelles inégalités observons-nous dans notre milieu et quelles en sont les causes ?",
    reflectionEn: "Which inequalities do we observe in our environment, and what causes them?",
    actionFr: "Mener un échange documenté et choisir une action de sensibilisation ou de solidarité.",
    actionEn: "Hold an informed discussion and choose an awareness or solidarity action.",
    sourceFr: "Nations Unies — Journée mondiale de la justice sociale", sourceEn: "United Nations — World Day of Social Justice",
    url: "https://www.un.org/fr/observances/social-justice-day"
  },
  {
    date: "2027-03-08", dateFr: "Lundi 8 mars 2027", dateEn: "Monday, 8 March 2027", month: "2027-03", type: "international",
    titleFr: "Journée internationale des femmes", titleEn: "International Women's Day",
    contextFr: "Un repère pour promouvoir les droits des femmes et l'égalité.",
    contextEn: "An opportunity to promote women's rights and equality.",
    reflectionFr: "Les jeunes femmes ont-elles les mêmes possibilités de prendre la parole, de décider et de conduire des projets ?",
    reflectionEn: "Do young women have equal opportunities to speak, decide and lead projects?",
    actionFr: "Faire un bilan de la participation et des responsabilités dans l'équipe, puis définir une amélioration.",
    actionEn: "Review participation and responsibilities in the team, then define one improvement.",
    sourceFr: "Nations Unies — Journées internationales", sourceEn: "United Nations — International Days",
    url: "https://www.un.org/fr/observances/list-days-weeks"
  },
  {
    date: "2027-03-19", dateFr: "Vendredi 19 mars 2027", dateEn: "Friday, 19 March 2027", month: "2027-03", type: "liturgie",
    titleFr: "Saint Joseph, époux de la Vierge Marie", titleEn: "Saint Joseph, spouse of the Virgin Mary",
    contextFr: "Solennité de saint Joseph.",
    contextEn: "Solemnity of Saint Joseph.",
    reflectionFr: "Comment reconnaître la valeur du travail, du soin et des responsabilités discrètes ?",
    reflectionEn: "How can we recognise the value of work, care and quiet responsibilities?",
    actionFr: "Valoriser une contribution peu visible dans l'équipe et partager les tâches plus équitablement.",
    actionEn: "Recognise an often unseen contribution and distribute tasks more fairly.",
    sourceFr: "AELF — Calendrier liturgique de mars 2027", sourceEn: "AELF — March 2027 liturgical calendar",
    url: "https://www.aelf.org/calendrier/romain/2027/03"
  },
  {
    date: "2027-03-21", dateFr: "Dimanche 21 mars 2027", dateEn: "Sunday, 21 March 2027", month: "2027-03", type: "liturgie",
    titleFr: "Dimanche des Rameaux et de la Passion", titleEn: "Palm Sunday of the Passion of the Lord",
    contextFr: "Entrée dans la Semaine sainte.",
    contextEn: "Beginning of Holy Week.",
    reflectionFr: "Comment rester fidèles à la paix, à la justice et à la vérité lorsque le chemin devient difficile ?",
    reflectionEn: "How can we remain faithful to peace, justice and truth when the path becomes difficult?",
    actionFr: "Préparer une action de paix ou de dialogue dans un contexte de tension.",
    actionEn: "Prepare an act of peace or dialogue in a situation of tension.",
    sourceFr: "AELF — Calendrier liturgique de mars 2027", sourceEn: "AELF — March 2027 liturgical calendar",
    url: "https://www.aelf.org/calendrier/romain/2027/03"
  },
  {
    date: "2027-03-22", dateFr: "Lundi 22 mars 2027", dateEn: "Monday, 22 March 2027", month: "2027-03", type: "international",
    titleFr: "Journée mondiale de l'eau", titleEn: "World Water Day",
    contextFr: "Les Nations Unies rappellent l'importance de l'eau et de sa gestion durable.",
    contextEn: "The United Nations highlights the importance of water and its sustainable management.",
    reflectionFr: "Qui a accès à une eau saine, et qui en est privé dans les territoires que nous connaissons ?",
    reflectionEn: "Who has access to safe water, and who is deprived of it in places we know?",
    actionFr: "Relier la réflexion à une initiative locale ou à une action de sensibilisation environnementale.",
    actionEn: "Connect the reflection to a local initiative or an environmental awareness action.",
    sourceFr: "Nations Unies — Journée mondiale de l'eau", sourceEn: "United Nations — World Water Day",
    url: "https://www.un.org/fr/observances/water-day"
  },
  {
    date: "2027-03-25", dateFr: "Jeudi 25 mars 2027", dateEn: "Thursday, 25 March 2027", month: "2027-03", type: "liturgie",
    titleFr: "Jeudi saint · Cène du Seigneur", titleEn: "Holy Thursday · The Lord's Supper",
    contextFr: "Début du Triduum pascal ; la liturgie fait mémoire du dernier repas et du lavement des pieds.",
    contextEn: "Beginning of the Easter Triduum; the liturgy recalls the Last Supper and the washing of the feet.",
    reflectionFr: "Le service est-il au cœur de notre manière de diriger et de travailler ensemble ?",
    reflectionEn: "Is service at the heart of how we lead and work together?",
    actionFr: "Organiser une action de service concret, décidée avec les personnes concernées.",
    actionEn: "Organise a practical act of service, planned together with the people concerned.",
    sourceFr: "AELF — Calendrier liturgique de mars 2027", sourceEn: "AELF — March 2027 liturgical calendar",
    url: "https://www.aelf.org/calendrier/romain/2027/03"
  },
  {
    date: "2027-03-26", dateFr: "Vendredi 26 mars 2027", dateEn: "Friday, 26 March 2027", month: "2027-03", type: "liturgie",
    titleFr: "Vendredi saint · Passion et mort du Seigneur", titleEn: "Good Friday · Passion and death of the Lord",
    contextFr: "Jour de jeûne et d'abstinence dans l'Église catholique latine.",
    contextEn: "A day of fasting and abstinence in the Latin Catholic Church.",
    reflectionFr: "Comment nous tenir aux côtés des personnes victimes de violence, d'injustice ou d'exclusion ?",
    reflectionEn: "How can we stand alongside people affected by violence, injustice or exclusion?",
    actionFr: "Prendre un temps de recueillement et identifier une manière non violente de soutenir une personne ou une cause.",
    actionEn: "Take time for reflection and identify a non-violent way to support a person or a cause.",
    sourceFr: "AELF — Calendrier liturgique de mars 2027", sourceEn: "AELF — March 2027 liturgical calendar",
    url: "https://www.aelf.org/calendrier/romain/2027/03"
  },
  {
    date: "2027-03-28", dateFr: "Dimanche 28 mars 2027", dateEn: "Sunday, 28 March 2027", month: "2027-03", type: "liturgie",
    titleFr: "Dimanche de Pâques · Résurrection du Seigneur", titleEn: "Easter Sunday · Resurrection of the Lord",
    contextFr: "Sommet de l'année liturgique et ouverture du temps pascal.",
    contextEn: "The summit of the liturgical year and beginning of Easter Time.",
    reflectionFr: "Quels signes de relèvement, de courage et d'espérance pouvons-nous reconnaître autour de nous ?",
    reflectionEn: "What signs of renewal, courage and hope can we recognise around us?",
    actionFr: "Partager un témoignage d'espérance et poser un geste qui aide une personne à retrouver confiance.",
    actionEn: "Share a testimony of hope and take one action that helps someone regain confidence.",
    sourceFr: "AELF — Calendrier liturgique de mars 2027", sourceEn: "AELF — March 2027 liturgical calendar",
    url: "https://www.aelf.org/calendrier/romain/2027/03"
  },
  {
    date: "2027-04-05", dateFr: "Lundi 5 avril 2027", dateEn: "Monday, 5 April 2027", month: "2027-04", type: "liturgie",
    titleFr: "Annonciation du Seigneur", titleEn: "Annunciation of the Lord",
    contextFr: "Solennité transférée après l'octave de Pâques en 2027.",
    contextEn: "Solemnity transferred until after the Easter Octave in 2027.",
    reflectionFr: "Comment discerner un appel et lui répondre avec liberté, courage et responsabilité ?",
    reflectionEn: "How can we discern a calling and respond with freedom, courage and responsibility?",
    actionFr: "Prendre un temps personnel de discernement puis partager une décision à mûrir avec l'équipe.",
    actionEn: "Take time for personal discernment, then share a decision to reflect on with the team.",
    sourceFr: "Calendrier liturgique CEF — mars 2027", sourceEn: "CEF liturgical calendar — March 2027",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2025/11/MARS-2027.pdf"
  },
  {
    date: "2027-05-06", dateFr: "Jeudi 6 mai 2027", dateEn: "Thursday, 6 May 2027", month: "2027-05", type: "liturgie",
    titleFr: "Ascension du Seigneur", titleEn: "Ascension of the Lord",
    contextFr: "Solennité célébrée le jeudi 6 mai 2027 dans le calendrier français.",
    contextEn: "Solemnity celebrated on Thursday, 6 May 2027 in the French calendar.",
    reflectionFr: "Comment faire grandir la responsabilité et la confiance plutôt que la dépendance dans nos équipes ?",
    reflectionEn: "How can we grow responsibility and trust rather than dependence in our teams?",
    actionFr: "Confier une responsabilité réelle à un nouveau membre et l'accompagner.",
    actionEn: "Entrust a new member with a real responsibility and support them.",
    sourceFr: "Calendrier liturgique CEF — mai 2027", sourceEn: "CEF liturgical calendar — May 2027",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2025/11/MAI-2027.pdf"
  },
  {
    date: "2027-05-16", dateFr: "Dimanche 16 mai 2027", dateEn: "Sunday, 16 May 2027", month: "2027-05", type: "liturgie",
    titleFr: "Dimanche de Pentecôte", titleEn: "Pentecost Sunday",
    contextFr: "Solennité qui commémore le don de l'Esprit Saint et l'envoi en mission.",
    contextEn: "Solemnity commemorating the gift of the Holy Spirit and the sending out on mission.",
    reflectionFr: "Comment accueillir la diversité des langues, des cultures et des sensibilités comme une richesse pour notre mouvement ?",
    reflectionEn: "How can we welcome the diversity of languages, cultures and perspectives as a gift to our movement?",
    actionFr: "Organiser un partage interculturel ou une rencontre entre équipes de pays différents.",
    actionEn: "Organise an intercultural exchange or a meeting between teams from different countries.",
    sourceFr: "Calendrier liturgique CEF — mai 2027", sourceEn: "CEF liturgical calendar — May 2027",
    url: "https://liturgie.catholique.fr/wp-content/uploads/sites/11/2025/11/MAI-2027.pdf"
  },
  {
    date: "2027-06-05", dateFr: "Samedi 5 juin 2027", dateEn: "Saturday, 5 June 2027", month: "2027-06", type: "international",
    titleFr: "Journée mondiale de l'environnement", titleEn: "World Environment Day",
    contextFr: "Journée annuelle conduite par le Programme des Nations Unies pour l'environnement.",
    contextEn: "Annual observance led by the United Nations Environment Programme.",
    reflectionFr: "Quels choix de consommation et quelles habitudes de notre équipe ont un impact sur la maison commune ?",
    reflectionEn: "Which consumption choices and team habits affect our common home?",
    actionFr: "Choisir une action collective mesurable : mobilité, sobriété numérique, réduction des déchets ou protection du vivant.",
    actionEn: "Choose one measurable collective action: mobility, digital sobriety, waste reduction or protection of biodiversity.",
    sourceFr: "Nations Unies — Journée mondiale de l'environnement", sourceEn: "United Nations — World Environment Day",
    url: "https://www.un.org/fr/observances/environment-day"
  }
];

const monthOptions = [
  { value: "all", fr: "Tous les mois", en: "All months" },
  { value: "2026-11", fr: "Novembre 2026", en: "November 2026" },
  { value: "2026-12", fr: "Décembre 2026", en: "December 2026" },
  { value: "2027-01", fr: "Janvier 2027", en: "January 2027" },
  { value: "2027-02", fr: "Février 2027", en: "February 2027" },
  { value: "2027-03", fr: "Mars 2027", en: "March 2027" },
  { value: "2027-04", fr: "Avril 2027", en: "April 2027" },
  { value: "2027-05", fr: "Mai 2027", en: "May 2027" },
  { value: "2027-06", fr: "Juin 2027", en: "June 2027" }
];

export default function SpiritualCalendarPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const t = (fr: string, english: string) => en ? english : fr;
  const [typeFilter, setTypeFilter] = useState<"all" | CalendarType>("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const filteredEvents = events.filter((event) =>
    (typeFilter === "all" || event.type === typeFilter) &&
    (monthFilter === "all" || event.month === monthFilter)
  );

  const typeLabel = (type: CalendarType) => {
    if (type === "liturgie") return t("Liturgie", "Liturgy");
    if (type === "international") return t("Journée internationale", "International day");
    return t("Église & société", "Church & society");
  };

  return (
    <main className="collab-page spirituality-page">
      <header className="account-header">
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
        <p className="eyebrow">{t("REPÈRES POUR LES ÉQUIPES", "HIGHLIGHTS FOR TEAMS")}</p>
        <h1>{t("Calendrier spirituel JEC", "JEC spiritual calendar")}</h1>
        <p className="collab-lead">
          {t(
            "Les grands temps liturgiques et les journées internationales de novembre 2026 à juin 2027, accompagnés de pistes de réflexion et d'action pour les équipes.",
            "Major liturgical seasons and international days from November 2026 to June 2027, with reflection and action prompts for teams."
          )}
        </p>

        <section className="spiritual-calendar-intro">
          <div>
            <p className="eyebrow light">{t("ANNÉE LITURGIQUE 2026–2027", "LITURGICAL YEAR 2026–2027")}</p>
            <h2>{t("Cycle dominical B", "Sunday cycle B")}</h2>
            <p>{t(
              "Le calendrier liturgique de référence pour la France sert de repère. Les dates et célébrations locales peuvent varier selon les pays, les diocèses ou les traditions chrétiennes.",
              "The reference liturgical calendar for France is used here. Local dates and observances may differ by country, diocese or Christian tradition."
            )}</p>
          </div>
          <a className="spiritual-calendar-source" href="https://liturgie.catholique.fr/celebrer-dans-le-temps/calendriers-liturgiques/" target="_blank" rel="noopener noreferrer">
            {t("Calendriers officiels CEF", "Official CEF calendars")} ↗
          </a>
        </section>

        <section className="collab-section spiritual-section">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("PARCOURIR LES REPÈRES", "BROWSE THE DATES")}</p>
              <h2>{t("Dates et pistes d'animation", "Dates and facilitation ideas")}</h2>
            </div>
            <span>{filteredEvents.length} {t("repères", "dates")}</span>
          </div>

          <div className="spiritual-calendar-controls">
            <div className="spiritual-calendar-filters" role="group" aria-label={t("Filtrer par type", "Filter by type")}>
              <button type="button" className={typeFilter === "all" ? "selected" : ""} aria-pressed={typeFilter === "all"} onClick={() => setTypeFilter("all")}>{t("Tout", "All")}</button>
              <button type="button" className={typeFilter === "liturgie" ? "selected" : ""} aria-pressed={typeFilter === "liturgie"} onClick={() => setTypeFilter("liturgie")}>{t("Liturgie", "Liturgy")}</button>
              <button type="button" className={typeFilter === "international" ? "selected" : ""} aria-pressed={typeFilter === "international"} onClick={() => setTypeFilter("international")}>{t("Journées internationales", "International days")}</button>
              <button type="button" className={typeFilter === "eglise" ? "selected" : ""} aria-pressed={typeFilter === "eglise"} onClick={() => setTypeFilter("eglise")}>{t("Église & société", "Church & society")}</button>
            </div>
            <label className="spiritual-month-select">
              <span>{t("Mois", "Month")}</span>
              <select value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
                {monthOptions.map((month) => <option key={month.value} value={month.value}>{en ? month.en : month.fr}</option>)}
              </select>
            </label>
          </div>

          {filteredEvents.length > 0 ? (
            <div className="spiritual-calendar-events">
              {filteredEvents.map((event) => (
                <article className="spiritual-calendar-event" key={event.date + event.titleFr}>
                  <div className="spiritual-calendar-event-date">
                    <span>{event.dateFr.split(" ")[2]}</span>
                    <strong>{event.dateFr.split(" ")[1]}</strong>
                    <small>{event.dateFr.split(" ")[3]}</small>
                  </div>
                  <div className="spiritual-calendar-event-body">
                    <div className="spiritual-calendar-event-meta">
                      <span className={"spiritual-calendar-tag " + event.type}>{typeLabel(event.type)}</span>
                      <time dateTime={event.date}>{en ? event.dateEn : event.dateFr}</time>
                    </div>
                    <h3>{en ? event.titleEn : event.titleFr}</h3>
                    <p className="spiritual-calendar-context">{en ? event.contextEn : event.contextFr}</p>
                    <div className="spiritual-calendar-reflection">
                      <strong>{t("Question pour méditer", "Reflection question")}</strong>
                      <p>{en ? event.reflectionEn : event.reflectionFr}</p>
                    </div>
                    <div className="spiritual-calendar-action">
                      <strong>{t("Piste pour l'équipe", "Team action")}</strong>
                      <p>{en ? event.actionEn : event.actionFr}</p>
                    </div>
                    <a className="spiritual-calendar-source-link" href={event.url} target="_blank" rel="noopener noreferrer">
                      {en ? event.sourceEn : event.sourceFr} ↗
                    </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="collab-empty compact">
              <span>◷</span>
              <h3>{t("Aucun repère pour cette sélection", "No dates match this selection")}</h3>
              <p>{t("Essaie un autre mois ou un autre type de journée.", "Try another month or event type.")}</p>
            </div>
          )}
        </section>

        <section className="spiritual-calendar-guidance">
          <div>
            <strong>{t("Comment utiliser ce calendrier ?", "How should this calendar be used?")}</strong>
            <p>{t("Choisissez un repère, lisez la source officielle, puis utilisez la question et la piste d'action pour préparer votre temps spi. Les suggestions d'animation sont des propositions JEC-conNEcT, à adapter au contexte local.", "Choose a date, read the official source, then use the question and action prompt to prepare your spiritual gathering. Facilitation ideas are JEC-conNEcT suggestions and should be adapted to local contexts.")}</p>
          </div>
          <Link href="/spiritualite" className="spiritual-cta">{t("Revenir aux méditations", "Back to guided reflections")} →</Link>
        </section>
      </div>
    </main>
  );
}
