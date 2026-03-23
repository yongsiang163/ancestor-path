# Ancestor Path — Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deepen the Stone Age layer of `stone-age-chronicles.jsx` with population roles, expanded buildings, the Ancestors' Path tech tree, nocturnal threats, genetic markers, genomic coverage, and the Enki Protocol narrative voice.

**Architecture:** All game logic stays in `stone-age-chronicles.jsx` (single-file React + useReducer). Pure functions (calcStats, doTick, reducer) are extracted to `src/game-logic.js` for testability. The React component lives in `src/App.jsx`. Vitest tests pure logic only — no React rendering tests.

**Tech Stack:** React 18, Vite, Vitest, vanilla CSS-in-JS (existing inline styles)

---

## Task 0: Project Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.jsx`
- Move: `stone-age-chronicles.jsx` → `src/App.jsx`
- Create: `src/game-logic.js` (extracted pure functions)
- Create: `src/game-logic.test.js`

**Step 1: Create package.json**

```json
{
  "name": "ancestor-path",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.2",
    "vitest": "^2.1.1"
  }
}
```

**Step 2: Create vite.config.js**

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: { environment: 'node' },
});
```

**Step 3: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Ancestor Path</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 4: Create src/main.jsx**

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
```

**Step 5: Copy stone-age-chronicles.jsx to src/App.jsx**

```bash
cp stone-age-chronicles.jsx src/App.jsx
```

Then add `export default` to the main component function at the bottom of src/App.jsx.

**Step 6: Install dependencies and verify game still runs**

```bash
npm install
npm run dev
```

Expected: game loads in browser at http://localhost:5173, plays identically to before.

**Step 7: Create src/game-logic.js**

Cut these functions out of `src/App.jsx` and paste into `src/game-logic.js` with named exports. Add `import` of them back into App.jsx.

Functions to extract:
- `f1`, `sign`, `logPush`, `nodeKey`
- `upgCost`, `bldgWorkers`, `bldgRate`, `bldgHousing`
- `mkGrid`, `mkNodes`
- `calcStats`
- `doTick`
- `reducer`
- `initState`
- `calcDayNight`
- All constants: `GW`, `GH`, `MAX_LVL`, `BASE_HOUSING`, `TICK_MS`, `DAY_MS`, `MAX_LOG`, `DROUGHT_FOOD`, `DROUGHT_LEN`, `FOOD_PER_POP`, `TILE_PX`, `LV_MULT`, `LV_XWORK`, `LV_ROM`, `NODE_DEF`, `NODE_POOL`, `BLDG`, `TECH_GROUPS`, `TECH`

**Step 8: Write a smoke test to confirm extraction**

In `src/game-logic.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { initState, doTick, calcStats } from './game-logic.js';

describe('initState', () => {
  it('starts with 4 pop and correct resources', () => {
    const st = initState();
    expect(st.pop).toBe(4);
    expect(st.res.food).toBe(30);
    expect(st.res.wood).toBe(15);
    expect(st.res.stone).toBe(8);
  });
});

describe('calcStats', () => {
  it('returns housing >= BASE_HOUSING', () => {
    const st = initState();
    const s = calcStats(st);
    expect(s.housing).toBeGreaterThanOrEqual(4);
  });
});
```

**Step 9: Run tests**

```bash
npm test
```

Expected: 2 passing tests.

**Step 10: Verify game still runs after extraction**

```bash
npm run dev
```

Expected: identical to Step 6.

**Step 11: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold Vite project, extract game logic to game-logic.js"
```

---

## Task 1: Storage Cap System

Pure logic only. No UI yet.

**Files:**
- Modify: `src/game-logic.js`
- Modify: `src/game-logic.test.js`

**Step 1: Write failing tests**

```js
import { initState, doTick, DEFAULT_CAPS } from './game-logic.js';

describe('storage caps', () => {
  it('exports DEFAULT_CAPS with expected values', () => {
    expect(DEFAULT_CAPS.food).toBe(80);
    expect(DEFAULT_CAPS.wood).toBe(100);
    expect(DEFAULT_CAPS.stone).toBe(100);
    expect(DEFAULT_CAPS.hides).toBe(40);
  });

  it('caps food at DEFAULT_CAPS.food when no granary', () => {
    const st = { ...initState(), res: { food: 200, wood: 50, stone: 50, hides: 0 } };
    const next = doTick(st);
    expect(next.res.food).toBeLessThanOrEqual(DEFAULT_CAPS.food);
  });
});
```

**Step 2: Run tests — expect FAIL**

```bash
npm test
```

Expected: "DEFAULT_CAPS is not exported" or similar.

**Step 3: Add DEFAULT_CAPS and hides resource to game-logic.js**

At the top of game-logic.js, add:

```js
export const DEFAULT_CAPS = { food: 80, wood: 100, stone: 100, hides: 40 };
```

Add `hides: 0` to `initState()` res object:
```js
res: { food: 30, wood: 15, stone: 8, hides: 0 },
```

**Step 4: Add calcCaps helper**

```js
export function calcCaps(grid) {
  let food = DEFAULT_CAPS.food, wood = DEFAULT_CAPS.wood,
      stone = DEFAULT_CAPS.stone, hides = DEFAULT_CAPS.hides;
  for (let r = 0; r < GH; r++) {
    for (let c = 0; c < GW; c++) {
      const cell = grid[r][c]; if (!cell) continue;
      if (cell.id === 'granary')   food  += 60 * LV_MULT[cell.level - 1];
      if (cell.id === 'warehouse') { wood += 80 * LV_MULT[cell.level - 1];
                                     stone+= 80 * LV_MULT[cell.level - 1];
                                     hides+= 60 * LV_MULT[cell.level - 1]; }
    }
  }
  return { food: Math.ceil(food), wood: Math.ceil(wood), stone: Math.ceil(stone), hides: Math.ceil(hides) };
}
```

**Step 5: Apply caps in doTick**

In `doTick`, after computing `food`, `wood`, `stone`:

```js
const caps = calcCaps(st.grid);
food  = Math.min(food,  caps.food);
wood  = Math.min(wood,  caps.wood);
stone = Math.min(stone, caps.stone);
let hides = Math.min(f1(res.hides + hidesRate), caps.hides); // hidesRate added in Task 3
```

For now, `hidesRate` = 0. Add `hides` to the returned `res` object:
```js
return { ...st, res: { food, wood, stone, hides }, ... };
```

**Step 6: Run tests — expect PASS**

```bash
npm test
```

**Step 7: Verify browser still works**

```bash
npm run dev
```

**Step 8: Commit**

```bash
git add src/game-logic.js src/game-logic.test.js
git commit -m "feat: add storage caps and hides resource to state"
```

---

## Task 2: New Buildings Data

No logic change. Data only.

**Files:**
- Modify: `src/game-logic.js`

**Step 1: Add 7 new buildings to the BLDG object**

Add after the existing `berryFarm` entry:

```js
granary:    { name:"Granary",       icon:"🏚️", bg:"#2A1A0A", border:"#5A3A18",
              housing:0, workers:2, food:0, wood:0, stone:0, cw:12, cs:8,
              storageCap:"food", tech:null },
