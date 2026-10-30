# Enemy wave progression

## Boss encounters

Every 20th wave replaces the normal slime force with one boss, cycling Dreadmaw (20/120/220), Ironback (40/140/240), Iron Titan (60/160/260), Professor Fizz (80/180/280), and the All-Seeing Eye (100/200/300). The header marks the encounter as BOSS. The underlying power curve supplies the current wave's stat and army budgets; bosses continue getting stronger on later appearances.

Ironback uses the same clean three-quarter drawing style and 3× scale, with dark fur, a broad hunched torso, a projecting gorilla muzzle, long arms and a giant knuckle punch. At wave 40 he has **22,259 HP and 240 damage per target**, punching up to three nearby troops every 1.3 seconds. All bosses use the shared difficulty premium below. Only the boss scheduled for a wave can spawn.

Iron Titan is a giant humanoid robot with steel-gray armor, rounded shoulder guards, purple joints, a mint visor and an articulated piston punch. At wave 60 it has **36,992 HP and 315 damage per target**, striking up to three nearby troops every 1.3 seconds. It uses the same 3× model scale, enemy-only restrictions and shared wave-derived stats.

Professor Fizz wears a white lab coat, has wild white hair and glasses, and wields an animated bubbling green beaker. At wave 80 he has **53,723 HP and 390 damage per hit**. His potion globs have 240 range, a 1.8-second cooldown, travel from the beaker, and splash up to three troops within 55 world units of impact. Potions also damage the bunker. Splash still occurs when the original target dies before impact. Green particles distinguish potion impacts.

Bosses have a deliberate difficulty premium: 60% more health than the expected complete 5:2 mixed slime army and attacks stronger than either individual slime type. Dreadmaw hits one target; the other melee bosses strike up to three targets every 1.3 seconds. The scientist exchanges that attack speed for range and splash. This is a tuning budget, not a guarantee that every army composition finds the encounter equally hard. Counter variants do not change the base mixture used to calculate boss stats.

```text
mixed health = (5 × scaled bruiser health + 2 × scaled lobber health) / 7
boss health = round(mixed health × normal wave slime count × 1.6)
boss attack = scaled bruiser attack × 5
```

The All-Seeing Eye is an intentionally much harder milestone: it multiplies that same-wave boss health by **2.5** and damage by **2**. At wave 100 this produces **183,369 HP and 910 damage per target**. It floats above a shadow as a shaded golden pyramid with a single central eye.

The eye charges for **0.9 seconds**, displaying a thin aiming ray and pulsing glow, then fires a bright light beam for **0.35 seconds**. It has **360 range**, a **2.2-second attack interval**, and pierces up to **five troops** across the forward beam segment. Damage applies once per shot. Bunker-targeted beams damage the bunker. The pyramid holds position during the charge/beam, and killing it cancels any pending beam. These extra stats, range and piercing apply to the pyramid, not the other bosses. Later pyramid appearances retain the bonus over their current wave's standard boss budget.

At wave 20 this yields **9,974 HP and 160 damage per target**. Dreadmaw swipes every 1.3 seconds, hitting one nearby troop, and walks at 28 world units/second. Its model is drawn at 3× normal unit scale; melee contact follows its lower body and animated hands. The boss starts fully offscreen, enters after the normal five-second delay, and displays a wider red health bar.

There are no additional slime spawns on boss waves. Killing the boss wins, bunker destruction loses, and failed attempts retain the same boss wave. Winning returns to the next normal wave. Bosses are enemy-only and cannot be purchased or equipped. The table below describes the underlying normal slime budget, which boss waves convert into boss stats.

## Normal wave formula

Enemy count, health and damage grow from the current saved wave number. The combined strength estimate follows a power curve: faster than linear, with easing percentage increases instead of constant exponential growth.

For wave `w`:

