import { useState, useRef, useEffect, useCallback } from “react”;

// ── Joint definitions ──────────────────────────────────────────
const JOINTS = [
{ id: “lShoulder”, label: “左肩”,     color: “#ff7b7b” },
{ id: “rShoulder”, label: “右肩”,     color: “#ff9b9b” },
{ id: “lElbow”,    label: “左肘”,     color: “#ffb347” },
{ id: “rElbow”,    label: “右肘”,     color: “#ffc870” },
{ id: “lHip”,      label: “左股関節”, color: “#6ee87a” },
{ id: “rHip”,      label: “右股関節”, color: “#98f0a0” },
{ id: “lKnee”,     label: “左膝”,     color: “#74aaff” },
{ id: “rKnee”,     label: “右膝”,     color: “#99c2ff” },
];

// ── Face direction ─────────────────────────────────────────────
const FACE_CYCLE = [“front”, “up”, “down”, “left”, “right”];
const FACE_ICON  = { front: “●”, up: “↑”, down: “↓”, left: “←”, right: “→” };
const FACE_LABEL = { front: “正面”, up: “上”, down: “下”, left: “左”, right: “右” };

const ZERO = { …Object.fromEntries(JOINTS.map(j => [j.id, 0])), face: “front” };

function lerp(a, b, t) { return a + (b - a) * t; }

function blendBeats(b1, b2, t) {
const out = Object.fromEntries(JOINTS.map(j => [j.id, lerp(b1[j.id]??0, b2[j.id]??0, t)]));
out.face = b1.face ?? “front”; // snap — no interpolation for face direction
return out;
}

// ── Face drawing ───────────────────────────────────────────────
function drawFace(ctx, hcx, hcy, HR, dir) {
ctx.save();
ctx.shadowColor = “#00ffaa”; ctx.shadowBlur = 5;
ctx.strokeStyle = “#00ffaa”; ctx.fillStyle = “#00ffaa”;
ctx.lineWidth = 1.8; ctx.lineCap = “round”;

const eye = (dx, dy) => {
ctx.beginPath(); ctx.arc(hcx+dx, hcy+dy, 2.4, 0, Math.PI*2); ctx.fill();
};

switch (dir) {
case “front”:
eye(-6.5, -5); eye(+6.5, -5);
ctx.beginPath(); ctx.arc(hcx, hcy+1, 1.2, 0, Math.PI*2); ctx.fill(); // nose
ctx.beginPath(); ctx.arc(hcx, hcy+2, 6, 0.18*Math.PI, 0.82*Math.PI); ctx.stroke(); // smile
break;

```
case "up":
  eye(-5.5, -12); eye(+5.5, -12);
  ctx.beginPath(); ctx.moveTo(hcx-2, hcy-6); ctx.lineTo(hcx+2, hcy-6); ctx.stroke(); // nose
  ctx.beginPath(); ctx.arc(hcx, hcy-2, 4, 0.15*Math.PI, 0.85*Math.PI); ctx.stroke(); // mouth
  break;

case "down":
  eye(-5.5, +7); eye(+5.5, +7);
  ctx.beginPath(); ctx.moveTo(hcx, hcy-HR+4); ctx.lineTo(hcx, hcy+2); ctx.stroke(); // nose bridge
  break;

case "left": {
  eye(-9, -5);
  const nx = hcx - HR + 2;
  ctx.beginPath();
  ctx.moveTo(hcx-4, hcy+1); ctx.quadraticCurveTo(nx-2, hcy+2, nx, hcy+6); ctx.stroke(); // nose
  ctx.beginPath(); ctx.moveTo(nx+3, hcy+10); ctx.lineTo(hcx-6, hcy+10); ctx.stroke(); // mouth
  ctx.beginPath(); ctx.arc(hcx+HR-1, hcy, 3, -0.4*Math.PI, 0.4*Math.PI); ctx.stroke(); // ear
  break;
}

case "right": {
  eye(+9, -5);
  const nx = hcx + HR - 2;
  ctx.beginPath();
  ctx.moveTo(hcx+4, hcy+1); ctx.quadraticCurveTo(nx+2, hcy+2, nx, hcy+6); ctx.stroke(); // nose
  ctx.beginPath(); ctx.moveTo(nx-3, hcy+10); ctx.lineTo(hcx+6, hcy+10); ctx.stroke(); // mouth
  ctx.beginPath(); ctx.arc(hcx-HR+1, hcy, 3, 0.6*Math.PI, 1.4*Math.PI); ctx.stroke(); // ear
  break;
}
```

}
ctx.restore();
}

// ── Canvas figure renderer ─────────────────────────────────────
function paintFigure(canvas, ang) {
const ctx = canvas.getContext(“2d”);
const W = canvas.width, H = canvas.height;
ctx.clearRect(0, 0, W, H);

ctx.fillStyle = “rgba(0,210,130,0.09)”;
for (let x = 0; x < W; x += 22)
for (let y = 0; y < H; y += 22)
ctx.fillRect(x-0.5, y-0.5, 1, 1);

const cx=W/2, cy=H*0.43;
const toR = d => d*Math.PI/180;
const HR=20, NK=13, TR=80, UA=52, FA=45, UL=64, LL=58;
const SW=22, HW=15;
const sy=cy-TR/2, hy=cy+TR/2;
const lShx=cx-SW, rShx=cx+SW;
const lHpx=cx-HW, rHpx=cx+HW;
const hcx=cx, hcy=sy-NK-HR;

ctx.lineCap=“round”; ctx.lineJoin=“round”;

function seg(x1,y1,x2,y2) {
ctx.shadowColor=”#00ffaa”; ctx.shadowBlur=9;
ctx.strokeStyle=”#00ffaa”; ctx.lineWidth=3;
ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
}
function jdot(x,y) {
ctx.shadowColor=”#ff6040”; ctx.shadowBlur=14;
ctx.fillStyle=”#ff6040”;
ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.fill();
ctx.shadowBlur=0;
}

// Head circle
ctx.shadowColor=”#00ffaa”; ctx.shadowBlur=9;
ctx.strokeStyle=”#00ffaa”; ctx.lineWidth=3;
ctx.beginPath(); ctx.arc(hcx,hcy,HR,0,Math.PI*2); ctx.stroke();

// Face
drawFace(ctx, hcx, hcy, HR, ang.face??“front”);

// Neck
seg(cx, hcy+HR, cx, sy);

// Torso trapezoid
ctx.shadowColor=”#00ffaa”; ctx.shadowBlur=6;
ctx.fillStyle=“rgba(0,255,170,0.07)”;
ctx.strokeStyle=”#00ffaa”; ctx.lineWidth=3;
ctx.beginPath();
ctx.moveTo(lShx,sy); ctx.lineTo(rShx,sy);
ctx.lineTo(rHpx,hy); ctx.lineTo(lHpx,hy);
ctx.closePath(); ctx.fill(); ctx.stroke();

// Left arm
const lSa=toR(ang.lShoulder??0);
const lEx=lShx-Math.sin(lSa)*UA, lEy=sy+Math.cos(lSa)*UA;
seg(lShx,sy,lEx,lEy);
const lEa=lSa+toR(ang.lElbow??0);
const lHx=lEx-Math.sin(lEa)*FA, lHy=lEy+Math.cos(lEa)*FA;
seg(lEx,lEy,lHx,lHy);

// Right arm
const rSa=toR(ang.rShoulder??0);
const rEx=rShx+Math.sin(rSa)*UA, rEy=sy+Math.cos(rSa)*UA;
seg(rShx,sy,rEx,rEy);
const rEa=rSa+toR(ang.rElbow??0);
const rHx=rEx+Math.sin(rEa)*FA, rHy=rEy+Math.cos(rEa)*FA;
seg(rEx,rEy,rHx,rHy);

// Left leg
const lHa=toR(ang.lHip??0);
const lKx=lHpx-Math.sin(lHa)*UL, lKy=hy+Math.cos(lHa)*UL;
seg(lHpx,hy,lKx,lKy);
const lKa=lHa+toR(ang.lKnee??0);
const lFx=lKx-Math.sin(lKa)*LL, lFy=lKy+Math.cos(lKa)*LL;
seg(lKx,lKy,lFx,lFy);

// Right leg
const rHa=toR(ang.rHip??0);
const rKx=rHpx+Math.sin(rHa)*UL, rKy=hy+Math.cos(rHa)*UL;
seg(rHpx,hy,rKx,rKy);
const rKa=rHa+toR(ang.rKnee??0);
const rFx=rKx+Math.sin(rKa)*LL, rFy=rKy+Math.cos(rKa)*LL;
seg(rKx,rKy,rFx,rFy);

// Joints
[[lShx,sy],[rShx,sy],[lEx,lEy],[rEx,rEy],
[lHpx,hy],[rHpx,hy],[lKx,lKy],[rKx,rKy]].forEach(([x,y])=>jdot(x,y));
ctx.shadowBlur=0;
}

// ── Preset dances ──────────────────────────────────────────────
const mk = (ls,rs,le,re,lh,rh,lk,rk,face=“front”) =>
({ lShoulder:ls, rShoulder:rs, lElbow:le, rElbow:re,
lHip:lh, rHip:rh, lKnee:lk, rKnee:rk, face });

const PRESETS = {
“idle”: [mk(0,0,0,0,0,0,0,0), mk(0,0,0,0,0,0,0,0),
mk(0,0,0,0,0,0,0,0), mk(0,0,0,0,0,0,0,0)],
“wave 🤚”: [
mk(-20,65, 0,-45, 0,0,0,0,“front”), mk(-20,80, 0,-65, 0,0,0,0,“right”),
mk(-20,65, 0,-45, 0,0,0,0,“front”), mk(-20,80, 0,-65, 0,0,0,0,“right”),
],
“JJ 🤸”: [
mk( 0, 0, 0, 0, 8, 8,0,0,“front”), mk(72,72,-15,-15,32,32,0,0,“up”),
mk( 0, 0, 0, 0, 8, 8,0,0,“front”), mk(72,72,-15,-15,32,32,0,0,“up”),
],
“march 🚶”: [
mk( 30,-30,-15, 15,-28, 28, 0,-50,“left”),  mk(5,5,0,0,0,0,0,0,“front”),
mk(-30, 30, 15,-15, 28,-28,-50, 0,“right”), mk(5,5,0,0,0,0,0,0,“front”),
],
“robot 🤖”: [
mk(90, 0,90,  0,0,0,0,0,“left”),  mk(90,90,90,-90,0,0,0,0,“front”),
mk( 0,90, 0,-90,0,0,0,0,“right”), mk( 0, 0, 0,  0,0,0,0,0,“front”),
],
“disco 🕺”: [
mk( 60,-20, 90, 30,-20,10, 0, 0,“left”),  mk(-20,60,-30,90,10,-20, 0, 0,“front”),
mk( 60,-20, 90, 30,-20,10, 0,45,“left”),  mk(-20,60,-30,90,10,-20,45, 0,“right”),
],
};

// ── Main App ───────────────────────────────────────────────────
export default function App() {
const canvasRef = useRef(null);
const rafRef    = useRef(null);
const startRef  = useRef(0);
const liveRef   = useRef({ beats:[], tempo:120, playing:false });

const [beats,      setBeats]      = useState(Array.from({length:8},()=>({…ZERO})));
const [tempo,      setTempo]      = useState(120);
const [playing,    setPlaying]    = useState(false);
const [activeBeat, setActiveBeat] = useState(-1);
const [sel,        setSel]        = useState({bi:0, ji:0});
const [gifState,   setGifState]   = useState(“idle”); // idle | loading | encoding | done
const [gifProgress,setGifProgress]= useState(0);

liveRef.current = { beats, tempo, playing };

useEffect(()=>{
if (!playing && canvasRef.current)
paintFigure(canvasRef.current, beats[sel.bi]??ZERO);
}, [sel, beats, playing]);

const animate = useCallback(()=>{
if (!liveRef.current.playing) return;
const {beats,tempo} = liveRef.current;
if (!beats.length) return;
const msPerBeat = 60000/tempo;
const elapsed   = performance.now()-startRef.current;
const t         = (elapsed%(beats.length*msPerBeat))/msPerBeat;
const bi        = Math.floor(t)%beats.length;
const angles    = blendBeats(beats[bi], beats[(bi+1)%beats.length], t-Math.floor(t));
if (canvasRef.current) paintFigure(canvasRef.current, angles);
setActiveBeat(bi);
rafRef.current = requestAnimationFrame(animate);
},[]);

const play = ()=>{
startRef.current=performance.now();
setPlaying(true); liveRef.current.playing=true;
rafRef.current=requestAnimationFrame(animate);
};
const stop = ()=>{
setPlaying(false); liveRef.current.playing=false;
if (rafRef.current){ cancelAnimationFrame(rafRef.current); rafRef.current=null; }
setActiveBeat(-1);
};

const setAngle = (bi,jid,raw)=>{
const v=Math.max(-180,Math.min(180,Math.round(Number(raw)||0)));
setBeats(prev=>{ const n=[…prev]; n[bi]={…n[bi],[jid]:v}; return n; });
};
const setFace = (bi,dir)=>{
setBeats(prev=>{ const n=[…prev]; n[bi]={…n[bi],face:dir}; return n; });
};
const cycleFace = bi=>{
const cur=beats[bi]?.face??“front”;
const nxt=FACE_CYCLE[(FACE_CYCLE.indexOf(cur)+1)%FACE_CYCLE.length];
setFace(bi,nxt); setSel(s=>({…s,bi}));
};

const addBeat    = ()=>setBeats(p=>[…p,{…(p[p.length-1]??ZERO)}]);
const removeBeat = idx=>{
if (beats.length<=2) return;
setBeats(p=>p.filter((_,i)=>i!==idx));
setSel(s=>({…s,bi:Math.min(s.bi,beats.length-2)}));
};
const loadPreset = preset=>{
stop();
setBeats(preset.map(b=>({…ZERO,…b})));
setSel({bi:0,ji:0});
};

// ── GIF export ──────────────────────────────────────────────
const loadGifShot = ()=> new Promise((res,rej)=>{
if (window.gifshot) { res(); return; }
const s=document.createElement(‘script’);
s.src=‘https://cdnjs.cloudflare.com/ajax/libs/gifshot/0.4.5/gifshot.min.js’;
s.onload=res; s.onerror=rej;
document.head.appendChild(s);
});

const downloadGif = async ()=>{
if (gifState===‘encoding’||gifState===‘loading’) return;
setGifState(‘loading’); setGifProgress(0);
try { await loadGifShot(); } catch(e){ setGifState(‘idle’); alert(‘gifshot の読み込みに失敗しました’); return; }

```
const FPB = 12; // frames per beat
const msPerBeat = 60000/tempo;
const frameDelay = msPerBeat/FPB/1000; // seconds per frame

// Offscreen canvas (same size as display canvas)
const oc = document.createElement('canvas');
oc.width=232; oc.height=316;

const frames=[];
const totalFrames = beats.length * FPB;
for (let f=0; f<totalFrames; f++){
  const t = f/FPB; // beat-time
  const bi = Math.floor(t)%beats.length;
  const frac = t-Math.floor(t);
  const ang = blendBeats(beats[bi], beats[(bi+1)%beats.length], frac);
  paintFigure(oc, ang);
  frames.push(oc.toDataURL('image/png'));
  setGifProgress(Math.round((f+1)/totalFrames*80));
  // yield to React every 4 frames
  if (f%4===3) await new Promise(r=>setTimeout(r,0));
}

setGifState('encoding'); setGifProgress(85);

window.gifshot.createGIF({
  images: frames,
  gifWidth:  232,
  gifHeight: 316,
  interval:  frameDelay,
  numWorkers: 2,
  progressCallback: p=>setGifProgress(85+Math.round(p*15)),
}, obj=>{
  if (obj.error){ setGifState('idle'); alert('GIF生成に失敗しました: '+obj.errorMsg); return; }
  const a=document.createElement('a');
  a.download='dance.gif';
  a.href=obj.image;
  a.click();
  setGifState('done');
  setTimeout(()=>setGifState('idle'),2000);
});
```

};

const selJ   = JOINTS[sel.ji];
const selVal = beats[sel.bi]?.[selJ.id]??0;
const selFace= beats[sel.bi]?.face??“front”;

const C = { bg:”#07090e”, panel:”#0c1119”, border:”#182030”,
acc:”#00ffaa”, text:”#b0cce0”, dim:”#354860” };
const FC = “#c8aaff”; // face color

return (
<div style={{height:“100vh”,display:“flex”,flexDirection:“column”,
background:C.bg,color:C.text,fontFamily:”‘Courier New’,Courier,monospace”,
overflow:“hidden”,fontSize:13}}>

```
  {/* ── Header ── */}
  <div style={{padding:"7px 14px",background:C.panel,
    borderBottom:`1px solid ${C.border}`,
    display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
    <span style={{color:C.acc,fontWeight:"bold",letterSpacing:3,fontSize:13}}>
      ◈ DANCE CHOREOGRAPHER
    </span>
    <span style={{color:C.dim,fontSize:10}}>PRESET:</span>
    {Object.entries(PRESETS).map(([k,v])=>(
      <button key={k} onClick={()=>loadPreset(v)} style={{
        background:"none",border:`1px solid ${C.border}`,color:C.text,
        padding:"2px 9px",borderRadius:3,cursor:"pointer",
        fontFamily:"inherit",fontSize:11}}>{k}</button>
    ))}
  </div>

  {/* ── Main split ── */}
  <div style={{flex:1,display:"flex",overflow:"hidden"}}>

    {/* Canvas */}
    <div style={{width:252,flexShrink:0,background:"#040710",
      borderRight:`1px solid ${C.border}`,
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",gap:8,padding:10}}>
      <canvas ref={canvasRef} width={232} height={316}
        style={{borderRadius:6,border:`1px solid ${C.border}`,display:"block"}} />
      <div style={{fontSize:10,color:C.dim,letterSpacing:2}}>
        {playing?`♪  BEAT ${activeBeat+1} / ${beats.length}`:`●  EDIT — ${sel.bi+1}拍目`}
      </div>
    </div>

    {/* Timeline */}
    <div style={{flex:1,overflowX:"auto",overflowY:"auto",padding:"10px 12px"}}>
      <div style={{display:"inline-flex",flexDirection:"column",gap:3}}>

        {/* Beat headers */}
        <div style={{display:"flex",gap:3,paddingLeft:90}}>
          {beats.map((_,bi)=>(
            <div key={bi} style={{width:54,flexShrink:0,textAlign:"center",fontSize:11,
              color:bi===activeBeat?C.acc:bi===sel.bi?"#88aacc":C.dim,
              fontWeight:bi===activeBeat?"bold":"normal"}}>
              <div style={{cursor:"pointer"}} onClick={()=>setSel(s=>({...s,bi}))}>
                {bi+1}拍
              </div>
              {beats.length>2&&(
                <button onClick={()=>removeBeat(bi)} style={{
                  background:"none",border:"none",color:"#ff5555",
                  cursor:"pointer",fontSize:9,padding:0,display:"block",margin:"0 auto"}}>×</button>
              )}
            </div>
          ))}
          <button onClick={addBeat} style={{
            width:36,height:38,background:"none",
            border:`1px dashed ${C.dim}`,color:C.acc,
            cursor:"pointer",fontSize:20,borderRadius:4,flexShrink:0,
            display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>+</button>
        </div>

        {/* ── Face row ── */}
        <div style={{display:"flex",gap:3,alignItems:"center"}}>
          <div style={{width:87,flexShrink:0,fontSize:11,paddingLeft:4,
            color:FC,borderLeft:`2px solid ${FC}`,userSelect:"none"}}>
            向き
          </div>
          {beats.map((beat,bi)=>{
            const dir=beat.face??"front";
            const isAct=bi===activeBeat, isSel=bi===sel.bi;
            return (
              <div key={bi} onClick={()=>cycleFace(bi)} title={`クリックで切替: ${FACE_LABEL[dir]}`}
                style={{width:54,height:30,flexShrink:0,
                  display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                  background:isSel?`${FC}18`:isAct?`${FC}08`:C.panel,
                  border:`1px solid ${isSel?FC:isAct?FC+"44":C.border}`,
                  borderRadius:4,cursor:"pointer",userSelect:"none",lineHeight:1}}>
                <span style={{fontSize:15,color:FC}}>{FACE_ICON[dir]}</span>
                <span style={{fontSize:8,color:`${FC}99`,marginTop:1}}>{FACE_LABEL[dir]}</span>
              </div>
            );
          })}
        </div>

        {/* ── Joint rows ── */}
        {JOINTS.map((joint,ji)=>(
          <div key={joint.id} style={{display:"flex",gap:3,alignItems:"center"}}>
            <div style={{width:87,flexShrink:0,fontSize:11,paddingRight:4,paddingLeft:4,
              cursor:"pointer",userSelect:"none",
              color:sel.ji===ji?joint.color:C.text,
              borderLeft:`2px solid ${sel.ji===ji?joint.color:"transparent"}`}}
              onClick={()=>setSel(s=>({...s,ji}))}>
              {joint.label}
            </div>
            {beats.map((beat,bi)=>{
              const v=beat[joint.id]??0;
              const isSel=sel.bi===bi&&sel.ji===ji, isAct=bi===activeBeat;
              return (
                <div key={bi} onClick={()=>setSel({bi,ji})} style={{
                  width:54,height:30,flexShrink:0,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  background:isSel?`${joint.color}18`:isAct?"#00ffaa08":C.panel,
                  border:`1px solid ${isSel?joint.color:isAct?"#00ffaa28":C.border}`,
                  borderRadius:4,cursor:"pointer",fontSize:12,
                  color:v!==0?isSel?joint.color:C.text:C.dim,
                  userSelect:"none",transition:"background 0.07s,border-color 0.07s"}}>
                  {v>0?`+${v}`:v}°
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* ── Controls ── */}
  <div style={{background:C.panel,borderTop:`1px solid ${C.border}`,
    padding:"10px 14px",display:"flex",flexDirection:"column",gap:10}}>

    {/* Row 1 — Play + Tempo */}
    <div style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
      <button onClick={playing?stop:play} style={{
        padding:"7px 26px",
        background:playing?"rgba(255,50,50,0.12)":"rgba(0,255,170,0.12)",
        border:`1px solid ${playing?"#ff3333":C.acc}`,
        color:playing?"#ff3333":C.acc,
        cursor:"pointer",borderRadius:4,fontFamily:"inherit",
        fontSize:13,fontWeight:"bold",letterSpacing:2}}>
        {playing?"■  STOP":"▶  PLAY"}
      </button>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:11,color:C.dim}}>TEMPO</span>
        <input type="range" min={40} max={240} value={tempo}
          onChange={e=>setTempo(+e.target.value)}
          style={{width:130,accentColor:C.acc}} />
        <span style={{color:C.acc,fontWeight:"bold",minWidth:68}}>{tempo} BPM</span>
      </div>
      <span style={{fontSize:11,color:C.dim}}>{beats.length} 拍ループ</span>

      {/* GIF download button */}
      <button onClick={downloadGif} disabled={gifState==='encoding'||gifState==='loading'}
        style={{
          padding:"7px 18px",marginLeft:4,
          background:gifState==='done'?"rgba(0,180,255,0.12)":gifState==='idle'?"rgba(180,130,255,0.10)":"rgba(180,130,255,0.06)",
          border:`1px solid ${gifState==='done'?"#00b4ff":gifState==='encoding'||gifState==='loading'?"#9966ff88":"#9966ff"}`,
          color:gifState==='done'?"#00b4ff":gifState==='encoding'||gifState==='loading'?"#9966ff88":"#c8aaff",
          cursor:gifState==='encoding'||gifState==='loading'?"not-allowed":"pointer",
          borderRadius:4,fontFamily:"inherit",fontSize:12,fontWeight:"bold",letterSpacing:1,
          minWidth:110,position:"relative",overflow:"hidden",transition:"all 0.2s"}}>
        {/* progress bar bg */}
        {(gifState==='loading'||gifState==='encoding')&&(
          <div style={{position:"absolute",left:0,top:0,height:"100%",
            width:`${gifProgress}%`,background:"rgba(153,102,255,0.18)",
            transition:"width 0.15s",pointerEvents:"none"}} />
        )}
        <span style={{position:"relative"}}>
          {gifState==='idle'   && "⬇ GIF 書き出し"}
          {gifState==='loading'&& `読込中… ${gifProgress}%`}
          {gifState==='encoding'&&`生成中… ${gifProgress}%`}
          {gifState==='done'   && "✓ ダウンロード完了"}
        </span>
      </button>
    </div>

    {/* Row 2 — Face selector + Angle editor */}
    <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
      {/* Face quick-select for current beat */}
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <span style={{fontSize:10,color:C.dim,marginRight:2}}>{sel.bi+1}拍:</span>
        {FACE_CYCLE.map(dir=>(
          <button key={dir} onClick={()=>setFace(sel.bi,dir)}
            title={FACE_LABEL[dir]}
            style={{width:30,height:26,background:"none",
              border:`1px solid ${selFace===dir?FC:C.border}`,
              color:selFace===dir?FC:C.dim,
              cursor:"pointer",borderRadius:3,fontFamily:"inherit",fontSize:14,
              display:"flex",alignItems:"center",justifyContent:"center"}}>
            {FACE_ICON[dir]}
          </button>
        ))}
      </div>

      <div style={{width:1,height:22,background:C.border,flexShrink:0}} />

      {/* Angle editor */}
      <span style={{fontSize:11,minWidth:128,paddingLeft:8,
        borderLeft:`2px solid ${selJ.color}`,color:selJ.color}}>
        {selJ.label} — {sel.bi+1}拍目
      </span>
      <input type="range" min={-180} max={180} step={1} value={selVal}
        onChange={e=>setAngle(sel.bi,selJ.id,+e.target.value)}
        style={{width:180,accentColor:selJ.color}} />
      <input type="number" min={-180} max={180} value={selVal}
        onChange={e=>setAngle(sel.bi,selJ.id,+e.target.value)}
        style={{width:62,background:"#040710",border:`1px solid ${selJ.color}`,
          color:selJ.color,fontFamily:"inherit",fontSize:13,
          padding:"3px 6px",borderRadius:4,textAlign:"right"}} />
      <span style={{color:selJ.color,fontSize:12}}>°</span>
    </div>
  </div>
</div>
```

);
}
