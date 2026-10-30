const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const assert = require("node:assert/strict");
require("tsx/cjs");

async function main() {
  const kit = await require("canvaskit-wasm/bin/full/canvaskit.js")({
    wasmBinary: fs.readFileSync(
      require.resolve("canvaskit-wasm/bin/full/canvaskit.wasm"),
    ),
  });
  const {
    JsiSkApi,
  } = require("../node_modules/@shopify/react-native-skia/lib/commonjs/skia/web/JsiSkia.js");
  const Skia = JsiSkApi(kit);
  const load = Module._load;
  Module._load = function (id, ...args) {
    if (id === "@shopify/react-native-skia")
      return { Skia, PaintStyle: { Fill: 0, Stroke: 1 } };
    return load.call(this, id, ...args);
  };
  const { soldier, drawWorld } = require("../src/rendering/draw.ts");
  Module._load = load;
  const { createWorld, step } = require("../src/game/engine.ts");
  const { spawn } = require("../src/game/units.ts");
  const { UNITS } = require("../src/game/config.ts");
  const { attackDistance } = require("../src/game/geometry.ts");
  const { attackMotion } = require("../src/rendering/attackMotion.ts");
  const surface = Skia.Surface.Make(1600, Math.ceil(Object.keys(UNITS).length / 5) * 300 + 50);
  const c = surface.getCanvas();
  c.clear(Skia.Color("#374452"));
  for (const [index, kind] of Object.keys(UNITS).entries()) {
    const u = {
      id: 1,
      kind,
      side: "player",
      x: 0,
      lane: 0,
      hp: 100,
      maxHp: 100,
      damage: 1,
      cooldown: 1,
      attack: 0.17,
      hit: 0,
      dead: 0,
    };
    c.save();
    c.translate(85 + (index % 5) * 320, 230 + Math.floor(index / 5) * 300);
    c.scale(1.55, 1.55);
    soldier(c, u, 0.06, 0);
    c.restore();
  }
  surface.flush();
  const image = surface.makeImageSnapshot();
  fs.writeFileSync(
    path.resolve(__dirname, "../artifacts/cosmetic-attacks-roster.png"),
    image.encodeToBytes(),
  );
  image.dispose();
  surface.dispose();
  // Compare identical deterministic battles, with and without rendering every
  // tick. This covers damage, targeting, RNG, rewards, projectiles and movement.
  const battleSurface = Skia.Surface.Make(1000, 400);
  let checked = 0;
  for (const kind of Object.keys(UNITS)) {
    let captured = false;
    const world = createWorld(
      { food: 0, health: 0, damage: 0 },
      [kind],
      [kind, null, null],
    );
    world.food = 50;
    world.nextAI = 1e9;
    spawn(world, "player", kind);
    spawn(world, "enemy", "slimeArm");
    world.units[0].x = 250;
    world.units[1].x = 250 + attackDistance(world.units[0], world.units[1]);
    world.units[1].hp = world.units[1].maxHp = 10000;
    const control = structuredClone(world);
    for (let i = 0; i < 150; i++) {
      step(world, 1 / 60, () => 0.5);
      step(control, 1 / 60, () => 0.5);
      const random = Math.random;
      Math.random = () => {
        throw new Error("Renderer must not consume combat RNG");
      };
      let picture;
      try {
        picture = drawWorld(world, 1000, 400);
      } finally {
        Math.random = random;
      }
      assert.deepEqual(
        world,
        control,
        `${kind}: rendering changed combat at frame ${i}`,
      );
      checked++;
      if (
        !captured &&
        ["stormblade", "darkMage", "gundam", "barbarian", "cannon"].includes(
          kind,
        ) &&
        world.effects.some(
          (e) =>
            e.age > 0.04 &&
            e.age < 0.08 &&
            Math.abs(e.x - world.units[1].x) < 2,
        )
      ) {
        battleSurface.getCanvas().clear(Skia.Color("#374452"));
        battleSurface.getCanvas().drawPicture(picture);
        battleSurface.flush();
        const snap = battleSurface.makeImageSnapshot();
        fs.writeFileSync(
          path.resolve(__dirname, `../artifacts/cosmetic-${kind}-impact.png`),
          snap.encodeToBytes(),
        );
        snap.dispose();
        captured = true;
      }
      picture.dispose();
    }
  }
  battleSurface.dispose();
  for (const [kind, attack] of [
    ["barbarian", 0.17],
    ["gundam", 0.25],
    ["duck", 0.25],
  ]) {
    const pose = attackMotion({ kind, attack, hp: 100 });
    assert.ok(Math.abs(pose.x) < 1e-9);
    assert.ok(Math.abs(pose.y) < 1e-9);
    assert.ok(Math.abs(pose.angle) < 1e-9);
  }
  console.log(
    `Verified ${checked} rendered frames across all ${Object.keys(UNITS).length} units: simulation identical; no combat RNG consumed; melee contact poses preserved.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
