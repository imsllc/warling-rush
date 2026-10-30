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
  const surface = Skia.Surface.Make(1000, 800);
  const c = surface.getCanvas();
  c.clear(Skia.Color("#41495d"));
  const world = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "raccoon"],
    ["clubman", "raccoon", null],
  );
  world.food = 21;
  spawn(world, "player", "raccoon");
  const model = { ...world.units[0], x: 0 };
  for (const [x, attack] of [
    [190, 0],
    [510, 0.1],
  ]) {
    model.attack = attack;
    c.save();
    c.translate(x, 320);
    c.scale(2.8, 2.8);
    soldier(c, model, 0, 0);
    c.restore();
  }
  const clean = Skia.Surface.Make(560, 420);
  const cleanCanvas = clean.getCanvas(); cleanCanvas.clear(Skia.Color("#41495d"));
  cleanCanvas.translate(230, 345); cleanCanvas.scale(2.7, 2.7);
  soldier(cleanCanvas, { ...model, x: 0, attack: 0 }, 0.2, 0);
  clean.flush(); fs.writeFileSync("artifacts/raccoon-redraw-preview.png", clean.makeImageSnapshot().encodeToBytes());
  // Use the exact shop/deployment portrait framing, including the firing pose.
  for (const [label, attack] of [
    ["idle", 0],
    ["firing", 0.1],
  ]) {
    const portrait = Skia.Surface.Make(72, 64);
    const pc = portrait.getCanvas();
    pc.translate(5, 7);
    pc.scale(0.46, 0.46);
    soldier(pc, { ...model, x: 52, attack }, 0, 115);
    portrait.flush();
    const portraitImage = portrait.makeImageSnapshot();
    fs.writeFileSync(
      path.resolve(__dirname, `../artifacts/raccoon-portrait-${label}.png`),
      portraitImage.encodeToBytes(),
    );
    c.save();
    c.translate(725, label === "idle" ? 20 : 145);
    c.scale(1.8, 1.8);
    c.drawImage(portraitImage, 0, 0);
    c.restore();
    portraitImage.dispose();
    portrait.dispose();
  }
  world.nextAI = Infinity;
  world.units[0].x = 350;
  world.food = 21;
  spawn(world, "player", "clubman");
  world.units[1].x = 490;
  spawn(world, "enemy", "slimeArm");
  world.units[2].x = 560;
  world.units[2].hp = world.units[2].maxHp = 100000;
  for (let i = 0; i < 22; i++) step(world, 1 / 60);
  const picture = drawWorld(world, 900, 400);
  c.save();
  c.translate(0, 400);
  c.drawPicture(picture);
  c.restore();
  picture.dispose();
  surface.flush();
  const image = surface.makeImageSnapshot();
  const output = path.resolve(__dirname, "../artifacts/raccoon.png");
  fs.writeFileSync(output, image.encodeToBytes());
  image.dispose();
  surface.dispose();
  console.log(output);
  console.log(UNITS.raccoon);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
