# Ancestor Path — Roadmap Design
**Date:** 2026-03-23
**Status:** Approved
**Source:** GDD v2 (The Atlantis Revelation) + brainstorming session

---

## Vision Summary

Project: Ancestor Path is a Stone Age idle city builder currently implemented as `stone-age-chronicles.jsx`. The roadmap deepens the Stone Age foundation first, then expands into the full 4-tier civilisation arc described in GDD v2 — culminating in the Atlantis Revelation.

The player is the **Historical Architect** — a 2026 researcher using the **Enki Protocol** AI to reconstruct ancient DNA and recover the **Sovereignty Protocol** hidden in Atlantean non-coding DNA.

---

## Chosen Direction: Option 2 — Two Interlocked Phases

- **Phase 1:** Population roles + expanded Stone Age content (buildings, tech, folklore threats, genetic markers)
- **Phase 2:** Age progression — 4-tier genomic arc to the Atlantis Revelation

Each phase ships a complete, playable milestone. The role system and genetic marker accumulation established in Phase 1 become the engine that all future tiers run on.

---

## Phase 1 — Stone Age Depth

### 1.1 Population Roles System

Settlers are no longer fungible. Each settler has a **role** that determines which buildings they staff and what bonuses they contribute.

**5 Stone Age roles:**

| Role | Icon | Works in | Production Bonus |
|---|---|---|---|
| Gatherer | 🧺 | Bonfire, Berry Farm, Fishery | +10% food output |
| Woodcutter | 🪓 | Wood Camp, Forester | +10% wood output |
| Mason | ⛏️ | Quarry, Warehouse, Granary | +10% stone output |
| Hunter | 🏹 | Hunt Grounds, Tanning Hut | +15% food from hunting |
| Shaman | 🔮 | Ritual Circle, Elder's Lodge | Unlocks Ancestors' Path spiritual + folklore branches; suppresses nocturnal threats |

**Assignment UI:** "Tribe" panel in sidebar with +/− controls per role. Total assigned = total pop. Unassigned settlers contribute no production.

**Worker matching logic:**
- Each building draws from its matched role pool first
- If that pool is exhausted, draws from idle settlers at 50% efficiency
- Keeps idle gameplay intact — optimisation is rewarded, not required

**Global `scale` factor** computed per-role-pool rather than globally.

**Genetic marker contribution:**
- Hunter-dominant play → accumulates **Combat Reflex**
- Builder/Scholar dominant → accumulates **Orichalcum Tuning**
- Shaman/folklore-rich → accumulates **System Coherence**

### 1.2 Storage Cap System

Resources have default caps. Production above cap is wasted. Existing log overflow messages already hook into this.

| Structure | Stores | Default Cap | Per Structure |
|---|---|---|---|
| Granary | Food | 80 | +60 |
| Warehouse | Wood / Stone / Hides | 100 each | +80 each |

### 1.3 New Stone Age Buildings (7 new, 15 total)

**Existing 8:** Hut, Bonfire, Wood Camp, Quarry, Hunt Grounds, Forester, Fishery, Berry Farm

**New 7:**

| Building | Icon | Role | Cost | Effect |
|---|---|---|---|---|
| Granary | 🏚️ | Mason | 🪵12 🪨8 | +60 food storage cap |
| Warehouse | 📦 | Mason | 🪵15 🪨10 | +80 wood/stone/hides cap |
| Ritual Circle | 🔵 | Shaman | 🪵15 🪨20 | Unlocks Ancestral Memory + Nusantara Folklore tech branches |
| Tanning Hut | 🪶 | Hunter | 🪵10 🪨6 | Converts food surplus → Hides (new resource) |
| Herb Garden | 🌿 | Gatherer | 🪵8 🪨5 | +0.5 pop growth rate bonus |
| Spirit Trap | 🕸️ | Shaman | 🪵12 🪨8 | Counters Toyol nocturnal threat |
| Temple | 🏯 | Shaman | 🪵20 🪨15 | Counters Orang Minyak; +System Coherence/tick |
| Elder's Lodge | 🏛️ | Shaman | 🪵20 🪨15 | +1 parallel research slot |

**New resource: Hides 🪶**
Produced by Tanning Hut, consumed by tech unlocks and as a Tier 2 advancement prerequisite. 4 Stone Age resources total: food / wood / stone / hides.

