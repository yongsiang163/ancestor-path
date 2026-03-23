// ═══════════════════════════════════════════════════════════════════════════
//  ANCESTOR PATH — GAME LOGIC
//  Pure functions and constants. No React imports.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
export const GW = 20, GH = 13, MAX_LVL = 3, BASE_HOUSING = 4;
export const DEFAULT_CAPS = { food: 80, wood: 100, stone: 100, hides: 40 };
export const TICK_MS = 1300, DAY_MS = 480_000, MAX_LOG = 20;
export const DROUGHT_FOOD = 10, DROUGHT_LEN = 15, FOOD_PER_POP = 0.25;
export const TILE_PX = 34;
// Per-level multipliers and extra worker slots unlocked
export const LV_MULT  = [1.0, 1.65, 2.6];
export const LV_XWORK = [0,   1,    2  ];   // bonus workers added per level
export const LV_ROM   = ["Ⅰ","Ⅱ","Ⅲ"];

// ═══════════════════════════════════════════════════════════════════════════
//  POPULATION ROLES
// ═══════════════════════════════════════════════════════════════════════════
export const ROLES = {
  gatherer:  { name:"Gatherer",   icon:"🧺", works:["bonfire","berryFarm","fishery","herbGarden"], bonus:"food",  mult:1.10 },
  woodcutter:{ name:"Woodcutter", icon:"🪓", works:["woodCamp","forester"],                        bonus:"wood",  mult:1.10 },
  mason:     { name:"Mason",      icon:"⛏️",  works:["quarry","granary","warehouse"],               bonus:"stone", mult:1.10 },
  hunter:    { name:"Hunter",     icon:"🏹", works:["hunt","tanningHut"],                          bonus:"food",  mult:1.15 },
  shaman:    { name:"Shaman",     icon:"🔮", works:["ritualCircle","eldersLodge","spiritTrap","temple"], bonus:null, mult:1.0 },
};

// Reverse lookup: building id → preferred role key
export const BLDG_ROLE = Object.entries(ROLES).reduce((acc, [role, def]) => {
  def.works.forEach(bId => { acc[bId] = role; });
  return acc;
}, {});

// ═══════════════════════════════════════════════════════════════════════════
//  NATURAL RESOURCE NODES
// ═══════════════════════════════════════════════════════════════════════════
export const NODE_DEF = {
  tree:     { icon:"🌳", bg:"#071A04", border:"#1A5010", charges:3, respawn:28,
              wood:5, food:0, stone:0, label:"Ancient Tree",   verb:"Chop",   hint:"+5🪵" },
  grove:    { icon:"🌿", bg:"#061408", border:"#0E3A14", charges:4, respawn:20,
              wood:3, food:1, stone:0, label:"Undergrowth",    verb:"Clear",  hint:"+3🪵+1🍖" },
  rock:     { icon:"🪨", bg:"#1A1A14", border:"#404030", charges:3, respawn:32,
              wood:0, food:0, stone:5, label:"Stone Outcrop",  verb:"Quarry", hint:"+5🪨" },
  ore:      { icon:"💎", bg:"#10101A", border:"#2A2A50", charges:2, respawn:45,
              wood:0, food:0, stone:8, label:"Rich Ore Seam",  verb:"Mine",   hint:"+8🪨" },
  berry:    { icon:"🫐", bg:"#140820", border:"#381848", charges:4, respawn:16,
              wood:0, food:4, stone:0, label:"Berry Thicket",  verb:"Pick",   hint:"+4🍖" },
  mushroom: { icon:"🍄", bg:"#1A0E08", border:"#503020", charges:3, respawn:14,
              wood:0, food:3, stone:0, label:"Mushroom Patch", verb:"Forage", hint:"+3🍖" },
  deer:     { icon:"🦌", bg:"#140E04", border:"#3A2808", charges:1, respawn:24,
              wood:0, food:8, stone:0, label:"Wild Deer",      verb:"Hunt",   hint:"+8🍖" },
  fish:     { icon:"🐟", bg:"#040E18", border:"#0A2840", charges:2, respawn:18,
              wood:0, food:5, stone:0, label:"Fishing Hole",   verb:"Fish",   hint:"+5🍖" },
};

export const NODE_POOL = [
  ...Array(10).fill("tree"),  ...Array(7).fill("grove"),
  ...Array(8).fill("rock"),   ...Array(3).fill("ore"),
  ...Array(7).fill("berry"),  ...Array(5).fill("mushroom"),
  ...Array(4).fill("deer"),   ...Array(3).fill("fish"),
];

