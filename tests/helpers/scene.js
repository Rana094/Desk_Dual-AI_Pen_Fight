import * as THREE from "three";
import { createWorld } from "../../src/game/scene/world.js";

// Canvas drawing is not under test here. Use real Three.js geometry/materials;
// supply only the 2D API used to paint procedural texture images.
export function sceneFixture() {
  const engine = { TABLE: { w: 60, h: 100 } };
  const world = createWorld(engine);
  const gradient = { addColorStop() {} };
  const context = new Proxy(
    {
      createLinearGradient: () => gradient,
      createRadialGradient: () => gradient,
      measureText: (text) => ({ width: String(text).length * 8 }),
    },
    {
      get(target, name) {
        return target[name] ?? (() => {});
      },
    },
  );
  const cvs = (width, height) => ({ width, height, getContext: () => context });
  const sceneRoot = new THREE.Group();
  return {
    engine,
    world,
    sceneRoot,
    deps: {
      ...world.deps,
      cvs,
      sceneRoot,
      loadFurnitureTexture: () => new THREE.Texture(),
    },
  };
}
export function meshesOf(root) {
  const meshes = [];
  root.traverse((object) => {
    if (object.isMesh) meshes.push(object);
  });
  return meshes;
}
