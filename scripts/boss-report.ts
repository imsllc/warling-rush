import { createWorld, step } from "../src/game/engine";
import { spawn } from "../src/game/units";
import { bossForWave, enemyStats } from "../src/game/waves";
import { UnitKind } from "../src/game/config";

const wave = Number(process.argv[2] ?? 20);
const bossKind = bossForWave(wave);
if (!bossKind) throw new Error("Choose a boss wave, such as 20 or 40.");
console.log(`Wave ${wave} boss:`, enemyStats(bossKind, wave));
for (const bonus of bossKind === "pyramid"
  ? [20, 40, 60, 80, 100]
  : [0, 5, 10, 20]) {
  for (const army of [
    ["clubman", "spearman", "rock"],
    ["cyborgWalrus", "rock", "mech"],
  ] as UnitKind[][]) {
    const w = createWorld(
      { food: bonus, health: bonus, damage: bonus },
      army,
      [army[0], army[1], army[2]],
      wave,
    );
    let next = 0;
    for (let tick = 0; tick < 300 * 60 && !w.result; tick++) {
      if (tick % 30 === 0 && spawn(w, "player", army[next % army.length]))
        next++;
      step(w, 1 / 60, () => 0.5);
    }
    console.log({
      bonus,
      army,
      result: w.result,
      seconds: Math.round(w.time),
      baseHp: w.bases.player,
      bossHp: w.units.find((u) => u.kind === bossKind)?.hp ?? 0,
    });
  }
}
