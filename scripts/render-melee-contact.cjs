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
  const {
    attackDistance,
    BATTLE_UNIT_SCALE,
  } = require("../src/game/geometry.ts");
  const surface = Skia.Surface.Make(1000, 1200);
  const c = surface.getCanvas();
  c.clear(Skia.Color("#e5e1d5"));
  const kinds = [
    "clubman",
    "spearman",
    "shark",
    "cyborgWalrus",
    "barbarian",
    "duck",
    "gundam",
    "slimeArm",
  ];
  for (let index = 0; index < kinds.length; index++) {
    const kind = kinds[index];
    const world = createWorld(
      { food: 0, health: 0, damage: 0 },
      Object.keys(UNITS),
      ["clubman", null, null],
    );
    world.food = 20;
    spawn(world, "player", "clubman");
    spawn(world, "enemy", "slimeArm");
    const [troop, enemy] = world.units;
    troop.kind = kind;
    troop.hp = troop.maxHp = enemy.hp = enemy.maxHp = 10000;
    troop.x = 32;
    enemy.x = troop.x + attackDistance(troop, enemy);
    troop.lane = enemy.lane = 0;
    troop.attack =
      kind === "barbarian" ? 0.02 : kind === "clubman" ? 0.035 : 0.125;
    enemy.attack = 0;
    c.save();
    c.translate(45 + (index % 2) * 500, 200 + Math.floor(index / 2) * 235);
    c.scale(1.45, 1.45);
    soldier(c, enemy, 0, 0, BATTLE_UNIT_SCALE);
    soldier(c, troop, 0, 0, BATTLE_UNIT_SCALE);
    c.restore();
  }
  surface.flush();
  const img = surface.makeImageSnapshot();
  fs.writeFileSync(
    path.resolve(__dirname, "../artifacts/melee-contact.png"),
    img.encodeToBytes(),
  );
  img.dispose();
  surface.dispose();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
