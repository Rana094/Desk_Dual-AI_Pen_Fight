import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  CAMERA_PRESETS,
  DESK_CAMERA_RADIUS,
  cameraAngle,
  deskCamera,
  deskFov,
  overviewCamera,
  interpolateOrbit,
} from "../src/game/controller/camera.js";

test("portrait overview keeps the desk readable instead of framing the whole classroom", () => {
  for (const [width, height] of [
    [320, 700],
    [390, 800],
    [430, 900],
  ]) {
    const aspect = width / height,
      angle = overviewCamera(aspect),
      camera = new THREE.PerspectiveCamera(45, aspect, 1, 1500),
      target = new THREE.Vector3();
    assert.equal(angle.azimuth, 0);
    camera.fov = deskCamera(angle, aspect, camera.position, target);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    const corners = [-30, 30].flatMap((x) =>
      [-50, 50].map((z) => new THREE.Vector3(x, 0, z).project(camera)),
    );
    const occupiedWidth =
      (Math.max(...corners.map((p) => p.x)) -
        Math.min(...corners.map((p) => p.x))) /
      2;
    const occupiedHeight =
      (Math.max(...corners.map((p) => p.y)) -
        Math.min(...corners.map((p) => p.y))) /
      2;
    assert.ok(occupiedWidth > 0.85, "desk uses at least 85% of phone width");
    assert.ok(occupiedHeight > 0.55, "pens remain large enough to aim at");
  }
});

test("all camera angles keep every desk corner in frame on phones and wide screens", () => {
  for (const aspect of [0.45, 0.7, 1, 1.43, 2.4])
    for (const angle of [
      ...Object.values(CAMERA_PRESETS),
      { azimuth: -135, elevation: 45 },
      { azimuth: 179, elevation: 89 },
    ]) {
      const camera = new THREE.PerspectiveCamera(45, aspect, 1, 1500),
        target = new THREE.Vector3();
      camera.fov = deskCamera(angle, aspect, camera.position, target);
      camera.lookAt(target);
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld(true);
      for (const x of [-30, 30])
        for (const z of [-50, 50]) {
          const point = new THREE.Vector3(x, 0, z).project(camera);
          assert.ok(Math.abs(point.x) < 0.92, "horizontal clearance");
          assert.ok(Math.abs(point.y) < 0.8, "HUD clearance");
          assert.ok(point.z > -1 && point.z < 1, "visible depth");
        }
    }
});

test("camera stays below the lights and ceiling at every angle on narrow screens", () => {
  for (const aspect of [0.2, 0.3, 0.45, 0.7, 1, 1.43, 2.4, 4])
    for (let azimuth = -180; azimuth <= 180; azimuth += 15)
      for (const elevation of [45, 55, 65, 78, 89]) {
        const camera = new THREE.PerspectiveCamera(45, aspect, 1, 1500),
          target = new THREE.Vector3();
        camera.fov = deskCamera(
          { azimuth, elevation },
          aspect,
          camera.position,
          target,
        );
        assert.ok(
          camera.position.y < 180,
          "camera must stay below ceiling fixtures",
        );
        assert.ok(
          Math.abs(camera.position.length() - DESK_CAMERA_RADIUS) < 1e-8,
        );
        camera.lookAt(target);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);
        for (const x of [-30, 30])
          for (const z of [-50, 50]) {
            const point = new THREE.Vector3(x, 0, z).project(camera);
            assert.ok(Math.abs(point.x) < 0.92 && Math.abs(point.y) < 0.8);
            assert.ok(point.z > -1 && point.z < 1);
          }
      }
});

test("all preset transitions keep a safe orbit and fit the rendered desk", () => {
  const views = [
    ...Object.values(CAMERA_PRESETS),
    { azimuth: -179, elevation: 45 },
    { azimuth: 179, elevation: 89 },
  ];
  for (const aspect of [0.2, 0.45, 0.85, 1, 1.43, 2.4, 4])
    for (const start of views)
      for (const end of views) {
        const camera = new THREE.PerspectiveCamera(45, aspect, 1, 1500),
          look = new THREE.Vector3(),
          target = new THREE.Vector3(),
          targetLook = new THREE.Vector3();
        camera.fov = deskCamera(start, aspect, camera.position, look);
        deskCamera(end, aspect, target, targetLook);
        camera.updateProjectionMatrix();
        for (let frame = 0; frame < 60; frame++) {
          interpolateOrbit(camera.position, look, target, targetLook, 0.2);
          assert.ok(
            Math.abs(camera.position.length() - DESK_CAMERA_RADIUS) < 1e-8,
          );
          assert.ok(camera.position.y < 180);
          camera.fov = deskFov(camera.position, look, aspect);
          camera.updateProjectionMatrix();
          camera.lookAt(look);
          camera.updateMatrixWorld(true);
          for (const x of [-30, 30])
            for (const z of [-50, 50]) {
              const point = new THREE.Vector3(x, 0, z).project(camera);
              assert.ok(Math.abs(point.x) < 0.92 && Math.abs(point.y) < 0.8);
            }
        }
      }
});

test("the -180/180 seam takes the short route without a full spin", () => {
  const position = new THREE.Vector3(),
    look = new THREE.Vector3(),
    target = new THREE.Vector3(),
    targetLook = new THREE.Vector3();
  deskCamera({ azimuth: 179, elevation: 65 }, 1.4, position, look);
  deskCamera({ azimuth: -179, elevation: 65 }, 1.4, target, targetLook);
  interpolateOrbit(position, look, target, targetLook, 0.5);
  assert.ok(Math.abs(position.x) < 0.001);
  assert.ok(position.z < 0, "seam crossing remains behind the desk");
});
