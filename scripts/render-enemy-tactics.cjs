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
  const { attackDistance } = require("../src/game/geometry.ts");
  const save = (surface, filename) => {
    surface.flush();
    const image = surface.makeImageSnapshot();
    const output = path.resolve(__dirname, `../artifacts/${filename}.png`);
    fs.writeFileSync(output, image.encodeToBytes());
    image.dispose();
    surface.dispose();
    console.log(output);
  };
  const sheet = Skia.Surface.Make(1000, 480);
  const c = sheet.getCanvas();
  c.clear(Skia.Color("#303d42"));
  const variants = [
    ["slimeArm"],
    ["slimeArm", "armored"],
    ["slimeThrower"],
    ["slimeThrower", "frail"],
  ];
  for (const [column, [kind, trait]] of variants.entries()) {
    for (const [row, attack] of [0, 0.125].entries()) {
      const world = createWorld(
        { food: 0, health: 0, damage: 0 },
        undefined,
        undefined,
        5,
      );
      if (!spawn(world, "enemy", kind, trait))
        throw new Error("Preview spawn failed");
      const unit = { ...world.units[0], x: 0, lane: 0, attack };
      c.save();
      c.translate(175 + column * 250, 210 + row * 240);
      c.scale(2, 2);
      soldier(c, unit, 0, 0);
      c.restore();
    }
  }
  save(sheet, "enemy-tactics");
  const world = createWorld(
    { food: 0, health: 10, damage: 0 },
    ["clubman", "rock"],
    ["clubman", "rock", null],
    5,
  );
  world.nextAI = Infinity;
  for (const [side, kind, trait, x] of [
    ["player", "clubman", undefined, 450],
    ["player", "rock", undefined, 330],
    ["enemy", "slimeArm", "armored", 540],
    ["enemy", "slimeThrower", "frail", 700],
    ["enemy", "slimeArm", undefined, 800],
  ]) {
    world.food = 20;
    if (!spawn(world, side, kind, trait))
      throw new Error("Battle preview spawn failed");
    const unit = world.units.at(-1);
    unit.x = x;
    unit.lane = 1;
    if (kind === "clubman") unit.x = 540 - attackDistance(unit, { kind: "slimeArm" });
  }
  for (let tick = 0; tick < 18; tick++) step(world, 1 / 60);
  for (const [width, height, name] of [
    [1000, 500, "enemy-tactics-battle"],
    [390, 360, "enemy-tactics-phone"],
  ]) {
    const surface = Skia.Surface.Make(width, height);
    const picture = drawWorld(world, width, height);
    surface.getCanvas().drawPicture(picture);
    picture.dispose();
    save(surface, name);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