warehouse:  { name:"Warehouse",     icon:"📦", bg:"#1A1A0A", border:"#4A4A20",
              housing:0, workers:2, food:0, wood:0, stone:0, cw:15, cs:10,
              storageCap:"wood", tech:null },
ritualCircle:{ name:"Ritual Circle",icon:"🔵", bg:"#0A0A2A", border:"#2A2A70",
              housing:0, workers:0, food:0, wood:0, stone:0, cw:15, cs:20,
              tech:null, unlocksBranch:"ancestralMemory" },
tanningHut: { name:"Tanning Hut",   icon:"🪶", bg:"#1A0E08", border:"#4A2A10",
              housing:0, workers:2, food:0, wood:0, stone:0, hides:1, cw:10, cs:6,
              tech:null },
herbGarden: { name:"Herb Garden",   icon:"🌿", bg:"#061A06", border:"#1A5020",
              housing:0, workers:1, food:0, wood:0, stone:0, cw:8,  cs:5,
              growthBonus:0.5, tech:null },
spiritTrap: { name:"Spirit Trap",   icon:"🕸️", bg:"#1A0A1A", border:"#4A1A4A",
              housing:0, workers:1, food:0, wood:0, stone:0, cw:12, cs:8,
              counters:"toyol", tech:null },
temple:     { name:"Temple",        icon:"🏯", bg:"#1A1208", border:"#504020",
              housing:0, workers:2, food:0, wood:0, stone:0, cw:20, cs:15,
              counters:"orangMinyak", tech:null },
eldersLodge:{ name:"Elder's Lodge", icon:"🏛️", bg:"#120808", border:"#402020",
              housing:0, workers:3, food:0, wood:0, stone:0, cw:20, cs:15,
              extraResearchSlot:true, tech:null },
```

**Step 2: Add hides production to calcStats**

In `calcStats`, add tracking for hides:

```js
let rawHides = 0;
// inside the grid loop:
rawHides += bldgRate(b, "hides", level);
// (add hides:0 to BLDG entries that don't produce it, or use b.hides||0)
```

Return `hidesRate: rawHides * scale * tMult` from calcStats.

**Step 3: Add hides to doTick**

```js
let hides = Math.min(f1(res.hides + s.hidesRate), caps.hides);
```

**Step 4: Write test for tanning hut production**

```js
it('tanning hut produces hides', () => {
  const st = initState();
  // place a tanning hut
  const grid = st.grid.map(r => [...r]);
  grid[5][5] = { id: 'tanningHut', level: 1 };
  const next = doTick({ ...st, grid, pop: 10 });
  expect(next.res.hides).toBeGreaterThan(0);
});
```

**Step 5: Run tests**

```bash
npm test
```

Expected: all passing.

**Step 6: Add new buildings to RES_META in App.jsx**

```js
const RES_META = [
  { k:"food",  e:"🍖", label:"Food"  },
  { k:"wood",  e:"🪵", label:"Wood"  },
  { k:"stone", e:"🪨", label:"Stone" },
  { k:"hides", e:"🪶", label:"Hides" },
];
```

**Step 7: Verify browser — new buildings should appear in build panel**

```bash
npm run dev
```

Expected: Granary, Warehouse, Ritual Circle, etc. visible in the build panel.

**Step 8: Commit**

```bash
git add src/game-logic.js src/App.jsx src/game-logic.test.js
git commit -m "feat: add 7 new Stone Age buildings and hides resource"
```

---

## Task 3: The Ancestors' Path — Expanded Tech Tree

**Files:**
- Modify: `src/game-logic.js`
- Modify: `src/game-logic.test.js`
- Modify: `src/App.jsx` (UI rename + new branches)

**Step 1: Write failing test**

```js
it('has 18 techs across 4 branches', () => {
  const branches = Object.values(TECH).map(t => t.group);
  const unique = [...new Set(branches)];
  expect(unique).toContain('unlock');
  expect(unique).toContain('mastery');
  expect(unique).toContain('logistics');
  expect(unique).toContain('ancestralMemory');
  expect(Object.keys(TECH).length).toBe(18);
});
```

**Step 2: Run test — expect FAIL**

```bash
npm test
```

**Step 3: Add 11 new techs to TECH in game-logic.js**

Add to the TECH object after existing 7 entries:

```js
// group: mastery (2 new)
hideTanning:    { name:"Hide Tanning",    icon:"🪶", group:"mastery",
                  desc:"+50% hides per Tanning Hut",               cw:20, cs:15, ch:10 },
