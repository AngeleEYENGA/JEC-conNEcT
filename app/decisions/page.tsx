"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useLanguage } from "@/components/language-provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Workspace = { id: string; name: string; slug: string };
type Member = { user_id: string; workspace_id: string; workspace_role: string; membership_status: string };
type Meeting = { id: string; workspace_id: string; title: string; starts_at: string; meeting_status: string };
type Candidate = { user_id: string; name: string; workspace_id: string };
type Ballot = {
  id: string; workspace_id: string; meeting_id: string | null; ballot_type: "consultation" | "decision" | "election";
  title: string; description: string | null; voting_mode: "single" | "multiple"; is_anonymous: boolean;
  eligibility_scope: "workspace_members" | "meeting_participants" | "verified_members";
  results_visibility: "live" | "after_close"; quorum_percent: number; approval_rule: string;
  status: "draft" | "open" | "closed" | "cancelled"; opens_at: string; closes_at: string;
  created_by: string; created_at: string;
};
type BallotOption = {
  id: string; label: string; description: string | null; candidate_user_id: string | null; votes: number | null;
};
type BallotResult = {
  ballot_id: string; status: string; eligible_count: number; voter_count: number | null;
  is_eligible: boolean; has_voted: boolean; results_visible: boolean;
  quorum_reached: boolean | null; options: BallotOption[];
};

