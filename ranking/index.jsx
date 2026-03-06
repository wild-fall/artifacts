import { useState, useEffect, useRef } from "react";

const CONFETTI_COLORS = ["#38BDF8","#FB7185","#34D399","#FBBF24","#A78BFA","#F472B6","#60A5FA"];
function makeConfetti(n = 100) {
  return Array.from({ length: n }, (_, i) => ({
    id: i, x: Math.random() * 100,
    size: 6 + Math.random() * 10,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: Math.random() * 1.5, duration: 2 + Math.random() * 2,
    rotate: Math.random() * 720, shape: Math.random() > 0.5 ? "circle" : "rect",
  }));
}

const RANK_META = {
  3: { label:"3rd", gradient:"linear-gradient(135deg,#E8B96A,#C8922A)", glow:"#E8B96A", icon:"fa-solid fa-medal",  iconColor:"#fff", textColor:"#5a3a00" },
  2: { label:"2nd", gradient:"linear-gradient(135deg,#D0D8E8,#9BADC8)", glow:"#B0BDD0", icon:"fa-solid fa-medal",  iconColor:"#fff", textColor:"#2a3a50" },
  1: { label:"1st", gradient:"linear-gradient(135deg,#FFD84D,#FFB300)", glow:"#FFD84D", icon:"fa-solid fa-trophy", iconColor:"#fff", textColor:"#3a2000" },
};

const RANK_ORDER = [1, 2, 3];
function rankVisible(rank, rc) {
  if (rank === 3) return rc >= 1;
  if (rank === 2) return rc >= 2;
  if (rank === 1) return rc >= 3;
  return false;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return {};
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const result = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 2) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] || ""; });
    const topic  = row["お題"]   || row["topic"]   || "";
    const rank   = parseInt(row["順位"]  || row["rank"]  || "");
    const person = row["対象者"] || row["name"]    || "";
    const detail = row["内容"]   || row["content"] || "";
    if (!topic || isNaN(rank)) continue;
    if (!result[topic]) result[topic] = {};
    result[topic][rank] = { person, detail };
  }
  return result;
}

const CARD_COLORS = ["#38BDF8","#34D399","#A78BFA","#FB923C","#F472B6","#FBBF24"];
const TOPIC_ICONS = ["fa-solid fa-bullseye","fa-solid fa-star","fa-solid fa-music","fa-solid fa-fire","fa-solid fa-bolt","fa-solid fa-palette","fa-solid fa-crown","fa-solid fa-gamepad","fa-solid fa-microphone","fa-solid fa-film","fa-solid fa-dice","fa-solid fa-dragon"];