preservation:   { name:"Preservation",   icon:"🧊", group:"mastery",
                  desc:"+25% food cap, slows drought trigger",      cw:18, cs:10 },

// group: logistics (3 new — requires warehouse)
surplusStorage: { name:"Surplus Storage",icon:"📦", group:"logistics",
                  desc:"+40 to all storage caps",                   cw:25, cs:20,
                  req:"warehouse" },
tradeRoutes:    { name:"Trade Routes",   icon:"🛤️",  group:"logistics",
                  desc:"Unlocks wandering trader visits",           cw:35, cs:15, ch:8,
                  req:"warehouse" },
stockpiling:    { name:"Stockpiling",    icon:"⚖️",  group:"logistics",
                  desc:"Resources above 80% cap generate orichalcum trace", cw:40, cs:30,
                  req:"warehouse" },

// group: ancestralMemory (3 new — requires ritualCircle + shaman role)
ancestorWorship:{ name:"Ancestor Worship",icon:"🪦", group:"ancestralMemory",
                  desc:"+10% pop growth, unlock lore events",       cw:20, cs:25,
                  req:"ritualCircle" },
riteOfSeasons:  { name:"Rite of Seasons",icon:"🌀", group:"ancestralMemory",
                  desc:"-40% drought frequency",                    cw:30, cs:20, ch:12,
                  req:"ritualCircle" },
visionQuest:    { name:"Vision Quest",   icon:"👁️",  group:"ancestralMemory",
                  desc:"Reveals a random future event 20 ticks early", cw:25, cs:35, ch:15,
                  req:"ritualCircle" },

// group: nusantaraFolklore (3 new — requires shaman role + ritualCircle)
bomohArchetype: { name:"Bomoh Archetype",icon:"🔮", group:"nusantaraFolklore",
                  desc:"+34% stability — drought + nocturnal threat resistance",
                  cw:30, cs:25, ch:15, req:"ritualCircle",
                  enkiLog:"LOG: System Stabiliser active. This genetic signature is invariant across all viable paths." },
toyolPact:      { name:"Toyol Pact",     icon:"👁️",  group:"nusantaraFolklore",
                  desc:"+15% gather yield from depleted nodes",     cw:25, cs:20, ch:12,
                  req:"spiritTrap",
                  enkiLog:"LOG: Anomalous resource recovery. No evolutionary explanation. Flagged." },
orangBunianContact:{ name:"Orang Bunian Contact", icon:"✨", group:"nusantaraFolklore",
                  desc:"Unlocks rare Night Market trader tier",     cw:35, cs:30, ch:20,
                  req:"temple",
                  enkiLog:"LOG: Cultural exchange archetype. Present only in high-complexity DNA paths." },
```

Note: `ch` = cost in hides. Update RESEARCH reducer to deduct `tech.ch` from hides if present.

**Step 4: Update TECH_GROUPS**

```js
export const TECH_GROUPS = ["unlock","mastery","logistics","ancestralMemory","nusantaraFolklore"];
```

**Step 5: Update RESEARCH reducer to handle hides cost and enkiLog**

In the `RESEARCH` case:
```js
case "RESEARCH": {
  const tech = TECH[a.id]; if (!tech || st.tech[a.id]) return st;
  const disc = st.tech.stoneMasonry ? 0.7 : 1.0;
  const cw = Math.ceil((tech.cw||0) * disc);
  const cs = Math.ceil((tech.cs||0) * disc);
  const ch = tech.ch || 0;
  if (st.res.wood < cw || st.res.stone < cs || st.res.hides < ch)
    return { ...st, log: logPush(st.log, `❌ Need 🪵${cw} 🪨${cs}${ch?` 🪶${ch}`:""} for ${tech.name}`) };
  // Check building prerequisite
  if (tech.req && !gridHasBuilding(st.grid, tech.req))
    return { ...st, log: logPush(st.log, `🔒 ${tech.name} requires ${BLDG[tech.req]?.name || tech.req}`) };
  const msg = tech.enkiLog
    ? `🔬 ${tech.name} decoded. ${tech.enkiLog}`
    : `🔬 ${tech.name} discovered — ancestral pathway recovered.`;
  return { ...st, tech: { ...st.tech, [a.id]: true },
           res: { ...st.res, wood: st.res.wood-cw, stone: st.res.stone-cs, hides: st.res.hides-ch },
           log: logPush(st.log, msg) };
}
```

Add helper:
```js
function gridHasBuilding(grid, id) {
  return grid.some(row => row.some(cell => cell?.id === id));
}
```

**Step 6: Run tests**

```bash
npm test
```

Expected: 18-tech test passes.

**Step 7: Rename "Research" to "The Ancestors' Path" in App.jsx**

Find the section header text `Research` or `RESEARCH` in the UI and update to `The Ancestors' Path`. Update the `<PH>` component usage. Group the 5 tech branches in the UI panel with their group labels.

**Step 8: Verify browser — all 5 tech branches visible**

```bash
npm run dev
```

**Step 9: Commit**

```bash
git add src/game-logic.js src/App.jsx src/game-logic.test.js
git commit -m "feat: expand tech tree to 18 techs in 5 branches, rename to The Ancestors' Path"
```

---

## Task 4: Population Roles System — Logic

**Files:**
- Modify: `src/game-logic.js`
- Modify: `src/game-logic.test.js`

**Step 1: Write failing tests**