### 1.4 Nocturnal Threat System (Anunnaki Legacy Code)

Active threats that spawn at night. The Shaman role and specific buildings counter them.

| Entity | Framing | Mechanic | Counter |
|---|---|---|---|
| Toyol 👁️ | Bio-drone remnant — Anunnaki resource auditing mechanism | Steals resources at night | Spirit Trap building |
| Orang Minyak 🫥 | Failed Anunnaki genetic template — unstable prototype | Tiles unworkable for 20 ticks | Temple building |
| Whisper Storm 🌀 | Anunnaki Memory Pulse — genome broadcasting ancestral trauma | All villagers -50% efficiency next day | Bomoh Vigil (Shaman role active) |

Enki Protocol log entries fire on each nocturnal event.

### 1.5 Night Market 🌙

Late Stone Age feature. Unlocks passively at a genomic coverage threshold. After-dark commerce surfacing Anunnaki cultural artifacts — rare resources and early Tier 2 foreshadowing items. Deep-Layer Exchange framing.

### 1.6 The Ancestors' Path — Expanded Tech Tree (18 techs, 4 branches)

The tech tree is renamed **The Ancestors' Path**. Every unlock is a recovered memory. Each research event fires an Enki Protocol log entry in the Chronicle.

**Unlock Branch** *(4 techs — existing)*
- Hunting Grounds, Forester Guild, Net Fishing, Irrigation

**Mastery Branch** *(5 techs — 3 existing + 2 new)*
- Tool Crafting: +25% all production
- Stone Masonry: -30% build costs
- Animal Husbandry: +2 passive food/tick
- Hide Tanning *(new)*: +50% hides per Tanning Hut — requires 🪵20 🪨15 🪶10
- Preservation *(new)*: +25% food storage cap, slows drought trigger — requires 🪵18 🪨10

**Logistics Branch** *(3 new techs — requires Warehouse)*
- Surplus Storage: +40 to all storage caps — requires 🪵25 🪨20
- Trade Routes: unlocks wandering trader visits — requires 🪵35 🪨15 🪶8
- Stockpiling: resources above 80% cap generate slow Orichalcum trace — requires 🪵40 🪨30

**Ancestral Memory Branch** *(3 new techs — requires Ritual Circle + Shaman role)*
*(Formerly "Spiritual Branch" — reframed as Enki Protocol encountering genomic anomalies)*
- Ancestor Worship: +10% pop growth, unlock lore events — requires 🪵20 🪨25
- Rite of Seasons: -40% drought frequency — requires 🪵30 🪨20 🪶12
- Vision Quest: reveals a random future event 20 ticks early — requires 🪵25 🪨35 🪶15

**Nusantara Folklore Branch** *(3 new techs — requires Shaman + Ritual Circle)*
*(Anunnaki genetic anomalies encoded in human DNA)*
- Bomoh Archetype: +34% simulation stability (drought + nocturnal threat resistance) — *LOG: System Stabiliser active. This genetic signature is invariant across all viable paths.*
- Toyol Pact: +15% gather yield from depleted nodes — *LOG: Anomalous resource recovery. No evolutionary explanation. Flagged.*
- Orang Bunian Contact: unlocks rare Night Market trader tier — *LOG: Cultural exchange archetype. Present only in high-complexity DNA paths.*

### 1.7 Genomic Coverage Bar

A progress indicator visible in the sidebar showing **Tier 1 Genomic Coverage %**. Fills from:
- Buildings constructed
- Tech researched on the Ancestors' Path
- Folklore mechanics engaged (Shaman activities, nocturnal threat encounters)
- Night Market interactions

Reaching 100% triggers the Tier 1 → Tier 2 transition. Replaces raw population/building thresholds as the advancement mechanic.

### 1.8 Genetic Marker Accumulation

Three markers tracked from Stone Age onwards. Displayed as a subtle indicator in the UI. Shape the Atlantean endgame in Phase 2.

| Marker | Accumulated By | Tier 4 Effect |
|---|---|---|
| Combat Reflex ⚔️ | Hunter-dominant play, military buildings | Atlantean Warrior Guard building available |
| Orichalcum Tuning 💎 | Scholar/builder dominant, research focus | Crystal Array ×2 efficiency; faster Sovereignty Protocol |
| System Coherence 🔮 | Bomoh/folklore engagement, Shaman role | Resonance Chamber max output; Whisper Storm becomes positive |

