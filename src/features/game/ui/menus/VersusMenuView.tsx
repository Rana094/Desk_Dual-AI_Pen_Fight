"use client";
import {
  useGamePreferences,
  useGameServices,
} from "@/features/game/runtime/GameProvider";
import { PenSelector } from "@/features/pen/ui/PenSelector";
import { DifficultySelect } from "@/features/game/ui/controls/DifficultySelect";
import { GoalSelect } from "@/features/game/ui/controls/GoalSelect";
import { MenuPage } from "./MenuPage";
export function VersusMenuView() {
  const services = useGameServices();
  const { preferences, setPreferences } = useGamePreferences();
  const value = preferences.vs;
  const update = (patch: Partial<typeof value>) =>
    setPreferences({ ...preferences, vs: { ...value, ...patch } });
  return (
    <MenuPage view="vs" title="Human vs AI">
      <h3>Opponent</h3>
      <DifficultySelect
        label="Opponent difficulty"
        chips
        value={value.difficulty}
        onChange={(difficulty) => update({ difficulty })}
      />
      <h3>Your pen</h3>
      <PenSelector
        label="Your pen"
        value={value}
        onChange={(pen) => update(pen)}
      />
      <label className="f">
        First to
        <GoalSelect
          label="Human vs AI match rounds"
          value={value.goal}
          onChange={(goal) => update({ goal })}
        />
      </label>
      <button
        className="mbtn primary"
        onClick={() => services.controller?.start("vs")}
      >
        Play
      </button>
    </MenuPage>
  );
}