```js
import { initState, calcStats, ROLES } from './game-logic.js';

describe('population roles', () => {
  it('exports 5 ROLES', () => {
    expect(Object.keys(ROLES).length).toBe(5);
    expect(ROLES).toHaveProperty('gatherer');
    expect(ROLES).toHaveProperty('woodcutter');
    expect(ROLES).toHaveProperty('mason');
    expect(ROLES).toHaveProperty('hunter');
    expect(ROLES).toHaveProperty('shaman');
  });

  it('initState includes roles assignment', () => {
    const st = initState();
    expect(st.roles).toBeDefined();
    expect(Object.values(st.roles).reduce((a,b)=>a+b, 0)).toBe(st.pop);
  });

  it('hunter-dominant play accumulates Combat Reflex marker', () => {
    const st = initState();
    const grid = st.grid.map(r => [...r]);
    grid[5][5] = { id:'hunt', level:1 };
    const roles = { gatherer:0, woodcutter:0, mason:0, hunter:4, shaman:0 };
    const next = doTick({ ...st, grid, pop:4, roles });
    expect(next.markers.combatReflex).toBeGreaterThan(0);
  });
});
```

**Step 2: Run — expect FAIL**

```bash
npm test
```

**Step 3: Add ROLES constant**

```js
export const ROLES = {
  gatherer:  { name:"Gatherer",   icon:"🧺", works:["bonfire","berryFarm","fishery"],  bonus:"food",  mult:1.10 },
  woodcutter:{ name:"Woodcutter", icon:"🪓", works:["woodCamp","forester"],            bonus:"wood",  mult:1.10 },
  mason:     { name:"Mason",      icon:"⛏️",  works:["quarry","granary","warehouse"],   bonus:"stone", mult:1.10 },
  hunter:    { name:"Hunter",     icon:"🏹", works:["hunt","tanningHut"],              bonus:"food",  mult:1.15 },
  shaman:    { name:"Shaman",     icon:"🔮", works:["ritualCircle","eldersLodge"],     bonus:null,    mult:1.0  },
};

// Which building each role prefers (reverse lookup)
export const BLDG_ROLE = Object.entries(ROLES).reduce((acc, [role, def]) => {
  def.works.forEach(bId => { acc[bId] = role; });
  return acc;
}, {});
```

**Step 4: Add roles and markers to initState**

```js
// In initState():
roles: { gatherer:2, woodcutter:1, mason:1, hunter:0, shaman:0 }, // sums to pop (4)
markers: { combatReflex:0, orichalcumTuning:0, systemCoherence:0 },
```

**Step 5: Refactor calcStats to use per-role worker matching**

Replace the global `employed/workNeeded` scale with role-aware logic:

```js
export function calcStats(st) {
  let housing = BASE_HOUSING, workNeeded = 0;
  let rawFood = 0, rawWood = 0, rawStone = 0, rawHides = 0;
  const bldgBreakdown = {};

  // Build per-role available pool
  const rolePool = { ...st.roles }; // mutable copy

  for (let r = 0; r < GH; r++) {
    for (let c = 0; c < GW; c++) {
      const cell = st.grid[r][c]; if (!cell) continue;
      const { id, level } = cell;
      const b = BLDG[id]; if (!b) continue;
      const needWorkers = bldgWorkers(b, level);
      const preferredRole = BLDG_ROLE[id];
      workNeeded += needWorkers;

      // Staff from preferred role pool, then idle (no role assigned yet)
      let staffed = 0;
      if (preferredRole && rolePool[preferredRole] > 0) {
        const fromRole = Math.min(rolePool[preferredRole], needWorkers);
        rolePool[preferredRole] -= fromRole;
        staffed += fromRole;
      }
      // Remaining slots filled from unassigned (no-op for now, handled via scale)
      const efficiency = needWorkers > 0 ? staffed / needWorkers : 1;
      const roleBonus = preferredRole && ROLES[preferredRole].bonus === 'food'  ? (staffed > 0 ? ROLES[preferredRole].mult : 1) :
                        preferredRole && ROLES[preferredRole].bonus === 'wood'  ? (staffed > 0 ? ROLES[preferredRole].mult : 1) :
                        preferredRole && ROLES[preferredRole].bonus === 'stone' ? (staffed > 0 ? ROLES[preferredRole].mult : 1) : 1;

      housing    += bldgHousing(b, level);
      rawFood    += bldgRate(b, "food",  level) * efficiency * roleBonus;
      rawWood    += bldgRate(b, "wood",  level) * efficiency * roleBonus;
      rawStone   += bldgRate(b, "stone", level) * efficiency * roleBonus;
      rawHides   += (b.hides || 0) * LV_MULT[level-1] * efficiency;

      if (!bldgBreakdown[id]) bldgBreakdown[id] = { count:0, workers:0, food:0, wood:0, stone:0, housing:0, levels:[] };
      bldgBreakdown[id].count++;
      bldgBreakdown[id].workers  += needWorkers;
      bldgBreakdown[id].food     += bldgRate(b,"food",level)  * efficiency;
      bldgBreakdown[id].wood     += bldgRate(b,"wood",level)  * efficiency;
      bldgBreakdown[id].stone    += bldgRate(b,"stone",level) * efficiency;
      bldgBreakdown[id].housing  += bldgHousing(b,level);
      bldgBreakdown[id].levels.push(level);
    }
  }

  const employed  = Math.min(st.pop, workNeeded);
  const scale     = workNeeded > 0 ? employed / workNeeded : 0;
  const dMult     = st.drought.active ? 0.5 : 1.0;
  const tMult     = st.tech.toolCrafting ? 1.25 : 1.0;
  const passFood  = st.tech.animalHusbandry ? 2 : 0;
  const effFood   = rawFood  * dMult * tMult + passFood;
  const effWood   = rawWood  * tMult;
  const effStone  = rawStone * tMult;
  const hidesRate = rawHides;
  const consume   = st.pop * FOOD_PER_POP;

  return {
    housing, workNeeded, employed, scale,
    foodProd: effFood, woodRate: effWood, stoneRate: effStone, hidesRate,
    consume, netFood: effFood - consume, passFood, bldgBreakdown, rawFood, rawWood, rawStone,
  };
}
```

