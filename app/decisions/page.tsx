"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Workspace = { id: string; name: string; slug: string; workspace_role: string };
type Candidate = { user_id: string; name: string };
type MeetingChoice = { id: string; title: string; starts_at: string };
type Ballot = {
  id: string; workspace_id: string; meeting_id: string | null; ballot_type: "consultation" | "decision" | "election";
  title: string; description: string | null; voting_mode: "single" | "multiple"; is_anonymous: boolean;
  eligibility_scope: string; results_visibility: string; quorum_percent: number; approval_rule: string;
  status: string; opens_at: string; closes_at: string; created_at: string;
};
type BallotOption = { id: string; ballot_id: string; label: string; description: string | null; candidate_user_id: string | null; sort_order: number };
type BallotResult = {
  eligible_count: number; voter_count: number | null; has_voted: boolean; is_eligible: boolean;
  results_visible: boolean; quorum_reached: boolean | null;
  options: Array<{ id: string; label: string; description: string | null; candidate_user_id: string | null; votes: number | null }>;
};

const typeLabel = (type: Ballot["ballot_type"], en: boolean) =>
  type === "election" ? (en ? "Election" : "Élection") :
  type === "decision" ? (en ? "Decision vote" : "Vote décisionnel") :
  (en ? "Consultation" : "Consultation");

const scopeLabel = (scope: string, en: boolean) =>
  scope === "meeting_participants" ? (en ? "Accepted meeting participants" : "Participants ayant accepté la réunion") :
  scope === "verified_members" ? (en ? "All verified JEC members" : "Tous les membres JEC vérifiés") :
  (en ? "Active workspace members" : "Membres actifs de l'espace");

const ruleLabel = (rule: string, en: boolean) =>
  rule === "simple_majority" ? (en ? "Simple majority" : "Majorité simple") :
  rule === "absolute_majority" ? (en ? "Absolute majority" : "Majorité absolue") :
  rule === "two_thirds" ? (en ? "Two-thirds majority" : "Majorité des deux tiers") :
  (en ? "Plurality" : "Majorité relative");

