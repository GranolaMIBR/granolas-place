import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

/* ---------------------------------------------------------
   GRANOLA — Alpha 0.1 (ligado ao Supabase de verdade)
--------------------------------------------------------- */

const ACCENTS = {
  rosa: { name: "Rosa Granolas", hex: "#F794C0", soft: "#F794C01a" },
  roxo: { name: "Roxo", hex: "#8B5CF6", soft: "#8B5CF61a" },
  branco: { name: "Branco", hex: "#F2F0F5", soft: "#F2F0F51a" },
  azul: { name: "Azul", hex: "#4F9DFF", soft: "#4F9DFF1a" },
  vermelho: { name: "Vermelho", hex: "#FF5470", soft: "#FF54701a" },
  verde: { name: "Verde", hex: "#3DDC84", soft: "#3DDC841a" },
  laranja: { name: "Laranja", hex: "#FF9D4D", soft: "#FF9D4D1a" },
  ciano: { name: "Ciano", hex: "#22D3EE", soft: "#22D3EE1a" },
  amarelo: { name: "Amarelo", hex: "#FFD84D", soft: "#FFD84D1a" },
  magenta: { name: "Magenta", hex: "#E056FD", soft: "#E056FD1a" },
  lima: { name: "Lima", hex: "#A3E635", soft: "#A3E6351a" },
};

const STATUS_META = {
  online: { label: "Online", color: "#3DDC84" },
  ausente: { label: "Ausente", color: "#FFC24D" },
  ocupado: { label: "Ocupado", color: "#FF5470" },
  invisivel: { label: "Invisível", color: "#5A5866" },
};

const AVATAR_PALETTE = [
  "#8B5CF6", "#4F9DFF", "#FF5470", "#3DDC84", "#FF9D4D", "#F2F0F5", "#F794C0", "#0a0a0d",
  "#22D3EE", "#FFD84D", "#E056FD", "#A3E635", "#FF3B3B", "#14B8A6",
];

const AVATAR_FRAMES = {
  nenhuma: { name: "Nenhuma", render: () => null },
  brilho: { name: "Brilho", render: (hex) => ({ boxShadow: `0 0 0 3px #0a0a0d, 0 0 0 6px ${hex}, 0 0 18px 2px ${hex}88` }) },
  duplo: { name: "Anel duplo", render: (hex) => ({ boxShadow: `0 0 0 3px #0a0a0d, 0 0 0 6px ${hex}, 0 0 0 9px #0a0a0d, 0 0 0 11px ${hex}55` }) },
  pontilhada: { name: "Pontilhada", render: (hex) => ({ outline: `3px dashed ${hex}`, outlineOffset: 3 }) },
  arco: { name: "Arco-íris", render: () => ({ boxShadow: "0 0 0 3px #0a0a0d, 0 0 0 6px transparent", backgroundImage: "conic-gradient(#FF5470,#FF9D4D,#FFC24D,#3DDC84,#4F9DFF,#8B5CF6,#FF5470)", backgroundOrigin: "border-box", border: "3px solid transparent" }) },
  neon: { name: "Neon", render: () => null },
  gelo: { name: "Gelo", render: () => null },
  fogo: { name: "Fogo", render: () => null },
  ouro: { name: "Ouro", render: () => null },
  esmeralda: { name: "Esmeralda", render: () => null },
  sakura: { name: "Sakura", render: () => null },
  personalizada: { name: "Sua imagem", render: () => null },
};

/* ---------------------------------------------------------
   Marca — logo em bolha inspirada no Granolas Discord
   (preto/branco de contorno + rosa de destaque)
--------------------------------------------------------- */

function BrandMark({ size = 34 }) {
  return (
    <img
      src="/logo-mark.png"
      alt="Granolas Place"
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
    />
  );
}

