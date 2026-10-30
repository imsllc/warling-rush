// Render the actual game artwork with CanvasKit for visual inspection.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
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
  const original = Module._load;
  Module._load = function (id, ...args) {
    if (id === "@shopify/react-native-skia")
      return { Skia, PaintStyle: { Fill: 0, Stroke: 1 } };
    return original.call(this, id, ...args);
  };
  const { drawWorld, soldier } = require("../src/rendering/draw.ts");
  Module._load = original;
  const { createWorld, step } = require("../src/game/engine.ts");
  const { spawn } = require("../src/game/units.ts");
  const surface = Skia.Surface.Make(900, 680);
  const c = surface.getCanvas();
  c.clear(Skia.Color("#303d42"));
  for (const [i, kind] of ["slimeArm", "slimeThrower"].entries()) {
    for (const [j, attack] of [0, 0.125].entries()) {
      const world = createWorld({ food: 0, health: 0, damage: 0 });
      spawn(world, "enemy", kind);
      const unit = world.units[0];
      unit.x = 0;
      unit.attack = attack;
      c.save();
      c.translate(150 + i * 400 + j * 180, 210);
      c.scale(2, 2);
      soldier(c, unit, 0, 0);
      c.restore();
    }
  }
  const world = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "rock"],
    ["clubman", "rock", null],
    2,
  );
  world.nextAI = Infinity;
  for (const [side, kind, x] of [
    ["player", "clubman", 470],
    ["player", "rock", 310],
    ["enemy", "slimeArm", 495],
    ["enemy", "slimeThrower", 640],
  ]) {
    world.food = world.remainingEnemies = 15;
    spawn(world, side, kind);
    world.units.at(-1).x = x;
  }
  for (let i = 0; i < 18; i++) step(world, 1 / 60);
  const picture = drawWorld(world, 900, 400);
  c.save();
  c.translate(0, 280);
  c.drawPicture(picture);
  c.restore();
  picture.dispose();
  surface.flush();
  const image = surface.makeImageSnapshot();
  const output = path.resolve(__dirname, "../artifacts/slime-enemies.png");
  fs.writeFileSync(output, image.encodeToBytes());
  image.dispose();
  surface.dispose();
  console.log(output);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