function formatDate(value: string, en: boolean) {
  return new Date(value).toLocaleString(en ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default function DecisionsPage() {
  const { lang } = useLanguage();
  const en = lang === "en";
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [workspaceCandidates, setWorkspaceCandidates] = useState<Candidate[]>([]);
  const [meetingChoices, setMeetingChoices] = useState<MeetingChoice[]>([]);
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [options, setOptions] = useState<BallotOption[]>([]);
  const [results, setResults] = useState<Record<string, BallotResult>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [selectedMeeting, setSelectedMeeting] = useState("");
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [ballotType, setBallotType] = useState<Ballot["ballot_type"]>("consultation");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [votingMode, setVotingMode] = useState<"single" | "multiple">("single");
  const [anonymous, setAnonymous] = useState(true);
  const [eligibility, setEligibility] = useState("workspace_members");
  const [resultsVisibility, setResultsVisibility] = useState("after_close");
  const [quorum, setQuorum] = useState("0");
  const [approvalRule, setApprovalRule] = useState("plurality");
  const [closesAt, setClosesAt] = useState(() => {
    const date = new Date(Date.now() + 7 * 86400000);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  });
  const [optionText, setOptionText] = useState("Pour\nContre\nAbstention");
  const [candidateIds, setCandidateIds] = useState<string[]>([]);

  async function loadAll() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Supabase n'est pas configuré."); setLoading(false); return; }
    setLoading(true);
    setError("");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { window.location.href = "/login"; return; }
    setUserId(user.id);

    const [{ data: memberships, error: membershipError }, { data: admin }, { data: ballotRows, error: ballotError }] = await Promise.all([
      supabase.from("jec_workspace_members")
        .select("workspace_id,workspace_role,workspace:jec_workspaces(id,name,slug)")
        .eq("user_id", user.id).eq("membership_status", "active"),
      supabase.rpc("is_jec_admin"),
      supabase.from("jec_governance_ballots")
        .select("id,workspace_id,meeting_id,ballot_type,title,description,voting_mode,is_anonymous,eligibility_scope,results_visibility,quorum_percent,approval_rule,status,opens_at,closes_at,created_at")
        .order("created_at", { ascending: false })
    ]);
    if (membershipError) setError(membershipError.message);
    if (ballotError) setError(ballotError.message);
    const adminUser = admin === true;
    setIsAdmin(adminUser);

    let workspaceRows: Workspace[] = (memberships ?? []).flatMap((row: any) => {
      const workspace = Array.isArray(row.workspace) ? row.workspace[0] : row.workspace;
      return workspace ? [{ id: workspace.id, name: workspace.name, slug: workspace.slug, workspace_role: row.workspace_role }] : [];
    });
    if (adminUser) {
      const { data: allWorkspaces, error: allWorkspaceError } = await supabase.from("jec_workspaces").select("id,name,slug").order("name");
      if (allWorkspaceError) setError(allWorkspaceError.message);
      workspaceRows = (allWorkspaces ?? []).map((workspace: any) => ({
        ...workspace,
        workspace_role: "manager"
      }));
    }
    setWorkspaces(workspaceRows);

    const ballotList = (ballotRows ?? []) as Ballot[];
    setBallots(ballotList);
    const ids = ballotList.map(ballot => ballot.id);
    const [{ data: optionRows, error: optionError }, resultPairs] = await Promise.all([
      ids.length
        ? supabase.from("jec_governance_options").select("id,ballot_id,label,description,candidate_user_id,sort_order").in("ballot_id", ids).order("sort_order")
        : Promise.resolve({ data: [], error: null }),
      Promise.all(ballotList.map(async ballot => {
        const { data, error: resultError } = await supabase.rpc("jec_governance_ballot_results", { target_ballot_id: ballot.id });
        return [ballot.id, resultError ? null : data] as const;
      }))
    ]);
    if (optionError) setError(optionError.message);
    setOptions((optionRows ?? []) as BallotOption[]);
    const nextResults: Record<string, BallotResult> = {};
    for (const [id, value] of resultPairs) if (value) nextResults[id] = value as BallotResult;
    setResults(nextResults);

    const candidateUserIds = [...new Set(
      (optionRows ?? []).map((option: any) => option.candidate_user_id).filter(Boolean)
    )];
    if (candidateUserIds.length) {
      const { data: profiles } = await supabase.from("jec_profiles")
        .select("user_id,display_name,first_name,last_name")
        .in("user_id", candidateUserIds);
      const nextNames: Record<string, string> = {};
      for (const profile of profiles ?? []) {
        nextNames[profile.user_id] = profile.display_name ||
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") || (en ? "JEC member" : "Membre JEC");
      }
      setNames(current => ({ ...current, ...nextNames }));
    }

    const meetingFromUrl = new URLSearchParams(window.location.search).get("meeting") || "";
    setSelectedMeeting(meetingFromUrl);
    const workspaceFromUrl = new URLSearchParams(window.location.search).get("workspace") ||
      (meetingFromUrl
        ? ballotList.find(ballot => ballot.meeting_id === meetingFromUrl)?.workspace_id || ""
        : "") || workspaceRows[0]?.id || "";
    setSelectedWorkspace(current => current || workspaceFromUrl);
    setLoading(false);
  }

  useEffect(() => { void loadAll(); }, []);

  useEffect(() => {
    if (!selectedWorkspace) return;
    let active = true;
    async function loadWorkspaceContext() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const [{ data: meetingRows, error: meetingError }, { data: members, error: rosterError }] = await Promise.all([
        supabase.from("jec_meetings").select("id,title,starts_at").eq("workspace_id", selectedWorkspace).order("starts_at", { ascending: false }),
        supabase.from("jec_workspace_members").select("user_id").eq("workspace_id", selectedWorkspace).eq("membership_status", "active")
      ]);
      if (!active) return;
      if (meetingError) setError(meetingError.message);
      if (rosterError) setError(rosterError.message);
      setMeetingChoices((meetingRows ?? []) as MeetingChoice[]);
      const memberIds = (members ?? []).map((member: any) => member.user_id);
      if (!memberIds.length) { setWorkspaceCandidates([]); return; }
      const { data: profiles } = await supabase.from("jec_profiles")
        .select("user_id,display_name,first_name,last_name")
        .in("user_id", memberIds);
      if (!active) return;
      const candidateNames = new Map((profiles ?? []).map((profile: any) => [
        profile.user_id,
        profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || (en ? "JEC member" : "Membre JEC")
      ]));
      setWorkspaceCandidates(memberIds.map((id: string) => ({
        user_id: id,
        name: candidateNames.get(id) || (en ? "JEC member" : "Membre JEC")
      })));
      setNames(current => ({ ...current, ...Object.fromEntries(candidateNames) }));
    }
    void loadWorkspaceContext();
    return () => { active = false; };
  }, [selectedWorkspace, en]);

  const manageableWorkspaceIds = useMemo(() => new Set(
    workspaces.filter(workspace => isAdmin || ["owner", "manager"].includes(workspace.workspace_role)).map(workspace => workspace.id)
  ), [workspaces, isAdmin]);
  const canCreate = Boolean(selectedWorkspace) && manageableWorkspaceIds.has(selectedWorkspace);
  const visibleBallots = useMemo(() => {
    const filtered = selectedMeeting
      ? ballots.filter(ballot => ballot.meeting_id === selectedMeeting)
      : ballots.filter(ballot => !selectedWorkspace || ballot.workspace_id === selectedWorkspace);
    return filtered;
  }, [ballots, selectedWorkspace, selectedMeeting]);

  function toggleSelected(ballotId: string, optionId: string, multiple: boolean) {
    setSelectedVotes(current => {
      const existing = current[ballotId] ?? [];
      const next = multiple
        ? (existing.includes(optionId) ? existing.filter(id => id !== optionId) : [...existing, optionId])
        : [optionId];
      return { ...current, [ballotId]: next };
    });
  }

  async function createBallot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedWorkspace) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const ballotOptions = ballotType === "election"
      ? candidateIds.map(id => ({
          label: workspaceCandidates.find(candidate => candidate.user_id === id)?.name || "Candidat",
          candidate_user_id: id
        }))
      : optionText.split("\n").map(value => value.trim()).filter(Boolean).map(label => ({ label }));
    if (ballotOptions.length < 2) {
      setError(en ? "Add at least two options or candidates." : "Ajoute au moins deux choix ou candidats.");
      return;
    }
    if (eligibility === "meeting_participants" && !selectedMeeting) {
      setError(en ? "Select a meeting to define the electorate." : "Sélectionne une réunion pour définir l'électorat.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    const { error: createError } = await supabase.rpc("jec_create_governance_ballot", {
      p_workspace_id: selectedWorkspace,
      p_meeting_id: selectedMeeting || null,
      p_ballot_type: ballotType,
      p_title: title.trim(),
      p_description: description.trim() || null,
      p_voting_mode: ballotType === "election" || ballotType === "decision" ? "single" : votingMode,
      p_is_anonymous: true,
      p_eligibility_scope: eligibility,
      p_results_visibility: resultsVisibility,
      p_quorum_percent: Number(quorum) || 0,
      p_approval_rule: ballotType === "election" ? "plurality" : approvalRule,
      p_opens_at: new Date().toISOString(),
      p_closes_at: new Date(closesAt).toISOString(),
      p_options: ballotOptions
    });
    if (createError) setError(createError.message);
    else {
      setTitle(""); setDescription(""); setCandidateIds([]);
      setNotice(en ? "Ballot created. Eligible members can now vote." : "Scrutin créé. Les membres éligibles peuvent voter.");
      await loadAll();
    }
    setBusy(false);
  }

  async function castVote(ballot: Ballot) {
    const supabase = getSupabaseBrowserClient();
    const choices = selectedVotes[ballot.id] ?? [];
    if (!supabase || !choices.length) return;
    setBusy(true); setError(""); setNotice("");
    const { error: voteError } = await supabase.rpc("jec_cast_governance_vote", {
      target_ballot_id: ballot.id,
      selected_option_ids: choices
    });
    if (voteError) setError(voteError.message);
    else {
      setNotice(en ? "Your ballot has been recorded. You cannot vote twice." : "Ton bulletin a été enregistré. Un seul vote est autorisé par personne.");
      setSelectedVotes(current => ({ ...current, [ballot.id]: [] }));
      await loadAll();
    }
    setBusy(false);
  }

  async function changeStatus(ballotId: string, action: "open" | "close") {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError(""); setNotice("");
    const { error: actionError } = await supabase.rpc(
      action === "open" ? "jec_open_governance_ballot" : "jec_close_governance_ballot",
      { target_ballot_id: ballotId }
    );
    if (actionError) setError(actionError.message);
    else {
      setNotice(action === "open"
        ? (en ? "Ballot opened." : "Scrutin ouvert.")
        : (en ? "Ballot closed. Final results are now available." : "Scrutin clôturé. Les résultats définitifs sont disponibles."));
      await loadAll();
    }
    setBusy(false);
  }

  function decisionOutcome(ballot: Ballot, result: BallotResult) {
    if (!result.results_visible) return "";
    if (!result.quorum_reached) return en ? "Quorum not reached" : "Quorum non atteint";
    if (ballot.ballot_type === "election") {
      const ranked = [...result.options].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));
      if (!ranked.length || ranked[0].votes === 0) return "";
      if (ranked[1] && ranked[0].votes === ranked[1].votes) return en ? "Tie — no leading candidate" : "Égalité — aucun candidat en tête";
      return (en ? "Leading candidate: " : "Candidat arrivé en tête : ") +
        (ranked[0].candidate_user_id ? (names[ranked[0].candidate_user_id] || ranked[0].label) : ranked[0].label);
    }
    if (ballot.ballot_type !== "decision") return "";
    const yes = result.options.find(option => /^(pour|oui|yes|in favour)$/i.test(option.label.trim()));
    if (!yes) return "";
    const expressed = result.options.filter(option => !/^(abstention|abstain)$/i.test(option.label.trim()))
      .reduce((total, option) => total + (option.votes ?? 0), 0);
    const yesVotes = yes.votes ?? 0;
    const passed = ballot.approval_rule === "two_thirds" ? expressed > 0 && yesVotes / expressed >= 2 / 3
      : ballot.approval_rule === "absolute_majority" ? yesVotes > result.eligible_count / 2
      : yesVotes > expressed / 2;
    return passed ? (en ? "Proposition approved by the configured threshold" : "Proposition adoptée selon le seuil défini")
      : (en ? "Approval threshold not reached" : "Seuil d'adoption non atteint");
  }

  const selectedWorkspaceName = workspaces.find(workspace => workspace.id === selectedWorkspace)?.name;

  return <main className="collab-page decisions-page">
    <header className="account-header">
      <Link href="/" className="brand-lockup"><span className="brand-mark"><span>JEC</span><i>✳</i></span><span>conNEcT</span></Link>
      <div><LanguageSwitcher/><Link href={selectedMeeting ? "/reunions/" + selectedMeeting : "/workspace"} className="back-link-inline">{en ? "Back" : "Retour"}</Link></div>
    </header>
    <div className="collab-content decisions-content">
      <p className="eyebrow">{en ? "COLLECTIVE GOVERNANCE" : "GOUVERNANCE COLLECTIVE"}</p>
      <h1>{en ? "Consultations, votes & elections" : "Consultations, votes & élections"}</h1>
      <p className="collab-lead">{en
        ? "A transparent space to consult members, make collective decisions and organise internal elections."
        : "Un espace commun pour consulter les membres, prendre des décisions collectives et organiser les élections internes."}</p>
      {error && <p className="alert error">{error}</p>}
      {notice && <p className="alert success">{notice}</p>}

      <section className="decisions-principles">
        <strong>{en ? "A clear and traceable process" : "Un processus clair et traçable"}</strong>
        <p>{en
          ? "Each ballot has a defined electorate, opening and closing dates, a quorum and an approval rule. Individual choices are never exposed in the interface; only aggregate results are displayed. The platform records the vote but does not replace the JEC's statutes or the competent body's validation."
          : "Chaque scrutin définit son électorat, ses dates d'ouverture et de clôture, son quorum et sa règle d'adoption. Les choix individuels ne sont jamais exposés dans l'interface : seuls les résultats agrégés sont affichés. La plateforme consigne le vote, sans se substituer aux statuts de la JEC ni à la validation de l'instance compétente."}</p>
      </section>

      {loading ? <p className="muted">{en ? "Loading…" : "Chargement…"}</p> : <>
        <section className="decisions-toolbar">
          <label>{en ? "Workspace" : "Espace de travail"}
            <select value={selectedWorkspace} onChange={event => { setSelectedWorkspace(event.target.value); setSelectedMeeting(""); }}>
              <option value="">{en ? "Select a workspace" : "Sélectionner un espace"}</option>
              {workspaces.map(workspace => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
            </select>
          </label>
          <label>{en ? "Meeting filter" : "Filtrer par réunion"}
            <select value={selectedMeeting} onChange={event => setSelectedMeeting(event.target.value)}>
              <option value="">{en ? "All workspace ballots" : "Tous les scrutins de l'espace"}</option>
              {meetingChoices.map(meeting => <option key={meeting.id} value={meeting.id}>{meeting.title} · {formatDate(meeting.starts_at, en)}</option>)}
            </select>
          </label>
        </section>

        {canCreate && <section className="collab-card decisions-create-card">
          <div className="collab-card-heading"><div><p className="eyebrow">{en ? "NEW COLLECTIVE PROCESS" : "NOUVELLE CONSULTATION"}</p><h2>{en ? "Create a ballot" : "Créer un scrutin"}</h2></div></div>
          <form className="decisions-form" onSubmit={createBallot}>
            <div className="decisions-form-grid">
              <label>{en ? "Process type" : "Type de processus"}
                <select value={ballotType} onChange={event => {
                  const next = event.target.value as Ballot["ballot_type"];
                  setBallotType(next);
                  setApprovalRule(next === "election" ? "plurality" : next === "decision" ? "simple_majority" : "plurality");
                  if (next === "decision") { setOptionText("Pour\nContre\nAbstention"); setVotingMode("single"); }
                }}>
                  <option value="consultation">{en ? "Consultation / poll" : "Consultation / sondage"}</option>
                  <option value="decision">{en ? "Decision vote" : "Vote décisionnel"}</option>
                  <option value="election">{en ? "Internal election" : "Élection interne"}</option>
                </select>
              </label>
              <label>{en ? "Electorate" : "Électorat"}
                <select value={eligibility} onChange={event => setEligibility(event.target.value)}>
                  <option value="workspace_members">{en ? "Active workspace members" : "Membres actifs de l'espace"}</option>
                  <option value="meeting_participants">{en ? "Accepted meeting participants" : "Participants ayant accepté la réunion"}</option>
                  <option value="verified_members">{en ? "All verified JEC members" : "Tous les membres JEC vérifiés"}</option>
                </select>
              </label>
              <label>{en ? "Link to a meeting (optional)" : "Rattacher à une réunion (facultatif)"}
                <select value={selectedMeeting} onChange={event => setSelectedMeeting(event.target.value)}>
                  <option value="">{en ? "No meeting" : "Aucune réunion"}</option>
                  {meetingChoices.map(meeting => <option key={meeting.id} value={meeting.id}>{meeting.title}</option>)}
                </select>
              </label>
              <label>{en ? "Closing date" : "Date de clôture"}
                <input type="datetime-local" value={closesAt} onChange={event => setClosesAt(event.target.value)} required/>
              </label>
            </div>
            <label>{en ? "Title / question" : "Intitulé / question"}
              <input value={title} onChange={event => setTitle(event.target.value)} required minLength={3} maxLength={180} placeholder={en ? "What decision should members make?" : "Quelle décision les membres doivent-ils prendre ?"}/>
            </label>
            <label>{en ? "Context and details" : "Contexte et détails"}
              <textarea rows={3} value={description} onChange={event => setDescription(event.target.value)} placeholder={en ? "Explain the subject, context and consequences…" : "Précise le sujet, le contexte et les conséquences…"}/>
            </label>
            {ballotType === "election" ? <fieldset className="decisions-candidate-list">
              <legend>{en ? "Candidates" : "Candidats"}</legend>
              <p>{en ? "Select at least two candidates from this workspace." : "Sélectionne au moins deux candidats parmi les membres de cet espace."}</p>
              {workspaceCandidates.map(candidate => <label key={candidate.user_id}>
                <input type="checkbox" checked={candidateIds.includes(candidate.user_id)} onChange={event => setCandidateIds(current => event.target.checked ? [...current, candidate.user_id] : current.filter(id => id !== candidate.user_id))}/>
                <span>{candidate.name}</span>
              </label>)}
            </fieldset> : <label>{en ? "Choices (one per line)" : "Choix proposés (un par ligne)"}
              <textarea rows={4} value={optionText} onChange={event => setOptionText(event.target.value)} required placeholder={en ? "Yes\nNo\nAbstain" : "Pour\nContre\nAbstention"}/>
            </label>}
            <div className="decisions-form-grid">
              {ballotType === "consultation" && <label>{en ? "Voting method" : "Mode de vote"}
                <select value={votingMode} onChange={event => setVotingMode(event.target.value as "single" | "multiple")}>
                  <option value="single">{en ? "One choice" : "Un seul choix"}</option>
                  <option value="multiple">{en ? "Multiple choices" : "Plusieurs choix"}</option>
                </select>
              </label>}
              {ballotType !== "election" && <label>{en ? "Approval rule" : "Règle d'adoption"}
                <select value={approvalRule} onChange={event => setApprovalRule(event.target.value)}>
                  <option value="plurality">{en ? "Plurality" : "Majorité relative"}</option>
                  <option value="simple_majority">{en ? "Simple majority (>50% of expressed votes)" : "Majorité simple (>50 % des suffrages exprimés)"}</option>
                  <option value="absolute_majority">{en ? "Absolute majority (>50% of electorate)" : "Majorité absolue (>50 % de l'électorat)"}</option>
                  <option value="two_thirds">{en ? "Two-thirds majority" : "Majorité des deux tiers"}</option>
                </select>
              </label>}
              <label>{en ? "Quorum (%)" : "Quorum (%)"}
                <input type="number" min="0" max="100" value={quorum} onChange={event => setQuorum(event.target.value)} required/>
              </label>
              <label>{en ? "Results visibility" : "Visibilité des résultats"}
                <select value={resultsVisibility} onChange={event => setResultsVisibility(event.target.value)}>
                  <option value="after_close">{en ? "Only after closing" : "Uniquement après clôture"}</option>
                  <option value="live">{en ? "Live aggregate results" : "Résultats agrégés en direct"}</option>
                </select>
              </label>
            </div>
            <div className="decisions-checks">
              <p>{en ? "Secret ballot: individual choices and voter identities are never displayed." : "Scrutin secret : les choix individuels et l'identité des votants ne sont jamais affichés."}</p>
            </div>
            <p className="collab-muted">{en
              ? "The electorate is frozen when the ballot is created. A member may submit only once. Closing a ballot makes its aggregate results final."
              : "L'électorat est figé lors de la création du scrutin. Chaque membre ne peut déposer qu'un seul bulletin. La clôture rend les résultats agrégés définitifs."}</p>
            <button className="primary-button" disabled={busy || !title.trim() || (ballotType === "election" ? candidateIds.length < 2 : optionText.split("\n").filter(value => value.trim()).length < 2)}>
              {busy ? (en ? "Creating…" : "Création…") : (en ? "Create and open the ballot" : "Créer et ouvrir le scrutin")}
            </button>
          </form>
        </section>}

        <section className="decisions-ballot-list">
          <div className="collab-section-heading"><div><p className="eyebrow">{en ? "ACTIVE AND ARCHIVED PROCESSES" : "CONSULTATIONS ET SCRUTINS"}</p><h2>{selectedMeeting ? (en ? "Ballots for this meeting" : "Scrutins de cette réunion") : (en ? "Workspace ballots" : "Scrutins de l'espace")}</h2></div><span>{visibleBallots.length}</span></div>
          {visibleBallots.length ? visibleBallots.map(ballot => {
            const ballotOptions = options.filter(option => option.ballot_id === ballot.id);
            const result = results[ballot.id];
            const manager = isAdmin || manageableWorkspaceIds.has(ballot.workspace_id);
            const effectiveStatus = ballot.status === "open" && new Date(ballot.closes_at).getTime() <= Date.now() ? "closed" : ballot.status;
            const voteSelection = selectedVotes[ballot.id] ?? [];
            const totalVotes = result?.options.reduce((total, option) => total + (option.votes ?? 0), 0) ?? 0;
            const outcome = result ? decisionOutcome(ballot, result) : "";
            return <article className="collab-card governance-ballot-card" key={ballot.id}>
              <div className="governance-ballot-topline"><span className={"governance-type "+ballot.ballot_type}>{typeLabel(ballot.ballot_type, en)}</span><span className={"project-status "+effectiveStatus}>{effectiveStatus === "open" ? (en ? "Open" : "Ouvert") : effectiveStatus === "closed" ? (en ? "Closed" : "Clôturé") : effectiveStatus}</span></div>
              <h3>{ballot.title}</h3>
              {ballot.description && <p className="governance-description">{ballot.description}</p>}
              <div className="governance-meta">
                <span>{scopeLabel(ballot.eligibility_scope, en)}</span>
                <span>{en ? "Closes" : "Clôture"} : {formatDate(ballot.closes_at, en)}</span>
                <span>{ballot.is_anonymous ? (en ? "Secret ballot" : "Scrutin secret") : (en ? "Non-secret ballot" : "Scrutin non secret")}</span>
                <span>{en ? "Quorum" : "Quorum"} : {ballot.quorum_percent}%</span>
                <span>{ruleLabel(ballot.approval_rule, en)}</span>
              </div>
              {ballotOptions.length > 0 && <div className="governance-options">
                {ballotOptions.map(option => {
                  const candidateName = option.candidate_user_id ? names[option.candidate_user_id] || option.label : option.label;
                  const count = result?.options.find(item => item.id === option.id)?.votes;
                  const percent = result?.results_visible && totalVotes > 0 ? Math.round(((count ?? 0) / totalVotes) * 100) : 0;
                  const canVote = Boolean(result?.is_eligible && !result?.has_voted && effectiveStatus === "open");
                  return <label className={"governance-option "+(canVote ? "selectable" : "")} key={option.id}>
                    {canVote && <input
                      type={ballot.voting_mode === "multiple" ? "checkbox" : "radio"}
                      name={"ballot-"+ballot.id}
                      checked={voteSelection.includes(option.id)}
                      onChange={() => toggleSelected(ballot.id, option.id, ballot.voting_mode === "multiple")}
                    />}
                    <span className="governance-option-label">{candidateName}</span>
                    {result?.results_visible && <span className="governance-option-count">{count ?? 0} · {percent}%</span>}
                    {result?.results_visible && <span className="governance-result-track"><i style={{ width: percent+"%" }}/></span>}
                  </label>;
                })}
              </div>}
              {result?.results_visible
                ? <div className="governance-result-summary"><span>{result.voter_count ?? 0} / {result.eligible_count} {en ? "voted" : "ont voté"}</span><span>{result.quorum_reached ? (en ? "Quorum reached" : "Quorum atteint") : (en ? "Quorum not reached" : "Quorum non atteint")}</span>{outcome && <strong>{outcome}</strong>}</div>
                : <p className="governance-hidden-results">{en ? "Aggregate results will be revealed after the ballot closes." : "Les résultats agrégés seront révélés à la clôture du scrutin."}</p>}
              {result?.has_voted && <p className="governance-voted-note">✓ {en ? "Your ballot has been recorded." : "Ton bulletin a été enregistré."}</p>}
              {result?.is_eligible && !result.has_voted && effectiveStatus === "open" && <button className="primary-button" disabled={busy || voteSelection.length === 0} onClick={() => void castVote(ballot)}>{en ? "Submit my vote" : "Déposer mon vote"}</button>}
              {result && !result.is_eligible && effectiveStatus === "open" && <p className="governance-hidden-results">{en ? "You are not part of this ballot's electorate." : "Tu ne fais pas partie de l'électorat de ce scrutin."}</p>}
              {manager && ballot.status === "draft" && <button className="secondary-outline-button" disabled={busy} onClick={() => void changeStatus(ballot.id, "open")}>{en ? "Open ballot" : "Ouvrir le scrutin"}</button>}
              {manager && ballot.status === "open" && <button className="danger-outline-button" disabled={busy} onClick={() => void changeStatus(ballot.id, "close")}>{en ? "Close ballot" : "Clôturer le scrutin"}</button>}
            </article>;
          }) : <div className="collab-empty"><span>◉</span><h3>{en ? "No ballot yet" : "Aucun scrutin pour le moment"}</h3><p>{en ? "Create a consultation, a decision vote or an internal election for this workspace." : "Crée une consultation, un vote décisionnel ou une élection interne pour cet espace."}</p></div>}
        </section>
      </>}
    </div>
  </main>;
}
