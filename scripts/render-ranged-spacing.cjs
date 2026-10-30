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
  const { soldier, drawWorld } = require("../src/rendering/draw.ts");
  Module._load = original;
  const { createWorld, step } = require("../src/game/engine.ts");
  const { spawn } = require("../src/game/units.ts");
  const { UNITS } = require("../src/game/config.ts");
  const world = createWorld({ food: 0, health: 0, damage: 0 }, ["raccoon", "gundam", "barbarian"], ["raccoon", "gundam", "barbarian"], 100);
  world.nextAI = Infinity; world.food = 100;
  for (const kind of ["raccoon", "gundam", "barbarian"]) spawn(world, "player", kind);
  spawn(world, "enemy", "pyramid");
  world.units.slice(0,3).forEach((unit) => { unit.x = 400; });
  const boss = world.units[3]; boss.x = 900; boss.hp = boss.maxHp = 1e9; boss.damage = 0;
  for (let tick = 0; tick < 900; tick++) step(world, 1/60);
  const surface = Skia.Surface.Make(1000, 500);
  const picture = drawWorld(world, 1000, 500);
  surface.getCanvas().drawPicture(picture); surface.flush();
  fs.writeFileSync("artifacts/ranged-spacing-pyramid.png", surface.makeImageSnapshot().encodeToBytes());
  console.log(world.units.map(({kind,x}) => ({kind,x})));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
