"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Signal = {
  from: string;
  to: string;
  type: "description" | "candidate" | "ended";
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
};

function VideoTile({ stream, label, muted = false }: { stream: MediaStream; label: string; muted?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  return (
    <div className="call-video-tile">
      <video ref={ref} autoPlay playsInline muted={muted} />
      <span>{label}</span>
    </div>
  );
}

export default function MeetingCallRoom({
  meetingId,
  meetingTitle,
  displayName,
  onLeave
}: {
  meetingId: string;
  meetingTitle: string;
  displayName: string;
  onLeave?: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [hostId, setHostId] = useState("");
  const [consent, setConsent] = useState(false);
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [status, setStatus] = useState("Préparation de la salle");
  const [error, setError] = useState("");
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [remoteNames, setRemoteNames] = useState<Record<string, string>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const joinedRef = useRef(false);
  const sessionIdRef = useRef("");
  const userIdRef = useRef("");
  const hostIdRef = useRef("");
  const startingRef = useRef(false);

  const sendSignal = useCallback(async (signal: Signal) => {
    const channel = channelRef.current;
    if (!channel) return;
    await channel.send({ type: "broadcast", event: "signal", payload: signal });
  }, []);

  const closePeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.close();
      peersRef.current.delete(peerId);
    }
    setRemoteStreams(current => {
      const next = { ...current };
      delete next[peerId];
      return next;
    });
    setRemoteNames(current => {
      const next = { ...current };
      delete next[peerId];
      return next;
    });
  }, []);

  const ensurePeer = useCallback((peerId: string, peerName: string) => {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing;
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    localStreamRef.current?.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current!));
    pc.onicecandidate = event => {
      if (event.candidate && userIdRef.current) {
        void sendSignal({
          from: userIdRef.current,
          to: peerId,
          type: "candidate",
          candidate: event.candidate.toJSON()
        });
      }
    };
    pc.ontrack = event => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      setRemoteStreams(current => ({ ...current, [peerId]: stream }));
      setRemoteNames(current => ({ ...current, [peerId]: peerName }));
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        closePeer(peerId);
      }
      if (pc.connectionState === "connected") setStatus("Appel connecté");
    };
    peersRef.current.set(peerId, pc);
    return pc;
  }, [closePeer, sendSignal]);

  const processSignal = useCallback(async (signal: Signal) => {
    if (!signal || signal.to !== userIdRef.current || signal.from === userIdRef.current) return;
    const peerId = signal.from;
    if (signal.type === "ended") {
      closePeer(peerId);
      return;
    }
    const pc = ensurePeer(peerId, remoteNames[peerId] || "Participant");
    try {
      if (signal.type === "description" && signal.description) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.description));
        const pending = pendingCandidatesRef.current.get(peerId) ?? [];
        for (const candidate of pending) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        pendingCandidatesRef.current.delete(peerId);
        if (signal.description.type === "offer") {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal({
            from: userIdRef.current,
            to: peerId,
            type: "description",
            description: { type: pc.localDescription?.type ?? "offer", sdp: pc.localDescription?.sdp ?? "" }
          });
        }
      } else if (signal.type === "candidate" && signal.candidate) {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          const current = pendingCandidatesRef.current.get(peerId) ?? [];
          current.push(signal.candidate);
          pendingCandidatesRef.current.set(peerId, current);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de signalisation WebRTC.");
    }
  }, [closePeer, ensurePeer, remoteNames, sendSignal]);

  const createOffer = useCallback(async (peerId: string, peerName: string) => {
    if (userIdRef.current.localeCompare(peerId) >= 0) return;
    const pc = ensurePeer(peerId, peerName);
    if (pc.localDescription) return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignal({
        from: userIdRef.current,
        to: peerId,
        type: "description",
        description: { type: pc.localDescription?.type ?? "offer", sdp: pc.localDescription?.sdp ?? "" }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de démarrer la connexion.");
    }
  }, [ensurePeer, sendSignal]);

  const leaveCall = useCallback(async (endForEveryone = false) => {
    const supabase = getSupabaseBrowserClient();
    if (endForEveryone && sessionIdRef.current && supabase) {
      await supabase.rpc("jec_end_meeting_call", { target_session_id: sessionIdRef.current });
      if (channelRef.current) {
        await channelRef.current.send({
          type: "broadcast",
          event: "signal",
          payload: { from: userIdRef.current, to: "*", type: "ended" }
        });
      }
    } else if (sessionIdRef.current && supabase) {
      await supabase.rpc("jec_leave_meeting_call", { target_session_id: sessionIdRef.current });
    }
    joinedRef.current = false;
    setJoined(false);
    if (channelRef.current && supabase) void supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    peersRef.current.forEach(pc => pc.close());
    peersRef.current.clear();
    pendingCandidatesRef.current.clear();
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    setRemoteStreams({});
    setRemoteNames({});
    if (onLeave) onLeave();
  }, [onLeave]);

  async function startCall() {
    if (startingRef.current || joinedRef.current) return;
    if (!consent) {
      setError("Confirme d'abord le consentement des participants.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase n'est pas configuré.");
      return;
    }
    startingRef.current = true;
    setError("");
    setStatus("Vérification de l'accès…");
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Connecte-toi pour rejoindre cet appel.");
      setUserId(user.id);
      userIdRef.current = user.id;
      const { data: session, error: joinError } = await supabase.rpc("jec_join_meeting_call", {
        target_meeting_id: meetingId
      });
      if (joinError || !session) throw new Error(joinError?.message || "Accès à l'appel refusé.");
      const currentSessionId = session as string;
      setSessionId(currentSessionId);
      sessionIdRef.current = currentSessionId;
      const { data: sessionRow, error: sessionError } = await supabase
        .from("jec_meeting_call_sessions")
        .select("host_id")
        .eq("id", currentSessionId)
        .single();
      if (sessionError) throw sessionError;
      setHostId(sessionRow.host_id);
      hostIdRef.current = sessionRow.host_id;

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        setCameraOff(true);
        setStatus("Micro activé · caméra indisponible");
      }
      localStreamRef.current = stream;
      await supabase.realtime.setAuth();
      const channel = supabase.channel("jec-call:" + meetingId, {
        config: { private: true, presence: { key: user.id }, broadcast: { ack: true, self: false } }
      });
      channel.on("broadcast", { event: "signal" }, ({ payload }: { payload: Signal }) => {
        if (payload?.type === "ended" && payload.to === "*") {
          void leaveCall(false);
        } else {
          void processSignal(payload);
        }
      });
      channel.on("presence", { event: "sync" }, () => {
        const state = channel.presenceState() as Record<string, Array<{ userId?: string; displayName?: string }>>;
        Object.entries(state).forEach(([peerId, entries]) => {
          if (peerId === user.id) return;
          const name = entries[0]?.displayName || "Participant";
          setRemoteNames(current => ({ ...current, [peerId]: name }));
          if (user.id.localeCompare(peerId) < 0) void createOffer(peerId, name);
        });
      });
      channel.on("presence", { event: "join" }, ({ key, newPresences }: { key: string; newPresences: Array<{ displayName?: string }> }) => {
        if (key === user.id) return;
        const name = newPresences[0]?.displayName || "Participant";
        setRemoteNames(current => ({ ...current, [key]: name }));
        if (user.id.localeCompare(key) < 0) void createOffer(key, name);
      });
      const subscribeResult = await new Promise<string>((resolve, reject) => {
        channel.subscribe(async (state: string) => {
          if (state === "SUBSCRIBED") resolve(state);
          if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") reject(new Error("Impossible de rejoindre la salle privée (" + state + ")."));
        });
      });
      channelRef.current = channel;
      await channel.track({ userId: user.id, displayName, joinedAt: new Date().toISOString() });
      joinedRef.current = true;
      setJoined(true);
      setStatus(subscribeResult === "SUBSCRIBED" ? "Salle connectée · en attente des participants" : "Connexion à la salle…");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de rejoindre l'appel.");
      if (sessionIdRef.current) {
        if (hostIdRef.current === userIdRef.current) {
          await supabase.rpc("jec_end_meeting_call", { target_session_id: sessionIdRef.current });
        } else {
          await supabase.rpc("jec_leave_meeting_call", { target_session_id: sessionIdRef.current });
        }
      }
      if (channelRef.current) {
        await supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      await localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      sessionIdRef.current = "";
    } finally {
      startingRef.current = false;
    }
  }

  useEffect(() => {
    return () => {
      const supabase = getSupabaseBrowserClient();
      if (channelRef.current && supabase) void supabase.removeChannel(channelRef.current);
      peersRef.current.forEach(pc => pc.close());
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const localStream = localStreamRef.current;
  const remoteEntries = Object.entries(remoteStreams);

  return (
    <section className="meeting-call-room">
      <div className="call-room-heading">
        <div>
          <p className="eyebrow">SALLE DE RÉUNION PRIVÉE</p>
          <h2>{meetingTitle}</h2>
          <p>{status}</p>
        </div>
        <span className="call-room-security">🔒 Accès participants acceptés</span>
      </div>

      {error && <p className="alert error">{error}</p>}

      {!joined ? (
        <div className="call-preflight">
          <div className="call-preflight-icon">◉</div>
          <h3>Rejoindre l'appel audio / vidéo</h3>
          <p>La connexion média est directe entre les navigateurs. JEC-conNEcT ne stocke ni le son ni la vidéo de cet appel.</p>
          <label className="call-consent">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
            <span>Je confirme que les participants ont été informés de l'appel et consentent à l'activation de leur microphone et, le cas échéant, de leur caméra. Je comprends que les participants peuvent réaliser leurs propres captures ou enregistrements indépendamment de JEC-conNEcT.</span>
          </label>
          <button className="primary-button" onClick={() => void startCall()} disabled={!consent}>Autoriser le micro et rejoindre</button>
          <p className="call-network-note">La connexion directe peut échouer derrière certains réseaux ou pare-feu. Un serveur TURN devra être configuré pour améliorer la fiabilité des appels multi-réseaux.</p>
        </div>
      ) : (
        <>
          <div className="call-video-grid">
            {localStream && <VideoTile stream={localStream} label="Toi" muted />}
            {remoteEntries.map(([id, stream]) => <VideoTile key={id} stream={stream} label={remoteNames[id] || "Participant"} />)}
            {!remoteEntries.length && <div className="call-waiting-tile"><span>◉</span><strong>En attente des autres participants…</strong></div>}
          </div>
          <div className="call-controls">
            <button className={muted ? "call-control active" : "call-control"} onClick={() => {
              localStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = muted; });
              setMuted(!muted);
            }}>{muted ? "Activer le micro" : "Couper le micro"}</button>
            <button className={cameraOff ? "call-control active" : "call-control"} onClick={() => {
              localStreamRef.current?.getVideoTracks().forEach(track => { track.enabled = cameraOff; });
              setCameraOff(!cameraOff);
            }}>{cameraOff ? "Activer la caméra" : "Couper la caméra"}</button>
            {hostId === userId
              ? <button className="call-hangup" onClick={() => void leaveCall(true)}>Terminer pour tous</button>
              : <button className="call-hangup" onClick={() => void leaveCall(false)}>Quitter l'appel</button>}
          </div>
        </>
      )}
    </section>
  );
}