---

## Phase 2 — The 4-Tier Genomic Arc

### 2.1 Tier Structure

| Tier | Name | Era | Advancement |
|---|---|---|---|
| 1 | The Forged | Stone Age | 100% Tier 1 genomic coverage |
| 2 | The Sumerian Uplift | Bronze + Iron Age | 100% Tier 2 genomic coverage |
| 3 | The Modernity Paradox | Apparent Modern Era | 100% Tier 3 genomic coverage |
| 4 | The Atlantis Revelation | True Modern Era | Sovereignty Protocol recovered |

### 2.2 Tier Transitions

Same map, buildings transform. Wireframe dissolution sequence at each transition. Enki Protocol chapter transmission delivered as full-screen gold-on-black terminal text.

**Chapter transmissions (5 total):**
1. The Seed (Tier 1→2): *"The Anunnaki did not arrive. They were already here. In the genome."*
2. The Uplift (Tier 2→3): *"The civilisation did not discover these things. It remembered them."*
3. The Compression (Tier 3→4): *"The skyscrapers are correct in function. They are wrong in material."*
4. The Sovereignty Protocol (Tier 4 unlock): *"Atlantis existed. Our current history is the second draft."*
5. The Final Transmission (endgame): *"The Protocol contains a message addressed to whoever decoded it."*

### 2.3 Tier 2 — The Sumerian Uplift (Bronze + Iron Age)

New resources: Metal ⚙️, Gold 💰
New buildings: Forge, Bronze Mine, Smithy, Barracks, Market, Workshop
Night Market surfaces Anunnaki artifacts (Sumerian cylinder seals, orichalcum fragments)
Enki Protocol notes metallurgy emerging "340 years ahead of evolutionary baseline"

### 2.4 Tier 3 — The Modernity Paradox

New buildings: Factory, Power Plant, Skyscraper, Research Lab
Enki Protocol detects non-coding DNA anomaly spike at 400% above baseline
Player believes this is the apex — until the anomaly rate triggers the decompression

### 2.5 Tier 4 — The Atlantis Revelation

**The wireframe sequence:**
1. Game freezes, screen desaturates to greyscale (0–2s)
2. All Modern Era buildings dissolve to teal-cyan wireframe (2–6s) — wrong proportions visible
3. Full wireframe hold (6–9s) — *"SOVEREIGNTY PROTOCOL: UNLOCKED. Processing."*
4. Full-screen gold Enki Protocol terminal — Chapter 4 transmission letter by letter (9–14s)
5. Wireframe fills with Orichalcum from the ground up (14–20s)

**Atlantean buildings** (replace Modern tier):
- Orichalcum Spires (replace Skyscrapers)
- Crystal Array (replace Research Lab)
- Resonance Chamber (replace Power Plant)
- Atlantean Harbour (replace Factory)

**New resource: Orichalcum 🔷**
**New threat: The Forgetting** — requires military strength (Combat Reflex) to repel

**Endgame shaped by accumulated genetic markers** (see 1.8 above)

---

## Current Codebase State

- **File:** `stone-age-chronicles.jsx` (1,011 lines, single-file React)
- **Resources:** food, wood, stone
- **Buildings:** 8 (all Stone Age)
- **Tech:** 7 techs, 2 branches
- **Workers:** global scale factor (anonymous, fungible)
- **Events:** drought, famine, population growth
- **Day/Night:** cosmetic cycle implemented
- **Chronicle log:** plain text, 20 entries — needs Enki Protocol voice

---

## Design Principles (from GDD v2)

- **Nothing is deleted** — all existing mechanics survive; the narrative reframes them
- **Idle-first** — meaningful progress during AFK; Enki Protocol "processes centuries while offline"
- **Earned revelation** — every Tier 1–3 mechanic must retroactively make sense as Anunnaki test/preparation
- **Choices matter** — Stone Age specialisation determines which version of Atlantis the player reaches
- **Folklore as mechanics** — Toyol, Orang Minyak, Bomoh are not cosmetic; they are Anunnaki legacy code