**Step 6: Add marker accumulation to doTick**

After computing stats, accumulate markers each tick (slowly):

```js
// Marker accumulation — once every 10 ticks
let markers = st.markers;
if (t % 10 === 0) {
  const hunterFrac  = st.pop > 0 ? (st.roles.hunter  / st.pop) : 0;
  const builderFrac = st.pop > 0 ? ((st.roles.mason + st.roles.woodcutter) / st.pop) : 0;
  const shamanFrac  = st.pop > 0 ? (st.roles.shaman  / st.pop) : 0;
  markers = {
    combatReflex:     f1(markers.combatReflex     + (hunterFrac  > 0.3 ? 0.1 : 0)),
    orichalcumTuning: f1(markers.orichalcumTuning + (builderFrac > 0.4 ? 0.1 : 0)),
    systemCoherence:  f1(markers.systemCoherence  + (shamanFrac  > 0.1 ? 0.1 : 0)),
  };
}
return { ...st, ..., markers };
```

**Step 7: Add SET_ROLE reducer action**

```js
case "SET_ROLE": {
  // a.role, a.delta (+1 or -1)
  const newVal = Math.max(0, (st.roles[a.role] || 0) + a.delta);
  const total = Object.values({ ...st.roles, [a.role]: newVal }).reduce((x,y)=>x+y,0);
  if (total > st.pop) return st; // can't assign more than pop
  return { ...st, roles: { ...st.roles, [a.role]: newVal } };
}
```

**Step 8: Run tests**

```bash
npm test
```

Expected: all passing.

**Step 9: Commit**

```bash
git add src/game-logic.js src/game-logic.test.js
git commit -m "feat: add population roles system with per-role worker matching and genetic markers"
```

---

## Task 5: Population Roles — Tribe Panel UI

**Files:**
- Modify: `src/App.jsx`

**Step 1: Add Tribe panel component**

Add new sub-component to App.jsx:

```jsx
function TribePanel({ roles, pop, markers, dispatch }) {
  const total = Object.values(roles).reduce((a,b)=>a+b,0);
  const idle  = pop - total;
  return (
    <div style={{ marginBottom:7, padding:"7px 9px",
                  background:"rgba(0,0,0,0.28)", border:"1px solid #1E1008" }}>
      <PH>Tribe · {pop} settlers</PH>
      {Object.entries(ROLES).map(([key, def]) => (
        <div key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                                 marginBottom:3, fontSize:10 }}>
          <span style={{ color:"#C47C2A", width:90 }}>{def.icon} {def.name}</span>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <button onClick={()=>dispatch({type:"SET_ROLE",role:key,delta:-1})}
              style={btnStyle}>−</button>
            <span style={{ color:"#F0A850", width:16, textAlign:"center" }}>{roles[key]}</span>
            <button onClick={()=>dispatch({type:"SET_ROLE",role:key,delta:+1})}
              style={btnStyle}>+</button>
          </div>
        </div>
      ))}
      {idle > 0 && (
        <div style={{ fontSize:9, color:"#5A3A1A", marginTop:3 }}>
          ⚠ {idle} idle settler{idle!==1?"s":""} — assign to roles for full output
        </div>
      )}
      <div style={{ marginTop:5, fontSize:9, color:"#4A3A2A",
                    borderTop:"1px solid #1A0E04", paddingTop:3, display:"flex", gap:8 }}>
        <span title="Combat Reflex">⚔️ {markers.combatReflex}</span>
        <span title="Orichalcum Tuning">💎 {markers.orichalcumTuning}</span>
        <span title="System Coherence">🔮 {markers.systemCoherence}</span>
      </div>
    </div>
  );
}

const btnStyle = {
  width:16, height:16, background:"#1A0E04", border:"1px solid #3A2010",
  color:"#C47C2A", cursor:"pointer", fontSize:10, lineHeight:1,
  display:"flex", alignItems:"center", justifyContent:"center", padding:0,
};
```

**Step 2: Wire TribePanel into the main component**

In the sidebar JSX, add `<TribePanel>` above the buildings breakdown section:

```jsx
<TribePanel roles={roles} pop={pop} markers={markers} dispatch={dispatch} />
```

Destructure `roles` and `markers` from state in the main component.

**Step 3: Verify in browser**

```bash
npm run dev
```

Expected: Tribe panel visible in sidebar with +/− controls for each role. Genetic markers displayed as small icons at the bottom. Idle settler warning when roles don't sum to pop.

**Step 4: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add Tribe panel UI with role assignment and genetic marker display"
```

---

## Task 6: Nocturnal Threat System

**Files:**
- Modify: `src/game-logic.js`
- Modify: `src/game-logic.test.js`
- Modify: `src/App.jsx`

**Step 1: Write failing tests**

```js
import { initState, doTick, spawnThreat } from './game-logic.js';