const CSS = `
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css');
  @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@700;900&family=Rampart+One&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:#EFF6FF; overflow-x:hidden; }

  @keyframes fadeUp    { from{opacity:0;transform:translateY(24px) scale(0.95)} to{opacity:1;transform:none} }
  @keyframes shimmer   { from{background-position:200% center} to{background-position:-200% center} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes spin-in   { from{transform:rotateY(90deg) scale(0.8);opacity:0} to{transform:none;opacity:1} }
  @keyframes shake     { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-4deg)} 75%{transform:rotate(4deg)} }
  @keyframes glow-pulse{ 0%,100%{box-shadow:0 4px 24px var(--glow,#FFD84D66)} 50%{box-shadow:0 8px 48px var(--glow,#FFD84D99),0 0 80px var(--glow,#FFD84D44)} }
  @keyframes drop      { 0%{transform:translateY(-20px) rotate(0);opacity:1} 100%{transform:translateY(110vh) rotate(var(--r,360deg));opacity:0} }
  @keyframes blink     { 0%,80%,100%{opacity:0.2} 40%{opacity:0.7} }
  @keyframes mvp-bg-in { from{opacity:0} to{opacity:1} }
  @keyframes mvp-zoom  { 0%{transform:scale(0.3) rotate(-8deg);opacity:0} 60%{transform:scale(1.06) rotate(2deg)} 80%{transform:scale(0.97)} 100%{transform:scale(1);opacity:1} }
  @keyframes mvp-title { 0%{letter-spacing:0.5em;opacity:0;transform:translateY(-20px)} 100%{letter-spacing:0.12em;opacity:1;transform:none} }
  @keyframes mvp-slide { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:none} }
  @keyframes star-orbit{ from{transform:rotate(0deg) translateX(150px) rotate(0deg)} to{transform:rotate(360deg) translateX(150px) rotate(-360deg)} }
  @keyframes ray-spin  { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
  @keyframes mvp-name  { 0%{opacity:0;transform:scale(0.5)} 70%{transform:scale(1.05)} 100%{opacity:1;transform:scale(1)} }
  @keyframes crown-drop{ 0%{opacity:0;transform:translateY(-50px) scale(1.4)} 60%{transform:translateY(5px) scale(0.96)} 100%{opacity:1;transform:none} }

  .spin-in { animation:spin-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .topic-card { cursor:pointer; transition:transform 0.22s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.22s ease; }
  .topic-card:hover { transform:translateY(-6px) scale(1.03); box-shadow:0 12px 32px rgba(56,189,248,0.2) !important; }
  .btn { cursor:pointer; border:none; font-family:inherit; transition:transform 0.15s ease,filter 0.15s ease; }
  .btn:hover { transform:translateY(-2px) scale(1.04); filter:brightness(1.06); }
  .btn:active { transform:scale(0.96); }
`;

function BgBlobs() {
  return (
    <>
      {[{c:"#BAE6FD",t:"8%", l:"-6%",s:320},{c:"#E0F2FE",t:"50%",l:"68%",s:280},
        {c:"#F0F9FF",t:"28%",l:"40%",s:200},{c:"#DBEAFE",t:"72%",l:"-4%",s:250}
      ].map((b,i) => (
        <div key={i} style={{ position:"fixed", borderRadius:"50%", pointerEvents:"none", zIndex:0, width:b.s, height:b.s, background:`radial-gradient(circle,${b.c},transparent 70%)`, top:b.t, left:b.l, animation:`float ${5+i}s ease-in-out ${i*0.7}s infinite` }} />
      ))}
    </>
  );
}

