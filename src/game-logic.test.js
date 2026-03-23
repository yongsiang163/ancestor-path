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