```text
strength = (1 + 0.08 × (w - 1)) ^ 1.5
slime count = ceil(12 × strength ^ 0.4)
slime health = round(type's base health × strength ^ 0.65)
slime attack = round(type's base damage × strength ^ 0.55)
```

| Wave | Total slimes | Health multiplier | Attack multiplier | Bruiser health / attack |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 12 | 1.00× | 1.00× | 100 / 15 |
| 2 | 13 | 1.08× | 1.07× | 108 / 16 |
| 5 | 15 | 1.31× | 1.26× | 131 / 19 |
| 10 | 17 | 1.70× | 1.56× | 170 / 23 |
| 25 | 23 | 2.84× | 2.42× | 284 / 36 |
| 50 | 32 | 4.73× | 3.72× | 473 / 56 |
| 100 | 45 | 8.45× | 6.08× | 845 / 91 |

`count × sqrt(health × attack)` estimates strength, rather than guaranteeing combat outcomes. Relative to wave one, it follows `strength` before integer rounding because `0.4 + (0.65 + 0.55) / 2 = 1`. Attack intervals, range and speed stay fixed for each type. Enemy stats are independent of player upgrades.

Wave one contains bruisers. From wave two, each spawn is drawn from bruisers and lobbers with weights 5:2. Every slime consumes exactly one scheduled spawn, so composition cannot change the total count. Lobbers retain their distinct base stats. Introducing ranged enemies makes wave two an additional step in challenge.

The old linear food budget and 120-budget ceiling are removed. Count and stats keep growing across theme cycles. Up to 36 enemies can be alive at once; player deployment is uncapped. Additional enemies wait for space. Victory requires every scheduled slime to enter and every enemy to die.

## Counter variants

Variants replace some scheduled slimes, adding no extra enemies or gold. The existing 5:2 kind selection remains unchanged.

- From wave 3, some melee slimes wear a steel cap and gold shield. Their scaled HP and attack stay unchanged. Ranged hits deal 70% damage to them; melee hits deal 130%. An equal damage mix has the same average multiplier as before.
- From wave 5, some ranged lobbers are cracked orange jelly and launch bright orange globs. They have 50% of their normally scaled HP and twice their normally scaled damage, retaining the same HP × DPS budget before integer rounding. Their range, speed, and attack interval stay unchanged.
- Other slimes remain the familiar green versions. Bosses never receive these variants. A compact visual reminder appears before normal battles once each counter is introduced; the active battlefield gains no status counters or extra buttons.

## Bursts and breathing room

The initial five-second delay stays unchanged. Scheduled enemies enter in small groups separated by rest periods:

| Waves | Group size | Interval within group | Rest after group | Average interval |
| --- | ---: | ---: | ---: | ---: |
| 1 | 3 | 1.2 seconds | 3 seconds | 1.8 seconds |
| Other normal waves | 4 | 0.9 seconds | 4.5 seconds | 1.8 seconds |
| Boss waves | One boss | — | — | Original single-boss encounter |

`rest = group size × 1.8 − (group size − 1) × group interval`, so each complete group/rest cycle retains the original average spawn cadence. A final partial group uses only the remaining scheduled enemies. Blocked attempts retain their chosen kind, variant position, and remaining count; they retry after the original 1.8-second interval without consuming a group member.

## Gold rewards

The reward formula is unchanged: each normal enemy pays `10 + floor((wave − 1) / 5)` coins. A boss pays that rate multiplied by the current wave's underlying normal enemy count. Variants pay the same amount as green enemies and cost one spawn each. Full-wave gold therefore remains `normal count × per-enemy rate`, including boss waves and waves beyond 100. Kills pay once, and losses retain earned kill coins.

Tuning lives in `src/game/waves.ts` under `WAVE_SCALING`. Player roster stats, prices, food and upgrades remain independent. Retries use the same wave scaling. Tests verify the curve through wave 1000, exact counts for both extreme compositions, actual spawned stats and scaled projectile damage. Late-game win rates still need playtesting with real upgrade choices.
