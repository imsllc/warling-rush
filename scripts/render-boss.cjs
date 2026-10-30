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
  const { drawWorld } = require("../src/rendering/draw.ts");
  Module._load = original;
  const { createWorld, step } = require("../src/game/engine.ts");
  const { spawn } = require("../src/game/units.ts");
  const { bossForWave } = require("../src/game/waves.ts");
  const wave = Number(process.argv[2] ?? 20);
  const kind = bossForWave(wave);
  if (!kind) throw new Error("Choose a boss wave, such as 20 or 40.");
  const world = createWorld(
    { food: 10, health: kind === "pyramid" ? 100 : 5, damage: 5 },
    ["clubman", "rock", "mech"],
    ["clubman", "rock", "mech"],
    wave,
  );
  world.nextAI = Infinity;
  spawn(world, "enemy", kind);
  world.units[0].x = 700;
  for (const [kind, x] of [
    ["clubman", 615],
    ["rock", 450],
    ["mech", 380],
  ]) {
    world.food = 15;
    spawn(world, "player", kind);
    world.units.at(-1).x = x;
  }
  for (let i = 0; i < (kind === "pyramid" ? 64 : 18); i++) step(world, 1 / 60);
  const surface = Skia.Surface.Make(1000, 620);
  const picture = drawWorld(world, 1000, 620);
  surface.getCanvas().drawPicture(picture);
  surface.flush();
  const image = surface.makeImageSnapshot();
  const output = path.resolve(__dirname, `../artifacts/${kind}-boss.png`);
  fs.writeFileSync(output, image.encodeToBytes());
  image.dispose();
  picture.dispose();
  surface.dispose();
  // A compact phone view checks the large model stays within the field.
  const compact = Skia.Surface.Make(390, 360);
  const smallPicture = drawWorld(world, 390, 360);
  compact.getCanvas().drawPicture(smallPicture);
  compact.flush();
  const smallImage = compact.makeImageSnapshot();
  fs.writeFileSync(
    path.resolve(__dirname, `../artifacts/${kind}-boss-phone.png`),
    smallImage.encodeToBytes(),
  );
  smallImage.dispose();
  smallPicture.dispose();
  compact.dispose();
  console.log(output);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