function initials(name = "") {
  return name.trim().slice(0, 2).toUpperCase() || "??";
}
function timeFmt(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/* ---------------------------------------------------------
   App raiz — controla sessão de autenticação
--------------------------------------------------------- */

export default function GranolaApp() {
  const [session, setSession] = useState(undefined); // undefined = carregando
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setProfile(null); return; }
    loadProfile(session.user.id).then(setProfile);
  }, [session]);

  async function loadProfile(userId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) { console.error(error); return null; }
    return data;
  }

  const accent = ACCENTS[profile?.accent ?? "rosa"];

  if (session === undefined) {
    return <div style={{ background: "#0a0a0d", height: "100vh" }} />;
  }

  return (
    <div
      style={{
        "--accent": accent.hex,
        "--accent-soft": accent.soft,
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        width: "100%",
        height: "100vh",
        minHeight: 640,
        background: "#0a0a0d",
        color: "#F0EEF5",
        overflow: "hidden",
      }}
    >
      {!session || !profile ? (
        <AuthScreen accent={accent} />
      ) : (
        <MainApp
          profile={profile}
          setProfile={setProfile}
          accent={accent}
          onLogout={() => supabase.auth.signOut()}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Tela de autenticação
--------------------------------------------------------- */

function AuthScreen({ accent }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const grainDots = useRef(
    Array.from({ length: 60 }, () => ({
      x: Math.random() * 100, y: Math.random() * 100,
      r: Math.random() * 1.6 + 0.4, o: Math.random() * 0.3 + 0.05,
    }))
  ).current;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(traduzErro(error.message));
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, display_name: displayName || username } },
      });
      if (error) setError(traduzErro(error.message));
    }
    setLoading(false);
  }

  function traduzErro(msg) {
    if (msg.includes("already registered")) return "Esse e-mail já tem conta.";
    if (msg.includes("Password should be")) return "Senha muito curta (mínimo 6 caracteres).";
    if (msg.includes("Invalid login credentials")) return "E-mail ou senha errados.";
    if (msg.includes("duplicate key") || msg.includes("username")) return "Esse username já existe, escolhe outro.";
    return msg;
  }

  return (
    <div
      style={{
        position: "relative", width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(circle at 20% 20%, var(--accent-soft), transparent 45%), radial-gradient(circle at 80% 80%, var(--accent-soft), transparent 40%), #0a0a0d",
      }}
    >
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.7 }}>
        {grainDots.map((d, i) => (
          <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={d.r} fill="#F2F0F5" opacity={d.o} />
        ))}
      </svg>

      <form onSubmit={submit} style={{ position: "relative", width: 380, maxWidth: "90vw", background: "#141418", border: "1px solid #26242c", borderRadius: 20, padding: "36px 32px", boxShadow: "0 24px 60px -20px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
          <img src="/logo-full.png" alt="Granolas Place" style={{ height: 46, objectFit: "contain" }} />
        </div>
        <p style={{ color: "#8B8894", fontSize: 13, marginTop: 0, marginBottom: 22 }}>
          {mode === "login" ? "Entra e volta pro seu grupo." : "Cria sua conta e chama a galera."}
        </p>

        {mode === "signup" && (
          <>
            <Field label="Nome de exibição">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Yzara_Lux" style={inputStyle} />
            </Field>
            <Field label="Username">
              <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "_"))} placeholder="yzara_lux" style={inputStyle} required />
            </Field>
          </>
        )}
        <Field label="E-mail">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" style={inputStyle} required />
        </Field>
        <Field label="Senha">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" style={inputStyle} required minLength={6} />
        </Field>

        {error && <div style={{ color: "#FF5470", fontSize: 12.5, marginBottom: 10 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: "#8B8894" }}>
          {mode === "login" ? (
            <>Não tem conta? <span style={linkStyle} onClick={() => setMode("signup")}>Cria uma</span></>
          ) : (
            <>Já tem conta? <span style={linkStyle} onClick={() => setMode("login")}>Entrar</span></>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11.5, color: "#8B8894", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box", background: "#1c1c22", border: "1px solid #2a2a32", borderRadius: 10, padding: "10px 12px", color: "#F0EEF5", fontSize: 14, outline: "none" };
const primaryBtn = { width: "100%", marginTop: 8, background: "var(--accent)", color: "#0a0a0d", border: "none", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const secondaryBtn = { background: "#1c1c22", color: "#F0EEF5", border: "1px solid #2a2a32", borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, cursor: "pointer" };
const linkStyle = { color: "var(--accent)", cursor: "pointer", fontWeight: 600 };

/* ---------------------------------------------------------
   Motor de chamada de voz + compartilhar tela (WebRTC)
   Usa o Supabase Realtime só pra "apresentar" as pessoas
   umas às outras (sinalização); o áudio/vídeo vai direto
   entre os participantes depois disso.
--------------------------------------------------------- */

function playJoinSound() {
  try {
    const audio = new Audio("/join-sound.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch (err) { /* ignora se o navegador bloquear autoplay */ }
}

function useVoiceCall(profile) {
  const [joinedChannelId, setJoinedChannelId] = useState(null);
  const [participants, setParticipants] = useState({});
  const [localMuted, setLocalMuted] = useState(false);
  const [localSharing, setLocalSharing] = useState(false);

  const channelRef = useRef(null);
  const pcsRef = useRef({});
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  function sendSignal(to, data) {
    channelRef.current?.send({ type: "broadcast", event: "signal", payload: { to, from: profile.id, ...data } });
  }

  function createPeerConnection(peerId) {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
    screenStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, screenStreamRef.current));

    pc.onicecandidate = (e) => { if (e.candidate) sendSignal(peerId, { kind: "ice", candidate: e.candidate }); };
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setParticipants((p) => ({
        ...p,
        [peerId]: { ...(p[peerId] || {}), ...(e.track.kind === "audio" ? { audioStream: stream } : { screenStream: stream }) },
      }));
    };
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal(peerId, { kind: "offer", sdp: pc.localDescription });
      } catch (err) { console.error(err); }
    };
    pcsRef.current[peerId] = pc;
    return pc;
  }

  async function handleSignal(payload) {
    const { to, from, kind } = payload;
    if (to !== profile.id) return;
    let pc = pcsRef.current[from];
    if (kind === "offer") {
      if (!pc) pc = createPeerConnection(from);
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(from, { kind: "answer", sdp: pc.localDescription });
    } else if (kind === "answer") {
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    } else if (kind === "ice") {
      if (pc) { try { await pc.addIceCandidate(payload.candidate); } catch (err) { console.error(err); } }
    }
  }

  async function join(channelId) {
    if (joinedChannelId) await leave();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      alert("Não consegui acessar seu microfone. Confere se o navegador tem permissão.");
      return;
    }
    localStreamRef.current = stream;
    setJoinedChannelId(channelId);
    setParticipants({});
    playJoinSound();

    const ch = supabase.channel(`voice:${channelId}`, { config: { presence: { key: profile.id } } });
    channelRef.current = ch;
    ch.on("broadcast", { event: "signal" }, ({ payload }) => handleSignal(payload));
    ch.on("presence", { event: "join" }, ({ key, newPresences }) => {
      if (key === profile.id) return;
      setParticipants((p) => ({ ...p, [key]: { ...(p[key] || {}), name: newPresences[0]?.name || "?" } }));
      if (profile.id < key) createPeerConnection(key);
      playJoinSound();
    });
    ch.on("presence", { event: "leave" }, ({ key }) => {
      pcsRef.current[key]?.close();
      delete pcsRef.current[key];
      setParticipants((p) => { const n = { ...p }; delete n[key]; return n; });
    });
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ name: profile.display_name });
        const state = ch.presenceState();
        Object.entries(state).forEach(([key, presences]) => {
          if (key === profile.id) return;
          setParticipants((p) => ({ ...p, [key]: { ...(p[key] || {}), name: presences[0]?.name || "?" } }));
          if (profile.id < key && !pcsRef.current[key]) createPeerConnection(key);
        });
      }
    });
  }

  async function leave() {
    Object.values(pcsRef.current).forEach((pc) => pc.close());
    pcsRef.current = {};
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    if (channelRef.current) {
      await channelRef.current.untrack();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setJoinedChannelId(null);
    setParticipants({});
    setLocalMuted(false);
    setLocalSharing(false);
  }

  function toggleMute() {
    setLocalMuted((m) => {
      const next = !m;
      localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
      return next;
    });
  }

  async function toggleShare() {
    if (localSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      Object.values(pcsRef.current).forEach((pc) => {
        pc.getSenders().filter((s) => s.track?.kind === "video").forEach((s) => pc.removeTrack(s));
      });
      screenStreamRef.current = null;
      setLocalSharing(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } },
        audio: false,
      });
      screenStreamRef.current = stream;
      Object.values(pcsRef.current).forEach((pc) => stream.getTracks().forEach((t) => pc.addTrack(t, stream)));
      stream.getVideoTracks()[0].onended = () => toggleShare();
      setLocalSharing(true);
    } catch (err) { /* usuário cancelou a seleção de tela */ }
  }

  useEffect(() => () => { leave(); }, []);

  return { joinedChannelId, participants, localMuted, localSharing, join, leave, toggleMute, toggleShare, localScreenStream: screenStreamRef.current };
}

/* ---------------------------------------------------------
   App principal
--------------------------------------------------------- */