// ═══════════════════════════════════════════════════════════════════════════
//  BUILDING DEFINITIONS
//  Grid cells store { id, level } — level 1-3
// ═══════════════════════════════════════════════════════════════════════════
export const BLDG = {
  hut:       { name:"Hut",         icon:"🏠", bg:"#5C3317", border:"#8B5230",
               housing:4, housingPerLevel:4, workers:0, food:0, wood:0, stone:0, cw:5,  cs:2  },
  bonfire:   { name:"Bonfire",     icon:"🔥", bg:"#7A2000", border:"#CC4400",
               housing:0, workers:2, food:1, wood:0, stone:0, cw:8,  cs:0  },
  woodCamp:  { name:"Wood Camp",   icon:"🪵", bg:"#1E4A10", border:"#3A8020",
               housing:0, workers:2, food:0, wood:2, stone:0, cw:10, cs:5  },
  quarry:    { name:"Quarry",      icon:"⛏️",  bg:"#2A2A2A", border:"#606060",
               housing:0, workers:3, food:0, wood:0, stone:2, cw:5,  cs:10 },
  hunt:      { name:"Hunt Grounds",icon:"🏹", bg:"#0E3A0E", border:"#226022",
               housing:0, workers:2, food:2, wood:0, stone:0, cw:15, cs:5,  tech:"huntingGrounds" },
  forester:  { name:"Forester",    icon:"🌲", bg:"#0A4020", border:"#1A7040",
               housing:0, workers:3, food:0, wood:3, stone:0, cw:5,  cs:15, tech:"foresterGuild"  },
  fishery:   { name:"Fishery",     icon:"🎣", bg:"#041830", border:"#0A4070",
               housing:0, workers:3, food:3, wood:0, stone:0, cw:15, cs:10, tech:"netFishing"     },
  berryFarm: { name:"Berry Farm",  icon:"🫐", bg:"#1A0828", border:"#502870",
               housing:0, workers:1, food:2, wood:0, stone:0, cw:8,  cs:5,  tech:"irrigation"     },
  granary:     { name:"Granary",        icon:"🏚️", bg:"#2A1A0A", border:"#5A3A18",
               housing:0, housingPerLevel:0, workers:2, food:0, wood:0, stone:0, hides:0,
               cw:12, cs:8  },
  warehouse:   { name:"Warehouse",      icon:"📦", bg:"#1A1A0A", border:"#4A4A20",
               housing:0, housingPerLevel:0, workers:2, food:0, wood:0, stone:0, hides:0,
               cw:15, cs:10 },
  ritualCircle:{ name:"Ritual Circle",  icon:"🔵", bg:"#0A0A2A", border:"#2A2A70",
               housing:0, housingPerLevel:0, workers:0, food:0, wood:0, stone:0, hides:0,
               cw:15, cs:20, unlocksBranch:"ancestralMemory" },
  tanningHut:  { name:"Tanning Hut",    icon:"🪶", bg:"#1A0E08", border:"#4A2A10",
               housing:0, housingPerLevel:0, workers:2, food:0, wood:0, stone:0, hides:1,
               cw:10, cs:6  },
  herbGarden:  { name:"Herb Garden",    icon:"🌿", bg:"#061A06", border:"#1A5020",
               housing:0, housingPerLevel:0, workers:1, food:0, wood:0, stone:0, hides:0,
               cw:8,  cs:5,  growthBonus:0.5 },
  spiritTrap:  { name:"Spirit Trap",    icon:"🕸️", bg:"#1A0A1A", border:"#4A1A4A",
               housing:0, housingPerLevel:0, workers:1, food:0, wood:0, stone:0, hides:0,
               cw:12, cs:8,  counters:"toyol" },
  temple:      { name:"Temple",         icon:"🏯", bg:"#1A1208", border:"#504020",
               housing:0, housingPerLevel:0, workers:2, food:0, wood:0, stone:0, hides:0,
               cw:20, cs:15, counters:"orangMinyak" },
  eldersLodge: { name:"Elder's Lodge",  icon:"🏛️", bg:"#120808", border:"#402020",
               housing:0, housingPerLevel:0, workers:3, food:0, wood:0, stone:0, hides:0,
               cw:20, cs:15, extraResearchSlot:true },
};