function localDateTime(daysAhead = 0) {
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
  const [globalAdmin, setGlobalAdmin] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [ballots, setBallots] = useState<Ballot[]>([]);
  const [results, setResults] = useState<Record<string, BallotResult>>({});
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [workspaceId, setWorkspaceId] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ballotType, setBallotType] = useState<"consultation" | "decision" | "election">("consultation");
  const [votingMode, setVotingMode] = useState<"single" | "multiple">("single");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [eligibilityScope, setEligibilityScope] = useState<"workspace_members" | "meeting_participants" | "verified_members">("workspace_members");
  const [resultsVisibility, setResultsVisibility] = useState<"live" | "after_close">("after_close");
  const [approvalRule, setApprovalRule] = useState("plurality");
  const [quorum, setQuorum] = useState("0");
  const [opensAt, setOpensAt] = useState(localDateTime(0));
  const [closesAt, setClosesAt] = useState(localDateTime(3));
  const [optionsText, setOptionsText] = useState("");
  const [candidateIds, setCandidateIds] = useState<string[]>([]);

  const managerWorkspaces = useMemo(() => {
    if (globalAdmin) return workspaces;
    const ids = new Set(members.filter(m => m.workspace_role === "owner" || m.workspace_role === "manager").map(m => m.workspace_id));
    return workspaces.filter(w => ids.has(w.id));
  }, [globalAdmin, members, workspaces]);

  const availableCandidates = useMemo(() => candidates.filter(candidate => candidate.workspace_id === workspaceId), [candidates, workspaceId]);
  const availableMeetings = useMemo(() => meetings.filter(meeting => meeting.workspace_id === workspaceId), [meetings, workspaceId]);

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Supabase n'est pas configuré."); setLoading(false); return; }
    setLoading(true);
    setError("");
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { window.location.href = "/login"; return; }

    const [spacesResult, adminResult, ballotResult] = await Promise.all([
      supabase.from("jec_workspaces").select("id,name,slug").order("name"),
      supabase.rpc("is_jec_admin"),
      supabase.from("jec_governance_ballots")
        .select("id,workspace_id,meeting_id,ballot_type,title,description,voting_mode,is_anonymous,eligibility_scope,results_visibility,quorum_percent,approval_rule,status,opens_at,closes_at,created_by,created_at")
        .order("created_at", { ascending: false })
    ]);
    if (spacesResult.error) { setError(spacesResult.error.message); setLoading(false); return; }
    if (ballotResult.error) { setError(ballotResult.error.message); setLoading(false); return; }

    const spaces = (spacesResult.data || []) as Workspace[];
    const isAdmin = adminResult.data === true;
    setGlobalAdmin(isAdmin);
    setWorkspaces(spaces);
    const spaceIds = spaces.map(space => space.id);
    let memberRows: Member[] = [];
    let meetingRows: Meeting[] = [];
    if (spaceIds.length) {
      const [memberResult, meetingResult] = await Promise.all([
        supabase.from("jec_workspace_members")
          .select("user_id,workspace_id,workspace_role,membership_status")
          .in("workspace_id", spaceIds).eq("membership_status", "active"),
        supabase.from("jec_meetings")
          .select("id,workspace_id,title,starts_at,meeting_status")
          .in("workspace_id", spaceIds).order("starts_at", { ascending: false })
      ]);
      if (memberResult.error) setError(memberResult.error.message);
      if (meetingResult.error) setError(meetingResult.error.message);
      memberRows = (memberResult.data || []) as Member[];
      meetingRows = (meetingResult.data || []) as Meeting[];
    }
    setMembers(memberRows);
    setMeetings(meetingRows);

    const url = new URLSearchParams(window.location.search);
    const requestedWorkspace = url.get("workspaceId");
    const requestedMeeting = url.get("meetingId");
    const managerIds = new Set(memberRows.filter(m => m.workspace_role === "owner" || m.workspace_role === "manager").map(m => m.workspace_id));
    const firstManaged = isAdmin ? spaces[0]?.id : spaces.find(space => managerIds.has(space.id))?.id;
    setWorkspaceId(current => {
      if (current && (isAdmin || managerIds.has(current))) return current;
      if (requestedWorkspace && (isAdmin || managerIds.has(requestedWorkspace))) return requestedWorkspace;
      return firstManaged || spaces[0]?.id || "";
    });
    if (requestedMeeting) setMeetingId(current => current || requestedMeeting);

    const memberIds = [...new Set(memberRows.map(member => member.user_id))];
    let candidateRows: Candidate[] = [];
    if (memberIds.length) {
      const { data: profiles, error: profileError } = await supabase.from("jec_profiles")
        .select("user_id,display_name,first_name,last_name").in("user_id", memberIds);
      if (profileError) setError(profileError.message);
      const names = new Map<string, string>((profiles || []).map((profile: { user_id: string; display_name: string | null; first_name: string | null; last_name: string | null }) => [
        profile.user_id,
        profile.display_name || [profile.first_name, profile.last_name].filter(Boolean).join(" ") || (en ? "JEC member" : "Membre JEC")
      ] as [string, string]));
      candidateRows = memberRows.map(member => ({
        user_id: member.user_id,
        workspace_id: member.workspace_id,
        name: String(names.get(member.user_id) || (en ? "JEC member" : "Membre JEC"))
      }));
    }
    setCandidates(candidateRows);

    const ballotRows = (ballotResult.data || []) as Ballot[];
    setBallots(ballotRows);
    const resultPairs = await Promise.all(ballotRows.map(async ballot => {
      const { data, error: resultError } = await supabase.rpc("jec_governance_ballot_results", { target_ballot_id: ballot.id });
      if (resultError) return [ballot.id, null] as const;
      return [ballot.id, data as BallotResult] as const;
    }));
    setResults(Object.fromEntries(resultPairs.filter((pair): pair is readonly [string, BallotResult] => Boolean(pair[1]))));
    setLoading(false);
  }, [en]);

  useEffect(() => { void load(); }, [load]);

  async function createBallot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    if (eligibilityScope === "meeting_participants" && !meetingId) {
      setError(t("Sélectionne la réunion dont les participants pourront voter.", "Select the meeting whose participants may vote."));
      return;
    }
    let ballotOptions: Array<{ label: string; description: string | null; candidate_user_id: string | null }> = [];
    if (ballotType === "election") {
      ballotOptions = availableCandidates.filter(candidate => candidateIds.includes(candidate.user_id)).map(candidate => ({
        label: candidate.name, description: null, candidate_user_id: candidate.user_id
      }));
    } else {
      ballotOptions = optionsText.split("\n").map(line => {
        const [label, ...details] = line.split("|");
        return { label: label.trim(), description: details.join("|").trim() || null, candidate_user_id: null };
      }).filter(option => option.label);
    }
    if (ballotOptions.length < 2) {
      setError(ballotType === "election"
        ? t("Sélectionne au moins deux candidats.", "Select at least two candidates.")
        : t("Ajoute au moins deux choix, un par ligne.", "Add at least two options, one per line."));
      return;
    }
    if (closesAt <= opensAt) {
      setError(t("La clôture doit être postérieure à l'ouverture.", "The closing time must be after the opening time."));
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    const { data, error: createError } = await supabase.rpc("jec_create_governance_ballot", {
      p_workspace_id: workspaceId,
      p_meeting_id: meetingId || null,
      p_ballot_type: ballotType,
      p_title: title.trim(),
      p_description: description.trim() || null,
      p_voting_mode: ballotType === "election" ? "single" : votingMode,
      p_is_anonymous: ballotType === "election" ? true : isAnonymous,
      p_eligibility_scope: eligibilityScope,
      p_results_visibility: ballotType === "election" ? "after_close" : resultsVisibility,
      p_quorum_percent: Number(quorum),
      p_approval_rule: votingMode === "multiple" && ballotType !== "election" ? "plurality" : approvalRule,
      p_opens_at: new Date(opensAt).toISOString(),
      p_closes_at: new Date(closesAt).toISOString(),
      p_options: ballotOptions
    });
    if (createError) setError(createError.message);
    else {
      setTitle("");
      setDescription("");
      setOptionsText("");
      setCandidateIds([]);
      setBallotType("consultation");
      setVotingMode("single");
      setIsAnonymous(true);
      setResultsVisibility("after_close");
      setNotice(t("Scrutin créé. Les électeurs éligibles sont enregistrés selon le périmètre choisi.", "Ballot created. Eligible voters were recorded according to the selected scope."));
      await load();
    }
    setBusy(false);
  }

  function toggleOption(ballot: Ballot, optionId: string) {
    setSelected(current => {
      const ids = current[ballot.id] || [];
      if (ballot.voting_mode === "single") return { ...current, [ballot.id]: ids.includes(optionId) ? [] : [optionId] };
      return { ...current, [ballot.id]: ids.includes(optionId) ? ids.filter(id => id !== optionId) : [...ids, optionId] };
    });
  }

  async function castVote(ballot: Ballot) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const optionIds = selected[ballot.id] || [];
    if (!optionIds.length) {
      setError(t("Sélectionne au moins une option.", "Select at least one option."));
      return;
    }
    setBusy(true); setError(""); setNotice("");
    const { error: voteError } = await supabase.rpc("jec_cast_governance_vote", {
      target_ballot_id: ballot.id,
      selected_option_ids: optionIds
    });
    if (voteError) setError(voteError.message);
    else {
      setSelected(current => ({ ...current, [ballot.id]: [] }));
      setNotice(t("Ton vote est enregistré. Tu ne peux voter qu'une seule fois.", "Your vote has been recorded. You can vote only once."));
      await load();
    }
    setBusy(false);
  }

  async function openBallot(ballot: Ballot) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setBusy(true); setError("");
    const { error: openError } = await supabase.rpc("jec_open_governance_ballot", { target_ballot_id: ballot.id });
    if (openError) setError(openError.message);
    else { setNotice(t("Le scrutin est ouvert.", "The ballot is open.")); await load(); }
    setBusy(false);
  }

  async function closeBallot(ballot: Ballot) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    if (!window.confirm(t("Clore ce scrutin maintenant ? Les votes seront arrêtés et les résultats révélés selon le paramétrage.", "Close this ballot now? Voting will stop and results will be revealed according to its settings."))) return;
    setBusy(true); setError("");
    const { error: closeError } = await supabase.rpc("jec_close_governance_ballot", { target_ballot_id: ballot.id });
    if (closeError) setError(closeError.message);
    else { setNotice(t("Le scrutin est clôturé.", "The ballot is closed.")); await load(); }
    setBusy(false);
  }

  const workspaceName = (id: string) => workspaces.find(w => w.id === id)?.name || "JEC";
  const canManage = (id: string) => globalAdmin || managerWorkspaces.some(w => w.id === id);
  const formatApproval = (rule: string) => ({
    plurality: t("Pluralité des voix", "Plurality"),
    simple_majority: t("Majorité simple", "Simple majority"),
    absolute_majority: t("Majorité absolue", "Absolute majority"),
    two_thirds: t("Deux tiers", "Two-thirds majority")
  }[rule] || rule);

  function outcome(ballot: Ballot, result: BallotResult) {
    if (!result.results_visible) return "";
    if (!result.quorum_reached) return t("Quorum non atteint : le résultat ne peut pas être proclamé.", "Quorum not reached: no outcome can be declared.");
    const options = result.options || [];
    const counts = options.map(option => Number(option.votes || 0));
    const max = Math.max(0, ...counts);
    const leaders = options.filter(option => Number(option.votes || 0) === max);
    if (max === 0 || leaders.length !== 1) return t("Égalité ou absence de suffrages : une nouvelle délibération est nécessaire.", "Tie or no valid votes: further deliberation is required.");
    if (ballot.ballot_type === "consultation") return t("Tendance de la consultation (non contraignante) : ", "Consultation trend (non-binding): ") + leaders[0].label;
    const validVotes = counts.reduce((sum, count) => sum + count, 0);
    const winnerVotes = Number(leaders[0].votes || 0);
    const pctVotes = validVotes ? winnerVotes / validVotes : 0;
    const pctEligible = result.eligible_count ? winnerVotes / result.eligible_count : 0;
    const accepted =
      ballot.approval_rule === "plurality" ||
      (ballot.approval_rule === "simple_majority" && pctVotes > 0.5) ||
      (ballot.approval_rule === "absolute_majority" && pctEligible > 0.5) ||
      (ballot.approval_rule === "two_thirds" && pctVotes >= 2 / 3);
    return accepted
      ? t("Résultat conforme à la règle choisie : ", "Outcome meets the selected rule: ") + leaders[0].label
      : t("Le seuil requis n'est pas atteint. Une nouvelle délibération peut être nécessaire.", "The required threshold has not been reached. Further deliberation may be needed.");
  }

  const candidateName = (id: string | null) => id ? candidates.find(c => c.user_id === id)?.name || (en ? "Candidate" : "Candidat") : "";
  const managerWorkspace = managerWorkspaces.some(space => space.id === workspaceId);

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
            <p className="collab-lead">{t("Consulter les membres, prendre des décisions collectives et organiser les élections de la JEC, y compris dans le cadre d'une réunion.", "Consult members, take collective decisions and run JEC elections, including as part of a meeting.")}</p>
          </div>
          <span className="decision-security">🔐 {t("Bulletins secrets dissociés des identités", "Secret ballots separated from voter identities")}</span>
        </div>
        {error && <p className="alert error">{error}</p>}
        {notice && <p className="alert success">{notice}</p>}
        {loading ? <p className="collab-muted">{t("Chargement des scrutins…", "Loading ballots…")}</p> : (
          <>
            {managerWorkspace && <section className="collab-card decision-create-card">
              <div className="collab-card-heading"><div><p className="eyebrow">{t("ORGANISATION D'UN SCRUTIN", "BALLOT SETUP")}</p><h2>{t("Créer une consultation, une décision ou une élection", "Create a consultation, decision or election")}</h2></div></div>
              <p className="collab-muted">{t("Les électeurs sont déterminés et enregistrés à la création selon le périmètre sélectionné. Un seul vote est accepté par personne.", "Voter eligibility is determined and snapshotted at creation according to the selected scope. Only one submission per person is accepted.")}</p>
              <form className="decision-form" onSubmit={createBallot}>
                <label>{t("Espace JEC", "JEC workspace")}<select value={workspaceId} onChange={e => { setWorkspaceId(e.target.value); setMeetingId(""); setCandidateIds([]); }} required>
                  {managerWorkspaces.map(space => <option key={space.id} value={space.id}>{space.name}</option>)}
                </select></label>
                <label>{t("Type de scrutin", "Ballot type")}<select value={ballotType} onChange={e => { const value = e.target.value as "consultation" | "decision" | "election"; setBallotType(value); if (value === "election") { setVotingMode("single"); setIsAnonymous(true); setResultsVisibility("after_close"); setEligibilityScope("workspace_members"); } }}>
                  <option value="consultation">{t("Sondage / consultation", "Poll / consultation")}</option>
                  <option value="decision">{t("Vote décisionnel", "Formal decision")}</option>
                  <option value="election">{t("Élection", "Election")}</option>
                </select></label>
                <label>{t("Intitulé", "Title")}<input value={title} onChange={e => setTitle(e.target.value)} minLength={3} maxLength={180} required placeholder={t("Ex. Adoption du plan d'action 2027", "e.g. Adoption of the 2027 action plan")} /></label>
                <label>{t("Contexte et objet", "Context and purpose")}<textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} /></label>
                <label>{t("Réunion associée (facultatif)", "Related meeting (optional)")}<select value={meetingId} onChange={e => setMeetingId(e.target.value)}>
                  <option value="">— {t("Aucune réunion", "No meeting")} —</option>
                  {availableMeetings.map(meeting => <option key={meeting.id} value={meeting.id}>{meeting.title} · {dateLabel(meeting.starts_at, en)}</option>)}
                </select></label>
                <label>{t("Électeurs autorisés", "Eligible voters")}<select value={eligibilityScope} onChange={e => setEligibilityScope(e.target.value as typeof eligibilityScope)}>
                  <option value="workspace_members">{t("Membres actifs de l'espace", "Active workspace members")}</option>
                  <option value="meeting_participants">{t("Participants ayant accepté / assisté à la réunion", "Meeting participants who accepted / attended")}</option>
                  <option value="verified_members">{t("Tous les membres JEC vérifiés", "All verified JEC members")}</option>
                </select></label>
                {ballotType === "election" ? (
                  <div className="decision-candidate-picker decision-wide"><strong>{t("Candidats (au moins deux)", "Candidates (at least two)")}</strong>
                    <p className="decision-muted">{t("Sélectionne les membres actifs de cet espace. Le système vérifie leur statut de membre vérifié avant de créer l'élection.", "Select active members of this workspace. The system verifies their membership status before creating the election.")}</p>
                    <div className="decision-candidate-list">{availableCandidates.map(candidate => <label className="decision-candidate" key={candidate.user_id}>
                      <input type="checkbox" checked={candidateIds.includes(candidate.user_id)} onChange={e => setCandidateIds(current => e.target.checked ? [...current, candidate.user_id] : current.filter(id => id !== candidate.user_id)} />
                      <span>{candidate.name}</span>
                    </label>)}</div>
                  </div>
                ) : (
                  <label className="decision-wide">{t("Choix proposés (un par ligne : Choix | précision)", "Options (one per line: Option | description)")}<textarea rows={5} value={optionsText} onChange={e => setOptionsText(e.target.value)} required placeholder={"Option A\nOption B"} /></label>
                )}
                <label>{t("Mode de vote", "Voting mode")}<select value={votingMode} disabled={ballotType === "election"} onChange={e => { const value = e.target.value as "single" | "multiple"; setVotingMode(value); if (value === "multiple") setApprovalRule("plurality"); }}>
                  <option value="single">{t("Un seul choix", "Single choice")}</option>
                  <option value="multiple">{t("Plusieurs choix possibles", "Multiple selections")}</option>
                </select></label>
                <label>{t("Règle de décision", "Approval rule")}<select value={approvalRule} disabled={votingMode === "multiple" || ballotType === "election"} onChange={e => setApprovalRule(e.target.value)}>
                  <option value="plurality">{t("Pluralité des voix", "Plurality")}</option>
                  <option value="simple_majority">{t("Majorité simple", "Simple majority")}</option>
                  <option value="absolute_majority">{t("Majorité absolue", "Absolute majority")}</option>
                  <option value="two_thirds">{t("Deux tiers", "Two-thirds majority")}</option>
                </select></label>
                <label>{t("Résultats", "Results visibility")}<select value={ballotType === "election" ? "after_close" : resultsVisibility} disabled={ballotType === "election"} onChange={e => setResultsVisibility(e.target.value as "live" | "after_close")}>
                  <option value="after_close">{t("Après clôture", "After closing")}</option>
                  <option value="live">{t("En direct", "Live")}</option>
                </select></label>
                <label>{t("Quorum requis (%)", "Required quorum (%)")}<input type="number" min="0" max="100" step="1" value={quorum} onChange={e => setQuorum(e.target.value)} /></label>
                <label>{t("Ouverture du scrutin", "Voting opens")}<input type="datetime-local" value={opensAt} min={localDateTime(0)} onChange={e => setOpensAt(e.target.value)} required /></label>
                <label>{t("Clôture du scrutin", "Voting closes")}<input type="datetime-local" value={closesAt} min={opensAt} onChange={e => setClosesAt(e.target.value)} required /></label>
                <label className="decision-check"><input type="checkbox" checked={ballotType === "election" ? true : isAnonymous} disabled={ballotType === "election"} onChange={e => setIsAnonymous(e.target.checked)} /><span>{t("Bulletin secret (identité séparée du choix)", "Secret ballot (identity separated from choice)")}</span></label>
                <p className="decision-form-note">{ballotType === "election"
                  ? t("Les élections utilisent toujours le bulletin secret et les résultats sont masqués jusqu'à la clôture.", "Elections always use a secret ballot and results remain hidden until closing.")
                  : t("Pour un vote non secret, l'identité du votant est associée à son choix dans le registre interne. Les tables de votes ne sont pas directement accessibles depuis l'interface.", "For a non-secret ballot, the voter's identity is associated with their choice in the internal register. Vote tables are not directly accessible through the interface.")}</p>
                <button className="primary-button" disabled={busy || !workspaceId}>{busy ? t("Publication…", "Publishing…") : t("Créer le scrutin", "Create ballot")}</button>
              </form>
            </section>}
            <section className="decision-list">
              <div className="collab-card-heading"><div><p className="eyebrow">{t("VIE DÉMOCRATIQUE", "DEMOCRATIC LIFE")}</p><h2>{t("Consultations et scrutins", "Consultations and ballots")}</h2></div><span className="collab-count">{ballots.length}</span></div>
              {!ballots.length ? <div className="collab-empty"><p>{t("Aucune consultation ou élection n'a encore été lancée dans tes espaces.", "No poll or election has been launched in your workspaces yet.")}</p></div> : ballots.map(ballot => {
                const result = results[ballot.id];
                const effectiveStatus = result?.status || ballot.status;
                const expired = new Date(ballot.closes_at).getTime() <= Date.now();
                const open = effectiveStatus === "open" && !expired && new Date(ballot.opens_at).getTime() <= Date.now();
                const canVote = open && Boolean(result?.is_eligible) && !result?.has_voted;
                const options = result?.options || [];
                const totalVotes = options.reduce((sum, option) => sum + Number(option.votes || 0), 0);
                const voteCount = result?.voter_count;
                const turnout = result && voteCount !== null && result.eligible_count > 0 ? Math.round(voteCount / result.eligible_count * 100) : null;
                const statusLabel = effectiveStatus === "open" ? t("Ouvert", "Open") : effectiveStatus === "draft" ? t("Programmé", "Scheduled") : effectiveStatus === "cancelled" ? t("Annulé", "Cancelled") : t("Clôturé", "Closed");
                return <article className="collab-card decision-poll-card" key={ballot.id}>
                  <div className="decision-poll-top"><div>
                    <span className={"decision-type-tag " + ballot.ballot_type}>{ballot.ballot_type === "election" ? t("ÉLECTION", "ELECTION") : ballot.ballot_type === "decision" ? t("VOTE DÉCISIONNEL", "FORMAL DECISION") : t("CONSULTATION", "CONSULTATION")}</span>
                    <p className="decision-workspace-name">{workspaceName(ballot.workspace_id)}{ballot.meeting_id ? " · " + t("Lié à une réunion", "Linked to a meeting") : ""}</p>
                    <h3>{ballot.title}</h3>
                  </div><span className={"project-status " + (open ? "scheduled" : effectiveStatus === "cancelled" ? "cancelled" : "completed")}>{statusLabel}</span></div>
                  {ballot.description && <p className="decision-description">{ballot.description}</p>}
                  <div className="decision-meta">
                    <span>{t("Ouverture", "Opens")} : {dateLabel(ballot.opens_at, en)}</span>
                    <span>{t("Clôture", "Closes")} : {dateLabel(ballot.closes_at, en)}</span>
                    <span>{t("Quorum", "Quorum")} : {ballot.quorum_percent}%</span>
                    <span>{formatApproval(ballot.approval_rule)}</span>
                    <span>{ballot.is_anonymous ? t("Bulletin secret", "Secret ballot") : t("Vote nominatif", "Named vote")}</span>
                  </div>
                  {ballot.meeting_id && <p className="decision-muted">{meetings.find(meeting => meeting.id === ballot.meeting_id)?.title || t("Réunion associée", "Related meeting")}</p>}
                  {canVote && <div className="decision-ballot">
                    <p className="eyebrow">{ballot.ballot_type === "election" ? t("CHOISIS UN CANDIDAT", "SELECT A CANDIDATE") : t("EXPRIME TON CHOIX", "CAST YOUR VOTE")}</p>
                    {options.map(option => <label className="decision-option" key={option.id}>
                      <input type={ballot.voting_mode === "single" ? "radio" : "checkbox"} name={"ballot-" + ballot.id} checked={(selected[ballot.id] || []).includes(option.id)} onChange={() => toggleOption(ballot, option.id)} />
                      <span><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
                    </label>)}
                    <button className="primary-button" onClick={() => void castVote(ballot)} disabled={busy || !(selected[ballot.id] || []).length}>{t("Valider mon bulletin", "Submit my ballot")}</button>
                  </div>}
                  {open && result?.is_eligible && result.has_voted && <p className="decision-voted">✓ {t("Ta participation est enregistrée. Le bulletin ne peut pas être modifié.", "Your participation is recorded. Your ballot cannot be changed.")}</p>}
                  {open && result && !result.is_eligible && <p className="decision-muted">{t("Ce scrutin est réservé aux électeurs éligibles selon le périmètre indiqué.", "This ballot is restricted to voters eligible under the selected scope.")}</p>}
                  {effectiveStatus === "draft" && new Date(ballot.opens_at).getTime() > Date.now() && <p className="decision-muted">{t("Le scrutin s'ouvrira automatiquement à la date prévue.", "The ballot will open automatically at the scheduled time.")}</p>}
                  {expired && effectiveStatus === "open" && <p className="decision-muted">{t("Date de clôture atteinte : les votes ne sont plus acceptés.", "Closing time reached: votes are no longer accepted.")}</p>}
                  {result?.results_visible && <div className="decision-results">
                    <div className="decision-results-heading"><strong>{t("Résultats", "Results")}</strong><span>{voteCount}/{result.eligible_count} {t("votants", "voters")}{turnout !== null ? " · " + turnout + "%" : ""}</span></div>
                    {options.map(option => {
                      const votes = Number(option.votes || 0);
                      const percentage = totalVotes ? Math.round(votes / totalVotes * 100) : 0;
                      return <div className="decision-result-row" key={option.id}><div><span>{option.label}</span><strong>{votes} · {percentage}%</strong></div><div className="decision-result-track"><i style={{ width: percentage + "%" }} /></div></div>;
                    })}
                    <p className={result.quorum_reached ? "decision-outcome" : "decision-outcome warning"}>{outcome(ballot, result)}</p>
                  </div>}
                  {canManage(ballot.workspace_id) && effectiveStatus === "draft" && new Date(ballot.opens_at).getTime() <= Date.now() && !expired && <button className="primary-button" onClick={() => void openBallot(ballot)} disabled={busy}>{t("Ouvrir maintenant", "Open now")}</button>}
                  {canManage(ballot.workspace_id) && open && <button className="danger-outline-button decision-close-button" onClick={() => void closeBallot(ballot)} disabled={busy}>{t("Clore le scrutin", "Close ballot")}</button>}
                </article>;
              })}
            </section>
          </>
        )}
        <p className="decision-privacy-note">{t("Intégrité : éligibilité enregistrée à la création, un seul bulletin par personne, séparation de l'identité et des choix pour les scrutins secrets, quorum et résultats agrégés. Les élections importantes doivent respecter les statuts et règles de contrôle du mouvement.", "Integrity: eligibility is snapshotted at creation, one ballot per person, identity and selections are separated for secret ballots, with quorum and aggregated results. Important elections must comply with the movement's statutes and scrutiny rules.")}</p>
      </div>
    </main>
  );
}
