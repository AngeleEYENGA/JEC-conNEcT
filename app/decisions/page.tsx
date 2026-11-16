"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Workspace = { id: string; name: string; slug: string };
type Poll = {
  id: string; workspace_id: string; title: string; description: string | null;
  decision_type: "poll" | "vote" | "election"; selection_mode: "single" | "multiple";
  results_visibility: "after_close" | "immediate"; approval_rule: string;
  quorum_percent: number; allow_abstention: boolean; status: string;
  starts_at: string; ends_at: string; created_at: string;
};
type Option = { id: string; poll_id: string; label: string; detail: string | null; sort_order: number };
type Result = {
  option_id: string; option_label: string; option_detail: string | null; vote_count: number;
  participant_count: number; eligible_count: number; turnout_percent: number;
  quorum_met: boolean; abstention_count: number;
};
type Membership = { workspace_id: string; workspace_role: string };

function localDateTime(daysAhead = 3) {
  const date = new Date(Date.now() + daysAhead * 86400000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function dateLabel(value: string, en: boolean) {
  return new Date(value).toLocaleString(en ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default function DecisionsPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const t = (fr: string, english: string) => en ? english : fr;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [userId, setUserId] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [eligiblePollIds, setEligiblePollIds] = useState<string[]>([]);
  const [votedPollIds, setVotedPollIds] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, Result[]>>({});
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [workspaceId, setWorkspaceId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [decisionType, setDecisionType] = useState<"poll" | "vote" | "election">("poll");
  const [selectionMode, setSelectionMode] = useState<"single" | "multiple">("single");
  const [approvalRule, setApprovalRule] = useState("plurality");
  const [quorum, setQuorum] = useState("0");
  const [allowAbstention, setAllowAbstention] = useState(true);
  const [endsAt, setEndsAt] = useState(localDateTime());
  const [optionsText, setOptionsText] = useState("");

  const managerWorkspaces = useMemo(() => {
    const ids = new Set(memberships.filter(m => m.workspace_role === "owner" || m.workspace_role === "manager").map(m => m.workspace_id));
    return workspaces.filter(w => ids.has(w.id));
  }, [memberships, workspaces]);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Supabase n'est pas configuré."); setLoading(false); return; }
    setError("");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError(en ? "Sign in to access member decisions." : "Connecte-toi pour accéder aux décisions des membres.");
      setLoading(false);
      return;
    }
    setUserId(user.id);
    const [spacesResult, membershipResult] = await Promise.all([
      supabase.from("jec_workspaces").select("id,name,slug").order("name"),
      supabase.from("jec_workspace_members").select("workspace_id,workspace_role").eq("user_id", user.id).eq("membership_status", "active")
    ]);
    if (spacesResult.error) { setError(spacesResult.error.message); setLoading(false); return; }
    const spaces = (spacesResult.data || []) as Workspace[];
    const membershipsData = (membershipResult.data || []) as Membership[];
    setWorkspaces(spaces);
    setMemberships(membershipsData);
    if (!workspaceId && spaces[0]) setWorkspaceId(spaces[0].id);
    if (!spaces.length) {
      setPolls([]); setOptions([]); setEligiblePollIds([]); setVotedPollIds([]); setResults({});
      setLoading(false);
      return;
    }
    const ids = spaces.map(w => w.id);
    const pollResult = await supabase.from("jec_decision_polls")
      .select("id,workspace_id,title,description,decision_type,selection_mode,results_visibility,approval_rule,quorum_percent,allow_abstention,status,starts_at,ends_at,created_at")
      .in("workspace_id", ids).order("created_at", { ascending: false });
    if (pollResult.error) { setError(pollResult.error.message); setLoading(false); return; }
    const pollRows = (pollResult.data || []) as Poll[];
    setPolls(pollRows);
    const pollIds = pollRows.map(p => p.id);
    if (!pollIds.length) {
      setOptions([]); setEligiblePollIds([]); setVotedPollIds([]); setResults({});
      setLoading(false);
      return;
    }
    const [optionResult, eligibleResult, participationResult] = await Promise.all([
      supabase.from("jec_decision_options").select("id,poll_id,label,detail,sort_order").in("poll_id", pollIds).order("sort_order"),
      supabase.from("jec_decision_eligible_voters").select("poll_id").eq("user_id", user.id).in("poll_id", pollIds),
      supabase.from("jec_decision_voter_participation").select("poll_id").eq("user_id", user.id).in("poll_id", pollIds)
    ]);
    if (optionResult.error) setError(optionResult.error.message);
    setOptions((optionResult.data || []) as Option[]);
    setEligiblePollIds((eligibleResult.data || []).map((row: { poll_id: string }) => row.poll_id));
    setVotedPollIds((participationResult.data || []).map((row: { poll_id: string }) => row.poll_id));

    const now = Date.now();
    const visiblePolls = pollRows.filter(p => p.status === "closed" || new Date(p.ends_at).getTime() <= now || p.results_visibility === "immediate");
    const resultPairs = await Promise.all(visiblePolls.map(async poll => {
      const { data, error: resultError } = await supabase.rpc("jec_get_decision_poll_results", { target_poll_id: poll.id });
      if (resultError) return [poll.id, []] as const;
      return [poll.id, (data || []) as Result[]] as const;
    }));
    setResults(Object.fromEntries(resultPairs));
    setLoading(false);
  }, [en, workspaceId]);

  useEffect(() => { void load(); }, [load]);

  async function createDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const parsedOptions = optionsText.split("\n").map(line => {
      const [label, ...detail] = line.split("|");
      return { label: label.trim(), detail: detail.join("|").trim() || null };
    }).filter(option => option.label);
    if (parsedOptions.length < 2) {
      setError(en ? "Add at least two choices or candidates, one per line." : "Ajoute au moins deux choix ou candidats, un par ligne.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    const { data, error: createError } = await supabase.rpc("jec_create_decision_poll", {
      target_workspace_id: workspaceId,
      target_title: title.trim(),
      target_description: description.trim() || null,
      target_decision_type: decisionType,
      target_selection_mode: decisionType === "election" ? "single" : selectionMode,
      target_results_visibility: decisionType === "election" ? "after_close" : "after_close",
      target_ends_at: new Date(endsAt).toISOString(),
      target_quorum_percent: Number(quorum),
      target_approval_rule: decisionType === "election" ? "plurality" : approvalRule,
      target_allow_abstention: allowAbstention,
      target_options: parsedOptions
    });
    if (createError) setError(createError.message);
    else {
      setTitle(""); setDescription(""); setOptionsText(""); setDecisionType("poll"); setSelectionMode("single");
      setNotice(en ? "Decision published. Eligible workspace members can now participate." : "Décision publiée. Les membres éligibles de l’espace peuvent maintenant participer.");
      await load();
    }
    setBusy(false);
  }

  function toggleOption(poll: Poll, optionId: string) {
    setSelected(current => {
      const currentIds = current[poll.id] || [];
      if (poll.selection_mode === "single") return { ...current, [poll.id]: currentIds.includes(optionId) ? [] : [optionId] };
      return { ...current, [poll.id]: currentIds.includes(optionId) ? currentIds.filter(id => id !== optionId) : [...currentIds, optionId] };
    });
  }

  async function castBallot(poll: Poll) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const selection = selected[poll.id] || [];
    if (!selection.length && !poll.allow_abstention) return;
    setBusy(true); setError(""); setNotice("");
    const { error: voteError } = await supabase.rpc("jec_cast_decision_ballot", {
      target_poll_id: poll.id,
      target_option_ids: selection
    });
    if (voteError) setError(voteError.message);
    else {
      setNotice(en ? "Your ballot has been recorded." : "Ton bulletin a bien été enregistré.");
      setSelected(current => ({ ...current, [poll.id]: [] }));
      await load();
    }
    setBusy(false);
  }

  async function closePoll(poll: Poll) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    if (!window.confirm(en ? "Close this decision now? Voting will stop and results will become visible." : "Clore cette décision maintenant ? Le vote sera arrêté et les résultats seront visibles.")) return;
    setBusy(true); setError("");
    const { error: closeError } = await supabase.rpc("jec_close_decision_poll", { target_poll_id: poll.id });
    if (closeError) setError(closeError.message);
    else { setNotice(en ? "Decision closed." : "Décision clôturée."); await load(); }
    setBusy(false);
  }

  const optionsFor = (pollId: string) => options.filter(option => option.poll_id === pollId);
  const workspaceName = (id: string) => workspaces.find(w => w.id === id)?.name || "JEC";
  const canManage = (id: string) => managerWorkspaces.some(w => w.id === id);
  const resultVisible = (poll: Poll) => Boolean(results[poll.id]);
  const approvalLabel = (rule: string) => ({
    plurality: t("Pluralité des voix", "Most votes"),
    simple_majority: t("Majorité simple (> 50 % des suffrages exprimés)", "Simple majority (> 50% of votes cast)"),
    absolute_majority: t("Majorité absolue (> 50 % des électeurs inscrits)", "Absolute majority (> 50% of eligible voters)"),
    two_thirds: t("Majorité des deux tiers (≥ 2/3)", "Two-thirds majority (≥ 2/3)")
  }[rule] || rule);

  const calculateOutcome = (poll: Poll) => {
    const rows = results[poll.id] || [];
    if (!rows.length) return "";
    const participants = Number(rows[0].participant_count || 0);
    const eligible = Number(rows[0].eligible_count || 0);
    const quorumMet = rows[0].quorum_met;
    if (!quorumMet) return t("Quorum non atteint : aucune décision ne peut être proclamée.", "Quorum not reached: no decision can be declared.");
    const counts = rows.map(row => Number(row.vote_count || 0));
    const top = Math.max(...counts);
    const winners = rows.filter(row => Number(row.vote_count) === top);
    if (winners.length !== 1 || top === 0) return t("Égalité ou absence de suffrages : un second tour ou une nouvelle délibération est nécessaire.", "Tie or no valid votes: a second round or further deliberation is required.");
    const validVotes = counts.reduce((sum, value) => sum + value, 0);
    const pctOfVotes = validVotes ? top / validVotes : 0;
    const pctOfEligible = eligible ? top / eligible : 0;
    let accepted = false;
    if (poll.approval_rule === "plurality") accepted = true;
    if (poll.approval_rule === "simple_majority") accepted = pctOfVotes > 0.5;
    if (poll.approval_rule === "absolute_majority") accepted = pctOfEligible > 0.5;
    if (poll.approval_rule === "two_thirds") accepted = pctOfVotes >= 2 / 3;
    return accepted
      ? t("Résultat conforme à la règle de décision sélectionnée : ", "Result meets the selected decision rule: ") + winners[0].option_label
      : t("Le seuil de décision n’est pas atteint. Une nouvelle délibération peut être nécessaire.", "The decision threshold has not been met. Further deliberation may be needed.");
  };

  return (
    <main className="collab-page decision-page">
      <header className="account-header">
        <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link>
        <div><LanguageSwitcher /><Link href="/workspace" className="back-link-inline">{t("Espaces de travail", "Workspaces")}</Link></div>
      </header>
      <div className="collab-content decision-content">
        <p className="eyebrow">{t("GOUVERNANCE PARTICIPATIVE", "PARTICIPATORY GOVERNANCE")}</p>
        <div className="decision-page-heading">
          <div><h1>{t("Décisions, votes et élections", "Decisions, votes & elections")}</h1>
            <p className="collab-lead">{t("Un espace commun pour consulter les membres, prendre des décisions formelles et organiser les élections au sein des espaces JEC.", "A shared space to consult members, take formal decisions and run elections across JEC workspaces.")}</p>
          </div>
          <span className="decision-security">🔐 {t("Bulletins dissociés des identités", "Ballots separated from identities")}</span>
        </div>
        {error && <p className="alert error">{error}</p>}
        {notice && <p className="alert success">{notice}</p>}
        {loading ? <p className="collab-muted">{t("Chargement des consultations et votes…", "Loading consultations and votes…")}</p> : !workspaces.length ? (
          <section className="collab-empty"><h2>{t("Aucun espace de travail accessible", "No accessible workspace")}</h2><p>{t("Rejoins un espace de travail JEC pour participer aux consultations et élections.", "Join a JEC workspace to participate in consultations and elections.")}</p><Link className="primary-button" href="/workspace">{t("Voir les espaces", "Browse workspaces")}</Link></section>
        ) : (
          <>
            {managerWorkspaces.length > 0 && <section className="collab-card decision-create-card">
              <div className="collab-card-heading"><div><p className="eyebrow">{t("ORGANISATION D'UNE CONSULTATION", "CREATE A CONSULTATION")}</p><h2>{t("Lancer un sondage, un vote ou une élection", "Launch a poll, vote or election")}</h2></div></div>
              <p className="collab-muted">{t("La liste des électeurs éligibles est figée à l’ouverture. Les choix sont enregistrés séparément du registre nominatif de participation.", "The eligible voter list is snapshotted at launch. Choices are stored separately from the named participation register.")}</p>
              <form className="decision-form" onSubmit={createDecision}>
                <label>{t("Espace JEC", "JEC workspace")}<select value={workspaceId || managerWorkspaces[0]?.id || ""} onChange={e => setWorkspaceId(e.target.value)} required>{managerWorkspaces.map(space => <option key={space.id} value={space.id}>{space.name}</option>)}</select></label>
                <label>{t("Type de décision", "Decision type")}<select value={decisionType} onChange={e => { const value = e.target.value as "poll" | "vote" | "election"; setDecisionType(value); if (value === "election") { setSelectionMode("single"); setApprovalRule("plurality"); } }}><option value="poll">{t("Sondage / consultation", "Poll / consultation")}</option><option value="vote">{t("Vote décisionnel", "Formal vote")}</option><option value="election">{t("Élection", "Election")}</option></select></label>
                <label>{t("Intitulé", "Title")}<input value={title} onChange={e => setTitle(e.target.value)} minLength={3} maxLength={180} required placeholder={t("Ex. Adoption du plan d’action 2027", "e.g. Adoption of the 2027 action plan")} /></label>
                <label>{t("Contexte et objet", "Context and purpose")}<textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder={t("Présente les éléments utiles à la décision…", "Provide context for the decision…")} /></label>
                <label className="decision-wide">{decisionType === "election" ? t("Candidats (un par ligne : Nom | présentation)", "Candidates (one per line: Name | statement)") : t("Choix proposés (un par ligne : Choix | précision)", "Options (one per line: Option | detail)")}<textarea rows={5} value={optionsText} onChange={e => setOptionsText(e.target.value)} required placeholder={t("Option A\nOption B\nAbstention possible via le bouton dédié", "Option A\nOption B\nAbstention is available at voting time")} /></label>
                <label>{t("Mode de sélection", "Selection mode")}<select value={selectionMode} disabled={decisionType === "election"} onChange={e => setSelectionMode(e.target.value as "single" | "multiple")}><option value="single">{t("Un seul choix", "Single choice")}</option><option value="multiple">{t("Plusieurs choix possibles", "Multiple choices")}</option></select></label>
                <label>{t("Règle de décision", "Decision rule")}<select value={approvalRule} disabled={decisionType === "election" || selectionMode === "multiple"} onChange={e => setApprovalRule(e.target.value)}><option value="plurality">{t("Pluralité des voix", "Most votes")}</option><option value="simple_majority">{t("Majorité simple", "Simple majority")}</option><option value="absolute_majority">{t("Majorité absolue", "Absolute majority")}</option><option value="two_thirds">{t("Deux tiers", "Two-thirds majority")}</option></select></label>
                <label>{t("Quorum requis (%)", "Required quorum (%)")}<input type="number" min="0" max="100" step="1" value={quorum} onChange={e => setQuorum(e.target.value)} /></label>
                <label>{t("Clôture du scrutin", "Voting closes")}<input type="datetime-local" value={endsAt} min={localDateTime(0)} onChange={e => setEndsAt(e.target.value)} required /></label>
                <label className="decision-check"><input type="checkbox" checked={allowAbstention} onChange={e => setAllowAbstention(e.target.checked)} /><span>{t("Autoriser l’abstention", "Allow abstention")}</span></label>
                <p className="decision-form-note">{t("Les élections sont toujours à bulletin secret et leurs résultats ne sont révélés qu’après clôture.", "Elections always use a secret ballot; results are revealed only after closing.")}</p>
                <button className="primary-button" disabled={busy || !workspaceId}>{busy ? t("Publication…", "Publishing…") : t("Publier et ouvrir le scrutin", "Publish and open vote")}</button>
              </form>
            </section>}
            <section className="decision-list">
              <div className="collab-card-heading"><div><p className="eyebrow">{t("VIE DÉMOCRATIQUE", "DEMOCRATIC LIFE")}</p><h2>{t("Consultations et scrutins", "Consultations and ballots")}</h2></div><span className="collab-count">{polls.length}</span></div>
              {!polls.length ? <div className="collab-empty"><p>{t("Aucun sondage ou scrutin n’a encore été lancé dans tes espaces.", "No polls or ballots have been launched in your workspaces yet.")}</p></div> : polls.map(poll => {
                const pollOptions = optionsFor(poll.id);
                const eligible = eligiblePollIds.includes(poll.id);
                const voted = votedPollIds.includes(poll.id);
                const expired = new Date(poll.ends_at).getTime() <= Date.now();
                const open = poll.status === "open" && !expired;
                const pollResults = results[poll.id] || [];
                const showResults = resultVisible(poll);
                return <article className="collab-card decision-poll-card" key={poll.id}>
                  <div className="decision-poll-top"><div><span className={"decision-type-tag " + poll.decision_type}>{poll.decision_type === "election" ? t("ÉLECTION", "ELECTION") : poll.decision_type === "vote" ? t("VOTE DÉCISIONNEL", "FORMAL VOTE") : t("CONSULTATION", "CONSULTATION")}</span><p className="decision-workspace-name">{workspaceName(poll.workspace_id)}</p><h3>{poll.title}</h3></div><span className={"project-status " + (open ? "scheduled" : "completed")}>{open ? t("Ouvert", "Open") : t("Clôturé", "Closed")}</span></div>
                  {poll.description && <p className="decision-description">{poll.description}</p>}
                  <div className="decision-meta"><span>{t("Clôture", "Closes")} : {dateLabel(poll.ends_at, en)}</span><span>{t("Quorum", "Quorum")} : {poll.quorum_percent}%</span><span>{approvalLabel(poll.approval_rule)}</span></div>
                  {open && eligible && !voted && <div className="decision-ballot">
                    <p className="eyebrow">{poll.decision_type === "election" ? t("CHOISIS UN CANDIDAT", "SELECT A CANDIDATE") : t("EXPRIME TON CHOIX", "CAST YOUR VOTE")}</p>
                    {pollOptions.map(option => <label className="decision-option" key={option.id}>
                      <input type={poll.selection_mode === "single" ? "radio" : "checkbox"} name={"poll-" + poll.id} checked={(selected[poll.id] || []).includes(option.id)} onChange={() => toggleOption(poll, option.id)} />
                      <span><strong>{option.label}</strong>{option.detail && <small>{option.detail}</small>}</span>
                    </label>)}
                    {poll.allow_abstention && <p className="decision-abstain-note">{t("Tu peux aussi soumettre un bulletin blanc / une abstention en laissant tous les choix décochés.", "You may submit a blank ballot / abstention by leaving every option unchecked.")}</p>}
                    <button className="primary-button" onClick={() => void castBallot(poll)} disabled={busy || (!(selected[poll.id] || []).length && !poll.allow_abstention)}>{t("Valider mon bulletin", "Submit my ballot")}</button>
                  </div>}
                  {open && !eligible && <p className="decision-muted">{t("Ce scrutin est réservé aux membres éligibles de cet espace.", "This ballot is restricted to eligible members of this workspace.")}</p>}
                  {open && eligible && voted && <p className="decision-voted">✓ {t("Ta participation est enregistrée. Tu ne peux voter qu’une seule fois.", "Your participation is recorded. You can vote only once.")}</p>}
                  {!open && <p className="decision-muted">{expired && poll.status === "open" ? t("Date de clôture atteinte.", "Closing time reached.") : t("Ce scrutin est clôturé.", "This ballot is closed.")}</p>}
                  {showResults && pollResults.length > 0 && <div className="decision-results">
                    <div className="decision-results-heading"><strong>{t("Résultats", "Results")}</strong><span>{pollResults[0].participant_count}/{pollResults[0].eligible_count} {t("participants", "participants")} · {pollResults[0].turnout_percent}%</span></div>
                    {pollResults.map(result => {
                      const totalVotes = pollResults.reduce((sum, row) => sum + Number(row.vote_count), 0);
                      const percentage = totalVotes ? Math.round(Number(result.vote_count) * 100 / totalVotes) : 0;
                      return <div className="decision-result-row" key={result.option_id}><div><span>{result.option_label}</span><strong>{result.vote_count} · {percentage}%</strong></div><div className="decision-result-track"><i style={{ width: percentage + "%" }} /></div></div>;
                    })}
                    {Number(pollResults[0].abstention_count) > 0 && <p className="decision-muted">{t("Bulletins blancs / abstentions", "Blank ballots / abstentions")} : {pollResults[0].abstention_count}</p>}
                    <p className={pollResults[0].quorum_met ? "decision-outcome" : "decision-outcome warning"}>{calculateOutcome(poll)}</p>
                  </div>}
                  {canManage(poll.workspace_id) && open && <button className="danger-outline-button decision-close-button" onClick={() => void closePoll(poll)} disabled={busy}>{t("Clore le scrutin", "Close ballot")}</button>}
                </article>;
              })}
            </section>
          </>
        )}
        <p className="decision-privacy-note">{t("Intégrité : éligibilité enregistrée à l’ouverture, un bulletin maximum par membre, choix dissociés du registre de participation et résultats agrégés. Pour les élections importantes, les règles statutaires de la JEC et le contrôle du dépouillement doivent également être respectés.", "Integrity: eligibility is snapshotted at launch, each member may cast one ballot, selections are kept separate from the participation register, and results are aggregated. Important elections must also comply with JEC statutes and appropriate scrutiny procedures.")}</p>
      </div>
    </main>
  );
}
