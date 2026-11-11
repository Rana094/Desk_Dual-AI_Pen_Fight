import test from "node:test";
import assert from "node:assert/strict";
import { createUninformedStrategy } from "../src/game/ai/strategies/uninformed.js";
import { createSearchStrategy } from "../src/game/ai/strategies/search.js";
import { createGameEngine } from "../src/game/engine.js";

function run(generator) {
  let step;
  do {
    step = generator.next();
  } while (!step.done);
  return step.value;
}
function setup(goal = "1,2,3,2", risk = 0) {
  const ctx = {
    nodes: 0,
    evals: 0,
    sims: 0,
    live: { nodes: [], moves: [], extra: {} },
  };
  const helpers = {
    clamp: (x, a, b) => Math.max(a, Math.min(b, x)),
    makeAction: (_state, _me, ...choices) => ({
      key: choices.join(","),
      label: choices.join(","),
    }),
    ANGS: [-0.07, 0, 0.07],
    POWS: [0.35, 0.5, 0.62, 0.74],
    OFFS: [-0.7, 0, 0.7],
    TNAME: ["attack", "guard"],
    LV: [2, 3, 4, 3],
    ev: (_state, _me, act, ctx, samples) => {
      ctx.evals++;
      ctx.sims += samples;
      return {
        score: act.key === goal ? 100 : 20,
        pSucc: act.key === goal ? 1 : 0,
        pSelf: risk,
        pHit: 1,
      };
    },
    topMoves: (list, n) =>
      list
        .slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, n),
    movesFrom: (list, selected) =>
      list.map((m) => ({ ...m, selected: m.act.key === selected })),
    slice: function* () {
      yield null;
    },
  };
  return { ctx, helpers, ...createUninformedStrategy(helpers) };
}

test("DFS reaches an attacking leaf before defensive branches and stops at a verified goal", () => {
  const { ctx, depthSearch } = setup("0,2,3,2");
  const result = run(depthSearch({}, 0, { leafBudget: 20 }, ctx));
  assert.equal(result.action.key, "0,2,3,2");
  assert.equal(ctx.evals, 1);
  assert.equal(ctx.live.extra.found, true);
});
test("obsolete decision identifiers resolve to the supported A* default", () => {
  const engine = createGameEngine();
  const state = engine.newState(["ball", "gel"], engine.rng(31), 0);
  for (const algo of [
    "dls",
    "iddfs",
    "bidirectional",
    "bfs",
    "planner",
    "hybrid",
    "fuzzy",
    "unknown",
  ]) {
    const result = engine.runSync(
      engine.decide(state, 0, { algo, seed: 42, budgetScale: 0.02 }),
    );
    assert.equal(result.info.algo, "astar");
    assert.ok(Number.isFinite(result.action.pow));
  }
});

test("DFS respects configured shallow and zero depth limits", () => {
  for (const depthLimit of [0, 2]) {
    const { ctx, depthSearch } = setup();
    const result = run(depthSearch({}, 0, { depthLimit }, ctx));
    assert.ok(ctx.live.nodes.every((n) => n.d <= depthLimit));
    assert.equal(ctx.live.extra.cutoff, true);
    assert.equal(ctx.live.extra.found, false);
    assert.equal(ctx.evals, 1);
    assert.ok(result.action.key);
  }
});

test("best-first and A* respect depth limits and keep a playable fallback", () => {
  for (const astar of [false, true]) {
    for (const depthLimit of [0, 2, 4]) {
      const { ctx, helpers } = setup();
      const { informed } = createSearchStrategy(helpers);
      const result = run(
        informed({}, 0, { depthLimit, evalBudget: 1000 }, ctx, astar),
      );
      assert.ok(ctx.live.nodes.every((n) => n.d <= depthLimit));
      assert.equal(ctx.live.extra.cutoff, depthLimit < 4);
      assert.equal(ctx.live.extra.found, depthLimit === 4);
      assert.ok(result.action.key);
    }
  }
});

test("greedy chooses the lowest h while A* can prefer a lower g + h", () => {
  for (const astar of [false, true]) {
    const { ctx, helpers } = setup();
    const { informed } = createSearchStrategy({
      ...helpers,
      ev: (_state, _me, act) => ({
        score: act.key.startsWith("1,") ? 52 : 50,
        pSucc: 0,
        pSelf: 0,
      }),
    });
    run(informed({}, 0, { evalBudget: 3, goal: 0 }, ctx, astar));
    const firstTarget = ctx.live.nodes.find((node) => node.order === 2);
    assert.equal(firstTarget.label, astar ? "attack" : "guard");
    assert.equal(ctx.live.extra.found, false);
  }
});

test("all implemented strategies hit a reproducible straight shot from either side", () => {
  const engine = createGameEngine();
  for (const me of [0, 1]) {
    const state = engine.newState(["ball", "gel"], engine.rng(0), me);
    state.pens[me] = engine.makePen("ball", 30, me ? 60 : 40, Math.PI / 2);
    state.pens[1 - me] = engine.makePen("gel", 30, me ? 81 : 19, 0);
    for (const algo of Object.keys(engine.ALGOS)) {
      const decision = run(engine.decide(state, me, { algo, seed: 0 }));
      const shot = engine.shoot(state.pens, me, decision.action);
      assert.ok(
        shot.hit,
        `${algo} player ${me} should contact the opposing pen`,
      );
      assert.equal(
        shot.out,
        1 - me,
        `${algo} player ${me} should finish the knockout`,
      );
    }
  }
});
