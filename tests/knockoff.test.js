import test from "node:test";
import assert from "node:assert/strict";
import { createGameEngine } from "../src/game/engine.js";
import { roundOutcome } from "../src/game/physics/outcome.js";
import { interpolateRecording } from "../src/game/controller/playback.js";

const noFlick = { ang: 0, pow: 0, off: 0 };

test("knock-off points follow both fallen pens, independently of the shooter", () => {
  assert.equal(roundOutcome(-1), null);
  assert.deepEqual(roundOutcome(0), { winner: 1, points: [0, 1], how: "out" });
  assert.deepEqual(roundOutcome(1), { winner: 0, points: [1, 0], how: "out" });
  assert.deepEqual(roundOutcome(2), { winner: -1, points: [1, 1], how: "out" });
});

for (const real of [true, false]) {
  for (const who of [0, 1]) {
    for (const first of [0, 1]) {
      for (const delayed of [false, true]) {
        test(`both falls score: real=${real}, shooter=${who}, first=${first}, delayed=${delayed}`, () => {
          const e = createGameEngine();
          e.setRealism(real);
          const pens = [20, 80].map((y) =>
            e.makePen("ball", 60.9, y, Math.PI / 2),
          );
          pens.forEach((p) => {
            p.mu = 0;
            p.vx = 30;
          });
          if (delayed) pens[1 - first].x = 30;
          const before = structuredClone(pens);
          const results = [0, 0.45].map((afterOut) =>
            e.shoot(pens, who, noFlick, {
              afterOut,
              record: 1 / 60,
              maxT: 4.8,
            }),
          );
          assert.deepEqual(pens, before);
          for (const res of results) {
            assert.equal(res.out, 2);
            assert.deepEqual(
              res.pens.map((p) => p.out),
              [true, true],
            );
            assert.equal(
              res.events.filter((ev) => ev.type === "out").length,
              2,
            );
            assert.deepEqual(roundOutcome(res.out).points, [1, 1]);
            if (delayed)
              assert.ok(res.pens[1 - first].outT - res.pens[first].outT > 0.45);
            else assert.equal(res.pens[0].outT, res.pens[1].outT);
          }
        });
      }
    }
  }
}

test("one falling pen does not give the surviving player an extra fall", () => {
  const e = createGameEngine();
  const pens = [
    e.makePen("ball", 60.9, 20, Math.PI / 2),
    e.makePen("ball", 40, 80, 0),
  ];
  pens[0].vx = 30;
  pens[0].mu = 0;
  pens[1].vx = 2;
  const res = e.shoot(pens, 0, noFlick, { afterOut: 0.45 });
  assert.equal(res.out, 0);
  assert.equal(res.pens[1].out, false);
  assert.deepEqual(roundOutcome(res.out).points, [0, 1]);
});

test("pens remain balanced when their centres are on the desk, despite overhanging ends", () => {
  const e = createGameEngine();
  for (const type of Object.keys(e.PENS)) {
    const r = e.PENS[type].r;
    for (const [x, y, a] of [
      [1, 50, 0],
      [59, 50, 0],
      [30, 1, Math.PI / 2],
      [30, 99, Math.PI / 2],
      [r / 2, 50, Math.PI / 2],
      [60 - r / 2, 50, Math.PI / 2],
      [30, r / 2, 0],
      [30, 100 - r / 2, 0],
    ]) {
      const p = e.makePen(type, x, y, a);
      assert.equal(e.hasTableSupport(p), true, `${type} at ${x},${y}`);
      const res = e.shoot([p, e.makePen("ball", 30, 25, 0)], 0, noFlick);
      assert.equal(res.out, -1);
      assert.equal(res.pens[0].z, 0);
    }
    // The capsule's bounding box overlaps this corner, but its barrel does not.
    assert.equal(
      e.hasTableSupport(e.makePen(type, -2, -2, -Math.PI / 4)),
      false,
    );
  }
});

test("sliding and spinning falls record balance loss and finish landing, including playback", () => {
  const e = createGameEngine();
  let falls = 0;
  for (const real of [true, false]) {
    e.setRealism(real);
    for (const type of Object.keys(e.PENS)) {
      for (const [x, y, normal] of [
        [59, 65, 0],
        [1, 65, Math.PI],
        [35, 99, Math.PI / 2],
        [35, 1, -Math.PI / 2],
      ]) {
        for (const [angle, spin] of [
          [0, 0],
          [Math.PI / 2, 0],
          [Math.PI / 4, 8],
          [(3 * Math.PI) / 4, -8],
        ]) {
          const p = e.makePen(type, x, y, normal + angle);
          p.vx = 40 * Math.cos(normal);
          p.vy = 40 * Math.sin(normal);
          p.w = spin;
          const other = e.makePen("ball", 20, 30, 0);
          const res = e.shoot([p, other], 0, noFlick, {
            record: 1 / 60,
            afterOut: 0.45,
            maxT: 4.8,
          });
          if (!res.pens[0].out) continue;
          falls++;
          const departure = res.rec.find((f) => f.t === res.pens[0].outT);
          assert.ok(
            departure,
            "record the exact loss of support before interpolating gravity",
          );
          assert.equal(departure.p[0].z, 0);
          assert.equal(res.pens[0].landed, true);
          assert.equal(
            res.events.filter((e) => e.type === "landing" && e.who === 0)
              .length,
            1,
          );
          for (let t = 0; t < res.t; t += 1 / 240) {
            const state = { ...p, ...interpolateRecording(res.rec, t).p[0] };
            if (state.z < 0 && state.z > -4 - p.L / 2 - 2 * p.r) {
              assert.equal(
                state.tipAngle > 0 || !e.overlapsTable(state),
                true,
                `${type}, real=${real}, edge=${normal}, spin=${spin}, t=${t}`,
              );
            }
          }
        }
      }
    }
  }
  assert.ok(falls > 50, "exercise actual falls across models and edges");
});
