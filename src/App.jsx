import { useState, useEffect, useReducer, useRef, useCallback } from "react";
import { GW, GH, MAX_LVL, BASE_HOUSING, TICK_MS, DAY_MS, MAX_LOG, DROUGHT_FOOD, DROUGHT_LEN, FOOD_PER_POP, TILE_PX, LV_MULT, LV_XWORK, LV_ROM, NODE_DEF, NODE_POOL, BLDG, TECH_GROUPS, TECH, f1, sign, logPush, nodeKey, upgCost, bldgWorkers, bldgRate, bldgHousing, mkGrid, mkNodes, calcStats, doTick, reducer, initState, calcDayNight } from './game-logic.js';

// ═══════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════
function PH({ children, color }) {
  return (
    <div style={{ fontSize:9, letterSpacing:"0.2em", color:color||"#5A3A1A",
                  borderBottom:"1px solid #2A1808", paddingBottom:3, marginBottom:6,
                  textTransform:"uppercase", display:"flex", alignItems:"center", gap:4 }}>
      <span style={{ color:"#3A2010" }}>▸</span>{children}
    </div>
  );
}

function Stat({ icon, label, value, rate, sub, alert }) {
  const rc = rate>0?"#72E472":rate<0?"#E47272":"#6A5A4A";
  return (
    <div style={{ flex:1, padding:"8px 12px", borderRight:"1px solid #1A0E04" }}>
      <div style={{ fontSize:9, color:"#6A4A2A", letterSpacing:"0.1em", marginBottom:1 }}>{icon} {label}</div>
      <div style={{ fontSize:20, color:alert?"#E47272":"#F0A850", fontWeight:600, lineHeight:1.1 }}>{value}</div>
      {rate!==undefined&&<div style={{ fontSize:10, color:rc, fontFamily:"'Crimson Text',serif" }}>{sign(rate)}/tick</div>}
      {sub&&<div style={{ fontSize:9, color:"#4A3020", fontFamily:"'Crimson Text',serif", marginTop:1 }}>{sub}</div>}
    </div>
  );
}

function ModeTab({ id, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex:1, padding:"5px 3px", fontSize:9.5, letterSpacing:"0.04em",
      background:active?"#3A1E08":"#100804", border:`1px solid ${active?"#C47C2A":"#2A1808"}`,
      color:active?"#F0A850":"#6A4A2A", cursor:"pointer", fontFamily:"'Cinzel',serif",
      transition:"all .12s", outline:"none",
    }}>
      {label}
    </button>
  );
}

function BldgBtn({ id, b, selected, canAfford, locked, onClick }) {
  const sel = selected&&!locked;
  return (
    <button onClick={onClick} style={{
      width:"100%", textAlign:"left", padding:"5px 7px", marginBottom:2,
      background:sel?"#2A1808":"#120804", border:`1px solid ${sel?"#C47C2A":"#221008"}`,
      color:"#C47C2A", cursor:locked?"not-allowed":"pointer",
      opacity:locked?0.35:canAfford?1:0.55,
      transition:"all .1s", fontFamily:"'Cinzel',serif", outline:"none",
    }}>
      <div style={{ fontSize:11, marginBottom:1.5 }}>
        {locked?"🔒":b.icon} {b.name}
        {sel&&<span style={{ float:"right", color:"#C47C2A", fontSize:7.5 }}>◀ ACTIVE</span>}
      </div>
      <div style={{ fontSize:8.5, color:"#5A3A2A", lineHeight:1.55 }}>
        {b.cw>0&&<span>🪵{b.cw} </span>}
        {b.cs>0&&<span>🪨{b.cs} </span>}
        {(b.cw>0||b.cs>0)&&<span style={{ color:"#2A1808" }}>│ </span>}
        {b.housing>0&&<span style={{ color:"#72E472" }}>+{b.housing}🏠 </span>}
        {b.food>0&&<span style={{ color:"#72E472" }}>+{b.food}🍖/t </span>}
        {b.wood>0&&<span style={{ color:"#72E472" }}>+{b.wood}🪵/t </span>}
        {b.stone>0&&<span style={{ color:"#72E472" }}>+{b.stone}🪨/t </span>}
        {b.workers>0&&<span style={{ color:"#7A6050" }}>👷{b.workers}</span>}
        {locked&&<span style={{ color:"#5A3010" }}> — research needed</span>}
      </div>
    </button>
  );
}