// ═══════════════════════════════════════════════════════════════════════════
//  TECH TREE — 18 technologies in five groups
// ═══════════════════════════════════════════════════════════════════════════
export const TECH_GROUPS = ["unlock", "mastery", "logistics", "ancestralMemory", "nusantaraFolklore"];
export const TECH = {
  // group: unlock
  huntingGrounds:  { name:"Hunting Grounds",  icon:"🏹", group:"unlock",
                     desc:"Unlocks Hunt Grounds · +2🍖/t per worker pair", cw:20, cs:10 },
  foresterGuild:   { name:"Forester Guild",   icon:"🌲", group:"unlock",
                     desc:"Unlocks Forester   · +3🪵/t, 3 workers", cw:10, cs:20 },
  netFishing:      { name:"Net Fishing",      icon:"🎣", group:"unlock",
                     desc:"Unlocks Fishery    · +3🍖/t, 3 workers", cw:15, cs:8  },
  irrigation:      { name:"Irrigation",       icon:"💧", group:"unlock",
                     desc:"Unlocks Berry Farm · +2🍖/t, 1 worker",  cw:12, cs:15 },
  // group: mastery
  toolCrafting:    { name:"Tool Crafting",    icon:"🔧", group:"mastery",
                     desc:"+25% all building production output",      cw:30, cs:25 },
  stoneMasonry:    { name:"Stone Masonry",    icon:"🏛️",  group:"mastery",
                     desc:"-30% all construction & upgrade costs",    cw:25, cs:35 },
  animalHusbandry: { name:"Animal Husbandry",icon:"🐄", group:"mastery",
                     desc:"+2 free food/tick (no workers required)",  cw:22, cs:12 },
  hideTanning:    { name:"Hide Tanning",     icon:"🪶", group:"mastery",
                    desc:"+50% hides per Tanning Hut",                cw:20, cs:15, ch:10 },
  preservation:   { name:"Preservation",    icon:"🧊", group:"mastery",
                    desc:"+25% food cap, slows drought trigger",       cw:18, cs:10 },
  // group: logistics (requires warehouse on grid)
  surplusStorage: { name:"Surplus Storage", icon:"📦", group:"logistics",
                    desc:"+40 to all storage caps",                    cw:25, cs:20, req:"warehouse" },
  tradeRoutes:    { name:"Trade Routes",    icon:"🛤️",  group:"logistics",
                    desc:"Unlocks wandering trader visits",            cw:35, cs:15, ch:8, req:"warehouse" },
  stockpiling:    { name:"Stockpiling",     icon:"⚖️",  group:"logistics",
                    desc:"Resources above 80% cap generate orichalcum trace", cw:40, cs:30, req:"warehouse" },
  // group: ancestralMemory (requires ritualCircle on grid)
  ancestorWorship:{ name:"Ancestor Worship",icon:"🪦", group:"ancestralMemory",
                    desc:"+10% pop growth, unlock lore events",        cw:20, cs:25, req:"ritualCircle" },
  riteOfSeasons:  { name:"Rite of Seasons", icon:"🌀", group:"ancestralMemory",
                    desc:"-40% drought frequency",                     cw:30, cs:20, ch:12, req:"ritualCircle" },
  visionQuest:    { name:"Vision Quest",    icon:"👁️",  group:"ancestralMemory",
                    desc:"Reveals a random future event 20 ticks early", cw:25, cs:35, ch:15, req:"ritualCircle" },
  // group: nusantaraFolklore
  bomohArchetype: { name:"Bomoh Archetype", icon:"🔮", group:"nusantaraFolklore",
                    desc:"+34% stability — drought + nocturnal threat resistance", cw:30, cs:25, ch:15,
                    req:"ritualCircle",
                    enkiLog:"LOG: System Stabiliser active. This genetic signature is invariant across all viable paths." },
  toyolPact:      { name:"Toyol Pact",      icon:"👁️",  group:"nusantaraFolklore",
                    desc:"+15% gather yield from depleted nodes",      cw:25, cs:20, ch:12,
                    req:"spiritTrap",
                    enkiLog:"LOG: Anomalous resource recovery. No evolutionary explanation. Flagged." },
  orangBunianContact:{ name:"Orang Bunian Contact", icon:"✨", group:"nusantaraFolklore",
                    desc:"Unlocks rare Night Market trader tier",       cw:35, cs:30, ch:20,
                    req:"temple",
                    enkiLog:"LOG: Cultural exchange archetype. Present only in high-complexity DNA paths." },
};

// ═══════════════════════════════════════════════════════════════════════════
//  NOCTURNAL THREAT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════
export const THREAT_DEF = {
  toyol: {
    icon: "👁️", name: "Toyol",
    spawnChance: 0.004, // per tick at night
    stealRate: { food: 2, wood: 2 },
    duration: 8,
    counter: "spiritTrap",
    enkiLog: "LOG: Bio-drone remnant detected. Anunnaki resource audit protocol active.",
  },
  orangMinyak: {
    icon: "🫥", name: "Orang Minyak",
    spawnChance: 0.002,
    tileBlock: true,
    duration: 20,
    counter: "temple",
    enkiLog: "LOG: Unstable genetic template detected. Prototype still active on legacy code.",
  },
  whisperStorm: {
    icon: "🌀", name: "Whisper Storm",
    spawnChance: 0.001,
    efficiencyDrain: 0.5,
    duration: 1, // lasts 1 tick, sets whisperActive for next tick
    counter: "shaman", // any shaman-staffed building present
    enkiLog: "LOG: Anunnaki Memory Pulse detected. Ancestral trauma broadcasting from genome.",
  },
};

// ═══════════════════════════════════════════════════════════════════════════
//  NIGHT MARKET
// ═══════════════════════════════════════════════════════════════════════════
export const MARKET_ITEMS = [
  { id:"foodBundle",   label:"Salted Provisions",   icon:"🍖",
    gives:{ food:20 },        costs:{ wood:15 } },
  { id:"woodBundle",   label:"Timber Cache",         icon:"🪵",
    gives:{ wood:20 },        costs:{ food:15 } },
  { id:"stoneBundle",  label:"Quarried Blocks",      icon:"🪨",
    gives:{ stone:20 },       costs:{ wood:12 } },
  { id:"hidesBundle",  label:"Cured Hides",          icon:"🪶",
    gives:{ hides:15 },       costs:{ food:10 } },
  { id:"anunnakiShard",label:"Anunnaki Shard",        icon:"💠",
    gives:{ hides:5, stone:5 }, costs:{ food:20, wood:10 },
    rare: true,
    enkiLog:"LOG: Artifact predates simulation timeline by 4,000 years. Flagged as Deep-Layer Exchange." },
];

