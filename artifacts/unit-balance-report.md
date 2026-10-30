# Unit balance report

Generated with `npm run balance`.

Static equal-food armies, at least 12 food per side (rounded up to a common multiple), three lanes, 280 distance between fronts, no reinforcements or permanent upgrades. Each pair runs twice, reversing attack priority. These checks complement live playtesting; they do not model every composition or deployment timing.

| Unit | Profile | Food | Coins | HP | Hit | DPS | DPS / food | HP/DPS power / food | HP/DPS power | Budget ratio | Wins / Losses / Draws |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Clubman | balanced | 1 | 0 | 100 | 15 | 16.7 | 16.67 | 1 | 1 | 1 | 0 / 40 / 0 |
| Spearman | balanced | 2 | 100 | 237 | 45 | 39.1 | 19.57 | 1.179 | 2.359 | 0.996 | 2 / 38 / 0 |
| Rock Thrower | damage | 3 | 225 | 262 | 109 | 77.9 | 25.95 | 1.166 | 3.498 | 1.002 | 30 / 10 / 0 |
| Stormblade | damage | 4 | 375 | 384 | 165 | 113.8 | 28.45 | 1.28 | 5.12 | 0.999 | 9 / 31 / 0 |
| Mech | balanced | 5 | 525 | 646 | 194 | 107.8 | 21.56 | 1.293 | 6.463 | 1.001 | 33 / 7 / 0 |
| Machine Gunner | damage | 6 | 700 | 576 | 27 | 168.8 | 28.13 | 1.273 | 7.637 | 0.995 | 34 / 6 / 0 |
| Basketball Player | balanced | 7 | 850 | 895 | 157 | 149.5 | 21.36 | 1.28 | 8.961 | 1.001 | 34 / 6 / 0 |
| Cannon | damage | 8 | 1025 | 866 | 513 | 256.5 | 32.06 | 1.443 | 11.545 | 0.999 | 29 / 11 / 0 |
| Shark | balanced | 9 | 1225 | 1410 | 200 | 235.3 | 26.14 | 1.568 | 14.109 | 1.001 | 4 / 36 / 0 |
| Tiger | damage | 10 | 1400 | 1173 | 313 | 347.8 | 34.78 | 1.564 | 15.645 | 1 | 28 / 12 / 0 |
| Cyborg Walrus | tank | 11 | 1575 | 3384 | 218 | 174.4 | 15.85 | 1.711 | 18.818 | 1.001 | 9 / 31 / 0 |
| Mafia | damage | 12 | 1775 | 1537 | 91 | 455 | 37.92 | 1.707 | 20.484 | 1 | 26 / 14 / 0 |
| Rapper | balanced | 13 | 1975 | 2242 | 411 | 373.6 | 28.74 | 1.725 | 22.419 | 1 | 24 / 16 / 0 |
| Barbarian | damage | 14 | 2175 | 1827 | 758 | 541.4 | 38.67 | 1.74 | 24.362 | 1 | 9 / 31 / 0 |
| Space Marine | balanced | 15 | 2375 | 2639 | 198 | 440 | 29.33 | 1.76 | 26.395 | 1 | 26 / 14 / 0 |
| Mallard Duck | balanced | 16 | 2575 | 2854 | 262 | 476.4 | 29.77 | 1.785 | 28.561 | 1.001 | 13 / 27 / 0 |
| MiG-17 | damage | 17 | 2775 | 2259 | 1205 | 669.4 | 39.38 | 1.772 | 30.122 | 1 | 19 / 21 / 0 |
| Gundam Warrior | balanced | 18 | 3000 | 3273 | 627 | 545.2 | 30.29 | 1.818 | 32.722 | 1 | 16 / 24 / 0 |
| Skeleton King | damage | 19 | 3200 | 2662 | 1025 | 788.5 | 41.5 | 1.868 | 35.487 | 1 | 19 / 21 / 0 |
| Dark Mage | glassCannon | 20 | 3425 | 2050 | 1581 | 1129.3 | 56.46 | 1.863 | 37.27 | 1 | 16 / 24 / 0 |
| Jetpack Raccoon | glassCannon | 21 | 10000 | 10250 | 1581 | 5646.4 | 268.88 | 8.874 | 186.348 | 5.237 | 40 / 0 / 0 |

HP/DPS power is sqrt((HP / 100) × (DPS / 16.667)), before credit for reach or speed. Power per food exposes actual purchase value, while budget ratio compares against the intended food^1.2 progression curve (target 1.00). Higher tiers gain value per food; tank and damage profiles still trade health against DPS. Small differences come from whole-number rounding. Cards display damage per hit (the total volley for Mech); DPS remains listed here for balance and cooldown checks.

