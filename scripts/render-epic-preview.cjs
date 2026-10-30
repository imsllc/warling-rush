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
  const Skia = JsiSkApi(kit),
    load = Module._load;
  Module._load = function (id, ...args) {
    if (id === "@shopify/react-native-skia")
      return { Skia, PaintStyle: { Fill: 0, Stroke: 1 } };
    return load.call(this, id, ...args);
  };
  const { drawWorld } = require("../src/rendering/draw.ts");
  Module._load = load;
  const { createWorld, step } = require("../src/game/engine.ts"),
    { spawn } = require("../src/game/units.ts"),
    { attackDistance } = require("../src/game/geometry.ts");
  const kinds = [
    "stormblade",
    "cannon",
    "darkMage",
    "barbarian",
    "gundam",
    "mech",
    "basketballPlayer",
    "skeletonKing",
  ];
  for (const kind of (process.argv.length > 2 ? process.argv.slice(2) : kinds)) {
    const dir = path.resolve(__dirname, "../artifacts/epic-frames", kind);
    fs.mkdirSync(dir, { recursive: true });
    const world = createWorld(
      { food: 0, health: 0, damage: 0 },
      [kind],
      [kind, null, null],
    );
    world.nextAI = 1e9;
    world.food = 50;
    spawn(world, "player", kind);
    spawn(world, "enemy", "slimeArm");
    const [u, e] = world.units;
    u.x = 330;
    e.x = u.x + attackDistance(u, e);
    u.cooldown = 0.12;
    e.cooldown = 1000;
    u.hp = u.maxHp = e.hp = e.maxHp = 10000;
    const surface = Skia.Surface.Make(720, 432),
      c = surface.getCanvas();
    for (let frame = 0; frame < 84; frame++) {
      step(world, 1 / 60, () => 0.5);
      step(world, 1 / 60, () => 0.5);
      const pic = drawWorld(world, 720, 432);
      c.clear(Skia.Color("#1b273a"));
      c.drawPicture(pic);
      pic.dispose();
      surface.flush();
      const image = surface.makeImageSnapshot();
      fs.writeFileSync(
        path.join(dir, String(frame).padStart(3, "0") + ".png"),
        image.encodeToBytes(),
      );
      image.dispose();
    }
    surface.dispose();
    console.log("Rendered", kind);
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