describe('nocturnal threats', () => {
  it('initState has empty threats array', () => {
    const st = initState();
    expect(st.threats).toEqual([]);
  });

  it('toyol steals resources at night', () => {
    const st = { ...initState(),
      res: { food:50, wood:50, stone:50, hides:10 },
      threats: [{ type:'toyol', tile:null, ticks:5 }],
      dayPhase: 0.1 // night
    };
    const next = doTick(st);
    expect(next.res.food + next.res.wood).toBeLessThan(100);
  });
});
```

**Step 2: Run — expect FAIL**

**Step 3: Add threat state to initState**

```js
threats: [],   // [{ type: 'toyol'|'orangMinyak'|'whisperStorm', tile:[r,c]|null, ticks: number }]
```

**Step 4: Add THREAT_DEF constant**

```js
export const THREAT_DEF = {
  toyol:       { icon:"👁️",  name:"Toyol",        spawnChance:0.004, night:true,
                 stealRate:{ food:2, wood:2 }, duration:8,
                 counter:"spiritTrap",
                 enkiLog:"LOG: Bio-drone remnant detected. Anunnaki resource audit protocol active." },
  orangMinyak: { icon:"🫥", name:"Orang Minyak",  spawnChance:0.002, night:true,
                 tileBlock:true, duration:20,
                 counter:"temple",
                 enkiLog:"LOG: Unstable genetic template detected. Prototype still active on legacy code." },
  whisperStorm:{ icon:"🌀", name:"Whisper Storm",  spawnChance:0.001, night:true,
                 efficiencyDrain:0.5, duration:1,  // lasts 1 tick, effect next day
                 counter:"shaman",
                 enkiLog:"LOG: Anunnaki Memory Pulse detected. Ancestral trauma broadcasting from genome." },
};
```

**Step 5: Add threat logic to doTick**

```js
// Threat spawn (night only — dayPhase < 0.25 or > 0.75)
const isNight = st.dayPhase < 0.25 || st.dayPhase > 0.75;
let threats = st.threats.filter(th => th.ticks > 0).map(th => ({ ...th, ticks: th.ticks - 1 }));

if (isNight && !st.tech.bomohArchetype) {
  Object.entries(THREAT_DEF).forEach(([type, def]) => {
    if (Math.random() < def.spawnChance && !threats.find(t => t.type === type)) {
      threats.push({ type, ticks: def.duration, tile: null });
      L = logPush(L, `${def.icon} ${def.name}! ${def.enkiLog}`);
    }
  });
}

// Toyol: steals resources
const hasToyol = threats.find(t => t.type === 'toyol');
const hasSpiritTrap = gridHasBuilding(st.grid, 'spiritTrap');
if (hasToyol && !hasSpiritTrap) {
  food  = Math.max(0, food  - THREAT_DEF.toyol.stealRate.food);
  wood  = Math.max(0, wood  - THREAT_DEF.toyol.stealRate.wood);
}

// Whisper Storm: efficiency penalty applied via whisperActive flag
const whisperActive = !!threats.find(t => t.type === 'whisperStorm');
// (applied in calcStats via st.whisperActive flag)

return { ...st, ..., threats, whisperActive: whisperActive || false };
```

**Step 6: Connect whisperActive to calcStats**

In calcStats, add:
```js
const wMult = st.whisperActive ? 0.5 : 1.0;
// multiply into effFood, effWood, effStone
```

**Step 7: Add dayPhase to state**

`dayPhase` is currently a local variable in the component computed from `calcDayNight`. Move it into state so doTick can access it:

```js
// In initState:
dayPhase: 0.5,  // starts at noon

// In doTick, update dayPhase:
const dayPhase = (st.tick * TICK_MS / DAY_MS) % 1;
return { ...st, ..., dayPhase };
```

**Step 8: Run tests**

```bash
npm test
```

**Step 9: Add threat indicator to App.jsx**

In the UI, add a small threat display near the top (below stats bar):

```jsx
{threats.length > 0 && (
  <div style={{ padding:"4px 10px", background:"rgba(80,0,0,0.4)",
                border:"1px solid #5A1010", marginBottom:4, fontSize:10,
                color:"#E47272", fontFamily:"'Cinzel',serif" }}>
    {threats.map((t,i) => (
      <span key={i} style={{ marginRight:8 }}>
        {THREAT_DEF[t.type].icon} {THREAT_DEF[t.type].name} ({t.ticks}t)
      </span>
    ))}
  </div>
)}
```

**Step 10: Verify in browser**

```bash
npm run dev
```

Expected: Threats visible in the header area when active. Resources decrease when Toyol is active.

**Step 11: Commit**

```bash
git add src/game-logic.js src/game-logic.test.js src/App.jsx
git commit -m "feat: add nocturnal threat system — Toyol, Orang Minyak, Whisper Storm"
```

---

## Task 7: Genomic Coverage Bar

**Files:**
- Modify: `src/game-logic.js`
- Modify: `src/game-logic.test.js`
- Modify: `src/App.jsx`

**Step 1: Write failing test**

```js
import { calcGenomicCoverage, initState } from './game-logic.js';