function TechBtn({ id, tech, done, canAfford, onResearch }) {
  const isUnlock = tech.group==="unlock";
  return (
    <button onClick={onResearch} disabled={done} style={{
      width:"100%", textAlign:"left", padding:"5px 7px", marginBottom:2,
      background:done?(isUnlock?"#101A08":"#0E0E18"):"#100804",
      border:`1px solid ${done?(isUnlock?"#2A5010":"#1A1A40"):"#221008"}`,
      color:done?(isUnlock?"#4A8030":"#4A4A90"):"#C47C2A",
      cursor:done?"default":canAfford?"pointer":"not-allowed",
      opacity:done?0.7:canAfford?1:0.5,
      transition:"all .1s", fontFamily:"'Cinzel',serif", outline:"none",
    }}>
      <div style={{ fontSize:10, marginBottom:1 }}>{done?"✅":tech.icon} {tech.name}</div>
      <div style={{ fontSize:8, color:done?(isUnlock?"#3A6020":"#3A3A70"):"#4A3020", lineHeight:1.5 }}>{tech.desc}</div>
      {!done&&<div style={{ fontSize:8, color:canAfford?"#C47C2A":"#4A3018", marginTop:2 }}>🪵{tech.cw} 🪨{tech.cs}</div>}
    </button>
  );
}

