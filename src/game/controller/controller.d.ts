import type { GameUiStore } from "@/game/state/store";
import type {
  Algorithm,
  CameraPreset,
  GameMode,
  MenuView,
} from "@/game/state/types";
import type { SceneWorld } from "@/game/scene/types";
export interface GameController {
  start(mode: Exclude<GameMode, "menu">): void;
  openMenu(): void;
  pause(): void;
  resume(): void;
  settings(): void;
  back(): void;
  changeAlgorithm(algo: Algorithm): void;
  showView(view: MenuView): void;
  toggleSurge(): void;
  skipReplay(): void;
  setSpeed(speed: number): void;
  setCameraPreset(preset: CameraPreset): void;
  setCameraAngle(azimuth: number, elevation: number): void;
  setCameraRotation(azimuth: number): void;
  setCameraTilt(elevation: number): void;
  setCameraZoom(zoom: number): void;
  resetCamera(): void;
  setCameraPinned(pinned: boolean): void;
  dispose(): void;

}
export function createController(options: {
  engine: unknown;
  world: SceneWorld;
  sound: unknown;
  canvas: HTMLCanvasElement;
  ui: GameUiStore;
}): GameController;
