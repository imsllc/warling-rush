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
  const surface = Skia.Surface.Make(900, 680);
  const c = surface.getCanvas();
  c.clear(Skia.Color("#41495d"));
  const world = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "tiger"],
    ["clubman", "tiger", null],
  );
  world.food = 15;
  spawn(world, "player", "tiger");
  const model = { ...world.units[0], x: 0 };
  for (const [x, attack] of [
    [190, 0],
    [510, 0.125],
  ]) {
    model.attack = attack;
    c.save();
    c.translate(x, 240);
    c.scale(2.8, 2.8);
    soldier(c, model, 0, 0);
    c.restore();
  }
  // Use the exact shop/deployment portrait framing, including the firing pose.
  for (const [label, attack] of [
    ["idle", 0],
    ["firing", 0.125],
  ]) {
    const portrait = Skia.Surface.Make(72, 64);
    const pc = portrait.getCanvas();
    pc.translate(5, 7);
    pc.scale(0.66, 0.66);
    soldier(pc, { ...model, x: 44, attack }, 0, 66);
    portrait.flush();
    const portraitImage = portrait.makeImageSnapshot();
    fs.writeFileSync(
      path.resolve(__dirname, `../artifacts/tiger-portrait-${label}.png`),
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
  world.units[0].x = 370;
  world.food = 15;
  spawn(world, "player", "clubman");
  world.units[1].x = 490;
  spawn(world, "enemy", "slimeArm");
  world.units[2].x = 560;
  for (let i = 0; i < 17; i++) step(world, 1 / 60);
  const picture = drawWorld(world, 900, 400);
  c.save();
  c.translate(0, 280);
  c.drawPicture(picture);
  c.restore();
  picture.dispose();
  surface.flush();
  const image = surface.makeImageSnapshot();
  const output = path.resolve(__dirname, "../artifacts/tiger.png");
  fs.writeFileSync(output, image.encodeToBytes());
  image.dispose();
  surface.dispose();
  console.log(output);
  console.log(UNITS.tiger);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