| Matchup | Winners (normal / reversed priority) |
| --- | --- |
| Clubman vs Spearman | Spearman / Spearman |
| Clubman vs Rock Thrower | Rock Thrower / Rock Thrower |
| Clubman vs Stormblade | Stormblade / Stormblade |
| Clubman vs Mech | Mech / Mech |
| Clubman vs Machine Gunner | Machine Gunner / Machine Gunner |
| Clubman vs Basketball Player | Basketball Player / Basketball Player |
| Clubman vs Cannon | Cannon / Cannon |
| Clubman vs Shark | Shark / Shark |
| Clubman vs Tiger | Tiger / Tiger |
| Clubman vs Cyborg Walrus | Cyborg Walrus / Cyborg Walrus |
| Clubman vs Mafia | Mafia / Mafia |
| Clubman vs Rapper | Rapper / Rapper |
| Clubman vs Barbarian | Barbarian / Barbarian |
| Clubman vs Space Marine | Space Marine / Space Marine |
| Clubman vs Mallard Duck | Mallard Duck / Mallard Duck |
| Clubman vs MiG-17 | MiG-17 / MiG-17 |
| Clubman vs Gundam Warrior | Gundam Warrior / Gundam Warrior |
| Clubman vs Skeleton King | Skeleton King / Skeleton King |
| Clubman vs Dark Mage | Dark Mage / Dark Mage |
| Clubman vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Spearman vs Rock Thrower | Rock Thrower / Rock Thrower |
| Spearman vs Stormblade | Stormblade / Stormblade |
| Spearman vs Mech | Mech / Mech |
| Spearman vs Machine Gunner | Machine Gunner / Machine Gunner |
| Spearman vs Basketball Player | Basketball Player / Basketball Player |
| Spearman vs Cannon | Cannon / Cannon |
| Spearman vs Shark | Shark / Shark |
| Spearman vs Tiger | Tiger / Tiger |
| Spearman vs Cyborg Walrus | Cyborg Walrus / Cyborg Walrus |
| Spearman vs Mafia | Mafia / Mafia |
| Spearman vs Rapper | Rapper / Rapper |
| Spearman vs Barbarian | Barbarian / Barbarian |
| Spearman vs Space Marine | Space Marine / Space Marine |
| Spearman vs Mallard Duck | Mallard Duck / Mallard Duck |
| Spearman vs MiG-17 | MiG-17 / MiG-17 |
| Spearman vs Gundam Warrior | Gundam Warrior / Gundam Warrior |
| Spearman vs Skeleton King | Skeleton King / Skeleton King |
| Spearman vs Dark Mage | Dark Mage / Dark Mage |
| Spearman vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Rock Thrower vs Stormblade | Rock Thrower / Rock Thrower |
| Rock Thrower vs Mech | Rock Thrower / Rock Thrower |
| Rock Thrower vs Machine Gunner | Machine Gunner / Machine Gunner |
| Rock Thrower vs Basketball Player | Basketball Player / Basketball Player |
| Rock Thrower vs Cannon | Rock Thrower / Rock Thrower |
| Rock Thrower vs Shark | Rock Thrower / Rock Thrower |
| Rock Thrower vs Tiger | Rock Thrower / Rock Thrower |
| Rock Thrower vs Cyborg Walrus | Rock Thrower / Rock Thrower |
| Rock Thrower vs Mafia | Rock Thrower / Rock Thrower |
| Rock Thrower vs Rapper | Rock Thrower / Rock Thrower |
| Rock Thrower vs Barbarian | Rock Thrower / Rock Thrower |
| Rock Thrower vs Space Marine | Space Marine / Space Marine |
| Rock Thrower vs Mallard Duck | Mallard Duck / Mallard Duck |
| Rock Thrower vs MiG-17 | Rock Thrower / Rock Thrower |
| Rock Thrower vs Gundam Warrior | Rock Thrower / Rock Thrower |
| Rock Thrower vs Skeleton King | Rock Thrower / Rock Thrower |
| Rock Thrower vs Dark Mage | Rock Thrower / Rock Thrower |
| Rock Thrower vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Stormblade vs Mech | Mech / Mech |
| Stormblade vs Machine Gunner | Machine Gunner / Machine Gunner |
| Stormblade vs Basketball Player | Basketball Player / Basketball Player |
| Stormblade vs Cannon | Cannon / Cannon |
| Stormblade vs Shark | Stormblade / Stormblade |
| Stormblade vs Tiger | Tiger / Tiger |
| Stormblade vs Cyborg Walrus | Cyborg Walrus / Cyborg Walrus |
| Stormblade vs Mafia | Mafia / Mafia |
| Stormblade vs Rapper | Rapper / Rapper |
| Stormblade vs Barbarian | Stormblade / Stormblade |
| Stormblade vs Space Marine | Space Marine / Space Marine |
| Stormblade vs Mallard Duck | Mallard Duck / Mallard Duck |
| Stormblade vs MiG-17 | Stormblade / MiG-17 |
| Stormblade vs Gundam Warrior | Gundam Warrior / Gundam Warrior |
| Stormblade vs Skeleton King | Skeleton King / Skeleton King |
| Stormblade vs Dark Mage | Dark Mage / Dark Mage |
| Stormblade vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Mech vs Machine Gunner | Mech / Mech |
| Mech vs Basketball Player | Mech / Mech |
| Mech vs Cannon | Mech / Mech |
| Mech vs Shark | Mech / Mech |
| Mech vs Tiger | Mech / Mech |
| Mech vs Cyborg Walrus | Cyborg Walrus / Mech |
| Mech vs Mafia | Mech / Mech |
| Mech vs Rapper | Mech / Mech |
| Mech vs Barbarian | Mech / Mech |
| Mech vs Space Marine | Space Marine / Space Marine |
| Mech vs Mallard Duck | Mech / Mech |
| Mech vs MiG-17 | Mech / Mech |
| Mech vs Gundam Warrior | Mech / Mech |
| Mech vs Skeleton King | Mech / Mech |
| Mech vs Dark Mage | Mech / Mech |
| Mech vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Machine Gunner vs Basketball Player | Machine Gunner / Machine Gunner |
| Machine Gunner vs Cannon | Machine Gunner / Machine Gunner |
| Machine Gunner vs Shark | Machine Gunner / Machine Gunner |
| Machine Gunner vs Tiger | Machine Gunner / Machine Gunner |
| Machine Gunner vs Cyborg Walrus | Machine Gunner / Machine Gunner |
| Machine Gunner vs Mafia | Machine Gunner / Machine Gunner |
| Machine Gunner vs Rapper | Machine Gunner / Machine Gunner |
| Machine Gunner vs Barbarian | Machine Gunner / Machine Gunner |
| Machine Gunner vs Space Marine | Machine Gunner / Machine Gunner |
| Machine Gunner vs Mallard Duck | Machine Gunner / Machine Gunner |
| Machine Gunner vs MiG-17 | Machine Gunner / Machine Gunner |
| Machine Gunner vs Gundam Warrior | Gundam Warrior / Gundam Warrior |
| Machine Gunner vs Skeleton King | Machine Gunner / Machine Gunner |
| Machine Gunner vs Dark Mage | Machine Gunner / Machine Gunner |
| Machine Gunner vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Basketball Player vs Cannon | Basketball Player / Basketball Player |
| Basketball Player vs Shark | Basketball Player / Basketball Player |
| Basketball Player vs Tiger | Basketball Player / Basketball Player |
| Basketball Player vs Cyborg Walrus | Basketball Player / Basketball Player |
| Basketball Player vs Mafia | Basketball Player / Basketball Player |
| Basketball Player vs Rapper | Basketball Player / Basketball Player |
| Basketball Player vs Barbarian | Basketball Player / Basketball Player |
| Basketball Player vs Space Marine | Basketball Player / Basketball Player |
| Basketball Player vs Mallard Duck | Basketball Player / Basketball Player |
| Basketball Player vs MiG-17 | Basketball Player / Basketball Player |
| Basketball Player vs Gundam Warrior | Basketball Player / Basketball Player |
| Basketball Player vs Skeleton King | Basketball Player / Basketball Player |
| Basketball Player vs Dark Mage | Basketball Player / Basketball Player |
| Basketball Player vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Cannon vs Shark | Cannon / Cannon |
| Cannon vs Tiger | Cannon / Cannon |
| Cannon vs Cyborg Walrus | Cannon / Cannon |
| Cannon vs Mafia | Cannon / Cannon |
| Cannon vs Rapper | Cannon / Cannon |
| Cannon vs Barbarian | Cannon / Cannon |
| Cannon vs Space Marine | Cannon / Cannon |
| Cannon vs Mallard Duck | Cannon / Cannon |
| Cannon vs MiG-17 | Cannon / Cannon |
| Cannon vs Gundam Warrior | Cannon / Cannon |
| Cannon vs Skeleton King | Skeleton King / Cannon |
| Cannon vs Dark Mage | Cannon / Cannon |
| Cannon vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Shark vs Tiger | Tiger / Tiger |
| Shark vs Cyborg Walrus | Cyborg Walrus / Cyborg Walrus |
| Shark vs Mafia | Mafia / Mafia |
| Shark vs Rapper | Rapper / Rapper |
| Shark vs Barbarian | Barbarian / Barbarian |
| Shark vs Space Marine | Space Marine / Space Marine |
| Shark vs Mallard Duck | Mallard Duck / Mallard Duck |
| Shark vs MiG-17 | MiG-17 / MiG-17 |
| Shark vs Gundam Warrior | Gundam Warrior / Gundam Warrior |
| Shark vs Skeleton King | Skeleton King / Skeleton King |
| Shark vs Dark Mage | Dark Mage / Dark Mage |
| Shark vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Tiger vs Cyborg Walrus | Tiger / Tiger |
| Tiger vs Mafia | Tiger / Tiger |
| Tiger vs Rapper | Tiger / Tiger |
| Tiger vs Barbarian | Tiger / Tiger |
| Tiger vs Space Marine | Tiger / Tiger |
| Tiger vs Mallard Duck | Tiger / Tiger |
| Tiger vs MiG-17 | Tiger / Tiger |
| Tiger vs Gundam Warrior | Tiger / Tiger |
| Tiger vs Skeleton King | Tiger / Tiger |
| Tiger vs Dark Mage | Tiger / Tiger |
| Tiger vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Cyborg Walrus vs Mafia | Mafia / Mafia |
| Cyborg Walrus vs Rapper | Rapper / Rapper |
| Cyborg Walrus vs Barbarian | Barbarian / Barbarian |
| Cyborg Walrus vs Space Marine | Space Marine / Space Marine |
| Cyborg Walrus vs Mallard Duck | Mallard Duck / Mallard Duck |
| Cyborg Walrus vs MiG-17 | MiG-17 / MiG-17 |
| Cyborg Walrus vs Gundam Warrior | Gundam Warrior / Gundam Warrior |
| Cyborg Walrus vs Skeleton King | Skeleton King / Skeleton King |
| Cyborg Walrus vs Dark Mage | Dark Mage / Dark Mage |
| Cyborg Walrus vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Mafia vs Rapper | Mafia / Mafia |
| Mafia vs Barbarian | Mafia / Mafia |
| Mafia vs Space Marine | Mafia / Mafia |
| Mafia vs Mallard Duck | Mafia / Mafia |
| Mafia vs MiG-17 | Mafia / Mafia |
| Mafia vs Gundam Warrior | Mafia / Mafia |
| Mafia vs Skeleton King | Mafia / Mafia |
| Mafia vs Dark Mage | Mafia / Mafia |
| Mafia vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Rapper vs Barbarian | Rapper / Rapper |
| Rapper vs Space Marine | Rapper / Rapper |
| Rapper vs Mallard Duck | Rapper / Rapper |
| Rapper vs MiG-17 | Rapper / Rapper |
| Rapper vs Gundam Warrior | Rapper / Rapper |
| Rapper vs Skeleton King | Rapper / Rapper |
| Rapper vs Dark Mage | Rapper / Rapper |
| Rapper vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Barbarian vs Space Marine | Space Marine / Space Marine |
| Barbarian vs Mallard Duck | Mallard Duck / Barbarian |
| Barbarian vs MiG-17 | MiG-17 / MiG-17 |
| Barbarian vs Gundam Warrior | Gundam Warrior / Gundam Warrior |
| Barbarian vs Skeleton King | Skeleton King / Skeleton King |
| Barbarian vs Dark Mage | Dark Mage / Dark Mage |
| Barbarian vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Space Marine vs Mallard Duck | Space Marine / Space Marine |
| Space Marine vs MiG-17 | Space Marine / Space Marine |
| Space Marine vs Gundam Warrior | Space Marine / Space Marine |
| Space Marine vs Skeleton King | Space Marine / Space Marine |
| Space Marine vs Dark Mage | Space Marine / Space Marine |
| Space Marine vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Mallard Duck vs MiG-17 | MiG-17 / MiG-17 |
| Mallard Duck vs Gundam Warrior | Gundam Warrior / Gundam Warrior |
| Mallard Duck vs Skeleton King | Skeleton King / Skeleton King |
| Mallard Duck vs Dark Mage | Dark Mage / Dark Mage |
| Mallard Duck vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| MiG-17 vs Gundam Warrior | MiG-17 / MiG-17 |
| MiG-17 vs Skeleton King | MiG-17 / MiG-17 |
| MiG-17 vs Dark Mage | MiG-17 / MiG-17 |
| MiG-17 vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Gundam Warrior vs Skeleton King | Skeleton King / Skeleton King |
| Gundam Warrior vs Dark Mage | Dark Mage / Dark Mage |
| Gundam Warrior vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Skeleton King vs Dark Mage | Skeleton King / Skeleton King |
| Skeleton King vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
| Dark Mage vs Jetpack Raccoon | Jetpack Raccoon / Jetpack Raccoon |