function generateMarketOffers(tech) {
  const pool = tech?.orangBunianContact ? MARKET_ITEMS : MARKET_ITEMS.slice(0, 4);
  // Fisher-Yates shuffle
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 3);
}

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════════════
export const f1      = n => (isNaN(n)||!isFinite(n)) ? 0 : Math.round(n * 10) / 10;
export const sign    = n => (n >= 0 ? "+" : "") + f1(n);
export const logPush = (log, msg) => [msg, ...log].slice(0, MAX_LOG);
export const nodeKey = (r, c) => `${r},${c}`;

// Cost to upgrade a building to toLvl (2 or 3)
export function upgCost(b, toLvl, masonry) {
  const factor = toLvl === 2 ? 2.2 : 4.5;
  const disc   = masonry ? 0.7 : 1.0;
  return {
    cw: Math.max(10, Math.ceil(b.cw * factor * disc)),
    cs: Math.max(8,  Math.ceil(b.cs * factor * disc)),
  };
}

// True workers a building needs at a given level
export const bldgWorkers = (b, level) => b.workers + LV_XWORK[level - 1];
// Production rate of a building at a given level (unscaled, before workers)
export const bldgRate    = (b, key, level) => b[key] * LV_MULT[level - 1];
// Housing a building provides at a given level
export const bldgHousing = (b, level) => b.housing + (b.housingPerLevel || 0) * (level - 1);

export function mkGrid() {
  const g = Array.from({ length: GH }, () => Array(GW).fill(null));
  g[0][0] = { id:"hut", level:1 }; g[0][1] = { id:"hut", level:1 };
  g[1][0] = { id:"bonfire", level:1 };
  return g;
}