function MainApp({ profile, setProfile, accent, onLogout }) {
  const [servers, setServers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pending, setPending] = useState([]);
  const [view, setView] = useState("home");
  const [homeTab, setHomeTab] = useState("todos");
  const [currentServerId, setCurrentServerId] = useState(null);
  const [currentChannelId, setCurrentChannelId] = useState(null);
  const [channels, setChannels] = useState([]);
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showJoinServer, setShowJoinServer] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [viewingUserId, setViewingUserId] = useState(null);
  const [fullscreenCall, setFullscreenCall] = useState(false);
  const call = useVoiceCall(profile);
  const friendIds = new Set(friends.map((f) => f.id));
  const pendingIds = new Set(pending.map((p) => p.other.id));

  const currentServer = servers.find((s) => s.id === currentServerId);
  const currentChannel = channels.find((c) => c.id === currentChannelId);

  useEffect(() => { loadServers(); loadFriends(); markPresence("online"); 
    const onUnload = () => markPresence("offline");
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  useEffect(() => {
    if (currentServerId) loadChannels(currentServerId);
    else setChannels([]);
  }, [currentServerId]);

  async function markPresence(status) {
    await supabase.from("user_presence").upsert({ user_id: profile.id, status, updated_at: new Date().toISOString() });
  }

  async function loadServers() {
    // Busca em 2 passos (sem "embed" aninhado) — evita o bug de recursão do Supabase
    // quando duas tabelas com RLS se referenciam dentro da mesma consulta.
    const { data: memberRows, error: mErr } = await supabase
      .from("server_members")
      .select("server_id")
      .eq("user_id", profile.id);
    if (mErr) { console.error(mErr); return; }
    const ids = (memberRows || []).map((r) => r.server_id);
    if (ids.length === 0) { setServers([]); return; }
    const { data, error } = await supabase.from("servers").select("*").in("id", ids);
    if (error) { console.error(error); return; }
    setServers(data || []);
  }

  async function loadChannels(serverId) {
    const { data, error } = await supabase.from("channels").select("*").eq("server_id", serverId).order("position");
    if (error) { console.error(error); return; }
    setChannels(data || []);
    const firstText = data?.find((c) => c.type === "text");
    setCurrentChannelId(firstText?.id ?? null);
  }

  async function loadFriends() {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("*, sender:sender_id(id, username, display_name, avatar_color), receiver:receiver_id(id, username, display_name, avatar_color)")
      .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`);
    if (error) { console.error(error); return; }
    const accepted = [];
    const pend = [];
    (data || []).forEach((r) => {
      const other = r.sender_id === profile.id ? r.receiver : r.sender;
      if (r.status === "accepted") accepted.push(other);
      else if (r.status === "pending") pend.push({ ...r, other, isReceiver: r.receiver_id === profile.id });
    });
    setFriends(accepted);
    setPending(pend);
  }

  async function sendFriendRequest(username) {
    const { data: target, error: fErr } = await supabase.from("profiles").select("id").eq("username", username).single();
    if (fErr || !target) { alert("Username não encontrado."); return; }
    if (target.id === profile.id) { alert("Esse é você :)"); return; }
    const { error } = await supabase.from("friend_requests").insert({ sender_id: profile.id, receiver_id: target.id });
    if (error) alert(error.message.includes("duplicate") ? "Pedido já enviado." : error.message);
    else loadFriends();
  }

  async function respondRequest(id, status) {
    await supabase.from("friend_requests").update({ status }).eq("id", id);
    loadFriends();
  }

  function selectServer(id) {
    setCurrentServerId(id);
    setView("server");
  }

  async function createServer(name) {
    const { data: server, error } = await supabase.from("servers").insert({ name, owner_id: profile.id, icon: initials(name) }).select().single();
    if (error) { alert(error.message); return; }
    await supabase.from("server_members").insert({ server_id: server.id, user_id: profile.id });
    await supabase.from("channels").insert([
      { server_id: server.id, name: "geral", type: "text", position: 0 },
      { server_id: server.id, name: "Sala Principal", type: "voice", position: 1 },
    ]);
    await loadServers();
    selectServer(server.id);
    setShowCreateServer(false);
  }

  async function joinServer(serverId) {
    const { error } = await supabase.from("server_members").insert({ server_id: serverId, user_id: profile.id });
    if (error) { alert("Não consegui entrar. Confere se o ID do servidor está certo."); return; }
    await loadServers();
    selectServer(serverId);
    setShowJoinServer(false);
  }

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {Object.entries(call.participants).map(([id, p]) => (
        p.audioStream ? <audio key={id} autoPlay ref={(el) => { if (el && el.srcObject !== p.audioStream) el.srcObject = p.audioStream; }} /> : null
      ))}

      {!fullscreenCall && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
            <ServerRail
              servers={servers}
              currentServerId={view === "server" ? currentServerId : null}
              onHome={() => setView("home")}
              onSelect={selectServer}
              onCreate={() => setShowCreateServer(true)}
              onJoin={() => setShowJoinServer(true)}
              homeActive={view === "home"}
            />
            {view === "home" ? (
              <HomeSidebar
                tab={homeTab}
                onSelectTab={setHomeTab}
                pendingCount={pending.filter((p) => p.isReceiver).length}
                onCreateServer={() => setShowCreateServer(true)}
                onJoinServer={() => setShowJoinServer(true)}
              />
            ) : (
              <ChannelSidebar
                server={currentServer}
                channels={channels}
                currentChannelId={currentChannelId}
                onSelectChannel={setCurrentChannelId}
                call={call}
                onOpenSettings={() => setShowServerSettings(true)}
              />
            )}
          </div>
          <ProfileFooter profile={profile} onOpenProfile={() => setShowProfile(true)} />
        </div>
      )}

      {view === "server" && currentChannel?.type === "voice" && call.joinedChannelId === currentChannel.id ? (
        <VoiceStage
          channel={currentChannel}
          call={call}
          profile={profile}
          fullscreen={fullscreenCall}
          onToggleFullscreen={() => setFullscreenCall((f) => !f)}
        />
      ) : view === "home" ? (
        <FriendsMain tab={homeTab} friends={friends} pending={pending} onAdd={sendFriendRequest} onRespond={respondRequest} profile={profile} onViewProfile={setViewingUserId} />
      ) : (
        <>
          <ChatArea channel={currentChannel} profile={profile} onViewProfile={setViewingUserId} />
          {!fullscreenCall && currentServer && <MembersPanel server={currentServer} profile={profile} onViewProfile={setViewingUserId} />}
        </>
      )}

      {showCreateServer && <CreateServerModal onClose={() => setShowCreateServer(false)} onCreate={createServer} />}
      {showJoinServer && <JoinServerModal onClose={() => setShowJoinServer(false)} onJoin={joinServer} />}
      {showServerSettings && currentServer && (
        <ServerSettingsModal
          server={currentServer}
          profile={profile}
          onClose={() => setShowServerSettings(false)}
          onRenamed={(name) => setServers((prev) => prev.map((s) => (s.id === currentServer.id ? { ...s, name } : s)))}
          onLeftOrDeleted={() => { setShowServerSettings(false); setView("home"); setCurrentServerId(null); loadServers(); }}
        />
      )}
      {showProfile && (
        <ProfileModal
          profile={profile}
          onSave={async (draft) => {
            const { error } = await supabase.from("profiles").update(draft).eq("id", profile.id);
            if (error) { alert("Não deu pra salvar: " + error.message); return; }
            setProfile({ ...profile, ...draft });
            setShowProfile(false);
          }}
          onClose={() => setShowProfile(false)}
          onLogout={onLogout}
        />
      )}
      {viewingUserId && viewingUserId !== profile.id && (
        <UserProfileModal
          userId={viewingUserId}
          onClose={() => setViewingUserId(null)}
          isFriend={friendIds.has(viewingUserId)}
          isPending={pendingIds.has(viewingUserId)}
          onAddFriend={async (username) => { await sendFriendRequest(username); }}
        />
      )}
    </div>
  );
}

function ProfileFooter({ profile, onOpenProfile }) {
  const statusMeta = STATUS_META[profile.status] ?? STATUS_META.online;
  return (
    <div onClick={onOpenProfile} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#111114", borderTop: "1px solid #1e1e24", borderRight: "1px solid #1e1e24", cursor: "pointer", flexShrink: 0 }}>
      <Avatar color={profile.avatar_color} name={profile.display_name} status={profile.status} frame={profile.avatar_frame} avatarUrl={profile.avatar_url} customFrameUrl={profile.custom_frame_url} size={34} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.display_name}</div>
        <div style={{ fontSize: 11, color: statusMeta.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.custom_status || statusMeta.label}</div>
      </div>
      <span style={{ color: "#8B8894", fontSize: 16 }}>⚙</span>
    </div>
  );
}

function VoiceStage({ channel, call, profile, fullscreen, onToggleFullscreen }) {
  const localVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && call.localScreenStream) localVideoRef.current.srcObject = call.localScreenStream;
  }, [call.localSharing]);

  const tiles = [
    {
      id: "you",
      name: `${profile.display_name} (você)`,
      color: profile.avatar_color,
      frame: profile.avatar_frame,
      avatarUrl: profile.avatar_url,
      customFrameUrl: profile.custom_frame_url,
      isVideo: call.localSharing,
      videoRef: localVideoRef,
      isLocal: true,
      muted: call.localMuted,
    },
    ...Object.entries(call.participants).map(([id, p]) => ({
      id,
      name: p.name || "...",
      color: "#4F9DFF",
      isVideo: !!p.screenStream,
      screenStream: p.screenStream,
      muted: false,
    })),
  ];

  return (
    <div style={{ flex: 1, background: "#0a0a0d", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #1e1e24", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>🔊 {channel.name}</div>
        <button onClick={onToggleFullscreen} style={{ ...secondaryBtn, width: "auto", padding: "7px 14px" }}>
          {fullscreen ? "Sair da tela cheia" : "Tela cheia"}
        </button>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {tiles.map((t) => <VoiceTile key={t.id} tile={t} />)}
        </div>
      </div>

      <div style={{ padding: 16, borderTop: "1px solid #1e1e24", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", gap: 10, width: 360 }}>
          <ToolBtn active={!call.localMuted} onClick={call.toggleMute} label="Mic">{call.localMuted ? "🔇" : "🎤"}</ToolBtn>
          <ToolBtn active={call.localSharing} onClick={call.toggleShare} label="Compartilhar tela">🖥</ToolBtn>
          <ToolBtn active={false} onClick={call.leave} label="Sair" danger>✕ Sair</ToolBtn>
        </div>
      </div>
    </div>
  );
}

function VoiceTile({ tile }) {
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", background: tile.isVideo ? "#000" : `linear-gradient(135deg, ${tile.color}, #1c1c22)`, minHeight: 190, aspectRatio: "16 / 10", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #1e1e24" }}>
      {tile.isVideo ? (
        tile.isLocal ? (
          <video ref={tile.videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        ) : (
          <video
            autoPlay playsInline
            ref={(el) => { if (el && tile.screenStream && el.srcObject !== tile.screenStream) el.srcObject = tile.screenStream; }}
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )
      ) : (
        <Avatar color={tile.color} name={tile.name} frame={tile.frame} avatarUrl={tile.avatarUrl} customFrameUrl={tile.customFrameUrl} size={72} />
      )}
      <div style={{ position: "absolute", left: 10, bottom: 10, background: "rgba(10,10,13,0.75)", padding: "5px 11px", borderRadius: 8, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, maxWidth: "calc(100% - 20px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {tile.name}
        {tile.muted && <span style={{ fontSize: 11 }}>🔇</span>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Barra lateral de servidores
--------------------------------------------------------- */

function ServerRail({ servers, currentServerId, onHome, onSelect, onCreate, onJoin, homeActive }) {
  return (
    <div style={{ width: 76, flexShrink: 0, background: "#0e0e12", borderRight: "1px solid #1e1e24", display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 0", gap: 10 }}>
      <RailIcon active={homeActive} onClick={onHome} label="Granolas Place"><BrandMark size={28} /></RailIcon>
      <div style={{ width: 32, height: 1, background: "#1e1e24", margin: "4px 0" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", maxHeight: "50vh" }}>
        {servers.map((s) => (
          <RailIcon key={s.id} active={s.id === currentServerId} onClick={() => onSelect(s.id)} label={s.name}>
            <span style={{ fontSize: 12.5, fontWeight: 800 }}>{s.icon}</span>
          </RailIcon>
        ))}
      </div>
      <button onClick={onCreate} title="Criar servidor" style={railAddBtn}>+</button>
      <button onClick={onJoin} title="Entrar em servidor com ID" style={{ ...railAddBtn, fontSize: 14 }}>🔗</button>
    </div>
  );
}

const railAddBtn = { width: 46, height: 46, borderRadius: 16, border: "1px dashed #34323c", background: "transparent", color: "#8B8894", fontSize: 20, cursor: "pointer" };

function RailIcon({ active, onClick, children, label }) {
  return (
    <button onClick={onClick} title={label} style={{ position: "relative", width: 46, height: 46, borderRadius: active ? 15 : 23, background: active ? "var(--accent)" : "#1c1c22", color: active ? "#0a0a0d" : "#F0EEF5", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-radius 160ms ease, background 160ms ease" }}>
      {children}
      {active && <span style={{ position: "absolute", left: -14, top: "50%", transform: "translateY(-50%)", width: 4, height: 22, borderRadius: 4, background: "var(--accent)" }} />}
    </button>
  );
}

/* ---------------------------------------------------------
   Sidebar de canais
--------------------------------------------------------- */

function ChannelSidebar({ server, channels, currentChannelId, onSelectChannel, call, onOpenSettings }) {
  if (!server) return <div style={{ width: 240, background: "#111114" }} />;
  const textChannels = channels.filter((c) => c.type === "text");
  const voiceChannels = channels.filter((c) => c.type === "voice");

  return (
    <div style={{ width: 240, flexShrink: 0, background: "#111114", display: "flex", flexDirection: "column", borderRight: "1px solid #1e1e24" }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid #1e1e24", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{server.name}</div>
          <div
            onClick={() => { navigator.clipboard?.writeText(server.id); }}
            title="Copiar ID pra convidar"
            style={{ fontSize: 10.5, color: "#5A5866", marginTop: 3, cursor: "pointer" }}
          >
            ID: {server.id.slice(0, 8)}... (clique pra copiar)
          </div>
        </div>
        <button onClick={onOpenSettings} title="Configurar servidor" style={{ background: "transparent", border: "none", color: "#8B8894", fontSize: 16, cursor: "pointer", flexShrink: 0, padding: 2 }}>⚙</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        <ChannelGroupLabel>Canais de texto</ChannelGroupLabel>
        {textChannels.map((c) => (
          <ChannelRow key={c.id} active={c.id === currentChannelId} onClick={() => onSelectChannel(c.id)} icon="#" label={c.name} />
        ))}
        <ChannelGroupLabel style={{ marginTop: 18 }}>Canais de voz</ChannelGroupLabel>
        {voiceChannels.map((c) => (
          <div key={c.id}>
            <ChannelRow active={c.id === currentChannelId} onClick={() => onSelectChannel(c.id)} icon="🔊" label={c.name} />
            {call.joinedChannelId === c.id && (
              <div style={{ marginLeft: 22, marginBottom: 6 }}>
                <div style={{ fontSize: 10.5, color: "#3DDC84" }}>● você{Object.values(call.participants).map((p) => p.name).length > 0 ? `, ${Object.values(call.participants).map((p) => p.name).join(", ")}` : ""}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {!call.joinedChannelId && currentChannelId && channels.find((c) => c.id === currentChannelId)?.type === "voice" && (
        <div style={{ padding: 12 }}>
          <button onClick={() => call.join(currentChannelId)} style={{ ...primaryBtn, marginTop: 0, borderRadius: 10 }}>Entrar na chamada</button>
        </div>
      )}
      {call.joinedChannelId && call.joinedChannelId !== currentChannelId && (
        <div style={{ padding: 12, fontSize: 11, color: "#8B8894", textAlign: "center" }}>
          Você está em outra chamada de voz — clica no canal pra ver.
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   Painel de membros do servidor (fica do lado do chat,
   parecido com o do Discord — online em cima, offline embaixo)
--------------------------------------------------------- */

function MembersPanel({ server, profile, onViewProfile }) {
  const [members, setMembers] = useState([]);

  useEffect(() => {
    let active = true;
    load();
    const interval = setInterval(load, 15000); // atualiza status a cada 15s
    return () => { active = false; clearInterval(interval); };

    async function load() {
      const { data: memberRows, error: mErr } = await supabase
        .from("server_members")
        .select("user_id")
        .eq("server_id", server.id);
      if (mErr || !active) return;
      const ids = (memberRows || []).map((r) => r.user_id);
      if (ids.length === 0) { setMembers([]); return; }
      const { data: profs } = await supabase.from("profiles").select("*").in("id", ids);
      const { data: pres } = await supabase.from("user_presence").select("*").in("user_id", ids);
      if (!active) return;
      const presMap = Object.fromEntries((pres || []).map((p) => [p.user_id, p.status]));
      const merged = (profs || []).map((p) => ({ ...p, liveStatus: presMap[p.id] ?? "offline" }));
      merged.sort((a, b) => {
        const rank = (s) => (s === "online" ? 0 : s === "ausente" ? 1 : s === "ocupado" ? 1 : s === "offline" ? 3 : 2);
        return rank(a.liveStatus) - rank(b.liveStatus) || a.display_name.localeCompare(b.display_name);
      });
      setMembers(merged);
    }
  }, [server.id]);

  const online = members.filter((m) => m.liveStatus && m.liveStatus !== "offline" && m.liveStatus !== "invisivel");
  const offline = members.filter((m) => !m.liveStatus || m.liveStatus === "offline" || m.liveStatus === "invisivel");

  return (
    <div style={{ width: 220, flexShrink: 0, background: "#111114", borderLeft: "1px solid #1e1e24", overflowY: "auto", padding: "16px 12px" }}>
      {online.length > 0 && (
        <>
          <ChannelGroupLabel>Online — {online.length}</ChannelGroupLabel>
          {online.map((m) => <MemberRow key={m.id} member={m} onClick={() => onViewProfile(m.id)} isYou={m.id === profile.id} />)}
        </>
      )}
      {offline.length > 0 && (
        <>
          <ChannelGroupLabel style={{ marginTop: 16 }}>Offline — {offline.length}</ChannelGroupLabel>
          {offline.map((m) => <MemberRow key={m.id} member={m} onClick={() => onViewProfile(m.id)} isYou={m.id === profile.id} dim />)}
        </>
      )}
    </div>
  );
}

function MemberRow({ member, onClick, isYou, dim }) {
  const statusMeta = STATUS_META[member.liveStatus] ?? STATUS_META.invisivel;
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, cursor: "pointer", opacity: dim ? 0.5 : 1 }}>
      <Avatar color={member.avatar_color} name={member.display_name} status={dim ? null : member.liveStatus} frame={member.avatar_frame} avatarUrl={member.avatar_url} customFrameUrl={member.custom_frame_url} size={30} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.display_name}{isYou ? " (você)" : ""}</div>
        {!dim && member.custom_status && <div style={{ fontSize: 10.5, color: "#8B8894", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.custom_status}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Configurações do servidor
--------------------------------------------------------- */

function ServerSettingsModal({ server, profile, onClose, onRenamed, onLeftOrDeleted }) {
  const isOwner = server.owner_id === profile.id;
  const [name, setName] = useState(server.name);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("servers").update({ name: name.trim() }).eq("id", server.id);
    setSaving(false);
    if (error) { alert("Não deu pra salvar: " + error.message); return; }
    onRenamed(name.trim());
  }

  async function leaveServer() {
    if (!confirm("Sair desse servidor?")) return;
    const { error } = await supabase.from("server_members").delete().eq("server_id", server.id).eq("user_id", profile.id);
    if (error) { alert(error.message); return; }
    onLeftOrDeleted();
  }

  async function deleteServer() {
    if (!confirm(`Isso apaga o servidor "${server.name}" pra sempre, com todos os canais e mensagens. Tem certeza?`)) return;
    const { error } = await supabase.from("servers").delete().eq("id", server.id);
    if (error) { alert("Não deu pra excluir: " + error.message); return; }
    onLeftOrDeleted();
  }

  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: 28, width: 380 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Configurar servidor</div>
        <div style={{ fontSize: 13, color: "#8B8894", marginBottom: 20 }}>
          {isOwner ? "Você é o dono desse servidor." : "Você é um membro desse servidor."}
        </div>

        {isOwner && (
          <>
            <Field label="Nome do servidor">
              <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            </Field>
            <button onClick={save} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>{saving ? "Salvando..." : "Salvar nome"}</button>
          </>
        )}

        <Field label="ID do servidor (pra convidar)">
          <div
            onClick={() => navigator.clipboard?.writeText(server.id)}
            style={{ ...inputStyle, cursor: "pointer", color: "#8B8894", fontSize: 12.5 }}
            title="Clique pra copiar"
          >
            {server.id}
          </div>
        </Field>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #1e1e24" }}>
          {isOwner ? (
            <button onClick={deleteServer} style={{ ...secondaryBtn, width: "100%", color: "#FF5470", borderColor: "#3a1c22" }}>Excluir servidor</button>
          ) : (
            <button onClick={leaveServer} style={{ ...secondaryBtn, width: "100%", color: "#FF5470", borderColor: "#3a1c22" }}>Sair do servidor</button>
          )}
        </div>

        <button type="button" onClick={onClose} style={{ ...secondaryBtn, width: "100%", marginTop: 10 }}>Fechar</button>
      </div>
    </ModalShell>
  );
}

function ChannelGroupLabel({ children, style }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#5A5866", textTransform: "uppercase", letterSpacing: 0.6, padding: "4px 8px", ...style }}>{children}</div>;
}

function ChannelRow({ active, onClick, icon, label }) {
  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? "#F0EEF5" : "#9a97a3", background: active ? "#1e1e26" : "transparent" }}>
      <span style={{ opacity: 0.7, fontSize: 12, width: 14, textAlign: "center" }}>{icon}</span>{label}
    </div>
  );
}

function ToolBtn({ active, onClick, children, label, danger }) {
  return (
    <button onClick={onClick} title={label} style={{ flex: 1, height: 32, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, background: danger ? "#3a1c22" : active ? "var(--accent-soft)" : "#1c1c22", color: danger ? "#FF5470" : active ? "var(--accent)" : "#8B8894" }}>{children}</button>
  );
}

/* ---------------------------------------------------------
   Chat com Realtime
--------------------------------------------------------- */

function ChatArea({ channel, profile, onViewProfile }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!channel || channel.type !== "text") { setMessages([]); return; }
    let active = true;
    loadMessages();

    const sub = supabase
      .channel(`messages:${channel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `channel_id=eq.${channel.id}` }, () => {
        loadMessages();
      })
      .subscribe();

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*, profiles(display_name, avatar_color, avatar_frame, avatar_url, custom_frame_url), attachments(*)")
        .eq("channel_id", channel.id)
        .order("created_at");
      if (!active) return;
      if (error) { console.error(error); return; }
      setMessages(data || []);
    }

    return () => { active = false; supabase.removeChannel(sub); };
  }, [channel?.id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim() || !channel) return;
    const content = text;
    setText("");
    const { error } = await supabase.from("messages").insert({ channel_id: channel.id, author_id: profile.id, content });
    if (error) alert(error.message);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file || !channel) return;
    if (file.size > 15 * 1024 * 1024) { alert("Arquivo até 15MB por enquanto."); e.target.value = ""; return; }
    setUploading(true);
    const path = `${channel.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("attachments").upload(path, file);
    if (upErr) {
      setUploading(false);
      alert(upErr.message.includes("Bucket not found")
        ? "O espaço de armazenamento de arquivos ainda não foi criado no Supabase (bucket 'attachments')."
        : "Não deu pra enviar: " + upErr.message);
      e.target.value = "";
      return;
    }
    const { data: pub } = supabase.storage.from("attachments").getPublicUrl(path);
    const { data: msg, error: msgErr } = await supabase
      .from("messages")
      .insert({ channel_id: channel.id, author_id: profile.id, content: text.trim() })
      .select()
      .single();
    if (!msgErr && msg) {
      await supabase.from("attachments").insert({
        message_id: msg.id, file_url: pub.publicUrl, file_name: file.name, file_size: file.size, mime_type: file.type,
      });
      setText("");
    } else if (msgErr) {
      alert(msgErr.message);
    }
    setUploading(false);
    e.target.value = "";
  }

  if (!channel) return <div style={{ flex: 1, background: "#0a0a0d" }} />;

  if (channel.type === "voice") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a0d", color: "#5A5866" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔊</div>
        <div style={{ fontWeight: 700, color: "#F0EEF5", fontSize: 16 }}>{channel.name}</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Canal de voz — entre pela barra lateral</div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0a0a0d", minWidth: 0 }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1e24", fontWeight: 700, fontSize: 14.5, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ opacity: 0.5 }}>#</span> {channel.name}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "18px 20px" }}>
        {messages.length === 0 && <div style={{ color: "#5A5866", fontSize: 13.5, marginTop: 20 }}>Nenhuma mensagem ainda. Manda o primeiro "e aí" pro grupo.</div>}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const grouped = prev && prev.author_id === m.author_id;
          const authorName = m.profiles?.display_name ?? "Alguém";
          const authorColor = m.profiles?.avatar_color ?? "#8B5CF6";
          return (
            <div key={m.id} style={{ display: "flex", gap: 12, marginTop: grouped ? 2 : 14 }}>
              <div style={{ width: 38, flexShrink: 0 }}>
                {!grouped && (
                  <div onClick={() => onViewProfile?.(m.author_id)} style={{ cursor: "pointer" }}>
                    <Avatar color={authorColor} name={authorName} frame={m.profiles?.avatar_frame} avatarUrl={m.profiles?.avatar_url} customFrameUrl={m.profiles?.custom_frame_url} size={38} />
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                {!grouped && (
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span onClick={() => onViewProfile?.(m.author_id)} style={{ fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>{authorName}</span>
                    <span style={{ fontSize: 11, color: "#5A5866" }}>{timeFmt(m.created_at)}</span>
                  </div>
                )}
                {m.content && <div style={{ fontSize: 14, color: "#DFDCE6", lineHeight: 1.5, wordBreak: "break-word" }}>{m.content}</div>}
                {m.attachments?.map((a) => <AttachmentView key={a.id} attachment={a} />)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ padding: "0 20px 18px" }}>
        <form onSubmit={send} style={{ display: "flex", alignItems: "center", background: "#17171c", border: "1px solid #26242c", borderRadius: 12, padding: "4px 6px 4px 14px" }}>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Enviar arquivo ou imagem" style={{ background: "transparent", border: "none", color: uploading ? "var(--accent)" : "#8B8894", fontSize: 17, cursor: "pointer", padding: "0 8px 0 0" }}>
            {uploading ? "..." : "📎"}
          </button>
          <input ref={fileInputRef} type="file" onChange={handleFile} style={{ display: "none" }} />
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Conversar em #${channel.name}`} style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#F0EEF5", fontSize: 14, padding: "10px 0" }} />
          <button type="submit" style={{ background: "var(--accent)", color: "#0a0a0d", border: "none", borderRadius: 8, width: 32, height: 32, marginLeft: 4, cursor: "pointer", fontWeight: 800 }}>➤</button>
        </form>
      </div>
    </div>
  );
}

function AttachmentView({ attachment }) {
  const isImage = attachment.mime_type?.startsWith("image/");
  if (isImage) {
    return (
      <a href={attachment.file_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 6 }}>
        <img src={attachment.file_url} alt={attachment.file_name} style={{ maxWidth: 320, maxHeight: 260, borderRadius: 10, border: "1px solid #26242c", display: "block" }} />
      </a>
    );
  }
  const sizeKb = attachment.file_size ? Math.round(attachment.file_size / 1024) : null;
  return (
    <a href={attachment.file_url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6, background: "#17171c", border: "1px solid #26242c", borderRadius: 10, padding: "10px 14px", maxWidth: 320, textDecoration: "none", color: "#F0EEF5" }}>
      <span style={{ fontSize: 20 }}>📄</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{attachment.file_name}</div>
        {sizeKb && <div style={{ fontSize: 11, color: "#8B8894" }}>{sizeKb} KB</div>}
      </div>
    </a>
  );
}

/* ---------------------------------------------------------
   Sidebar da tela inicial — logo + navegação
   (Amigos / Adicionar amigo / Pedidos de amizade / servidores)
--------------------------------------------------------- */

function HomeSidebar({ tab, onSelectTab, pendingCount, onCreateServer, onJoinServer }) {
  const navItems = [
    { key: "todos", label: "Amigos", icon: "👥" },
    { key: "adicionar", label: "Adicionar amigo", icon: "＋" },
    { key: "pendentes", label: `Pedidos de amizade${pendingCount ? ` (${pendingCount})` : ""}`, icon: "🔗" },
  ];

  return (
    <div style={{ width: 260, flexShrink: 0, background: "#111114", borderRight: "1px solid #1e1e24", display: "flex", flexDirection: "column", padding: "18px 14px" }}>
      <img src="/logo-full.png" alt="Granolas Place" style={{ width: "100%", maxWidth: 220, objectFit: "contain", marginBottom: 18 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {navItems.map((item) => (
          <HomeNavItem key={item.key} active={tab === item.key} onClick={() => onSelectTab(item.key)} icon={item.icon} label={item.label} />
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <HomeNavItem onClick={onCreateServer} icon="✨" label="Criar servidor" />
        <HomeNavItem onClick={onJoinServer} icon="🔑" label="Entrar em servidor" />
      </div>
    </div>
  );
}

function HomeNavItem({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
        borderRadius: 10, border: "none", cursor: "pointer", textAlign: "left",
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#0a0a0d" : "#DFDCE6",
        fontWeight: active ? 700 : 600, fontSize: 14,
      }}
    >
      <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{icon}</span>
      {label}
    </button>
  );
}

/* ---------------------------------------------------------
   Amigos — conteúdo principal (varia com a aba escolhida na sidebar)
--------------------------------------------------------- */

function FriendsMain({ tab, friends, pending, onAdd, onRespond, profile, onViewProfile }) {
  const [addValue, setAddValue] = useState("");
  const incoming = pending.filter((p) => p.isReceiver);
  const outgoing = pending.filter((p) => !p.isReceiver);

  return (
    <div style={{ flex: 1, background: "#0a0a0d", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #1e1e24", paddingBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>
          {tab === "todos" && "Amigos"}
          {tab === "adicionar" && "Adicionar amigo"}
          {tab === "pendentes" && "Pedidos de amizade"}
        </div>
      </div>

      <div style={{ padding: "16px 24px" }}>
        {tab === "adicionar" && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (addValue.trim()) { onAdd(addValue.trim()); setAddValue(""); } }}
            style={{ display: "flex", gap: 8, marginBottom: 20, maxWidth: 460 }}
          >
            <input value={addValue} onChange={(e) => setAddValue(e.target.value)} placeholder="Adicionar amigo pelo username..." style={{ ...inputStyle, flex: 1 }} autoFocus />
            <button type="submit" style={{ ...primaryBtn, width: 140, marginTop: 0 }}>Enviar pedido</button>
          </form>
        )}

        {tab === "todos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {friends.length === 0 && <div style={{ color: "#5A5866", fontSize: 13, padding: "10px 0" }}>Nenhum amigo ainda. Vai em "Adicionar amigo" na barra lateral ☝</div>}
            {friends.map((f) => (
              <div key={f.id} onClick={() => onViewProfile?.(f.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer" }}>
                <Avatar color={f.avatar_color} name={f.display_name} frame={f.avatar_frame} avatarUrl={f.avatar_url} customFrameUrl={f.custom_frame_url} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{f.display_name}</div>
                  <div style={{ fontSize: 12, color: "#8B8894" }}>@{f.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "pendentes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {incoming.length === 0 && outgoing.length === 0 && <div style={{ color: "#5A5866", fontSize: 13, padding: "10px 0" }}>Nenhum pedido pendente.</div>}
            {incoming.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px" }}>
                <Avatar color={p.other.avatar_color} name={p.other.display_name} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.other.display_name}</div>
                  <div style={{ fontSize: 12, color: "#8B8894" }}>quer ser seu amigo</div>
                </div>
                <button onClick={() => onRespond(p.id, "accepted")} style={{ ...primaryBtn, width: "auto", padding: "6px 14px", marginTop: 0, fontSize: 12.5 }}>Aceitar</button>
                <button onClick={() => onRespond(p.id, "declined")} style={{ ...secondaryBtn, width: "auto", padding: "6px 14px", fontSize: 12.5 }}>Recusar</button>
              </div>
            ))}
            {outgoing.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", opacity: 0.6 }}>
                <Avatar color={p.other.avatar_color} name={p.other.display_name} size={38} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.other.display_name}</div>
                  <div style={{ fontSize: 12, color: "#8B8894" }}>pedido enviado, aguardando</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Avatar
--------------------------------------------------------- */

function Avatar({ color, name, status, size = 36, frame = "nenhuma", avatarUrl, customFrameUrl }) {
  const ringWrap = frame === "arco" || frame === "pontilhada";
  const ring = 3;

  const wrapperStyle = frame === "arco"
    ? { padding: ring, borderRadius: "35%", background: "conic-gradient(#FF5470,#FF9D4D,#FFC24D,#3DDC84,#4F9DFF,#8B5CF6,#FF5470)" }
    : frame === "pontilhada"
      ? { padding: ring, borderRadius: "35%", border: `3px dashed ${color}` }
      : {};

  const avatarBoxShadow =
    frame === "brilho" ? `0 0 0 3px #0a0a0d, 0 0 0 6px ${color}, 0 0 16px 2px ${color}88` :
    frame === "duplo" ? `0 0 0 3px #0a0a0d, 0 0 0 6px ${color}, 0 0 0 9px #0a0a0d, 0 0 0 11px ${color}55` :
    frame === "neon" ? `0 0 0 3px #0a0a0d, 0 0 0 5px #00E5FF, 0 0 20px 3px #00E5FFaa, 0 0 34px 6px #FF00E5aa` :
    frame === "gelo" ? `0 0 0 3px #0a0a0d, 0 0 0 5px #BFF3FF, 0 0 16px 3px #7FD9FFaa` :
    frame === "fogo" ? `0 0 0 3px #0a0a0d, 0 0 0 5px #FF6A00, 0 0 18px 4px #FF2E0088` :
    frame === "ouro" ? `0 0 0 3px #0a0a0d, 0 0 0 5px #FFD700, 0 0 20px 3px #FFD70099` :
    frame === "esmeralda" ? `0 0 0 3px #0a0a0d, 0 0 0 5px #10E0A0, 0 0 18px 3px #10E0A088` :
    frame === "sakura" ? `0 0 0 3px #0a0a0d, 0 0 0 5px #FFB3D1, 0 0 16px 3px #FF8FC0aa` :
    undefined;

  const avatarEl = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      style={{ width: size, height: size, borderRadius: "30%", objectFit: "cover", display: "block", border: "2px solid var(--accent-soft)", boxShadow: avatarBoxShadow }}
    />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "30%", background: `linear-gradient(135deg, ${color}, #1c1c22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 800, border: "2px solid var(--accent-soft)", boxShadow: avatarBoxShadow }}>
      {initials(name)}
    </div>
  );

  return (
    <div style={{ position: "relative", width: size + (ringWrap ? ring * 2 : 0), height: size + (ringWrap ? ring * 2 : 0), flexShrink: 0 }}>
      {ringWrap ? <div style={wrapperStyle}>{avatarEl}</div> : avatarEl}
      {frame === "personalizada" && customFrameUrl && (
        <img src={customFrameUrl} alt="moldura" style={{ position: "absolute", top: "-18%", left: "-18%", width: "136%", height: "136%", pointerEvents: "none" }} />
      )}
      {status && <div style={{ position: "absolute", bottom: -2, right: -2, width: size * 0.32, height: size * 0.32, borderRadius: "50%", background: STATUS_META[status]?.color ?? "#5A5866", border: "2.5px solid #111114" }} />}
    </div>
  );
}

/* ---------------------------------------------------------
   Modais
--------------------------------------------------------- */

function CreateServerModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onCreate(name.trim()); }} style={{ padding: 28, width: 380 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Criar servidor</div>
        <div style={{ fontSize: 13, color: "#8B8894", marginBottom: 20 }}>Um espaço só seu, pra chamar sua galera.</div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "linear-gradient(135deg, var(--accent), #1c1c22)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 22 }}>
            {name ? initials(name) : "?"}
          </div>
        </div>
        <Field label="Nome do servidor">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Oficina do Grupo" style={inputStyle} />
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{ ...secondaryBtn, flex: 1 }}>Cancelar</button>
          <button type="submit" style={{ ...primaryBtn, flex: 1, marginTop: 0 }}>Criar</button>
        </div>
      </form>
    </ModalShell>
  );
}

function JoinServerModal({ onClose, onJoin }) {
  const [id, setId] = useState("");
  return (
    <ModalShell onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (id.trim()) onJoin(id.trim()); }} style={{ padding: 28, width: 380 }}>
        <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Entrar em um servidor</div>
        <div style={{ fontSize: 13, color: "#8B8894", marginBottom: 20 }}>Cola o ID do servidor que seu amigo te mandou.</div>
        <Field label="ID do servidor">
          <input autoFocus value={id} onChange={(e) => setId(e.target.value)} placeholder="cole o ID aqui" style={inputStyle} />
        </Field>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onClose} style={{ ...secondaryBtn, flex: 1 }}>Cancelar</button>
          <button type="submit" style={{ ...primaryBtn, flex: 1, marginTop: 0 }}>Entrar</button>
        </div>
      </form>
    </ModalShell>
  );
}

function ProfileModal({ profile, onSave, onClose, onLogout }) {
  const [draft, setDraft] = useState({
    display_name: profile.display_name,
    bio: profile.bio ?? "",
    custom_status: profile.custom_status ?? "",
    status: profile.status,
    accent: profile.accent,
    avatar_color: profile.avatar_color,
    avatar_frame: profile.avatar_frame ?? "nenhuma",
    avatar_url: profile.avatar_url ?? "",
    custom_frame_url: profile.custom_frame_url ?? "",
    banner_from: profile.banner_from ?? profile.avatar_color,
    banner_to: profile.banner_to ?? "",
    banner_gif_url: profile.banner_gif_url ?? "",
    full_gradient: profile.full_gradient ?? false,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingFrame, setUploadingFrame] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function uploadTo(file, filename, maxMB) {
    if (file.size > maxMB * 1024 * 1024) { alert(`Arquivo muito grande (máx ${maxMB}MB).`); return null; }
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/${filename}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, cacheControl: "3600" });
    if (error) { alert("Não deu pra enviar: " + error.message); return null; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadTo(file, "avatar", 5);
    setUploading(false);
    if (url) setDraft((d) => ({ ...d, avatar_url: url }));
  }

  async function handleBannerFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    const url = await uploadTo(file, "banner", 8);
    setUploadingBanner(false);
    if (url) setDraft((d) => ({ ...d, banner_gif_url: url }));
  }

  async function handleFrameFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFrame(true);
    const url = await uploadTo(file, "frame", 3);
    setUploadingFrame(false);
    if (url) setDraft((d) => ({ ...d, custom_frame_url: url, avatar_frame: "personalizada" }));
  }

  const bannerCss = draft.banner_to
    ? `linear-gradient(120deg, ${draft.banner_from}, ${draft.banner_to})`
    : `linear-gradient(120deg, ${draft.banner_from}, #1c1c22 80%)`;
  const bannerBgStyle = draft.banner_gif_url
    ? { backgroundImage: `url(${draft.banner_gif_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: bannerCss };

  return (
    <ModalShell onClose={onClose}>
      <div style={{ width: 440, borderRadius: 16, overflow: "hidden", position: "relative", ...(draft.full_gradient ? bannerBgStyle : {}) }}>
        {draft.full_gradient && <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,13,0.6)" }} />}
        <div style={{ position: "relative" }}>
          <div style={{ height: 100, ...(!draft.full_gradient ? bannerBgStyle : {}) }} />
          <div style={{ padding: "0 24px 24px", marginTop: -34 }}>
            <Avatar color={draft.avatar_color} name={draft.display_name} status={draft.status} frame={draft.avatar_frame} avatarUrl={draft.avatar_url} customFrameUrl={draft.custom_frame_url} size={68} />
            <div style={{ fontSize: 11.5, color: "#5A5866", marginTop: 4 }}>@{profile.username}</div>

            <div style={{ marginTop: 14 }}>
              <Field label="Foto de perfil (imagem ou GIF, até 5MB)">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ ...secondaryBtn, display: "inline-block", cursor: "pointer", width: "auto", padding: "8px 14px" }}>
                    {uploading ? "Enviando..." : "Escolher arquivo"}
                    <input type="file" accept="image/*,.gif" onChange={handleFileChange} style={{ display: "none" }} disabled={uploading} />
                  </label>
                  {draft.avatar_url && (
                    <button type="button" onClick={() => setDraft((d) => ({ ...d, avatar_url: "" }))} style={{ ...secondaryBtn, width: "auto", padding: "8px 14px", color: "#FF5470" }}>Remover foto</button>
                  )}
                </div>
              </Field>
              <Field label="Nome de exibição">
                <input value={draft.display_name} onChange={(e) => setDraft({ ...draft, display_name: e.target.value })} style={inputStyle} />
              </Field>
              <Field label="Bio">
                <textarea value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} rows={2} style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }} />
              </Field>
              <Field label="Status personalizado">
                <input value={draft.custom_status} onChange={(e) => setDraft({ ...draft, custom_status: e.target.value })} placeholder="Jogando Roblox" style={inputStyle} />
              </Field>
              <Field label="Presença">
                <div style={{ display: "flex", gap: 8 }}>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <div key={key} onClick={() => setDraft({ ...draft, status: key })} style={{ flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: "pointer", background: draft.status === key ? "#1c1c22" : "transparent", border: `1px solid ${draft.status === key ? meta.color : "#2a2a32"}`, color: draft.status === key ? meta.color : "#8B8894" }}>{meta.label}</div>
                  ))}
                </div>
              </Field>
              <Field label="Cor de destaque">
                <div style={{ display: "flex", gap: 8 }}>
                  {Object.entries(ACCENTS).map(([key, a]) => (
                    <div key={key} onClick={() => setDraft({ ...draft, accent: key })} title={a.name} style={{ width: 30, height: 30, borderRadius: "50%", background: a.hex, cursor: "pointer", border: draft.accent === key ? "3px solid #F0EEF5" : "3px solid transparent" }} />
                  ))}
                </div>
              </Field>
              <Field label="Cor do avatar">
                <div style={{ display: "flex", gap: 8 }}>
                  {AVATAR_PALETTE.map((c) => (
                    <div key={c} onClick={() => setDraft({ ...draft, avatar_color: c })} style={{ width: 26, height: 26, borderRadius: "30%", background: c, cursor: "pointer", border: draft.avatar_color === c ? "3px solid #F0EEF5" : "3px solid transparent" }} />
                  ))}
                </div>
              </Field>
              <Field label="Moldura do avatar">
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {Object.entries(AVATAR_FRAMES).filter(([key]) => key !== "personalizada").map(([key, f]) => (
                    <div key={key} onClick={() => setDraft({ ...draft, avatar_frame: key })} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <div style={{ padding: 4, borderRadius: 12, background: draft.avatar_frame === key ? "var(--accent-soft)" : "transparent", border: `1px solid ${draft.avatar_frame === key ? "var(--accent)" : "transparent"}` }}>
                        <Avatar color={draft.avatar_color} name={draft.display_name} frame={key} avatarUrl={draft.avatar_url} size={34} />
                      </div>
                      <span style={{ fontSize: 10, color: "#8B8894" }}>{f.name}</span>
                    </div>
                  ))}
                </div>
              </Field>
              <Field label="Moldura personalizada (envie um PNG com buraco no meio)">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ ...secondaryBtn, display: "inline-block", cursor: "pointer", width: "auto", padding: "8px 14px" }}>
                    {uploadingFrame ? "Enviando..." : "Escolher imagem"}
                    <input type="file" accept="image/png" onChange={handleFrameFileChange} style={{ display: "none" }} disabled={uploadingFrame} />
                  </label>
                  {draft.custom_frame_url && (
                    <span onClick={() => setDraft((d) => ({ ...d, avatar_frame: "personalizada" }))} style={{ fontSize: 11, color: draft.avatar_frame === "personalizada" ? "#3DDC84" : "#8B8894", cursor: "pointer" }}>
                      {draft.avatar_frame === "personalizada" ? "✓ usando essa moldura" : "usar essa moldura"}
                    </span>
                  )}
                </div>
              </Field>
              <Field label="Banner — cor 1">
                <div style={{ display: "flex", gap: 8 }}>
                  {AVATAR_PALETTE.map((c) => (
                    <div key={c} onClick={() => setDraft({ ...draft, banner_from: c })} style={{ width: 26, height: 26, borderRadius: "30%", background: c, cursor: "pointer", border: draft.banner_from === c ? "3px solid #F0EEF5" : "3px solid transparent" }} />
                  ))}
                </div>
              </Field>
              <Field label="Banner — cor 2 (opcional, faz gradiente)">
                <div style={{ display: "flex", gap: 8 }}>
                  <div onClick={() => setDraft({ ...draft, banner_to: "" })} style={{ width: 26, height: 26, borderRadius: "30%", background: "#1c1c22", cursor: "pointer", border: !draft.banner_to ? "3px solid #F0EEF5" : "3px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✕</div>
                  {AVATAR_PALETTE.map((c) => (
                    <div key={c} onClick={() => setDraft({ ...draft, banner_to: c })} style={{ width: 26, height: 26, borderRadius: "30%", background: c, cursor: "pointer", border: draft.banner_to === c ? "3px solid #F0EEF5" : "3px solid transparent" }} />
                  ))}
                </div>
              </Field>
              <Field label="Banner — GIF ou imagem de fundo (substitui as cores)">
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <label style={{ ...secondaryBtn, display: "inline-block", cursor: "pointer", width: "auto", padding: "8px 14px" }}>
                    {uploadingBanner ? "Enviando..." : "Escolher GIF/imagem"}
                    <input type="file" accept="image/*,.gif" onChange={handleBannerFileChange} style={{ display: "none" }} disabled={uploadingBanner} />
                  </label>
                  {draft.banner_gif_url && (
                    <button type="button" onClick={() => setDraft((d) => ({ ...d, banner_gif_url: "" }))} style={{ ...secondaryBtn, width: "auto", padding: "8px 14px", color: "#FF5470" }}>Remover</button>
                  )}
                </div>
              </Field>
              <Field label="Aplicar o banner no card de perfil inteiro">
                <div onClick={() => setDraft((d) => ({ ...d, full_gradient: !d.full_gradient }))} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <div style={{ width: 38, height: 22, borderRadius: 12, background: draft.full_gradient ? "var(--accent)" : "#2a2a32", position: "relative", transition: "background 150ms" }}>
                    <div style={{ position: "absolute", top: 2, left: draft.full_gradient ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 150ms" }} />
                  </div>
                  <span style={{ fontSize: 12.5, color: "#8B8894" }}>{draft.full_gradient ? "Ativado" : "Desativado"}</span>
                </div>
              </Field>

              <button type="button" onClick={() => setShowPreview(true)} style={{ ...secondaryBtn, width: "100%", marginTop: 4 }}>👁 Ver como os outros veem</button>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button onClick={onLogout} style={{ ...secondaryBtn, flex: 1, color: "#FF5470", borderColor: "#3a1c22" }}>Sair da conta</button>
                <button onClick={() => onSave(draft)} style={{ ...primaryBtn, flex: 1, marginTop: 0 }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPreview && (
        <ModalShell onClose={() => setShowPreview(false)}>
          <ProfileCardBody data={{ ...draft, username: profile.username, status: draft.status || "online" }} />
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ fontSize: 11, color: "#5A5866", textAlign: "center", marginBottom: 8 }}>É assim que seu perfil aparece pros outros</div>
            <button type="button" onClick={() => setShowPreview(false)} style={{ ...secondaryBtn, width: "100%" }}>Fechar</button>
          </div>
        </ModalShell>
      )}
    </ModalShell>
  );
}

/* ---------------------------------------------------------
   Cartão de perfil (usado no popup de "ver perfil" e também
   no modo de pré-visualização dentro do editor de perfil)
--------------------------------------------------------- */

function ProfileCardBody({ data }) {
  const bannerCss = data.banner_to
    ? `linear-gradient(120deg, ${data.banner_from}, ${data.banner_to})`
    : `linear-gradient(120deg, ${data.banner_from || data.avatar_color}, #1c1c22 80%)`;
  const bannerStyle = data.banner_gif_url
    ? { backgroundImage: `url(${data.banner_gif_url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: bannerCss };

  return (
    <div style={{ width: 340, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ height: 90, ...bannerStyle }} />
      <div style={{ padding: "0 20px 20px", marginTop: -32 }}>
        <Avatar color={data.avatar_color} name={data.display_name} status={data.status} frame={data.avatar_frame} avatarUrl={data.avatar_url} customFrameUrl={data.custom_frame_url} size={64} />
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>{data.display_name}</div>
          <div style={{ fontSize: 12.5, color: "#8B8894" }}>@{data.username}</div>
        </div>
        {data.custom_status && (
          <div style={{ marginTop: 10, fontSize: 12.5, color: STATUS_META[data.status]?.color ?? "#8B8894", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_META[data.status]?.color ?? "#5A5866", display: "inline-block" }} />
            {data.custom_status}
          </div>
        )}
        {data.bio && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #26242c", fontSize: 13, color: "#DFDCE6", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
            {data.bio}
          </div>
        )}
      </div>
    </div>
  );
}

function UserProfileModal({ userId, onClose, isFriend, isPending, onAddFriend }) {
  const [data, setData] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.from("profiles").select("*").eq("id", userId).single().then(({ data, error }) => {
      if (active && !error) setData(data);
    });
    return () => { active = false; };
  }, [userId]);

  async function handleAdd() {
    if (!data) return;
    setSending(true);
    await onAddFriend(data.username);
    setSending(false);
    setSent(true);
  }

  return (
    <ModalShell onClose={onClose}>
      {!data ? (
        <div style={{ width: 340, padding: 40, textAlign: "center", color: "#8B8894", fontSize: 13 }}>Carregando perfil...</div>
      ) : (
        <div>
          <ProfileCardBody data={data} />
          <div style={{ padding: "0 20px 20px" }}>
            {isFriend ? (
              <div style={{ ...secondaryBtn, width: "100%", textAlign: "center", cursor: "default", color: "#3DDC84", borderColor: "#1e3a2a" }}>✓ Vocês já são amigos</div>
            ) : isPending || sent ? (
              <div style={{ ...secondaryBtn, width: "100%", textAlign: "center", cursor: "default" }}>Pedido de amizade enviado</div>
            ) : (
              <button onClick={handleAdd} disabled={sending} style={{ ...primaryBtn, marginTop: 0, opacity: sending ? 0.6 : 1 }}>
                {sending ? "Enviando..." : "Adicionar amigo"}
              </button>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  );
}

function ModalShell({ children, onClose }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,5,7,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#141418", border: "1px solid #26242c", borderRadius: 16, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 30px 70px -25px rgba(0,0,0,0.7)" }}>
        {children}
      </div>
    </div>
  );
}