export default function App() {
  const [screen, setScreen]           = useState("upload");
  const [rankingData, setRankingData] = useState({});
  const [topics, setTopics]           = useState([]);
  const [topic, setTopic]             = useState("");
  const [revealCount, setRevealCount] = useState(0);
  const [busy, setBusy]               = useState(false);
  const [confetti, setConfetti]       = useState([]);
  const [dragOver, setDragOver]       = useState(false);
  const [showTitle, setShowTitle]     = useState("");
  const [doneTopics, setDoneTopics]   = useState(new Set());
  const [showMVP, setShowMVP]         = useState(false);
  const [showOverall, setShowOverall] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      const keys = Object.keys(parsed);
      if (keys.length === 0) return alert("No valid data found in CSV.");
      setRankingData(parsed); setTopics(keys);
      setDoneTopics(new Set()); setShowMVP(false); setShowOverall(false);
      setScreen("topics");
    };
    reader.readAsText(file, "UTF-8");
  }

  function startReveal(t) { setTopic(t); setRevealCount(0); setConfetti([]); setScreen("reveal"); }

  function revealNext() {
    if (busy || revealCount >= 3) return;
    setBusy(true);
    setTimeout(() => {
      setRevealCount(prev => {
        const next = prev + 1;
        if (next === 3) { setConfetti(makeConfetti(120)); setTimeout(() => setConfetti([]), 5500); }
        return next;
      });
      setBusy(false);
    }, 150);
  }

  function backToTopics() {
    if (revealCount === 3) {
      const newDone = new Set([...doneTopics, topic]);
      setDoneTopics(newDone); setRevealCount(0); setConfetti([]); setScreen("topics");
      if (newDone.size >= topics.length && topics.length > 0)
        setTimeout(() => setShowMVP(true), 400);
    } else {
      setRevealCount(0); setConfetti([]); setScreen("topics");
    }
  }

  function calcScores(fromTopics) {
    const pts = {1:3,2:2,3:1};
    const scores = {};
    fromTopics.forEach(t => {
      const data = rankingData[t] || {};
      [1,2,3].forEach(r => { if (data[r]?.person) scores[data[r].person] = (scores[data[r].person]||0) + (pts[r]||0); });
    });
    const sorted = Object.entries(scores).sort((a,b) => b[1]-a[1]);
    const ranked = []; let cur = 1;
    sorted.forEach(([name,score],i) => {
      if (i>0 && score<sorted[i-1][1]) cur = i+1;
      ranked.push({name,score,rank:cur});
    });
    return ranked;
  }

  const current = rankingData[topic] || {};
  const allDone = revealCount === 3;
  const allTopicsDone = doneTopics.size >= topics.length && topics.length > 0;
  const NEXT_BTN = [{label:"Start from 3rd place!",gold:false},{label:"Reveal 2nd place!",gold:false},{label:"🏆  And the winner is...  🏆",gold:true}][revealCount];

  // ── Shared card shadow/style ──
  const card = { background:"#fff", border:"1px solid #E2E8F0", borderRadius:18, boxShadow:"0 4px 16px rgba(0,0,0,0.06)" };

  // ═══════════════════════════════════════════════════════════════════════════
  // UPLOAD
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "upload") return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#EFF6FF,#F0F9FF,#E0F2FE)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"'Zen Maru Gothic',sans-serif", position:"relative", overflow:"hidden" }}>
      <BgBlobs />
      <div style={{ position:"relative", zIndex:1, width:"100%", maxWidth:480, animation:"fadeUp 0.6s ease" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <i className="fa-solid fa-trophy" style={{ fontSize:52, color:"#F59E0B", display:"block", marginBottom:8, filter:"drop-shadow(0 4px 12px rgba(245,158,11,0.3))", animation:"float 3s ease-in-out infinite" }} />
          <h1 style={{ fontFamily:"'Rampart One',cursive", fontSize:"clamp(26px,7vw,48px)", background:"linear-gradient(135deg,#0EA5E9,#6366F1,#EC4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundSize:"200%", animation:"shimmer 3s linear infinite", lineHeight:1.2 }}>
            RANKING SHOW
          </h1>
          <p style={{ color:"#94A3B8", fontSize:13, marginTop:6 }}>Upload your CSV to get started</p>
        </div>

        <div style={{ marginBottom:14 }}>
          <p style={{ color:"#64748B", fontSize:11, fontWeight:700, letterSpacing:2, marginBottom:6 }}>🏷️ SHOW TITLE</p>
          <input type="text" value={showTitle} onChange={e => setShowTitle(e.target.value)}
            placeholder="e.g. 2024 年末大賞ランキング"
            style={{ width:"100%", ...card, borderRadius:12, padding:"11px 16px", color:"#1E293B", fontSize:15, fontFamily:"'Zen Maru Gothic',sans-serif", outline:"none", transition:"border-color 0.2s" }}
            onFocus={e => e.target.style.borderColor="#38BDF8"}
            onBlur={e => e.target.style.borderColor="#E2E8F0"}
          />
        </div>

        <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
          onClick={()=>fileRef.current.click()}
          style={{ border:`2px dashed ${dragOver?"#38BDF8":"#CBD5E1"}`, borderRadius:20, padding:"40px 28px", cursor:"pointer", background:dragOver?"rgba(56,189,248,0.06)":"rgba(255,255,255,0.7)", textAlign:"center", transition:"all 0.25s ease", boxShadow:"0 2px 12px rgba(0,0,0,0.04)" }}>
          <i className={dragOver?"fa-solid fa-folder-open":"fa-solid fa-folder"} style={{ fontSize:44, color:dragOver?"#38BDF8":"#94A3B8", display:"block", marginBottom:12 }} />
          <p style={{ color:"#334155", fontSize:16, fontWeight:700, marginBottom:4 }}>Drag & Drop</p>
          <p style={{ color:"#94A3B8", fontSize:13 }}>or click to select a CSV file</p>
          <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={e=>handleFile(e.target.files[0])} />
        </div>

        <div style={{ marginTop:20, ...card, borderRadius:14, padding:16 }}>
          <p style={{ color:"#F59E0B", fontSize:11, fontWeight:700, letterSpacing:2, marginBottom:8 }}>📋 CSV FORMAT</p>
          <div style={{ fontFamily:"monospace", fontSize:12, background:"#F8FAFC", borderRadius:8, padding:10, border:"1px solid #E2E8F0" }}>
            <div style={{ color:"#6366F1" }}>お題,順位,対象者,内容</div>
            <div style={{ color:"#059669" }}>背の高い人,1,山田太郎,204cm</div>
            <div style={{ color:"#059669" }}>背の高い人,2,鈴木次郎,199cm</div>
            <div style={{ color:"#059669" }}>背の高い人,3,田中花子,178cm</div>
          </div>
          <p style={{ color:"#94A3B8", fontSize:11, marginTop:8 }}>* Ranks: 1, 2, 3 only. Missing ranks show "N/A".</p>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TOPICS
  // ═══════════════════════════════════════════════════════════════════════════
  if (screen === "topics") return (
    <>
      <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#EFF6FF,#F0F9FF,#E0F2FE)", padding:"32px 24px", fontFamily:"'Zen Maru Gothic',sans-serif", position:"relative", overflow:"hidden" }}>
        <BgBlobs />
        <div style={{ maxWidth:780, margin:"0 auto", position:"relative", zIndex:1 }}>

          <div style={{ textAlign:"center", marginBottom:32, animation:"fadeUp 0.5s ease" }}>
            {showTitle && <p style={{ color:"#0EA5E9", fontSize:13, fontWeight:700, letterSpacing:2, marginBottom:6 }}>🏆 {showTitle}</p>}
            <i className="fa-solid fa-list-ol" style={{ fontSize:34, color:"#38BDF8", display:"block", marginBottom:6 }} />
            <h2 style={{ fontFamily:"'Rampart One',cursive", fontSize:"clamp(22px,5vw,38px)", background:"linear-gradient(135deg,#0EA5E9,#6366F1)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", marginBottom:4 }}>
              Choose a Topic
            </h2>
            <p style={{ color:"#94A3B8", fontSize:13 }}>Tap to start the ranking reveal</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:12, marginBottom:28 }}>
            {topics.map((t, i) => {
              const done = doneTopics.has(t);
              return (
                <div key={t} className={done?"":"topic-card"} onClick={()=>!done&&startReveal(t)}
                  style={{ ...card, border: done?"1px solid #F1F5F9":`2px solid ${CARD_COLORS[i%6]}55`, borderRadius:18, padding:"20px 16px", textAlign:"center", opacity:done?0.5:1, cursor:done?"default":"pointer", position:"relative", animation:`fadeUp 0.5s ease ${i*0.06}s both`, background:done?"#FAFAFA":"#fff" }}>
                  <i className={TOPIC_ICONS[i%TOPIC_ICONS.length]} style={{ fontSize:26, color:done?"#CBD5E1":CARD_COLORS[i%6], marginBottom:8, display:"block" }} />
                  <p style={{ color:done?"#94A3B8":"#1E293B", fontSize:14, fontWeight:700, lineHeight:1.4 }}>{t}</p>
                  {done && (
                    <div style={{ position:"absolute", top:8, right:9, display:"flex", alignItems:"center", gap:3 }}>
                      <i className="fa-solid fa-circle-check" style={{ fontSize:12, color:"#34D399" }} />
                      <span style={{ fontSize:10, color:"#34D399", fontWeight:700 }}>Done</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {doneTopics.size > 0 && (
            <div style={{ textAlign:"center", marginBottom:showOverall?20:28 }}>
              <button className="btn" onClick={()=>setShowOverall(v=>!v)} style={{
                background: allTopicsDone?"linear-gradient(135deg,#F59E0B,#F97316)":"linear-gradient(135deg,#6366F1,#8B5CF6)",
                color:"#fff", borderRadius:50, fontWeight:900, padding:"11px 30px", fontSize:14,
                boxShadow: allTopicsDone?"0 4px 20px rgba(245,158,11,0.35)":"0 4px 20px rgba(99,102,241,0.35)",
                display:"inline-flex", alignItems:"center", gap:9,
              }}>
                <i className={allTopicsDone?"fa-solid fa-ranking-star":"fa-solid fa-chart-bar"} />
                {allTopicsDone?"Final Results":"Interim Results"}
                <i className={`fa-solid fa-chevron-${showOverall?"up":"down"}`} style={{ fontSize:11 }} />
              </button>
            </div>
          )}

          {showOverall && (() => {
            const ranked = calcScores([...doneTopics]);
            if (ranked.length === 0) return null;
            const om = { 1:{bg:"linear-gradient(135deg,#FFD84D,#FFB300)",icon:"fa-solid fa-trophy",tc:"#3a2000"}, 2:{bg:"linear-gradient(135deg,#D0D8E8,#9BADC8)",icon:"fa-solid fa-medal",tc:"#2a3a50"}, 3:{bg:"linear-gradient(135deg,#E8B96A,#C8922A)",icon:"fa-solid fa-medal",tc:"#5a3a00"} };
            return (
              <div style={{ marginBottom:28, animation:"fadeUp 0.5s ease" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <i className="fa-solid fa-ranking-star" style={{ fontSize:16, color:"#F59E0B" }} />
                  <span style={{ color:"#334155", fontSize:13, fontWeight:700, letterSpacing:2 }}>OVERALL RANKING</span>
                  <span style={{ color:"#94A3B8", fontSize:11 }}>— {doneTopics.size} topic{doneTopics.size>1?"s":""} counted</span>
                </div>
                <div style={{ ...card, borderRadius:18, overflow:"hidden" }}>
                  {ranked.map(({name,score,rank},i) => {
                    const m = om[rank]||{bg:"#F8FAFC",icon:"fa-solid fa-circle",tc:"#475569"};
                    const isTop = rank===1;
                    return (
                      <div key={name} style={{ display:"flex", alignItems:"center", gap:14, padding:isTop?"14px 18px":"11px 18px", background:isTop?m.bg:i%2===0?"#F8FAFC":"#fff", borderBottom:i<ranked.length-1?"1px solid #F1F5F9":"none" }}>
                        <div style={{ minWidth:36, textAlign:"center" }}>
                          {rank<=3 ? <i className={m.icon} style={{ fontSize:isTop?22:17, color:isTop?"rgba(90,56,0,0.55)":m.tc }} /> : <span style={{ color:"#94A3B8", fontSize:13, fontWeight:700 }}>{rank}</span>}
                        </div>
                        <div style={{ flex:1, color:isTop?m.tc:"#334155", fontSize:isTop?16:14, fontWeight:isTop?900:700 }}>{name}</div>
                        <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
                          <span style={{ color:isTop?m.tc:"#F59E0B", fontSize:isTop?20:16, fontWeight:900 }}>{score}</span>
                          <span style={{ color:"#94A3B8", fontSize:10, fontWeight:700 }}>pt</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:6, display:"flex", gap:16, justifyContent:"flex-end" }}>
                  {[["1st","3pt"],["2nd","2pt"],["3rd","1pt"]].map(([l,p])=><span key={l} style={{ color:"#CBD5E1", fontSize:11 }}>{l} = {p}</span>)}
                </div>
              </div>
            );
          })()}

          <div style={{ textAlign:"center" }}>
            <button className="btn" onClick={()=>setScreen("upload")} style={{ ...card, color:"#64748B", borderRadius:50, padding:"8px 24px", fontSize:13 }}>
              ← Change CSV
            </button>
          </div>
        </div>
      </div>

      {/* MVP OVERLAY */}
      {showMVP && (() => {
        const ranked = calcScores([...doneTopics]);
        const mvpName = ranked[0]?.name||"—";
        const mvpPts  = ranked[0]?.score||0;
        return (
          <div style={{ position:"fixed", inset:0, zIndex:10000, background:"rgba(14,30,60,0.7)", backdropFilter:"blur(14px)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", animation:"mvp-bg-in 0.5s ease forwards" }}>
            <div style={{ position:"absolute", top:"50%", left:"50%", width:700, height:700, background:"repeating-conic-gradient(rgba(56,189,248,0.05) 0deg 10deg,transparent 10deg 20deg)", borderRadius:"50%", animation:"ray-spin 18s linear infinite", pointerEvents:"none" }} />
            {[0,60,120,180,240,300].map((deg,i)=>(
              <div key={i} style={{ position:"absolute", top:"50%", left:"50%", width:14, height:14, animation:`star-orbit ${3+i*0.3}s linear ${i*0.4}s infinite`, transformOrigin:"0 0", transform:`rotate(${deg}deg) translateX(150px)` }}>
                <i className="fa-solid fa-star" style={{ fontSize:12, color:["#F59E0B","#38BDF8","#34D399","#A78BFA","#FB923C","#F472B6"][i] }} />
              </div>
            ))}
            <div style={{ position:"relative", zIndex:1, textAlign:"center", padding:"48px 52px", background:"linear-gradient(160deg,rgba(255,255,255,0.97),rgba(240,249,255,0.97))", border:"2px solid rgba(56,189,248,0.25)", borderRadius:32, boxShadow:"0 24px 80px rgba(14,30,60,0.2),0 0 60px rgba(56,189,248,0.15)", animation:"mvp-zoom 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s both", maxWidth:460, width:"90%" }}>
              <i className="fa-solid fa-crown" style={{ fontSize:60, color:"#F59E0B", filter:"drop-shadow(0 4px 16px rgba(245,158,11,0.45))", display:"block", marginBottom:16, animation:"crown-drop 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.6s both" }} />
              <div style={{ fontFamily:"'Rampart One',cursive", fontSize:"clamp(12px,3.5vw,20px)", color:"#0EA5E9", letterSpacing:"0.12em", animation:"mvp-title 0.9s ease 1.0s both", marginBottom:10 }}>CONGRATULATIONS</div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:50, padding:"4px 18px", marginBottom:20, animation:"mvp-slide 0.6s ease 1.3s both" }}>
                <i className="fa-solid fa-trophy" style={{ fontSize:12, color:"#F59E0B" }} />
                <span style={{ color:"#D97706", fontSize:12, fontWeight:700, letterSpacing:3 }}>MVP</span>
              </div>
              <div style={{ fontFamily:"'Rampart One',cursive", fontSize:"clamp(26px,7vw,50px)", background:"linear-gradient(135deg,#F59E0B,#F97316,#FBBF24)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundSize:"200%", lineHeight:1.15, marginBottom:12, animation:"mvp-name 0.7s cubic-bezier(0.34,1.56,0.64,1) 1.5s both,shimmer 3s linear 2s infinite" }}>
                {mvpName}
              </div>
              <div style={{ color:"#94A3B8", fontSize:14, fontWeight:700, marginBottom:32, animation:"mvp-slide 0.6s ease 1.8s both" }}>
                Total <span style={{ color:"#F59E0B", fontSize:20, fontWeight:900 }}>{mvpPts}</span> pt
              </div>
              <button className="btn" onClick={()=>setShowMVP(false)} style={{ background:"linear-gradient(135deg,#38BDF8,#6366F1)", color:"#fff", borderRadius:50, padding:"12px 36px", fontSize:14, fontWeight:900, boxShadow:"0 6px 24px rgba(56,189,248,0.35)", animation:"mvp-slide 0.6s ease 2.1s both" }}>
                <i className="fa-solid fa-check" style={{ marginRight:7 }} />Close
              </button>
            </div>
            {makeConfetti(160).map(p=>(
              <div key={p.id} style={{ position:"fixed", top:"-20px", left:`${p.x}%`, width:p.shape==="circle"?p.size:p.size*0.65, height:p.size, borderRadius:p.shape==="circle"?"50%":"2px", background:p.color, pointerEvents:"none", animation:`drop ${p.duration}s ${p.delay}s ease-in forwards`, "--r":`${p.rotate}deg` }} />
            ))}
          </div>
        );
      })()}
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // REVEAL
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#EFF6FF,#F0F9FF,#E0F2FE)", padding:"24px", fontFamily:"'Zen Maru Gothic',sans-serif", position:"relative", overflow:"hidden" }}>
      <BgBlobs />
      {confetti.map(p=>(
        <div key={p.id} style={{ position:"fixed", top:"-20px", left:`${p.x}%`, width:p.shape==="circle"?p.size:p.size*0.65, height:p.size, borderRadius:p.shape==="circle"?"50%":"2px", background:p.color, pointerEvents:"none", zIndex:9999, animation:`drop ${p.duration}s ${p.delay}s ease-in forwards`, "--r":`${p.rotate}deg` }} />
      ))}

      <div style={{ maxWidth:640, margin:"0 auto", position:"relative", zIndex:1 }}>
        <div style={{ marginBottom:18 }}>
          <button className="btn" onClick={backToTopics} style={{ ...card, color:"#64748B", borderRadius:50, padding:"7px 20px", fontSize:12 }}>
            ← Back to Topics
          </button>
        </div>

        <div style={{ textAlign:"center", marginBottom:24, animation:"fadeUp 0.5s ease" }}>
          {showTitle && <p style={{ color:"#0EA5E9", fontSize:12, fontWeight:700, letterSpacing:2, marginBottom:6 }}>🏆 {showTitle}</p>}
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.25)", borderRadius:50, padding:"4px 16px", marginBottom:10 }}>
            <i className="fa-solid fa-bullseye" style={{ fontSize:12, color:"#38BDF8" }} />
            <span style={{ color:"#0EA5E9", fontSize:11, fontWeight:700, letterSpacing:2 }}>TOPIC</span>
          </div>
          <h2 style={{ fontFamily:"'Rampart One',cursive", fontSize:"clamp(20px,5vw,42px)", background:"linear-gradient(135deg,#0EA5E9,#6366F1)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1.3 }}>
            {topic}
          </h2>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:28 }}>
          {RANK_ORDER.map(rank => {
            const visible = rankVisible(rank, revealCount);
            const entry = current[rank];
            const meta  = RANK_META[rank];
            const isFirst = rank === 1;
            return (
              <div key={rank} className={visible?"spin-in":""} style={{ opacity:visible?1:0 }}>
                {visible ? (
                  <div style={{ background:meta.gradient, borderRadius:20, padding:isFirst?"22px 20px":"16px 20px", border:`2px solid ${meta.glow}66`, "--glow":`${meta.glow}88`, animation:isFirst?"glow-pulse 2s ease-in-out infinite":undefined, boxShadow:isFirst?`0 8px 32px ${meta.glow}55`:`0 4px 16px ${meta.glow}33`, display:"flex", alignItems:"center", gap:16, transform:isFirst?"scale(1.02)":undefined }}>
                    <div style={{ textAlign:"center", minWidth:56 }}>
                      <i className={meta.icon} style={{ fontSize:isFirst?38:28, color:meta.iconColor, filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.15))" }} />
                      <div style={{ color:`${meta.textColor}99`, fontSize:10, fontWeight:700, marginTop:3 }}>{meta.label}</div>
                    </div>
                    <div style={{ width:2, height:54, background:`${meta.textColor}22`, borderRadius:4, flexShrink:0 }} />
                    {entry ? (
                      <div style={{ flex:1 }}>
                        <div style={{ color:meta.textColor, fontSize:isFirst?24:19, fontWeight:900, lineHeight:1.2 }}>{entry.person}</div>
                        {entry.detail && <div style={{ color:meta.textColor, fontSize:isFirst?21:17, fontWeight:900, marginTop:3, opacity:0.75, lineHeight:1.2 }}>{entry.detail}</div>}
                      </div>
                    ) : (
                      <div style={{ flex:1, color:`${meta.textColor}55`, fontSize:13, fontWeight:700 }}>— N/A —</div>
                    )}
                    {isFirst && <i className="fa-solid fa-star" style={{ fontSize:22, color:"rgba(255,255,255,0.8)", animation:"shake 1.2s ease-in-out infinite" }} />}
                  </div>
                ) : (
                  <div style={{ ...card, borderRadius:20, padding:"16px 20px", display:"flex", alignItems:"center", gap:16, border:"2px dashed #E2E8F0" }}>
                    <div style={{ textAlign:"center", minWidth:56 }}>
                      <i className={meta.icon} style={{ fontSize:28, color:"#E2E8F0" }} />
                      <div style={{ color:"#CBD5E1", fontSize:10, fontWeight:700, marginTop:3 }}>{meta.label}</div>
                    </div>
                    <div style={{ width:2, height:52, background:"#F1F5F9", borderRadius:4 }} />
                    <div style={{ display:"flex", gap:6 }}>
                      {[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#CBD5E1", animation:`blink 1.4s ${i*0.22}s ease-in-out infinite` }} />)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign:"center" }}>
          {!allDone ? (
            <button className="btn" onClick={revealNext} disabled={busy} style={{
              background: NEXT_BTN.gold?"linear-gradient(135deg,#FFD84D,#F97316)":"linear-gradient(135deg,#38BDF8,#6366F1)",
              color: NEXT_BTN.gold?"#3a1800":"#fff", borderRadius:50, fontWeight:900,
              padding: NEXT_BTN.gold?"17px 50px":"13px 42px",
              fontSize: NEXT_BTN.gold?16:15,
              boxShadow: NEXT_BTN.gold?"0 8px 30px rgba(249,115,22,0.35)":"0 8px 30px rgba(56,189,248,0.35)",
              "--glow": NEXT_BTN.gold?"#FFD84D88":"#38BDF888",
              animation: NEXT_BTN.gold?"glow-pulse 1.4s ease-in-out infinite,float 2s ease-in-out infinite":"float 2s ease-in-out infinite",
              letterSpacing: NEXT_BTN.gold?1:0,
            }}>{NEXT_BTN.label}</button>
          ) : (
            <div style={{ animation:"fadeUp 0.6s ease" }}>
              <i className="fa-solid fa-star" style={{ fontSize:44, color:"#F59E0B", display:"block", marginBottom:10, animation:"float 1.5s ease-in-out infinite", filter:"drop-shadow(0 4px 12px rgba(245,158,11,0.35))" }} />
              <p style={{ color:"#0EA5E9", fontSize:20, fontWeight:900, marginBottom:16, fontFamily:"'Rampart One',cursive", letterSpacing:2 }}>Complete!</p>
              <button className="btn" onClick={backToTopics} style={{ background:"linear-gradient(135deg,#34D399,#059669)", color:"#fff", borderRadius:50, padding:"12px 34px", fontSize:14, fontWeight:700, boxShadow:"0 6px 22px rgba(52,211,153,0.35)" }}>
                Try another topic
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}