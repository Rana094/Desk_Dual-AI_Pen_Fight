import test from "node:test";
import assert from "node:assert/strict";
import {
  createGameConfig,
  defaultGameConfig,
  gameConfig,
} from "../src/config/config.ts";

test("configuration works with no environment file and never shares mutable defaults", () => {
  const a = createGameConfig(),
    b = createGameConfig();
  assert.deepEqual(a, defaultGameConfig);
  assert.deepEqual(gameConfig, defaultGameConfig);
  a.preferences.vs.colors.ball = "#abcdef";
  a.camera.presets.overview.azimuth = -20;
  a.pens.ball.mass = 2;
  assert.deepEqual(b, defaultGameConfig);
  assert.equal(defaultGameConfig.camera.presets.overview.azimuth, 30);
});

test("partial JSON config tunes each subsystem and preserves omitted defaults", () => {
  const patch = {
    settings: { vol: 0.2, follow: true, quality: "low", tableSurface: "maple" },
    preferences: {
      vs: { pen: "ball", difficulty: "expert", colors: { ball: "#abcdef" } },
      train: { algorithm: "mcts" },
      ai: { a: "dfs", speed: 4, penB: { pen: "matador_smoothy" } },
      pvp: { goal: 5, name1: "Alex" },
    },
    matches: { versusGoal: 7 },
    camera: { defaultZoom: 1.2, presets: { side: { elevation: 60 } } },
    input: { penSafetyTouch: 48 },
    physics: { maxFlickSpeed: 180, timeStep: 0.004 },
    playback: { impactSpeed: 0.9 },
    ai: {
      difficulties: { expert: { think: 900, algo: "astar" } },
      budgets: { mcts: { iters: 500 } },
    },
    pens: { ball: { mass: 1.2 } },
    penColors: { matador_hs: { default: "#112233" } },
    audio: {
      ambience: { fan: { gain: 0.05 } },
      assets: { flick: "/audio/custom.wav" },
    },
    graphics: { exposure: 0.9, quality: { low: { shadowMap: 256 } } },
  };
  const config = createGameConfig(JSON.stringify(patch));
  function check(actual, expected) {
    for (const [key, value] of Object.entries(expected)) {
      if (value && typeof value === "object") check(actual[key], value);
      else assert.equal(actual[key], value, key);
    }
  }
  check(config, patch);
  assert.equal(config.settings.friction, 0.98);
  assert.equal(config.pens.ball.len, 20);
});

test("individual environment overrides parse false/zero and take precedence over JSON", () => {
  const config = createGameConfig(
    '{"settings":{"vol":0.2,"follow":true},"camera":{"defaultZoom":1.2}}',
    {
      settings: { vol: "0", follow: "false", replay: "true", friction: "1.01" },
      camera: { defaultZoom: "1.4" },
    },
  );
  assert.equal(config.settings.vol, 0);
  assert.equal(config.settings.follow, false);
  assert.equal(config.settings.replay, true);
  assert.equal(config.settings.friction, 1.01);
  assert.equal(config.camera.defaultZoom, 1.4);
});

test("malformed, non-object, and empty JSON all recover to defaults", () => {
  for (const value of [
    undefined,
    "",
    "broken",
    "{",
    "null",
    "true",
    "42",
    "[]",
    '"test"',
  ]) {
    assert.deepEqual(createGameConfig(value), defaultGameConfig);
  }
});

test("invalid higher-priority values keep valid JSON fallbacks", () => {
  const config = createGameConfig('{"settings":{"vol":0.4,"quality":"low"}}', {
    settings: { vol: "NaN", quality: "ultra", follow: "yes", friction: "" },
  });
  assert.equal(config.settings.vol, 0.4);
  assert.equal(config.settings.quality, "low");
  assert.equal(config.settings.follow, false);
  assert.equal(config.settings.friction, 0.98);
});

test("unsafe physics, camera, graphics, and AI settings cannot enter the game", () => {
  const invalid = {
    settings: { vol: -1, friction: 7 },
    camera: {
      defaultZoom: 9,
      radius: 1000,
      presets: { overview: { elevation: -1 } },
    },
    physics: { timeStep: 0, gravity: -5, surgeMultiplier: 0 },
    ai: {
      budgets: { mcts: { iters: 1e9 }, minimax: { depth: 100 } },
      difficulties: { expert: { mistake: 5, algo: "removed" } },
    },
    graphics: { exposure: Infinity, quality: { high: { shadowMap: 1000 } } },
    input: { penSafetyTouch: 0 },
    preferences: {
      ai: { a: "removed", speed: 7 },
      vs: { pen: "missing", difficulty: "impossible" },
      pvp: { goal: -1 },
    },
  };
  assert.deepEqual(createGameConfig(undefined, invalid), defaultGameConfig);
});

test("catalogue colour validation, fixed array lengths, and names remain safe", () => {
  const config = createGameConfig(undefined, {
    settings: { name: "Long player name longer than 14" },
    penColors: { matador_hs: { default: "invalid", swatches: ["#ffffff"] } },
    preferences: {
      vs: { colors: { unknown: "#ffffff", ball: "bad", gel: "#aabbcc" } },
    },
    audio: { contacts: ["contactC", "contactA", "contactB"] },
  });
  assert.equal(config.settings.name.length, 14);
  assert.deepEqual(config.penColors, defaultGameConfig.penColors);
  assert.deepEqual(config.preferences.vs.colors, { gel: "#aabbcc" });
  assert.deepEqual(config.audio.contacts, ["contactC", "contactA", "contactB"]);
});

test("unknown keys and prototype fields are ignored", () => {
  const config = createGameConfig(
    '{"__proto__":{"polluted":true},"settings":{"__proto__":{"polluted":true},"unknown":42},"extra":true}',
  );
  assert.deepEqual(config, defaultGameConfig);
  assert.equal({}.polluted, undefined);
});
