// Render the actual battlefield drawing code through Skia's CanvasKit backend.
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
  const { createWorld } = require("../src/game/engine.ts");
  const { BATTLE_THEMES } = require("../src/rendering/themes.ts");
  Module._load = original;
  const width = 260,
    height = 520;
  const surface = Skia.Surface.Make(width * BATTLE_THEMES.length, height);
  const compact = Skia.Surface.Make(360 * BATTLE_THEMES.length, 480);
  const canvas = surface.getCanvas();
  BATTLE_THEMES.forEach((theme, index) => {
    const world = createWorld(
      { food: 0, health: 0, damage: 0 },
      undefined,
      undefined,
      index * 10 + 1,
    );
    const picture = drawWorld(world, width, height);
    canvas.save();
    canvas.translate(index * width, 0);
    canvas.drawPicture(picture);
    canvas.restore();
    picture.dispose();
    // Inspect road edges across every theme in a compact viewport too.
    const compactPicture = drawWorld(world, 360, 480);
    const compactCanvas = compact.getCanvas();
    compactCanvas.save();
    compactCanvas.translate(index * 360, 0);
    compactCanvas.drawPicture(compactPicture);
    compactCanvas.restore();
    compactPicture.dispose();
    if (theme === "jungle") {
      const jungle = Skia.Surface.Make(720, 720);
      for (const [x, h] of [
        [0, 720],
        [360, 480],
      ]) {
        const picture = drawWorld(world, 360, h);
        const c = jungle.getCanvas();
        c.save();
        c.translate(x, 0);
        c.drawPicture(picture);
        c.restore();
        picture.dispose();
      }
      jungle.flush();
      const image = jungle.makeImageSnapshot();
      fs.writeFileSync(
        path.resolve(__dirname, "../artifacts/jungle-background.png"),
        image.encodeToBytes(),
      );
      image.dispose();
      jungle.dispose();
    }
  });
  surface.flush();
  const image = surface.makeImageSnapshot();
  const output = path.resolve(__dirname, "../artifacts/battle-themes.png");
  fs.writeFileSync(output, image.encodeToBytes());
  image.dispose();
  surface.dispose();
  compact.flush();
  const compactImage = compact.makeImageSnapshot();
  fs.writeFileSync(
    path.resolve(__dirname, "../artifacts/battle-themes-compact.png"),
    compactImage.encodeToBytes(),
  );
  compactImage.dispose();
  compact.dispose();
  console.log(output);
  const units = Skia.Surface.Make(640, 260);
  const uc = units.getCanvas();
  uc.clear(Skia.Color("#41495d"));
  ["player", "enemy"].forEach((side, i) => {
    const world = createWorld(
      { food: 0, health: 0, damage: 0 },
      ["mech"],
      ["mech", null, null],
    );
    const { spawn } = require("../src/game/units.ts");
    world.food = world.remainingEnemies = 15;
    // Keep the historical mirrored mech art comparison without enemy spawning.
    spawn(world, "player", "mech");
    const unit = world.units[0];
    unit.side = side;
    unit.x = 0;
    uc.save();
    uc.translate(160 + i * 320, 218);
    uc.scale(2.8, 2.8);
    soldier(uc, unit, 0, 0);
    uc.restore();
    // Also exercise the real portrait framing to catch clipped pods or feet.
    const portrait = Skia.Surface.Make(72, 64);
    const pc = portrait.getCanvas();
    pc.translate(5, 7);
    pc.scale(0.69, 0.69);
    unit.x = 34;
    soldier(pc, unit, 0, 75);
    portrait.flush();
    const shot = portrait.makeImageSnapshot();
    fs.writeFileSync(
      path.resolve(__dirname, `../artifacts/mech-portrait-${side}.png`),
      shot.encodeToBytes(),
    );
    shot.dispose();
    portrait.dispose();
  });
  units.flush();
  const unitImage = units.makeImageSnapshot();
  fs.writeFileSync(
    path.resolve(__dirname, "../artifacts/mech-art.png"),
    unitImage.encodeToBytes(),
  );
  unitImage.dispose();
  units.dispose();
  const { spawn } = require("../src/game/units.ts");
  const { step } = require("../src/game/engine.ts");
  const battle = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["mech"],
    ["mech", null, null],
  );
  battle.food = battle.remainingEnemies = 15;
  battle.nextAI = Infinity;
  spawn(battle, "player", "mech");
  spawn(battle, "enemy", "slimeThrower");
  battle.units[0].x = 400;
  battle.units[1].x = 600;
  for (let i = 0; i < 20; i++) step(battle, 1 / 60);
  const battleSurface = Skia.Surface.Make(1000, 600);
  const battlePicture = drawWorld(battle, 1000, 600);
  battleSurface.getCanvas().drawPicture(battlePicture);
  battleSurface.flush();
  const battleImage = battleSurface.makeImageSnapshot();
  fs.writeFileSync(
    path.resolve(__dirname, "../artifacts/mech-missiles.png"),
    battleImage.encodeToBytes(),
  );
  battleImage.dispose();
  battlePicture.dispose();
  battleSurface.dispose();

  // Check enlarged troops and health bars in both tall and compact phone fields.
  const rosterBattle = createWorld(
    { food: 0, health: 0, damage: 0 },
    ["clubman", "spearman", "rock", "mech"],
    ["clubman", "rock", "mech"],
  );
  for (const side of ["player", "enemy"]) {
    for (const [kind, x] of [
      ["mech", 210],
      ["rock", 330],
      ["clubman", 465],
    ]) {
      rosterBattle.food = rosterBattle.remainingEnemies = 15;
      spawn(
        rosterBattle,
        side,
        side === "enemy"
          ? kind === "clubman"
            ? "slimeArm"
            : "slimeThrower"
          : kind,
      );
      const unit = rosterBattle.units.at(-1);
      unit.x = side === "player" ? x : 1000 - x;
      unit.hp *= 0.7;
      unit.attack = 0.15;
    }
  }
  const previews = Skia.Surface.Make(780, 700);
  for (const [x, height] of [
    [0, 700],
    [390, 360],
  ]) {
    const picture = drawWorld(rosterBattle, 390, height);
    const c = previews.getCanvas();
    c.save();
    c.translate(x, 0);
    c.drawPicture(picture);
    c.restore();
    picture.dispose();
  }
  previews.flush();
  const preview = previews.makeImageSnapshot();
  fs.writeFileSync(
    path.resolve(__dirname, "../artifacts/larger-battle-units.png"),
    preview.encodeToBytes(),
  );
  preview.dispose();
  previews.dispose();
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