describe('genomic coverage', () => {
  it('starts above 0 (starter buildings count)', () => {
    const st = initState();
    expect(calcGenomicCoverage(st)).toBeGreaterThan(0);
  });

  it('increases with more buildings and techs', () => {
    const st1 = initState();
    const st2 = { ...st1, tech: { ...st1.tech, toolCrafting: true } };
    expect(calcGenomicCoverage(st2)).toBeGreaterThan(calcGenomicCoverage(st1));
  });

  it('caps at 100', () => {
    // fully built state
    const st = initState();
    expect(calcGenomicCoverage(st)).toBeLessThanOrEqual(100);
  });
});
```

**Step 2: Run — expect FAIL**

**Step 3: Add calcGenomicCoverage function**

```js
// Coverage weights: buildings = 3pts each, techs = 5pts each, folklore = 8pts each
// Max: 15 buildings × 3 = 45, 18 techs × 5 = 90 → total possible ~135
// Normalise to 100 by dividing by 1.35
export function calcGenomicCoverage(st) {
  const TOTAL = 135;
  let pts = 0;

  // Buildings
  for (let r = 0; r < GH; r++)
    for (let c = 0; c < GW; c++)
      if (st.grid[r][c]) pts += 3;

  // Techs
  Object.keys(TECH).forEach(k => {
    if (st.tech[k]) {
      const group = TECH[k].group;
      pts += group === 'nusantaraFolklore' ? 8 : 5;
    }
  });

  // Genetic markers
  pts += (st.markers.combatReflex + st.markers.orichalcumTuning + st.markers.systemCoherence) * 2;

  return Math.min(100, Math.round((pts / TOTAL) * 100));
}
```

**Step 4: Run tests**

```bash
npm test
```

**Step 5: Add coverage bar to App.jsx**

Add a progress bar component near the top of the sidebar:

```jsx
function CoverageMeter({ coverage }) {
  return (
    <div style={{ marginBottom:7, padding:"6px 9px",
                  background:"rgba(0,0,0,0.28)", border:"1px solid #1E1008" }}>
      <div style={{ display:"flex", justifyContent:"space-between",
                    fontSize:9, color:"#6A4A2A", marginBottom:4 }}>
        <span>ENKI-PROTOCOL // TIER 1 GENOMIC COVERAGE</span>
        <span style={{ color:"#F0A850" }}>{coverage}%</span>
      </div>
      <div style={{ height:4, background:"#1A0E04", borderRadius:2 }}>
        <div style={{ height:"100%", width:`${coverage}%`,
                      background: coverage >= 100 ? "#72E472" : "#C47C2A",
                      borderRadius:2, transition:"width 0.3s" }} />
      </div>
      {coverage >= 100 && (
        <div style={{ fontSize:9, color:"#72E472", marginTop:3, fontFamily:"'Crimson Text',serif" }}>
          ✦ Tier 1 complete — Sumerian Uplift approaching
        </div>
      )}
    </div>
  );
}
```

Wire it in: compute `coverage = calcGenomicCoverage(state)` in the component and render `<CoverageMeter coverage={coverage} />` at the top of the sidebar.

**Step 6: Verify in browser**

```bash
npm run dev
```

Expected: progress bar visible, fills as you build and research.

**Step 7: Commit**

```bash
git add src/game-logic.js src/game-logic.test.js src/App.jsx
git commit -m "feat: add genomic coverage bar — Tier 1 progression indicator"
```

---

## Task 8: Night Market

**Files:**
- Modify: `src/game-logic.js`
- Modify: `src/App.jsx`

**Step 1: Add Night Market state and activation logic**

Night Market unlocks when genomic coverage ≥ 60% AND it is night (dayPhase > 0.75 or < 0.25).

```js
// In initState:
nightMarket: { unlocked: false, open: false, offers: [] },

// In doTick, after coverage calculation:
const coverage = calcGenomicCoverage(st);
const isNight  = st.dayPhase < 0.25 || st.dayPhase > 0.75;
let nightMarket = st.nightMarket;
if (!nightMarket.unlocked && coverage >= 60) {
  nightMarket = { ...nightMarket, unlocked: true };
  L = logPush(L, "🌙 Night Market opens — the Enki Protocol surfaces deep-layer artifacts.");
}
if (nightMarket.unlocked) {
  nightMarket = { ...nightMarket, open: isNight };
  // Refresh offers once per in-game night (when open transitions true)
  if (isNight && !st.nightMarket.open) {
    nightMarket = { ...nightMarket, offers: generateMarketOffers(st) };
  }
}
```

**Step 2: Add generateMarketOffers and MARKET_ITEMS**

```js
const MARKET_ITEMS = [
  { id:"foodBundle",  label:"Salted Provisions",  icon:"🍖", gives:{ food:20 },  costs:{ wood:15 } },
  { id:"woodBundle",  label:"Timber Cache",        icon:"🪵", gives:{ wood:20 },  costs:{ food:15 } },
  { id:"stoneBundle", label:"Quarried Blocks",     icon:"🪨", gives:{ stone:20 }, costs:{ wood:12 } },
  { id:"hidesBundle", label:"Cured Hides",         icon:"🪶", gives:{ hides:15 }, costs:{ food:10 } },
  { id:"anunnakiShard",label:"Anunnaki Shard",     icon:"💠", gives:{ hides:5, stone:5 }, costs:{ food:20, wood:10 },
    enkiLog:"LOG: Artifact predates simulation timeline by 4,000 years. Flagged as Deep-Layer Exchange." },
];

