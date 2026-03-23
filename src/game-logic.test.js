import { describe, it, expect } from 'vitest';
import { initState, doTick, calcStats, DEFAULT_CAPS, calcCaps, reducer } from './game-logic.js';

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