// Building breakdown row in the right panel
function BldgRow({ id, bd, scale, masonry }) {
  const b = BLDG[id];
  const avgLvl = Math.round(bd.levels.reduce((a,b)=>a+b,0)/bd.levels.length);
  const workEff = Math.round(scale*100);
  const scaledFood  = f1(bd.food  * scale);
  const scaledWood  = f1(bd.wood  * scale);
  const scaledStone = f1(bd.stone * scale);
  const workersFill = Math.round(bd.workers * scale);
  const maxLvlReached = avgLvl>=MAX_LVL;
  return (
    <div style={{ padding:"4px 0", borderBottom:"1px solid #160C04", fontFamily:"'Crimson Text',serif" }}>
      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
        <span style={{ fontSize:13 }}>{b.icon}</span>
        <span style={{ fontSize:10, color:"#C47C2A" }}>{b.name}</span>
        <span style={{ fontSize:9, color:"#4A3A2A" }}>×{bd.count}</span>
        <span style={{ fontSize:8, color:maxLvlReached?"#FFD700":"#6A4A2A",
                       background:maxLvlReached?"rgba(255,215,0,0.1)":"transparent",
                       padding:"0 3px", border:`1px solid ${maxLvlReached?"#806010":"#2A1808"}` }}>
          Lv{bd.levels.map(l=>LV_ROM[l-1]).join("/")}
        </span>
        {!maxLvlReached&&<span style={{ fontSize:7.5, color:"#3A3010" }}>⬆ upgradeable</span>}
      </div>
      <div style={{ display:"flex", gap:8, marginTop:2, fontSize:9, lineHeight:1.5 }}>
        <span style={{ color:"#5A7060" }}>
          👷 {workersFill}/{bd.workers} workers
          <span style={{ color:workEff>=80?"#72E472":workEff>=50?"#C47C2A":"#E47272", marginLeft:3 }}>
            ({workEff}%)
          </span>
        </span>
        {bd.food >0&&<span style={{ color:"#72E472" }}>🍖+{scaledFood}/t</span>}
        {bd.wood >0&&<span style={{ color:"#72E472" }}>🪵+{scaledWood}/t</span>}
        {bd.stone>0&&<span style={{ color:"#72E472" }}>🪨+{scaledStone}/t</span>}
        {bd.housing>0&&<span style={{ color:"#8AB0D8" }}>🏠{bd.housing} cap</span>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [st, dispatch]            = useReducer(reducer, null, initState);
  const [phase, setPhase]         = useState(0);
  const [mode,  setMode]          = useState("build"); // build | upgrade | demo
  const [hov,   setHov]           = useState(null);
  const [floats, setFloats]       = useState([]);
  const t0     = useRef(Date.now());
  const tmrRef = useRef(null);
  const rafRef = useRef(null);
  const fid    = useRef(0);
  const gridRef = useRef(null);

  useEffect(() => {
    if (st.paused) { clearInterval(tmrRef.current); return; }
    tmrRef.current = setInterval(() => dispatch({type:"TICK"}), TICK_MS/st.speed);
    return () => clearInterval(tmrRef.current);
  }, [st.paused, st.speed]);

  useEffect(() => {
    const loop = () => { setPhase(((Date.now()-t0.current)%DAY_MS)/DAY_MS); rafRef.current=requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const sky   = calcDayNight(phase);
  const stats = calcStats(st);
  const { res, pop, sel, paused, speed, log, drought, tick, tech, nodes } = st;
  const selBldg = BLDG[sel];

  const spawnFloat = useCallback((r, c, text, color="#72E472") => {
    const id = fid.current++;
    setFloats(f => [...f, { id, r, c, text, color }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 1100);
  }, []);

  const handleTileClick = useCallback((r, c) => {
    const k    = nodeKey(r, c);
    const cell = st.grid[r][c];
    const node = nodes[k];
    if (mode === "upgrade") {
      if (cell) {
        const b = BLDG[cell.id];
        if (cell.level < MAX_LVL) {
          const cost = upgCost(b, cell.level+1, tech.stoneMasonry);
          spawnFloat(r, c, `⬆Lv${LV_ROM[cell.level]}`, "#FFD700");
          dispatch({type:"UPGRADE", r, c});
        } else {
          spawnFloat(r, c, "MAX!", "#FFD700");
        }
      }
      return;
    }
    if (mode === "demo") {
      dispatch({type:"DEMO", r, c});
      return;
    }
    // build mode
    if (node && node.charges>0 && node.respawnAt===null) {
      spawnFloat(r, c, NODE_DEF[node.type].hint);
    }
    dispatch({type:"PLACE", r, c});
  }, [st.grid, nodes, mode, tech.stoneMasonry, spawnFloat]);

  const handleRightClick = useCallback((e, r, c) => {
    e.preventDefault();
    dispatch({type:"DEMO", r, c});
  }, []);

  // Derived for render
  const liveCt     = Object.values(nodes).filter(n=>n.respawnAt===null).length;
  const depCt      = Object.values(nodes).filter(n=>n.respawnAt!==null).length;
  const hovCell    = hov ? st.grid[hov.r]?.[hov.c] : null;
  const hovNode    = hov ? nodes[nodeKey(hov.r,hov.c)] : null;
  const hovBldg    = hovCell ? BLDG[hovCell.id] : null;
  const hovNodeDef = hovNode ? NODE_DEF[hovNode.type] : null;
  const masonry    = tech.stoneMasonry;

  return (
    <div style={{
      background:`radial-gradient(ellipse at 50% -10%, ${sky.over} 0%, transparent 55%), ${sky.bg}`,
      minHeight:"100vh", color:"#C47C2A",
      fontFamily:"'Cinzel',Georgia,serif",
      padding:"8px", userSelect:"none",
      transition:"background 3s ease", position:"relative", overflow:"hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-track{background:#060302;}
        ::-webkit-scrollbar-thumb{background:#3A2010;border-radius:3px;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
        @keyframes glow{0%,100%{box-shadow:0 0 5px rgba(196,124,42,.3)}50%{box-shadow:0 0 12px rgba(196,124,42,.7)}}
        @keyframes goldGlow{0%,100%{box-shadow:0 0 4px rgba(255,215,0,.2)}50%{box-shadow:0 0 12px rgba(255,215,0,.6)}}
        @keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}80%{opacity:.9;transform:translateY(-28px) scale(1.1)}100%{opacity:0;transform:translateY(-44px) scale(.85)}}
        .pulse{animation:pulse 1.6s ease-in-out infinite;}
        .tile{display:flex;align-items:center;justify-content:center;
              width:${TILE_PX}px;height:${TILE_PX}px;border:1px solid #1A0E04;
              cursor:pointer;font-size:15px;transition:filter .07s,border-color .07s;position:relative;}
        .tile:hover{border-color:#C47C2A!important;filter:brightness(1.55);z-index:2;}
        .tile-node{cursor:crosshair;}
        .tile-node:hover{border-color:#72E472!important;filter:brightness(1.65)!important;}
        .tile-dep{cursor:default;opacity:.22;}
        .tile-dep:hover{filter:none!important;border-color:#1C1008!important;}
        .tile-upg-hover:hover{border-color:#FFD700!important;filter:brightness(1.5);animation:goldGlow 1s infinite;}
        .tile-demo-hover:hover{border-color:#E47272!important;filter:brightness(1.4);}
        .tile-ghost::after{content:attr(data-icon);position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:15px;opacity:.4;background:rgba(196,124,42,.07);}
        .ctrl-btn{background:#120804;border:1px solid #2E1808;color:#C47C2A;
                  padding:4px 10px;cursor:pointer;font-family:'Cinzel',serif;
                  font-size:9.5px;letter-spacing:.05em;transition:all .12s;outline:none;}
        .ctrl-btn:hover{background:#221208;border-color:#8A5A2A;}
        .ctrl-btn.on{background:#3A1E08;border-color:#C47C2A;color:#F0A850;animation:glow 2s infinite;}
        .float-txt{position:absolute;pointer-events:none;font-size:12px;font-weight:700;
                   text-shadow:0 1px 5px rgba(0,0,0,.9);animation:floatUp 1.1s ease-out forwards;
                   z-index:200;white-space:nowrap;font-family:'Crimson Text',serif;transform-origin:center bottom;}
        .lvl-badge{position:absolute;top:1px;right:2px;font-size:7px;line-height:1;
                   color:#FFD700;text-shadow:0 0 4px rgba(0,0,0,.9);font-family:'Cinzel',serif;font-weight:600;}
        .pip{font-size:4.5px;line-height:1;letter-spacing:-1px;}
      `}</style>

      {/* Floating gather/upgrade text inside grid */}
      <div ref={gridRef} style={{ position:"fixed", top:0, left:0, width:0, height:0, pointerEvents:"none", zIndex:999 }}>
        {floats.map(f => (
          <div key={f.id} className="float-txt"
               style={{ color:f.color, top:122+f.r*(TILE_PX+1), left:194+f.c*(TILE_PX+1) }}>
            {f.text}
          </div>
        ))}
      </div>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                    borderBottom:"1px solid #2A1808", paddingBottom:7, marginBottom:7 }}>
        <div>
          <h1 style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:18,
                       color:"#F0A850", letterSpacing:"0.07em", lineHeight:1 }}>
            ⚒ STONE AGE CHRONICLES
          </h1>
          <div style={{ fontSize:9, color:"#6A4A2A", letterSpacing:"0.13em",
                        fontFamily:"'Crimson Text',serif", marginTop:2,
                        display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
            <span>{sky.label}</span>
            <span style={{ color:"#2A1808" }}>·</span>
            <span>Tick #{tick}</span>
            <span style={{ color:"#2A1808" }}>·</span>
            <span>{speed}× speed</span>
            <span style={{ color:"#2A1808" }}>·</span>
            <span>Workers {stats.employed}/{stats.workNeeded}
              <span style={{ color:stats.scale>0.8?"#72E472":stats.scale>0.5?"#C47C2A":"#E47272" }}>
                &nbsp;({Math.round(stats.scale*100)}% eff)
              </span>
            </span>
            {drought.active&&<span className="pulse" style={{ color:"#E06030" }}>🌵 DROUGHT ({drought.ticks}t)</span>}
            {paused&&<span style={{ color:"#FFD700" }}>⏸ PAUSED</span>}
            {tech.toolCrafting&&<span style={{ color:"#8AB0D8" }}>🔧+25%</span>}
            {tech.stoneMasonry&&<span style={{ color:"#8AB0D8" }}>🏛-30%</span>}
            {tech.animalHusbandry&&<span style={{ color:"#8AB0D8" }}>🐄+2🍖</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <button className={`ctrl-btn${paused?" on":""}`}
                  onClick={() => dispatch({type:"PAUSE"})}>
            {paused?"▶ Resume":"⏸ Pause"}
          </button>
          {[1,2,3].map(v => (
            <button key={v} className={`ctrl-btn${speed===v?" on":""}`}
                    onClick={()=>dispatch({type:"SPEED",v})}>{v}×</button>
          ))}
          <button className="ctrl-btn" style={{ marginLeft:4 }}
                  onClick={()=>{ if(window.confirm("Begin anew?")) dispatch({type:"NEW_GAME"}); }}>
            🔄 New
          </button>
        </div>
      </div>

      {/* ── RESOURCE BAR ───────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:0, marginBottom:7,
                    background:"rgba(0,0,0,0.35)", border:"1px solid #2A1808" }}>
        <Stat icon="👥" label="Population" value={`${pop} / ${stats.housing}`}
              sub={`${pop-stats.employed} idle · ${stats.employed} working`}
              alert={pop>=stats.housing} />
        <Stat icon="🍖" label="Food" value={f1(res.food)} rate={stats.netFood}
              sub={`+${f1(stats.foodProd)} prod · −${f1(stats.consume)} eat`}
              alert={res.food<DROUGHT_FOOD} />
        <Stat icon="🪵" label="Wood"  value={f1(res.wood)}  rate={stats.woodRate}  />
        <Stat icon="🪨" label="Stone" value={f1(res.stone)} rate={stats.stoneRate} />
      </div>

      {/* ── BODY ───────────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:7, alignItems:"flex-start" }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div style={{ width:178, flexShrink:0, maxHeight:"calc(100vh - 145px)",
                      overflowY:"auto", paddingRight:3 }}>

          {/* Mode tabs */}
          <div style={{ display:"flex", gap:2, marginBottom:8 }}>
            <ModeTab id="build"   label="🏗 Build"   active={mode==="build"}   onClick={()=>setMode("build")} />
            <ModeTab id="upgrade" label="⬆ Upgrade" active={mode==="upgrade"} onClick={()=>setMode("upgrade")} />
            <ModeTab id="demo"    label="🔨 Demo"    active={mode==="demo"}    onClick={()=>setMode("demo")} />
          </div>

          {mode==="build" && (
            <>
              <PH>Buildings</PH>
              <div style={{ fontSize:8, color:"#3A2010", marginBottom:5,
                            fontFamily:"'Crimson Text',serif", lineHeight:1.5 }}>
                {masonry && <span style={{ color:"#8AB0D8" }}>🏛 Masonry: 30% discount active<br/></span>}
                Left-click empty tile to place
              </div>
              {Object.entries(BLDG).map(([id,b]) => {
                const locked    = !!(b.tech&&!tech[b.tech]);
                const disc      = masonry?0.7:1;
                const canAfford = !locked&&res.wood>=Math.ceil(b.cw*disc)&&res.stone>=Math.ceil(b.cs*disc);
                return (
                  <BldgBtn key={id} id={id} b={b} selected={sel===id}
                           canAfford={canAfford} locked={locked}
                           onClick={()=>!locked&&dispatch({type:"SELECT",id})} />
                );
              })}
            </>
          )}

          {mode==="upgrade" && (
            <>
              <PH color="#C0A020">Upgrade Mode</PH>
              <div style={{ fontSize:9, color:"#7A6020", fontFamily:"'Crimson Text',serif", lineHeight:1.7, marginBottom:8 }}>
                Click any building on the map to upgrade it.<br/>
                <span style={{ color:"#C47C2A" }}>Lv Ⅱ:</span> ×1.65 output, +1 worker slot<br/>
                <span style={{ color:"#F0A850" }}>Lv Ⅲ:</span> ×2.6 output, +2 worker slots<br/>
                {masonry&&<span style={{ color:"#8AB0D8" }}>🏛 30% cost discount active</span>}
              </div>
              <PH>Upgrade Costs</PH>
              {Object.entries(BLDG).map(([id,b]) => {
                const c2=upgCost(b,2,masonry), c3=upgCost(b,3,masonry);
                return (
                  <div key={id} style={{ marginBottom:4, padding:"4px 6px",
                                         background:"#0E0804", border:"1px solid #1E1008",
                                         fontFamily:"'Crimson Text',serif" }}>
                    <div style={{ fontSize:10, color:"#C47C2A" }}>{b.icon} {b.name}</div>
                    <div style={{ fontSize:8.5, color:"#5A3A2A", lineHeight:1.5 }}>
                      Lv Ⅱ: 🪵{c2.cw} 🪨{c2.cs}&nbsp;&nbsp;Lv Ⅲ: 🪵{c3.cw} 🪨{c3.cs}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {mode==="demo" && (
            <>
              <PH color="#C05050">Demolish Mode</PH>
              <div style={{ fontSize:9, color:"#7A4040", fontFamily:"'Crimson Text',serif", lineHeight:1.7 }}>
                Click any building on the map to demolish it.<br/>
                Right-click always demolishes regardless of mode.<br/>
                <br/>
                Clicking a live resource node clears it permanently.
              </div>
            </>
          )}

          <div style={{ height:1, background:"#2A1808", margin:"8px 0 7px" }} />

          {/* RESEARCH — two groups */}
          <PH>Research — Unlocks</PH>
          {Object.entries(TECH).filter(([,t])=>t.group==="unlock").map(([id,tech_]) => (
            <TechBtn key={id} id={id} tech={tech_} done={tech[id]}
                     canAfford={res.wood>=tech_.cw&&res.stone>=tech_.cs}
                     onResearch={()=>dispatch({type:"RESEARCH",id})} />
          ))}

          <div style={{ height:1, background:"#2A1808", margin:"7px 0 6px" }} />
          <PH>Research — Mastery</PH>
          {Object.entries(TECH).filter(([,t])=>t.group==="mastery").map(([id,tech_]) => (
            <TechBtn key={id} id={id} tech={tech_} done={tech[id]}
                     canAfford={res.wood>=tech_.cw&&res.stone>=tech_.cs}
                     onResearch={()=>dispatch({type:"RESEARCH",id})} />
          ))}

          <div style={{ height:1, background:"#2A1808", margin:"7px 0 6px" }} />
          <PH>Field Resources</PH>
          <div style={{ fontSize:8.5, color:"#5A3A2A", lineHeight:1.85, fontFamily:"'Crimson Text',serif" }}>
            {Object.entries(NODE_DEF).map(([id,d]) => (
              <div key={id} style={{ display:"flex", justifyContent:"space-between" }}>
                <span>{d.icon} {d.label}</span>
                <span style={{ color:"#C47C2A" }}>{d.hint}</span>
              </div>
            ))}
            <div style={{ marginTop:4, color:"#3A2010", borderTop:"1px solid #1A0E04", paddingTop:3, lineHeight:1.6 }}>
              🖱 Left-click to gather<br/>
              💤 Depleted nodes respawn
            </div>
          </div>
        </div>

        {/* ── MAP ──────────────────────────────────────────────────────────── */}
        <div style={{ flexShrink:0 }}>
          <PH>
            The Land — {GW}×{GH}
            <span style={{ color:"#3A4A2A", fontSize:8, marginLeft:4 }}>
              🌳{liveCt} live · 💤{depCt} depleted · mode: <span style={{ color:mode==="upgrade"?"#FFD700":mode==="demo"?"#E47272":"#C47C2A" }}>{mode}</span>
            </span>
          </PH>
          <div
            style={{ display:"grid", gridTemplateColumns:`repeat(${GW},${TILE_PX}px)`,
                     gap:"1px", background:"#060402", padding:"2px",
                     border:"2px solid #2A1808", position:"relative" }}
            onContextMenu={e=>e.preventDefault()}
          >
            {st.grid.map((row,r) => row.map((cell,c) => {
              const k        = nodeKey(r,c);
              const bldg     = cell ? BLDG[cell.id] : null;
              const node     = nodes[k];
              const isHov    = hov?.r===r && hov?.c===c;
              const liveNode = node&&node.charges>0&&node.respawnAt===null;
              const deadNode = node&&node.respawnAt!==null;
              const nDef     = node?NODE_DEF[node.type]:null;
              const ghost    = isHov&&!bldg&&!liveNode&&mode==="build"&&selBldg;
              const canUpg   = bldg&&cell.level<MAX_LVL&&mode==="upgrade";
              const isDemo   = bldg&&mode==="demo";

              let cls = "tile";
              if      (liveNode&&!bldg) cls += " tile-node";
              else if (deadNode&&!bldg) cls += " tile-dep";
              else if (ghost)           cls += " tile-ghost";
              if (canUpg)               cls += " tile-upg-hover";
              else if (isDemo)          cls += " tile-demo-hover";

              const bg = bldg  ? bldg.bg
                       : liveNode ? nDef.bg
                       : deadNode ? "#080604" : "#110D06";
              const bd = bldg  ? `1px solid ${bldg.border}55`
                       : liveNode ? `1px solid ${nDef.border}99` : "1px solid #181008";

              let tip="";
              if (bldg) {
                const w=bldgWorkers(bldg,cell.level);
                const prod=bldg.food>0?`+${f1(bldgRate(bldg,"food",cell.level)*stats.scale)}🍖/t`
                  :bldg.wood>0?`+${f1(bldgRate(bldg,"wood",cell.level)*stats.scale)}🪵/t`
                  :bldg.stone>0?`+${f1(bldgRate(bldg,"stone",cell.level)*stats.scale)}🪨/t`
                  :bldg.housing>0?`+${bldgHousing(bldg,cell.level)} cap`:"";
                const uc=cell.level<MAX_LVL?upgCost(bldg,cell.level+1,masonry):null;
                tip=`${bldg.name} Lv${LV_ROM[cell.level-1]} · 👷${w} workers · ${prod}`
                   +(uc?` | Upgrade→Lv${LV_ROM[cell.level]}: 🪵${uc.cw} 🪨${uc.cs}`:" | MAX LEVEL")
                   +" | Right-click demo";
              } else if (liveNode) tip=`${nDef.icon} ${nDef.label} — ${nDef.verb} for ${nDef.hint} · ${node.charges} charges`;
              else if (deadNode)   tip=`${nDef.icon} Depleted — respawns in ${node.respawnAt-tick} ticks`;
              else                 tip=`Empty (${c+1},${r+1})`;

              return (
                <div key={`${r}-${c}`} className={cls} data-icon={ghost?selBldg.icon:""}
                     style={{ background:bg, border:bd }}
                     onClick={()=>handleTileClick(r,c)}
                     onContextMenu={e=>handleRightClick(e,r,c)}
                     onMouseEnter={()=>setHov({r,c})}
                     onMouseLeave={()=>setHov(null)}
                     title={tip}>
                  {bldg?.icon ?? (liveNode ? nDef.icon : (deadNode ? "·" : ""))}
                  {/* Level badge */}
                  {bldg&&cell.level>1&&(
                    <span className="lvl-badge">{LV_ROM[cell.level-1]}</span>
                  )}
                  {/* Charge pips */}
                  {liveNode&&!bldg&&(
                    <span className="pip" style={{
                      position:"absolute", bottom:1, right:1,
                      color:"#72E47299", display:"block",
                    }}>{"●".repeat(Math.min(node.charges,4))}</span>
                  )}
                </div>
              );
            }))}
          </div>
          <div style={{ fontSize:8.5, color:"#3A2010", textAlign:"center",
                        marginTop:3, fontFamily:"'Crimson Text',serif",
                        display:"flex", justifyContent:"space-between" }}>
            <span>{st.grid.flat().filter(Boolean).length}/{GW*GH} tiles built</span>
            <span>🟡 gold badge = upgraded · 🔴 border = max level</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div style={{ flex:1, minWidth:170, maxHeight:"calc(100vh - 145px)", overflowY:"auto" }}>

          {/* Hover tile info card */}
          {hov && (hovBldg||hovNode) && (
            <div style={{ marginBottom:7, padding:"7px 9px",
                          background:"rgba(0,0,0,0.50)", border:"1px solid #3A2010",
                          fontFamily:"'Crimson Text',serif" }}>
              {hovBldg && (() => {
                const lvl    = hovCell.level;
                const w      = bldgWorkers(hovBldg,lvl);
                const wFill  = Math.round(w*stats.scale);
                const fRate  = f1(bldgRate(hovBldg,"food",lvl)*stats.scale);
                const wdRate = f1(bldgRate(hovBldg,"wood",lvl)*stats.scale);
                const stRate = f1(bldgRate(hovBldg,"stone",lvl)*stats.scale);
                const hsg    = bldgHousing(hovBldg,lvl);
                const uc     = lvl<MAX_LVL ? upgCost(hovBldg,lvl+1,masonry) : null;
                const nxtMult= lvl<MAX_LVL ? LV_MULT[lvl] : null;
                return (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                      <span style={{ fontSize:16 }}>{hovBldg.icon}</span>
                      <span style={{ fontSize:12, color:"#F0A850" }}>{hovBldg.name}</span>
                      <span style={{ fontSize:10, color:"#C0A020",
                                     border:"1px solid #504010", padding:"0 5px" }}>
                        Level {LV_ROM[lvl-1]}
                      </span>
                      {lvl>=MAX_LVL && (
                        <span style={{ fontSize:9, color:"#FFD700", border:"1px solid #806010", padding:"0 4px" }}>
                          MAX
                        </span>
                      )}
                    </div>
                    {/* Worker bar */}
                    <div style={{ marginBottom:4 }}>
                      <div style={{ fontSize:9, color:"#6A5030", marginBottom:2 }}>
                        👷 Workers: {wFill}/{w} assigned ({Math.round(stats.scale*100)}% efficiency)
                      </div>
                      <div style={{ height:5, background:"#1A0E04", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${stats.scale*100}%`,
                                      background:stats.scale>0.8?"#72E472":stats.scale>0.5?"#C47C2A":"#E47272",
                                      transition:"width .3s" }} />
                      </div>
                    </div>
                    <div style={{ fontSize:9.5, color:"#7A5A3A", lineHeight:1.7 }}>
                      {fRate >0&&<div>🍖 Food: <span style={{ color:"#72E472" }}>+{fRate}/tick</span></div>}
                      {wdRate>0&&<div>🪵 Wood: <span style={{ color:"#72E472" }}>+{wdRate}/tick</span></div>}
                      {stRate>0&&<div>🪨 Stone:<span style={{ color:"#72E472" }}>+{stRate}/tick</span></div>}
                      {hsg   >0&&<div>🏠 Housing: <span style={{ color:"#8AB0D8" }}>+{hsg} capacity</span></div>}
                    </div>
                    {uc && (
                      <div style={{ marginTop:5, padding:"4px 6px",
                                    background:"rgba(255,215,0,0.05)", border:"1px solid #403010",
                                    fontSize:9, color:"#9A7820" }}>
                        <div style={{ color:"#C0A020", marginBottom:2 }}>
                          ⬆ Upgrade to Lv {LV_ROM[lvl]}: 🪵{uc.cw} 🪨{uc.cs}
                        </div>
                        <div style={{ color:"#7A6020" }}>
                          Output: ×{nxtMult} · +{LV_XWORK[lvl]} extra worker slot{LV_XWORK[lvl]!==1?"s":""}
                        </div>
                        {mode!=="upgrade"&&<div style={{ color:"#5A4010", marginTop:2 }}>Switch to ⬆ Upgrade mode to upgrade</div>}
                      </div>
                    )}
                  </>
                );
              })()}
              {hovNodeDef&&!hovBldg&&(
                <>
                  <div style={{ fontSize:12, color:"#F0A850", marginBottom:3 }}>
                    {hovNodeDef.icon} {hovNodeDef.label}
                  </div>
                  {hovNode.respawnAt!==null ? (
                    <div style={{ fontSize:9, color:"#5A3A20" }}>
                      💤 Depleted — respawns in {Math.max(0,hovNode.respawnAt-tick)} ticks
                    </div>
                  ) : (
                    <div style={{ fontSize:9.5, color:"#7A5A3A", lineHeight:1.7 }}>
                      Action: {hovNodeDef.verb}<br/>
                      Yields: <span style={{ color:"#72E472" }}>{hovNodeDef.hint}</span><br/>
                      Charges: {hovNode.charges} remaining
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Buildings breakdown */}
          {Object.keys(stats.bldgBreakdown).length > 0 && (
            <div style={{ marginBottom:7, padding:"7px 9px",
                          background:"rgba(0,0,0,0.28)", border:"1px solid #1E1008" }}>
              <PH>Active Buildings & Workers</PH>
              {Object.entries(stats.bldgBreakdown).map(([id,bd]) => (
                <BldgRow key={id} id={id} bd={bd} scale={stats.scale} masonry={masonry} />
              ))}
              <div style={{ marginTop:5, fontSize:9, color:"#4A3020",
                            fontFamily:"'Crimson Text',serif", borderTop:"1px solid #1A0E04", paddingTop:3 }}>
                Global efficiency: {Math.round(stats.scale*100)}%
                &nbsp;({stats.employed}/{stats.workNeeded} workers)
                {stats.passFood>0&&<span style={{ color:"#8AB0D8" }}>&nbsp;· 🐄+{stats.passFood}🍖 passive</span>}
              </div>
            </div>
          )}

          {/* Production summary */}
          <div style={{ marginBottom:7, padding:"7px 9px",
                        background:"rgba(0,0,0,0.28)", border:"1px solid #1E1008" }}>
            <PH>Production Summary</PH>
            {[
              ["🍖 Food",  `${sign(stats.netFood)}/t  (+${f1(stats.foodProd)} −${f1(stats.consume)})`],
              ["🪵 Wood",  `${sign(stats.woodRate)}/t`],
              ["🪨 Stone", `${sign(stats.stoneRate)}/t`],
              ["👷 Work",  `${stats.employed}/${stats.workNeeded} workers (${Math.round(stats.scale*100)}%)`],
              ["🏠 Cap",   `${pop}/${stats.housing} housing`],
            ].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between",
                                    fontSize:9.5, padding:"2px 0",
                                    borderBottom:"1px solid #160C04",
                                    fontFamily:"'Crimson Text',serif" }}>
                <span style={{ color:"#6A4A2A" }}>{k}</span>
                <span style={{ color:"#C47C2A" }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Chronicle */}
          <PH>Chronicle</PH>
          <div style={{
            background:"rgba(0,0,0,0.38)", border:"1px solid #1E1008",
            maxHeight:300, overflowY:"auto", padding:"5px 7px",
          }}>
            {log.map((entry,i) => (
              <div key={i} style={{
                padding:"4px 0", borderBottom:"1px solid #120C04",
                fontSize:10.5, lineHeight:1.45,
                color: i===0?"#F0A850":`rgba(196,124,42,${Math.max(0.09,1-i*0.046)})`,
                fontFamily:"'Crimson Text',serif",
              }}>{entry}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div style={{ marginTop:7, fontSize:8.5, color:"#3A2010", textAlign:"center",
                    letterSpacing:"0.12em", fontFamily:"'Crimson Text',serif" }}>
        ⬆ Higher level buildings need more workers & produce more per tick
        &nbsp;·&nbsp; 🌵 Drought fires when food &lt; {DROUGHT_FOOD}
        &nbsp;·&nbsp; 🌳 Resource nodes respawn automatically
      </div>
    </div>
  );
}