function generateMarketOffers(st) {
  const pool = st.tech.orangBunianContact ? MARKET_ITEMS : MARKET_ITEMS.slice(0, 4);
  return pool.sort(() => Math.random() - 0.5).slice(0, 3);
}
```

**Step 3: Add BUY_MARKET reducer case**

```js
case "BUY_MARKET": {
  const offer = st.nightMarket.offers.find(o => o.id === a.id);
  if (!offer || !st.nightMarket.open) return st;
  // Check costs
  const canAfford = Object.entries(offer.costs).every(([k,v]) => st.res[k] >= v);
  if (!canAfford) return { ...st, log: logPush(st.log, `❌ Cannot afford ${offer.label}`) };
  const newRes = { ...st.res };
  Object.entries(offer.costs).forEach(([k,v]) => { newRes[k] -= v; });
  Object.entries(offer.gives).forEach(([k,v]) => { newRes[k] = f1(newRes[k] + v); });
  const msg = offer.enkiLog
    ? `🌙 ${offer.label} acquired. ${offer.enkiLog}`
    : `🌙 Traded at Night Market: ${offer.label}`;
  return { ...st, res: newRes, log: logPush(st.log, msg) };
}
```

**Step 4: Add Night Market UI panel to App.jsx**

```jsx
{nightMarket.open && (
  <div style={{ marginBottom:7, padding:"7px 9px",
                background:"rgba(10,0,30,0.7)", border:"1px solid #2A1A4A" }}>
    <PH color="#9070D0">🌙 Night Market — Deep-Layer Exchange</PH>
    {nightMarket.offers.map(offer => (
      <button key={offer.id}
        onClick={() => dispatch({ type:"BUY_MARKET", id:offer.id })}
        style={{ width:"100%", textAlign:"left", marginBottom:3, padding:"4px 7px",
                 background:"#0A0820", border:"1px solid #2A1A4A",
                 color:"#9070D0", cursor:"pointer", fontSize:9.5,
                 fontFamily:"'Cinzel',serif" }}>
        {offer.icon} {offer.label}
        <span style={{ float:"right", color:"#6A5080" }}>
          {Object.entries(offer.costs).map(([k,v]) => `${RES_META.find(r=>r.k===k)?.e}${v}`).join(" ")}
          {" → "}
          {Object.entries(offer.gives).map(([k,v]) => `${RES_META.find(r=>r.k===k)?.e}${v}`).join(" ")}
        </span>
      </button>
    ))}
  </div>
)}
```

**Step 5: Verify in browser**

Cheat coverage to 60% temporarily by lowering the threshold to test. Night Market panel should appear at night.

**Step 6: Commit**

```bash
git add src/game-logic.js src/App.jsx
git commit -m "feat: add Night Market — Deep-Layer Exchange with Anunnaki artifacts"
```

---

## Task 9: Storage Cap UI

**Files:**
- Modify: `src/App.jsx`

**Step 1: Update resource display in Stat components to show cap**

In the stats bar, update the `Stat` component calls to show cap:

```jsx
// Current:
<Stat icon="🪵" label="Wood" value={f1(res.wood)} rate={stats.woodRate} />
// Updated:
<Stat icon="🪵" label="Wood" value={`${f1(res.wood)}/${caps.wood}`} rate={stats.woodRate} />
```

Compute `caps = calcCaps(grid)` in the component render. Apply to all resources including hides.

**Step 2: Add Hides to the stats bar**

```jsx
<Stat icon="🪶" label="Hides" value={`${f1(res.hides)}/${caps.hides}`} rate={stats.hidesRate} />
```

**Step 3: Update production summary panel**

Add Hides row to the production summary.

**Step 4: Verify in browser**

```bash
npm run dev
```

Expected: all resources show `current/cap` format. Hides appears in stats bar and production summary.

**Step 5: Commit**

```bash
git add src/App.jsx
git commit -m "feat: show storage caps in UI and add hides to stats bar"
```

---

## Task 10: Enki Protocol Chronicle Voice

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/game-logic.js`

**Step 1: Update initState log messages to Enki Protocol voice**

```js
log: [
  "ENKI-PROTOCOL // SIMULATION_INIT // TIER_1 // ITERATION_[UNKNOWN]",
  "The DNA sample is 12,000 years old. It remembers a winter that should have ended us.",
  "Six people. A clearing. Tools. A fire that is not yet lit.",
  "LOG-0001: Hut construction detected. Shelter archetype — present in 100% of viable DNA paths.",
  "// Click trees, rocks, berries to gather. Build. Research. Survive. //",
],
```

**Step 2: Update key doTick log messages**

Replace plain log messages with Enki Protocol framing:

```js
// Population growth:
`LOG: Population +1. Settlement: ${p}. Genomic viability increasing.`
// Starvation:
`LOG-WARNING: Starvation event. Population: ${p}. This DNA path is under stress.`
// Famine:
`LOG-CRITICAL: FAMINE. Population reduced to ${p}. Stress-testing survival threshold.`
// Wood overflow:
`LOG: Wood reserves exceed baseline. Storage expansion recommended.`
// Stone overflow:
`LOG: Stone reserves exceed baseline. Quarry efficiency noted.`
// Population milestones:
p === 10: `LOG: Settlement reaches 10 souls. Tier 1 viability score: RISING.`
p === 20: `LOG: 20 settlers. The DNA path is stabilising.`
```

**Step 3: Style Chronicle entries with Enki Protocol font**

In App.jsx Chronicle section, update entry styling:

```jsx
color: i === 0 ? "#9EEFD0" :   // teal for latest (Enki gold would be: "#D4A820")
       entry.startsWith("LOG") ? `rgba(158,239,208,${Math.max(0.1, 1-i*0.05)})` :
       `rgba(196,124,42,${Math.max(0.09,1-i*0.046)})`,
fontFamily: entry.startsWith("LOG") || entry.startsWith("ENKI") ?
            "'Courier New', monospace" : "'Crimson Text',serif",
fontSize: entry.startsWith("LOG") || entry.startsWith("ENKI") ? 9.5 : 10.5,
```

**Step 4: Verify in browser**

```bash
npm run dev
```

Expected: Chronicle shows LOG entries in monospace teal, narrative entries in serif amber. Enki Protocol init message visible at game start.

**Step 5: Commit**

```bash
git add src/App.jsx src/game-logic.js
git commit -m "feat: reframe Chronicle as Enki Protocol system logs with dual typography"
```

---

## Final Verification

**Step 1: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

**Step 2: Manual smoke test in browser**

Verify the following all work:
- [ ] Build all 15 buildings
- [ ] Assign settlers to all 5 roles
- [ ] Research techs from all 5 branches (or check locks work correctly)
- [ ] Observe Toyol/Orang Minyak/Whisper Storm at night
- [ ] Night Market opens after sufficient coverage
- [ ] Genomic coverage bar fills with activity
- [ ] Genetic markers accumulate based on role distribution
- [ ] Hides produced by Tanning Hut, capped by Warehouse
- [ ] Storage caps respected for all resources
- [ ] Chronicle shows Enki Protocol voice

**Step 3: Final commit**

```bash
git add .
git commit -m "feat: Phase 1 complete — population roles, new buildings, Ancestors Path tech tree, nocturnal threats, genomic coverage, Enki Protocol voice"
```