export function mkNodes() {
  const blocked = new Set(["0,0","0,1","1,0"]);
  const nodes   = {};
  const pool    = [...NODE_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  let placed = 0;
  for (let i = 0; i < pool.length * 8 && placed < pool.length; i++) {
    const r = Math.floor(Math.random() * GH);
    const c = Math.floor(Math.random() * GW);
    const k = nodeKey(r, c);
    if (!blocked.has(k) && !nodes[k]) {
      nodes[k] = { type: pool[placed], charges: NODE_DEF[pool[placed]].charges, respawnAt: null };
      blocked.add(k); placed++;
    }
  }
  return nodes;
}

export function calcCaps(grid, tech = {}) {
  let food = DEFAULT_CAPS.food + (tech.surplusStorage ? 40 : 0) + (tech.preservation ? Math.ceil(DEFAULT_CAPS.food * 0.25) : 0);
  let wood = DEFAULT_CAPS.wood + (tech.surplusStorage ? 40 : 0);
  let stone = DEFAULT_CAPS.stone + (tech.surplusStorage ? 40 : 0);
  let hides = DEFAULT_CAPS.hides + (tech.surplusStorage ? 40 : 0);
  for (let r = 0; r < GH; r++) {
    for (let c = 0; c < GW; c++) {
      const cell = grid[r][c]; if (!cell) continue;
      if (cell.id === 'granary')   food  += 60 * LV_MULT[cell.level - 1];
      if (cell.id === 'warehouse') {
        wood  += 80 * LV_MULT[cell.level - 1];
        stone += 80 * LV_MULT[cell.level - 1];
        hides += 60 * LV_MULT[cell.level - 1];
      }
    }
  }
  return { food: Math.ceil(food), wood: Math.ceil(wood), stone: Math.ceil(stone), hides: Math.ceil(hides) };
}

// Aggregate stats + per-building breakdown
export function calcStats(st) {
  let housing = BASE_HOUSING, workNeeded = 0;
  let rawFood = 0, rawWood = 0, rawStone = 0, rawHides = 0;
  const bldgBreakdown = {};

  // Mutable copy of role pools
  const rolePool = { ...(st.roles || { gatherer:0, woodcutter:0, mason:0, hunter:0, shaman:0 }) };
  // Idle settlers (not assigned to any role) — they can fill any role at 50% efficiency
  const totalAssigned = Object.values(rolePool).reduce((a, b) => a + b, 0);
  let idlePool = Math.max(0, st.pop - totalAssigned);

  for (let r = 0; r < GH; r++) {
    for (let c = 0; c < GW; c++) {
      const cell = st.grid[r][c]; if (!cell) continue;
      const { id, level } = cell;
      const b = BLDG[id]; if (!b) continue;
      const needWorkers = bldgWorkers(b, level);
      const preferredRole = BLDG_ROLE[id];
      workNeeded += needWorkers;
      housing += bldgHousing(b, level);

      // Staff building: preferred role first, then idle at 50% efficiency
      let staffedPref = 0, staffedIdle = 0;
      if (needWorkers > 0 && preferredRole && rolePool[preferredRole] > 0) {
        staffedPref = Math.min(rolePool[preferredRole], needWorkers);
        rolePool[preferredRole] -= staffedPref;
      }
      const remaining = needWorkers - staffedPref;
      if (remaining > 0 && idlePool > 0) {
        staffedIdle = Math.min(idlePool, remaining);
        idlePool -= staffedIdle;
      }

      const efficiency = needWorkers > 0
        ? (staffedPref * (ROLES[preferredRole]?.mult || 1.0) + staffedIdle * 0.5) / needWorkers
        : 1.0;

      rawFood  += bldgRate(b, "food",  level) * efficiency;
      rawWood  += bldgRate(b, "wood",  level) * efficiency;
      rawStone += bldgRate(b, "stone", level) * efficiency;
      rawHides += (b.hides || 0) * LV_MULT[level - 1] * efficiency;

      if (!bldgBreakdown[id]) bldgBreakdown[id] = { count:0, workers:0, food:0, wood:0, stone:0, hides:0, housing:0, levels:[] };
      bldgBreakdown[id].count++;
      bldgBreakdown[id].workers  += needWorkers;
      bldgBreakdown[id].food     += bldgRate(b,"food",level)   * efficiency;
      bldgBreakdown[id].wood     += bldgRate(b,"wood",level)   * efficiency;
      bldgBreakdown[id].stone    += bldgRate(b,"stone",level)  * efficiency;
      bldgBreakdown[id].hides    += (b.hides||0) * LV_MULT[level-1] * efficiency;
      bldgBreakdown[id].housing  += bldgHousing(b,level);
      bldgBreakdown[id].levels.push(level);
    }
  }

  const employed   = st.pop - idlePool;  // workers actually working
  const scale      = workNeeded > 0 ? Math.min(1, employed / workNeeded) : 0;
  const dMult      = (st.drought?.active) ? 0.5 : 1.0;
  const tMult      = st.tech?.toolCrafting ? 1.25 : 1.0;
  const hideMult   = st.tech?.hideTanning  ? 1.5  : 1.0;
  const passFood   = st.tech?.animalHusbandry ? 2 : 0;

  const effFood    = rawFood  * dMult * tMult + passFood;
  const effWood    = rawWood  * tMult;
  const effStone   = rawStone * tMult;
  const hidesRate  = rawHides * tMult * hideMult;
  const consume    = st.pop * FOOD_PER_POP;

  const wMult = st.whisperActive ? 0.5 : 1.0;

  return {
    housing, workNeeded, employed, scale,
    foodProd: effFood * wMult, woodRate: effWood * wMult, stoneRate: effStone * wMult, hidesRate: hidesRate * wMult,
    consume, netFood: effFood * wMult - consume, passFood,
    bldgBreakdown, rawFood, rawWood, rawStone,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  TICK
// ═══════════════════════════════════════════════════════════════════════════
export function doTick(st) {
  const { res, pop, drought, tick: t } = st;
  const s = calcStats(st);
  let L = st.log, nodes = st.nodes;

  // Respawn depleted nodes
  const toRespawn = Object.entries(nodes).filter(([,n]) => n.respawnAt !== null && n.respawnAt <= t);
  if (toRespawn.length) {
    nodes = { ...nodes };
    for (const [k, n] of toRespawn) nodes[k] = { ...n, charges: NODE_DEF[n.type].charges, respawnAt: null };
  }

  // Resources
  let food  = Math.max(0, f1(res.food  + s.netFood));
  let wood  = Math.max(0, f1(res.wood  + s.woodRate));
  let stone = Math.max(0, f1(res.stone + s.stoneRate));

  // ── Day phase ────────────────────────────────────────────────────────────
  const dayPhase = (t * TICK_MS / DAY_MS) % 1;
  const isNight  = dayPhase < 0.25 || dayPhase > 0.75;

  // ── Tick down and expire threats ─────────────────────────────────────────
  let threats = (st.threats || [])
    .map(th => ({ ...th, ticks: th.ticks - 1 }))
    .filter(th => th.ticks > 0);

  // ── Toyol: steal resources ────────────────────────────────────────────────
  const hasToyol      = threats.some(th => th.type === 'toyol');
  const hasSpiritTrap = gridHasBuilding(st.grid, 'spiritTrap');
  // Bomoh tech halves all threat chances
  const bomohActive   = st.tech.bomohArchetype || false;

  if (hasToyol && !hasSpiritTrap && !bomohActive) {
    food = Math.max(0, food - THREAT_DEF.toyol.stealRate.food);
    wood = Math.max(0, wood - THREAT_DEF.toyol.stealRate.wood);
  }

  // ── Whisper Storm: set flag for next tick ─────────────────────────────────
  const hasWhisper    = threats.some(th => th.type === 'whisperStorm');
  const hasShamanBldg = gridHasBuilding(st.grid, 'spiritTrap') ||
                        gridHasBuilding(st.grid, 'ritualCircle') ||
                        gridHasBuilding(st.grid, 'temple');
  const whisperActive = hasWhisper && !hasShamanBldg && !bomohActive;

  // ── Spawn new threats (night only) ────────────────────────────────────────
  if (isNight) {
    Object.entries(THREAT_DEF).forEach(([type, def]) => {
      const alreadyActive = threats.some(th => th.type === type);
      if (!alreadyActive && Math.random() < (bomohActive ? def.spawnChance * 0.5 : def.spawnChance)) {
        threats.push({ type, ticks: def.duration });
        L = logPush(L, `${def.icon} ${def.name} approaches! ${def.enkiLog}`);
      }
    });
  }

  // Apply storage caps
  const caps = calcCaps(st.grid, st.tech);
  food  = Math.min(food,  caps.food);
  wood  = Math.min(wood,  caps.wood);
  stone = Math.min(stone, caps.stone);
  let hides = Math.min(Math.max(0, f1(res.hides + s.hidesRate)), caps.hides);

  // Drought
  let da = drought.active, dt = drought.ticks, famine = false;
  if (da) { dt--; if (dt <= 0) { da=false; dt=0; famine=true; L=logPush(L,"☀️ Drought breaks… famine follows."); } }
  const droughtThreshold = st.tech.preservation ? Math.floor(DROUGHT_FOOD * 0.6) : DROUGHT_FOOD;
  if (!da && food < droughtThreshold) { da=true; dt=DROUGHT_LEN; L=logPush(L,`🌵 DROUGHT! Food halved for ${DROUGHT_LEN} ticks!`); }

  // Population
  let p = pop;
  if (famine) { p=Math.max(1,Math.ceil(p*0.9)); if (p<pop) L=logPush(L,`☠️ FAMINE — population: ${p}!`); }
  else if (food===0 && p>1 && t%3===0) { p--; L=logPush(L,`💀 Starvation! Pop: ${p}`); }
  else if (food>0 && p<s.housing && t%5===0) { p++; L=logPush(L,`👶 New settler! Pop: ${p}`); }

  if (p!==pop && p===10) L=logPush(L,"🏛️ A growing tribe — 10 souls!");
  if (p!==pop && p===20) L=logPush(L,"⚔️ Settlement swells to 20!");
  if (wood >100&&res.wood <=100) L=logPush(L,"🪵 Lumber stores overflow!");
  if (stone>100&&res.stone<=100) L=logPush(L,"🪨 Stone reserves grow immense!");

  // ── Night Market ──────────────────────────────────────────────────────────
  const coverage = calcGenomicCoverage(st);
  let nightMarket = st.nightMarket || { unlocked: false, open: false, offers: [] };

  if (!nightMarket.unlocked && coverage >= 60) {
    nightMarket = { ...nightMarket, unlocked: true };
    L = logPush(L, "🌙 Night Market unlocked — opens at nightfall.");
  }

  if (nightMarket.unlocked) {
    const nowOpen = isNight; // isNight already computed earlier in doTick
    // Refresh offers when market transitions to open
    if (nowOpen && !nightMarket.open) {
      nightMarket = { ...nightMarket, open: true, offers: generateMarketOffers(st.tech) };
    } else if (!nowOpen && nightMarket.open) {
      nightMarket = { ...nightMarket, open: false };
    }
  }

  // Genetic marker accumulation every 10 ticks
  let markers = st.markers || { combatReflex: 0, orichalcumTuning: 0, systemCoherence: 0 };
  if (t % 10 === 0 && st.pop > 0) {
    const roles = st.roles || {};
    const hunterFrac  = (roles.hunter  || 0) / st.pop;
    const builderFrac = ((roles.mason  || 0) + (roles.woodcutter || 0)) / st.pop;
    const shamanFrac  = (roles.shaman  || 0) / st.pop;
    markers = {
      combatReflex:     f1(markers.combatReflex     + (hunterFrac  > 0.3 ? 0.1 : 0)),
      orichalcumTuning: f1(markers.orichalcumTuning + (builderFrac > 0.4 ? 0.1 : 0)),
      systemCoherence:  f1(markers.systemCoherence  + (shamanFrac  > 0.1 ? 0.1 : 0)),
    };
  }

  return { ...st, res:{food,wood,stone,hides}, pop:p, log:L, nodes,
           drought:{active:da,ticks:dt}, tick:t+1,
           threats, whisperActive, dayPhase, markers, nightMarket };
}

// ═══════════════════════════════════════════════════════════════════════════
//  HELPERS (game-logic internal)
// ═══════════════════════════════════════════════════════════════════════════
export function gridHasBuilding(grid, id) {
  for (let r = 0; r < GH; r++)
    for (let c = 0; c < GW; c++)
      if (grid[r][c]?.id === id) return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
//  REDUCER
// ═══════════════════════════════════════════════════════════════════════════
export function reducer(st, a) {
  switch (a.type) {
    case "TICK": return doTick(st);

    // ── Gather natural resource ───────────────────────────────────────────
    case "GATHER": {
      const k = nodeKey(a.r,a.c); const node=st.nodes[k];
      if (!node||node.charges<=0||node.respawnAt!==null) return st;
      const def=NODE_DEF[node.type]; const newCh=node.charges-1;
      const nodes={...st.nodes,[k]:{...node,charges:newCh,respawnAt:newCh<=0?st.tick+def.respawn:null}};
      const parts=[];
      if (def.food>0) parts.push(`+${def.food}🍖`);
      if (def.wood>0) parts.push(`+${def.wood}🪵`);
      if (def.stone>0) parts.push(`+${def.stone}🪨`);
      const msg=newCh<=0
        ?`${def.icon} ${def.label} depleted — ${parts.join(" ")} (respawns ~${def.respawn}t)`
        :`${def.icon} ${def.verb}! ${parts.join(" ")} — ${newCh} charge${newCh!==1?"s":""} left`;
      return { ...st, nodes, log:logPush(st.log,msg),
               res:{...st.res, food:f1(st.res.food+def.food), wood:f1(st.res.wood+def.wood), stone:f1(st.res.stone+def.stone)} };
    }

    // ── Place building (or gather if live node) ───────────────────────────
    case "PLACE": {
      if (st.grid[a.r][a.c]) return st;
      const k=nodeKey(a.r,a.c); const node=st.nodes[k];
      if (node&&node.charges>0&&node.respawnAt===null) return reducer(st,{type:"GATHER",r:a.r,c:a.c});
      const b=BLDG[st.sel]; if (!b) return st;
      if (b.tech&&!st.tech[b.tech]) return {...st,log:logPush(st.log,`🔒 ${b.name} requires research!`)};
      const disc=st.tech.stoneMasonry?0.7:1.0;
      const cw=Math.ceil(b.cw*disc), cs=Math.ceil(b.cs*disc);
      if (st.res.wood<cw||st.res.stone<cs) return {...st,log:logPush(st.log,`❌ Need 🪵${cw} 🪨${cs} for ${b.name}`)};
      const g=st.grid.map(r=>[...r]); g[a.r][a.c]={id:st.sel,level:1};
      const nodes={...st.nodes}; delete nodes[k];
      return {...st,grid:g,nodes,res:{...st.res,wood:st.res.wood-cw,stone:st.res.stone-cs},
              log:logPush(st.log,`🏗️ ${b.name} built at (${a.c+1},${a.r+1})`)};
    }

    // ── Upgrade building ──────────────────────────────────────────────────
    case "UPGRADE": {
      const cell=st.grid[a.r][a.c]; if (!cell) return st;
      const {id,level}=cell;
      if (level>=MAX_LVL) return {...st,log:logPush(st.log,`⚠️ ${BLDG[id].name} is already max level!`)};
      const b=BLDG[id]; const toLvl=level+1;
      const cost=upgCost(b,toLvl,st.tech.stoneMasonry);
      if (st.res.wood<cost.cw||st.res.stone<cost.cs)
        return {...st,log:logPush(st.log,`❌ Need 🪵${cost.cw} 🪨${cost.cs} to upgrade ${b.name}`)};
      const g=st.grid.map(r=>[...r]); g[a.r][a.c]={id,level:toLvl};
      const newW=bldgWorkers(b,toLvl);
      const prodLabel=b.food>0?`+${f1(bldgRate(b,"food",toLvl))}🍖/t`
        :b.wood>0?`+${f1(bldgRate(b,"wood",toLvl))}🪵/t`
        :b.stone>0?`+${f1(bldgRate(b,"stone",toLvl))}🪨/t`
        :b.housing>0?`+${bldgHousing(b,toLvl)} housing`
        :b.hides>0?`+${f1(b.hides * LV_MULT[toLvl-1])}🪶/t`
        :"";
      return {...st,grid:g,res:{...st.res,wood:st.res.wood-cost.cw,stone:st.res.stone-cost.cs},
              log:logPush(st.log,`⬆️ ${b.name} → Level ${LV_ROM[toLvl-1]} · ${prodLabel} · 👷${newW} workers`)};
    }

    // ── Demolish building or clear node ───────────────────────────────────
    case "DEMO": {
      const k=nodeKey(a.r,a.c);
      if (st.grid[a.r][a.c]) {
        const nm=BLDG[st.grid[a.r][a.c].id]?.name;
        const g=st.grid.map(r=>[...r]); g[a.r][a.c]=null;
        return {...st,grid:g,log:logPush(st.log,`🔨 ${nm} torn down`)};
      }
      if (st.nodes[k]&&st.nodes[k].respawnAt===null) {
        const def=NODE_DEF[st.nodes[k].type];
        const nodes={...st.nodes}; delete nodes[k];
        return {...st,nodes,log:logPush(st.log,`🪓 ${def.label} cleared`)};
      }
      return st;
    }

    case "SELECT":   return { ...st, sel: a.id };
    case "PAUSE":    return { ...st, paused: !st.paused };
    case "SPEED":    return { ...st, speed: a.v };

    case "RESEARCH": {
      const tech = TECH[a.id]; if (!tech || st.tech[a.id]) return st;
      if (tech.req && !gridHasBuilding(st.grid, tech.req))
        return { ...st, log: logPush(st.log, `🔒 ${tech.name} requires ${BLDG[tech.req]?.name || tech.req}`) };
      const disc = st.tech.stoneMasonry ? 0.7 : 1.0;
      const cw = Math.ceil((tech.cw || 0) * disc);
      const cs = Math.ceil((tech.cs || 0) * disc);
      const ch = tech.ch || 0;
      if (st.res.wood < cw || st.res.stone < cs || st.res.hides < ch)
        return { ...st, log: logPush(st.log, `❌ Need 🪵${cw} 🪨${cs}${ch ? ` 🪶${ch}` : ""} for ${tech.name}`) };
      const msg = tech.enkiLog
        ? `🔬 ${tech.name} decoded. ${tech.enkiLog}`
        : `🔬 ${tech.name} — ancestral pathway recovered.`;
      return {
        ...st,
        tech: { ...st.tech, [a.id]: true },
        res: { ...st.res, wood: st.res.wood - cw, stone: st.res.stone - cs, hides: st.res.hides - ch },
        log: logPush(st.log, msg),
      };
    }

    case "SET_ROLE": {
      if (a.delta === 0) return st;
      const newVal = Math.max(0, (st.roles[a.role] || 0) + a.delta);
      let newRoles = { ...st.roles, [a.role]: newVal };
      let total = Object.values(newRoles).reduce((x, y) => x + y, 0);
      // If total exceeds pop, clamp by reducing other roles (largest first)
      while (total > st.pop) {
        const others = Object.entries(newRoles)
          .filter(([k, v]) => k !== a.role && v > 0)
          .sort((x, y) => y[1] - x[1]);
        if (!others.length) {
          // Can't reduce others — cap the target role itself
          newRoles = { ...newRoles, [a.role]: Math.max(0, newRoles[a.role] - (total - st.pop)) };
          break;
        }
        const [reduceKey] = others[0];
        newRoles = { ...newRoles, [reduceKey]: newRoles[reduceKey] - 1 };
        total--;
      }
      return { ...st, roles: newRoles };
    }

    case "BUY_MARKET": {
      const nm = st.nightMarket;
      if (!nm?.open) return st;
      const offer = nm.offers.find(o => o.id === a.id);
      if (!offer) return st;
      // Check can afford
      const canAfford = Object.entries(offer.costs).every(([k, v]) => (st.res[k] || 0) >= v);
      if (!canAfford)
        return { ...st, log: logPush(st.log, `❌ Cannot afford ${offer.label}`) };
      // Apply transaction
      const newRes = { ...st.res };
      Object.entries(offer.costs).forEach(([k, v]) => { newRes[k] = f1(newRes[k] - v); });
      Object.entries(offer.gives).forEach(([k, v]) => { newRes[k] = f1((newRes[k] || 0) + v); });
      const caps = calcCaps(st.grid, st.tech);
      Object.keys(offer.gives).forEach(k => { newRes[k] = Math.min(newRes[k], caps[k]); });
      const msg = offer.enkiLog
        ? `🌙 ${offer.label} acquired. ${offer.enkiLog}`
        : `🌙 Night Market: traded for ${offer.label}.`;
      return { ...st, res: newRes, log: logPush(st.log, msg) };
    }

    case "NEW_GAME": return initState();
    default: return st;
  }
}

export function initState() {
  const tech = Object.fromEntries(Object.keys(TECH).map(k => [k, false]));
  return {
    res: { food:30, wood:15, stone:8, hides:0 },
    pop: 4, grid: mkGrid(), nodes: mkNodes(), log: [
      "🌅 A new age dawns upon the land…",
      "🌳 Click trees, rocks, berries & deer to gather resources!",
      "🏗️ Build mode: place buildings on empty tiles.",
      "⬆️ Upgrade mode: click a building to level it up.",
      "💡 Higher levels need more workers but produce much more!",
    ],
    tech, drought:{active:false,ticks:0},
    tick:0, paused:false, speed:1, sel:"hut",
    roles:   { gatherer: 2, woodcutter: 1, mason: 1, hunter: 0, shaman: 0 },
    markers: { combatReflex: 0, orichalcumTuning: 0, systemCoherence: 0 },
    threats: [],           // [{ type: string, ticks: number }]
    whisperActive: false,  // true = efficiency halved this tick (from whisperStorm last tick)
    dayPhase: 0.5,         // 0=midnight, 0.5=noon, drives isNight check
    nightMarket: { unlocked: false, open: false, offers: [] },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  GENOMIC COVERAGE
// ═══════════════════════════════════════════════════════════════════════════
export function calcGenomicCoverage(st) {
  // Points system — normalised to 100
  // Buildings: 3pts each (max ~16 buildings * 3 = 48)
  // Techs: 5pts each, folklore techs 8pts each (max 15*5 + 3*8 = 99)
  // Genetic markers: 2pts per unit (slow accumulation)
  // Total possible ~150+ — normalise to 100 with /1.5 divisor

  let pts = 0;

  // Buildings on grid
  for (let r = 0; r < GH; r++)
    for (let c = 0; c < GW; c++)
      if (st.grid[r][c]) pts += 3;

  // Techs researched
  Object.entries(TECH).forEach(([k, def]) => {
    if (st.tech[k]) pts += def.group === 'nusantaraFolklore' ? 8 : 5;
  });

  // Genetic markers
  const m = st.markers || {};
  pts += ((m.combatReflex || 0) + (m.orichalcumTuning || 0) + (m.systemCoherence || 0)) * 2;

  return Math.min(100, Math.round((pts / 150) * 100));
}

// ═══════════════════════════════════════════════════════════════════════════
//  DAY / NIGHT
// ═══════════════════════════════════════════════════════════════════════════
export function calcDayNight(phase) {
  const b = (Math.sin(phase*Math.PI*2-Math.PI/2)+1)/2;
  return {
    bg:`rgb(${Math.round(20+b*38)},${Math.round(12+b*22)},${Math.round(4+b*6)})`,
    over:`rgba(196,124,42,${b*0.13})`,
    b,
    label:b>0.72?"☀️ High Noon":b>0.45?"🌤 Day":b>0.12?"🌆 Dusk":"🌙 Night",
  };
}
