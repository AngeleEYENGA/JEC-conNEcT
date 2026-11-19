"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ResourceType = "meditation" | "prayer" | "intention" | "activity";
type ResourceLanguage = "fr" | "en" | "multi";
type Contribution = {
  id: string;
  title: string;
  description: string | null;
  language: string;
  tags: string[];
  structure_name: string | null;
  source_url: string | null;
  visibility_scope: "public" | "members" | "workspace";
  status: "draft" | "review" | "approved" | "archived";
  created_by: string;
  created_at: string;
};

const resourceLabels: Record<ResourceType, { fr: string; en: string }> = {
  meditation: { fr: "Méditation", en: "Reflection" },
  prayer: { fr: "Prière", en: "Prayer" },
  intention: { fr: "Intention de prière", en: "Prayer intention" },
  activity: { fr: "Fiche d'animation", en: "Group activity" }
};

function contributionType(tags: string[] = []): ResourceType {
  const tag = tags.find((value) => value.startsWith("spiritual-type:"));
  const value = tag?.slice("spiritual-type:".length);
  return value === "prayer" || value === "intention" || value === "activity" ? value : "meditation";
}

function formatDate(value: string, en: boolean) {
  return new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", {
    day: "numeric", month: "long", year: "numeric"
  }).format(new Date(value));
}

