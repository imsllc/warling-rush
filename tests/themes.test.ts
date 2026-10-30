import { test } from "node:test";
import assert from "node:assert/strict";
import { battleTheme, BATTLE_THEMES } from "../src/rendering/themes";
import { createWorld } from "../src/game/engine";
import { decodeProgress, initialProgress, rewardBattle } from "../src/progress";

test("each theme lasts ten waves and the sequence repeats after sixty", () => {
  const cycle = [
    "grasslands",
    "mountains",
    "desert",
    "lava",
    "space",
    "jungle",
  ];
  assert.deepEqual([...BATTLE_THEMES], cycle);
  for (let battle = 1; battle <= 180; battle++) {
    assert.equal(battleTheme(battle), cycle[Math.floor((battle - 1) / 10) % 6]);
  }
});

test("jungle follows space and advances back to grasslands after clearing wave sixty", () => {
  assert.equal(battleTheme(50), "space");
  assert.equal(battleTheme(51), "jungle");
  assert.equal(battleTheme(60), "jungle");
  assert.equal(battleTheme(61), "grasslands");
  const progress = { ...initialProgress(), waveNumber: 60 };
  assert.equal(
    battleTheme(rewardBattle(progress, true).waveNumber),
    "grasslands",
  );
});

test("cleared waves advance the saved theme; defeats and restarts retain the wave", () => {
  let progress = initialProgress();
  for (let i = 0; i < 10; i++) progress = rewardBattle(progress, true);
  progress = rewardBattle(progress, false);
  progress = decodeProgress(JSON.stringify(progress));
  const prepare = () =>
    createWorld(
      progress.levels,
      progress.unlockedUnits,
      progress.army,
      progress.waveNumber,
    );
  const world = prepare();
  assert.equal(world.battleNumber, 11);
  assert.equal(battleTheme(world.battleNumber), "mountains");
  assert.equal(prepare().battleNumber, world.battleNumber);
  assert.equal(
    battleTheme(createWorld(progress.levels).battleNumber),
    "grasslands",
  );
});
