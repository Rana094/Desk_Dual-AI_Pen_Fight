import type { GamePreferences } from "../game/state/types";
/** Initial mode selections; saved browser preferences take precedence. */
export const preferencesConfig: GamePreferences = {
  vs: { pen: "matador_hs", colors: {}, difficulty: "advanced", goal: 3 },
  train: {
    pen: "matador_hs",
    colors: {},
    difficulty: "advanced",
    algorithm: "auto",
  },
  ai: {
    a: "astar",
    b: "mcts",
    speed: 2,
    goal: 5,
    penA: { pen: "matador_hs", colors: {} },
    penB: { pen: "matador_hs", colors: { matador_hs: "#ef4d33" } },
  },
  pvp: {
    name1: "Player 1",
    name2: "Player 2",
    goal: 3,
    pen1: { pen: "matador_hs", colors: {} },
    pen2: { pen: "matador_hs", colors: { matador_hs: "#ef4d33" } },
  },
};
