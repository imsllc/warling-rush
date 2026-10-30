import { mkdirSync, writeFileSync } from "node:fs";
import { UNITS, UnitKind } from "../src/game/config";
import { combatPower, foodEfficiency } from "../src/game/balance";
import { equalFoodMatch } from "./lib/balance-match";

const kinds = Object.keys(UNITS) as UnitKind[];
const results = Object.fromEntries(
  kinds.map((kind) => [kind, { wins: 0, losses: 0, draws: 0 }]),
) as Record<UnitKind, { wins: number; losses: number; draws: number }>;
const matrix: string[] = [];
for (let i = 0; i < kinds.length; i++)
  for (let j = i + 1; j < kinds.length; j++) {
    const a = kinds[i],
      b = kinds[j];
    const winners: string[] = [];
    for (const reverse of [false, true]) {
      const result = equalFoodMatch(a, b, reverse);
      if (result.winner === "draw") {
        results[a].draws++;
        results[b].draws++;
        winners.push("Draw");
      } else {
        const winner = result.winner === "player" ? a : b,
          loser = winner === a ? b : a;
        results[winner].wins++;
        results[loser].losses++;
        winners.push(UNITS[winner].name);
      }
    }
    matrix.push(
      `| ${UNITS[a].name} vs ${UNITS[b].name} | ${winners.join(" / ")} |`,
    );
  }
const rows = kinds.map((kind) => {
  const u = UNITS[kind];
  return {
    unit: u.name,
    profile: u.profile,
    food: u.cost,
    coins: u.unlockCost,
    health: u.hp,
    hit: u.damage,
    dps: +(u.damage / u.cooldown).toFixed(1),
    dpsPerFood: +(u.damage / u.cooldown / u.cost).toFixed(2),
    powerPerFood: +(combatPower(u) / u.cost).toFixed(3),
    power: +combatPower(u).toFixed(3),
    efficiency: +foodEfficiency(u).toFixed(3),
    ...results[kind],
  };
});
console.table(rows);
const report = [
  "# Unit balance report",
  "",
  "Generated with `npm run balance`.",
  "",
  "Static equal-food armies, at least 12 food per side (rounded up to a common multiple), three lanes, 280 distance between fronts, no reinforcements or permanent upgrades. Each pair runs twice, reversing attack priority. These checks complement live playtesting; they do not model every composition or deployment timing.",
  "",
  "| Unit | Profile | Food | Coins | HP | Hit | DPS | DPS / food | HP/DPS power / food | HP/DPS power | Budget ratio | Wins / Losses / Draws |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ...rows.map(
    (r) =>
      `| ${r.unit} | ${r.profile} | ${r.food} | ${r.coins} | ${r.health} | ${r.hit} | ${r.dps} | ${r.dpsPerFood} | ${r.powerPerFood} | ${r.power} | ${r.efficiency} | ${r.wins} / ${r.losses} / ${r.draws} |`,
  ),
  "",
  "HP/DPS power is sqrt((HP / 100) × (DPS / 16.667)), before credit for reach or speed. Power per food exposes actual purchase value, while budget ratio compares against the intended food^1.2 progression curve (target 1.00). Higher tiers gain value per food; tank and damage profiles still trade health against DPS. Small differences come from whole-number rounding. Cards display damage per hit (the total volley for Mech); DPS remains listed here for balance and cooldown checks.",
  "",
  "| Matchup | Winners (normal / reversed priority) |",
  "| --- | --- |",
  ...matrix,
  "",
].join("\n");
mkdirSync("artifacts", { recursive: true });
writeFileSync("artifacts/unit-balance-report.md", report);
console.log("Saved artifacts/unit-balance-report.md");
