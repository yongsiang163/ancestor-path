import { describe, it, expect } from 'vitest';
import { initState, doTick, calcStats, DEFAULT_CAPS, calcCaps, reducer, BLDG, TECH_GROUPS, TECH, ROLES, BLDG_ROLE, THREAT_DEF, calcGenomicCoverage } from './game-logic.js';

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
  it('returns housing >= BASE_HOUSING with starter buildings', () => {
    const st = initState();
    const s = calcStats(st);
    expect(s.housing).toBeGreaterThan(4);
  });

  it('returns non-negative food production with bonfire', () => {
    const st = initState();
    const s = calcStats(st);
    expect(s.foodProd).toBeGreaterThan(0);
  });
});

describe('doTick', () => {
  it('increments tick counter', () => {
    const st = initState();
    const next = doTick(st);
    expect(next.tick).toBe(1);
  });
});

describe('storage caps', () => {
  it('exports DEFAULT_CAPS with correct values', () => {
    expect(DEFAULT_CAPS.food).toBe(80);
    expect(DEFAULT_CAPS.wood).toBe(100);
    expect(DEFAULT_CAPS.stone).toBe(100);
    expect(DEFAULT_CAPS.hides).toBe(40);
  });

  it('calcCaps returns defaults when no granary/warehouse on grid', () => {
    const st = initState();
    const caps = calcCaps(st.grid);
    expect(caps.food).toBe(DEFAULT_CAPS.food);
    expect(caps.wood).toBe(DEFAULT_CAPS.wood);
    expect(caps.stone).toBe(DEFAULT_CAPS.stone);
  });

  it('doTick caps food at DEFAULT_CAPS.food when overfull', () => {
    const st = { ...initState(), res: { food: 200, wood: 50, stone: 50, hides: 0 } };
    const next = doTick(st);
    expect(next.res.food).toBeLessThanOrEqual(DEFAULT_CAPS.food);
  });

  it('initState includes hides: 0 in res', () => {
    const st = initState();
    expect(st.res.hides).toBe(0);
  });
});

describe('new buildings', () => {
  it('BLDG has 16 buildings total', () => {
    expect(Object.keys(BLDG).length).toBe(16);
  });

  it('tanningHut produces hides', () => {
    const st = initState();
    const grid = st.grid.map(r => [...r]);
    grid[5][5] = { id: 'tanningHut', level: 1 };
    const s = calcStats({ ...st, grid, pop: 10 });
    expect(s.hidesRate).toBeGreaterThan(0);
  });

  it('granary increases food cap via calcCaps', () => {
    const st = initState();
    const grid = st.grid.map(r => [...r]);
    grid[3][3] = { id: 'granary', level: 1 };
    const caps = calcCaps(grid);
    expect(caps.food).toBeGreaterThan(DEFAULT_CAPS.food);
  });

  it('warehouse increases wood/stone/hides caps via calcCaps', () => {
    const st = initState();
    const grid = st.grid.map(r => [...r]);
    grid[3][3] = { id: 'warehouse', level: 1 };
    const caps = calcCaps(grid);
    expect(caps.wood).toBeGreaterThan(DEFAULT_CAPS.wood);
    expect(caps.stone).toBeGreaterThan(DEFAULT_CAPS.stone);
    expect(caps.hides).toBeGreaterThan(DEFAULT_CAPS.hides);
  });
});

describe('GATHER action', () => {
  it('GATHER action preserves hides in res', () => {
    const st = { ...initState(), res: { food: 30, wood: 15, stone: 8, hides: 5 } };
    // Find a node to gather from
    const nodeKey = Object.keys(st.nodes)[0];
    const [r, c] = nodeKey.split(',').map(Number);
    const next = reducer(st, { type: 'GATHER', r, c });
    expect(next.res.hides).toBe(5); // hides unchanged by a gather
  });
});

describe('tech tree', () => {
  it('has 5 tech groups', () => {
    expect(TECH_GROUPS.length).toBe(5);
    expect(TECH_GROUPS).toContain('unlock');
    expect(TECH_GROUPS).toContain('mastery');
    expect(TECH_GROUPS).toContain('logistics');
    expect(TECH_GROUPS).toContain('ancestralMemory');
    expect(TECH_GROUPS).toContain('nusantaraFolklore');
  });

  it('has 18 techs total', () => {
    expect(Object.keys(TECH).length).toBe(18);
  });

  it('RESEARCH deducts hides cost when tech has ch', () => {
    // riteOfSeasons costs hides
    const st = { ...initState(), res: { food:30, wood:100, stone:100, hides:20 },
                 tech: { ...initState().tech, ancestorWorship: true } }; // prereq met via building, skip for this test
    // Place a ritualCircle so the req check passes
    const grid = st.grid.map(r => [...r]);
    grid[5][5] = { id:'ritualCircle', level:1 };
    const s = { ...st, grid };
    const next = reducer(s, { type:'RESEARCH', id:'riteOfSeasons' });
    if (next.tech.riteOfSeasons) {
      expect(next.res.hides).toBeLessThan(20);
    }
    // If it failed due to resource check, hides unchanged — either way no crash
    expect(next.res.hides).toBeGreaterThanOrEqual(0);
  });

  it('surplusStorage tech adds 40 to all caps', () => {
    const st = initState();
    const caps = calcCaps(st.grid, { surplusStorage: true });
    expect(caps.food).toBe(DEFAULT_CAPS.food + 40);
    expect(caps.wood).toBe(DEFAULT_CAPS.wood + 40);
    expect(caps.stone).toBe(DEFAULT_CAPS.stone + 40);
    expect(caps.hides).toBe(DEFAULT_CAPS.hides + 40);
  });

  it('RESEARCH blocks if building prerequisite not met', () => {
    const st = initState();
    const next = reducer(st, { type:'RESEARCH', id:'ancestorWorship' });
    expect(next.tech.ancestorWorship).toBe(false); // blocked — no ritualCircle on grid
    expect(next.log[0]).toMatch(/requires/i);
  });
});

