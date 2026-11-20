"use client";
import { GameProvider, useGameState } from "./GameProvider";
import { GameScene } from "./GameScene";
import { GameControls } from "@/features/game/ui/GameControls";
import { GameFeedback } from "@/features/game/ui/GameFeedback";
import { GameHud } from "@/features/game/ui/GameHud";
import { GameMenu } from "@/features/game/ui/GameMenu";
import { GameModals } from "@/features/game/ui/GameModals";
function GameSurface() {
  const state = useGameState([
    "replaying",
    "mode",
    "error",
    "paused",
    "end",
    "menuVisible",
  ]);
  return (
    <div
      id="app"
      className={`game-runtime${state.replaying ? " replay" : ""}`}
      data-mode={state.mode}
    >
      <GameScene />
      <div id="vig" />
      <div inert={state.paused || !!state.end || state.menuVisible}>
        <GameHud />
        <GameFeedback />
        <GameControls />
      </div>
      <GameMenu />
      <GameModals />
      {state.error && (
        <div className="runtime-error" role="alert">
          {state.error}
        </div>
      )}
    </div>
  );
}
export function GameRuntime() {
  return (
    <GameProvider>
      <GameSurface />
    </GameProvider>
  );
}