export default function SpiritualSharingPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const t = (fr: string, english: string) => en ? english : fr;
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [items, setItems] = useState<Contribution[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [canContribute, setCanContribute] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ResourceType>("meditation");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [structure, setStructure] = useState("");
  const [language, setLanguage] = useState<ResourceLanguage>(en ? "en" : "fr");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [rulesConfirmed, setRulesConfirmed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (!supabase) {
      setError(t("Le service de partage n'est pas configuré pour le moment.", "The sharing service is not configured yet."));
      setLoading(false);
      return;
    }

    const { data: userResult } = await supabase.auth.getUser();
    const user = userResult.user;
    setUserId(user?.id ?? null);

    if (user) {
      const [membershipResult, adminResult] = await Promise.all([
        supabase.from("jec_memberships").select("membership_status").eq("user_id", user.id).maybeSingle(),
        supabase.rpc("is_jec_admin")
      ]);
      const admin = adminResult.data === true;
      const verified = membershipResult.data?.membership_status === "verified";
      setIsAdmin(admin);
      setCanContribute(verified || admin);
    } else {
      setIsAdmin(false);
      setCanContribute(false);
    }

    const { data, error: queryError } = await supabase
      .from("jec_archive_items")
      .select("id,title,description,language,tags,structure_name,source_url,visibility_scope,status,created_by,created_at")
      .contains("tags", ["jec-spirituality"])
      .order("created_at", { ascending: false })
      .limit(80);

    if (queryError) setError(queryError.message);
    setItems((data ?? []) as Contribution[]);
    setLoading(false);
  }, [supabase, en]);

  useEffect(() => {
    void load();
  }, [load]);

  const publishedItems = useMemo(
    () => items.filter((item) => item.status === "approved"),
    [items]
  );
  const ownPending = useMemo(
    () => items.filter((item) => item.created_by === userId && item.status !== "approved" && item.status !== "archived"),
    [items, userId]
  );

  function resetForm() {
    setType("meditation");
    setTitle("");
    setDescription("");
    setStructure("");
    setLanguage(en ? "en" : "fr");
    setSourceUrl("");
    setRightsConfirmed(false);
    setRulesConfirmed(false);
  }

  async function submitContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !userId || !canContribute) return;
    setError("");
    setMessage("");

    if (title.trim().length < 3 || title.trim().length > 220) {
      setError(t("Le titre doit contenir entre 3 et 220 caractères.", "The title must contain between 3 and 220 characters."));
      return;
    }
    if (description.trim().length < 40 || description.trim().length > 10000) {
      setError(t("Le contenu doit contenir entre 40 et 10 000 caractères.", "The content must contain between 40 and 10,000 characters."));
      return;
    }
    if (!rightsConfirmed || !rulesConfirmed) {
      setError(t("Confirme les droits de contribution et les règles de confidentialité.", "Please confirm the contribution rights and privacy rules."));
      return;
    }
    let safeSource: string | null = null;
    if (sourceUrl.trim()) {
      try {
        const parsed = new URL(sourceUrl.trim());
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Invalid URL");
        safeSource = parsed.toString();
      } catch {
        setError(t("Le lien source doit être une URL HTTP ou HTTPS valide.", "The source link must be a valid HTTP or HTTPS URL."));
        return;
      }
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from("jec_archive_items").insert({
      collection_key: "other",
      item_type: "other",
      title: title.trim(),
      description: description.trim(),
      language,
      tags: ["jec-spirituality", "spiritual-type:" + type],
      structure_name: structure.trim() || null,
      publisher_name: "Contribution communautaire JEC",
      source_label: safeSource ? t("Source complémentaire", "Additional source") : null,
      source_url: safeSource,
      rights_status: "permission_granted",
      rights_holder: structure.trim() || null,
      rights_notes: t(
        "Le contributeur confirme être l'auteur du contenu ou disposer de l'autorisation de le partager. Publication publique soumise à validation éditoriale.",
        "The contributor confirms they authored the content or have permission to share it. Public release is subject to editorial approval."
      ),
      visibility_scope: "members",
      status: "review",
      created_by: userId
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setMessage(t(
        "Merci ! Ta proposition est transmise à l'équipe de validation. Elle ne sera visible qu'après approbation.",
        "Thank you! Your contribution has been sent for review. It will only become visible after approval."
      ));
      resetForm();
      await load();
    }
    setSubmitting(false);
  }

  const visibleResources = publishedItems;

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
        <p className="eyebrow">{t("COMMUNAUTÉ JEC", "JEC COMMUNITY")}</p>
        <h1>{t("Partager nos ressources spirituelles", "Share our spiritual resources")}</h1>
        <p className="collab-lead">
          {t(
            "Un espace pour faire circuler les méditations, prières, intentions et fiches d'animation proposées par les équipes JEC. Chaque contribution est relue avant publication.",
            "A space to share reflections, prayers, intentions and group activity guides proposed by JEC teams. Every contribution is reviewed before publication."
          )}
        </p>

        <section className="spiritual-sharing-rules">
          <div className="spiritual-sharing-rule-icon">✓</div>
          <div>
            <strong>{t("Validation éditoriale obligatoire", "Editorial approval required")}</strong>
            <p>{t(
              "Les propositions restent privées et en attente. Un administrateur JEC vérifie le contenu et choisit s'il sera partagé avec les membres vérifiés ou rendu public.",
              "Submissions remain private and pending. A JEC administrator reviews each contribution and decides whether it can be shared with verified members or made public."
            )}</p>
          </div>
        </section>

        <section className="collab-section spiritual-section">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("RESSOURCES VALIDÉES", "APPROVED RESOURCES")}</p>
              <h2>{t("Ce que les équipes partagent", "What teams are sharing")}</h2>
            </div>
            <span>{visibleResources.length} {t("ressources", "resources")}</span>
          </div>

          {loading ? (
            <p className="spiritual-sharing-empty">{t("Chargement des ressources…", "Loading resources…")}</p>
          ) : visibleResources.length ? (
            <div className="spiritual-sharing-list">
              {visibleResources.map((item) => {
                const resourceType = contributionType(item.tags);
                return (
                  <article className="spiritual-sharing-card" key={item.id}>
                    <div className="spiritual-sharing-card-head">
                      <span className={"spiritual-sharing-type " + resourceType}>{en ? resourceLabels[resourceType].en : resourceLabels[resourceType].fr}</span>
                      <time dateTime={item.created_at}>{formatDate(item.created_at, en)}</time>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                    <div className="spiritual-sharing-card-foot">
                      <span>{item.structure_name || t("Équipe JEC", "JEC team")}</span>
                      <span className="spiritual-sharing-visibility">{item.visibility_scope === "public" ? t("Public", "Public") : t("Membres JEC", "JEC members")}</span>
                    </div>
                    {item.source_url && <a className="spiritual-calendar-source-link" href={item.source_url} target="_blank" rel="noopener noreferrer">{t("Consulter la source", "Open source")} ↗</a>}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="spiritual-sharing-empty">
              <span>✧</span>
              <h3>{t("Les premières contributions sont attendues", "The first contributions are welcome")}</h3>
              <p>{t(
                "Aucune ressource n'a encore été approuvée pour cet espace. Les contenus en attente ne sont visibles que par leur auteur et les administrateurs.",
                "No resource has been approved for this space yet. Pending contributions are visible only to their author and administrators."
              )}</p>
            </div>
          )}
        </section>

        {ownPending.length > 0 && (
          <section className="collab-section spiritual-section">
            <div className="collab-section-heading">
              <div>
                <p className="eyebrow">{t("SUIVI", "FOLLOW-UP")}</p>
                <h2>{t("Mes propositions en attente", "My pending contributions")}</h2>
              </div>
              <span>{ownPending.length}</span>
            </div>
            <div className="spiritual-own-pending">
              {ownPending.map((item) => (
                <article key={item.id}>
                  <span className="spiritual-review-badge">{t("À valider", "Pending review")}</span>
                  <strong>{item.title}</strong>
                  <small>{formatDate(item.created_at, en)}</small>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="collab-section spiritual-section">
          <div className="collab-section-heading">
            <div>
              <p className="eyebrow">{t("CONTRIBUER", "CONTRIBUTE")}</p>
              <h2>{t("Proposer une ressource", "Submit a resource")}</h2>
            </div>
          </div>

          {loading ? (
            <div className="spiritual-sharing-gate"><p>{t("Vérification de ton accès…", "Checking your access…")}</p></div>
          ) : !userId ? (
            <div className="spiritual-sharing-gate">
              <p>{t("Pour proposer une ressource, connecte-toi avec ton compte JEC.", "To submit a resource, sign in with your JEC account.")}</p>
              <Link href="/login" className="spiritual-cta">{t("Se connecter", "Sign in")} →</Link>
            </div>
          ) : !canContribute ? (
            <div className="spiritual-sharing-gate">
              <p>{t("La contribution est réservée aux membres JEC dont l'adhésion a été vérifiée. Tu peux consulter les ressources validées en attendant.", "Contributions are reserved for JEC members whose membership has been verified. You can browse approved resources in the meantime.")}</p>
              <Link href="/compte" className="spiritual-cta">{t("Voir mon compte", "View my account")} →</Link>
            </div>
          ) : (
            <form className="spiritual-sharing-form" onSubmit={submitContribution}>
              <div className="spiritual-sharing-form-grid">
                <label>
                  <span>{t("Type de contribution", "Contribution type")}</span>
                  <select value={type} onChange={(event) => setType(event.target.value as ResourceType)}>
                    {Object.entries(resourceLabels).map(([value, label]) => <option key={value} value={value}>{en ? label.en : label.fr}</option>)}
                  </select>
                </label>
                <label>
                  <span>{t("Langue", "Language")}</span>
                  <select value={language} onChange={(event) => setLanguage(event.target.value as ResourceLanguage)}>
                    <option value="fr">{t("Français", "French")}</option>
                    <option value="en">{t("Anglais", "English")}</option>
                    <option value="multi">{t("Multilingue", "Multilingual")}</option>
                  </select>
                </label>
                <label className="spiritual-sharing-full">
                  <span>{t("Titre", "Title")}</span>
                  <input required minLength={3} maxLength={220} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("Ex. Méditation sur l'engagement et la fraternité", "e.g. Reflection on commitment and fraternity")} />
                </label>
                <label className="spiritual-sharing-full">
                  <span>{t("Contenu", "Content")}</span>
                  <textarea required minLength={40} maxLength={10000} rows={8} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("Partage le texte, les questions, la prière ou la fiche d'animation…", "Share the text, questions, prayer or activity outline…")} />
                  <small>{description.length}/10 000 {t("caractères", "characters")}</small>
                </label>
                <label>
                  <span>{t("Équipe / structure JEC (facultatif)", "JEC team / structure (optional)")}</span>
                  <input maxLength={160} value={structure} onChange={(event) => setStructure(event.target.value)} placeholder={t("Ex. JEC locale, mouvement national…", "e.g. Local JEC team, national movement…")} />
                </label>
                <label>
                  <span>{t("Lien de référence (facultatif)", "Reference link (optional)")}</span>
                  <input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://" />
                </label>
              </div>

              <div className="spiritual-sharing-safeguards">
                <label>
                  <input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} />
                  <span>{t("Je suis l'auteur de ce contenu ou j'ai l'autorisation de le partager.", "I authored this content or have permission to share it.")}</span>
                </label>
                <label>
                  <input type="checkbox" checked={rulesConfirmed} onChange={(event) => setRulesConfirmed(event.target.checked)} />
                  <span>{t("Je n'inclus aucun nom, diagnostic, détail privé ou information sensible permettant d'identifier une personne dans une intention de prière.", "I have not included any name, diagnosis, private detail or sensitive information that could identify a person in a prayer intention.")}</span>
                </label>
              </div>

              {error && <p className="spiritual-sharing-error" role="alert">{error}</p>}
              {message && <p className="spiritual-sharing-success" role="status">{message}</p>}
              <div className="spiritual-builder-actions">
                <button type="submit" className="spiritual-cta" disabled={submitting}>{submitting ? t("Envoi…", "Submitting…") : t("Soumettre pour validation", "Submit for review")} →</button>
                <span className="spiritual-sharing-note">{t("Diffusion réservée aux membres par défaut. Le public n'y aura accès qu'après validation explicite.", "Member-only by default. Public access is available only after explicit approval.")}</span>
              </div>
            </form>
          )}
          {error && !canContribute && <p className="spiritual-sharing-error" role="alert">{error}</p>}
          {message && !canContribute && <p className="spiritual-sharing-success" role="status">{message}</p>}
        </section>

        {isAdmin && (
          <section className="spiritual-admin-review-link">
            <div>
              <strong>{t("Tu peux modérer les contributions", "You can moderate contributions")}</strong>
              <p>{t("La validation, le choix de visibilité et le retrait se font dans le catalogue des archives JEC.", "Approval, visibility and withdrawal are managed in the JEC archive catalogue.")}</p>
            </div>
            <Link href="/archives" className="spiritual-cta">{t("Ouvrir la modération", "Open moderation")} →</Link>
          </section>
        )}

        <section className="spiritual-validation-note">
          <strong>{t("Un espace de partage responsable", "A responsible sharing space")}</strong>
          <p>{t(
            "Les intentions sont formulées de manière générale. Ne publie pas de demandes nominatives, de données de santé ou d'informations privées. Les contributions restent réservées aux membres tant qu'un administrateur n'a pas validé leur diffusion publique.",
            "Prayer intentions must remain general. Do not publish identifiable requests, health data or private information. Contributions remain limited to members until an administrator approves public distribution."
          )}</p>
        </section>
      </div>
    </main>
  );
}