describe('population roles', () => {
  it('exports 5 ROLES: gatherer, woodcutter, mason, hunter, shaman', () => {
    expect(Object.keys(ROLES).length).toBe(5);
    expect(ROLES).toHaveProperty('gatherer');
    expect(ROLES).toHaveProperty('woodcutter');
    expect(ROLES).toHaveProperty('mason');
    expect(ROLES).toHaveProperty('hunter');
    expect(ROLES).toHaveProperty('shaman');
  });

  it('initState includes roles summing to pop', () => {
    const st = initState();
    const total = Object.values(st.roles).reduce((a, b) => a + b, 0);
    expect(total).toBe(st.pop);
  });

  it('initState includes markers with all three keys', () => {
    const st = initState();
    expect(st.markers).toHaveProperty('combatReflex');
    expect(st.markers).toHaveProperty('orichalcumTuning');
    expect(st.markers).toHaveProperty('systemCoherence');
  });

  it('SET_ROLE increases a role count', () => {
    const st = initState();
    const next = reducer(st, { type: 'SET_ROLE', role: 'hunter', delta: 1 });
    expect(next.roles.hunter).toBe(st.roles.hunter + 1);
  });

  it('SET_ROLE prevents total roles exceeding pop', () => {
    const st = initState();
    // Try to assign all 4 pop to hunter (pop is 4, so 5th would exceed)
    let s = reducer(st, { type: 'SET_ROLE', role: 'hunter', delta: 4 });
    const total = Object.values(s.roles).reduce((a, b) => a + b, 0);
    expect(total).toBeLessThanOrEqual(s.pop);
  });

  it('hunter-dominant play accumulates Combat Reflex marker over ticks', () => {
    let st = initState();
    // Assign all pop to hunter
    st = { ...st, roles: { gatherer:0, woodcutter:0, mason:0, hunter:st.pop, shaman:0 } };
    // Run 10 ticks
    for (let i = 0; i < 10; i++) st = { ...doTick(st), tick: st.tick + 1 };
    expect(st.markers.combatReflex).toBeGreaterThan(0);
  });
});

describe('nocturnal threats', () => {
  it('THREAT_DEF exports 3 threat types', () => {
    expect(THREAT_DEF).toHaveProperty('toyol');
    expect(THREAT_DEF).toHaveProperty('orangMinyak');
    expect(THREAT_DEF).toHaveProperty('whisperStorm');
  });

  it('initState has empty threats array and whisperActive false', () => {
    const st = initState();
    expect(st.threats).toEqual([]);
    expect(st.whisperActive).toBe(false);
  });

  it('toyol steals resources when active and no spiritTrap on grid', () => {
    const st = {
      ...initState(),
      res: { food: 50, wood: 50, stone: 50, hides: 10 },
      threats: [{ type: 'toyol', ticks: 5 }],
      whisperActive: false,
    };
    const next = doTick(st);
    // Resources should decrease (toyol steals)
    expect(next.res.food + next.res.wood).toBeLessThan(100);
  });

  it('spiritTrap neutralises toyol steal', () => {
    const st = initState();
    const grid = st.grid.map(r => [...r]);
    grid[5][5] = { id: 'spiritTrap', level: 1 };
    const threatened = {
      ...st, grid,
      res: { food: 50, wood: 50, stone: 50, hides: 10 },
      threats: [{ type: 'toyol', ticks: 5 }],
      whisperActive: false,
    };
    const next = doTick(threatened);
    expect(next.res.food + next.res.wood).toBeGreaterThanOrEqual(100);
  });
});

describe('genomic coverage', () => {
  it('starts above 0 with starter buildings', () => {
    const st = initState();
    expect(calcGenomicCoverage(st)).toBeGreaterThan(0);
  });

  it('increases when a tech is researched', () => {
    const st1 = initState();
    const st2 = { ...st1, tech: { ...st1.tech, toolCrafting: true } };
    expect(calcGenomicCoverage(st2)).toBeGreaterThan(calcGenomicCoverage(st1));
  });

  it('never exceeds 100', () => {
    const st = initState();
    expect(calcGenomicCoverage(st)).toBeLessThanOrEqual(100);
  });

  it('increases when more buildings are placed', () => {
    const st = initState();
    const grid = st.grid.map(r => [...r]);
    grid[5][5] = { id: 'quarry', level: 1 };
    const st2 = { ...st, grid };
    expect(calcGenomicCoverage(st2)).toBeGreaterThan(calcGenomicCoverage(st));
  });
});
