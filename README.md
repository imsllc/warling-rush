# Warling Rush

An original, offline army battle game for Android with units to unlock and a three-slot army to equip. Battles use simple gray bunkers drawn at an angle with flat shaded roof and side faces. Built with Expo SDK 55, React Native, TypeScript, and Skia.

Optional rewarded ads double a completed battle's coin payout. See [AdMob setup](ADMOB_SETUP.md) for account settings and test/live build behavior; battles remain playable offline.

## Run on Windows

1. Install Node.js 22 LTS or newer and Android Studio. In Android Studio's SDK Manager, install Android SDK Platform 36, Build Tools 36.0.0, Platform Tools, Android Emulator, and the NDK/CMake requested by Gradle. Accept SDK licenses.
2. Create and start a phone emulator in Device Manager, or connect an Android phone with USB debugging enabled and authorize the computer on the phone.
3. In PowerShell at the repository root:

   ```powershell
   npm ci
   . ./scripts/android-env.ps1
   npx expo run:android
   ```

The environment script prefers a cached Gradle JDK 17/21, then falls back to Android Studio's bundled JDK. It also locates the standard Android SDK. If your installations are elsewhere, set `JAVA_HOME` and `ANDROID_HOME` before running it. Use **JDK 17 or 21**; the Java 25 runtime bundled with newer Android Studio versions can fail the native CMake/Prefab configuration. First builds download native dependencies and can take several minutes. Metro stays running for development; press `r` to reload. Physical devices must reach Metro, usually through Expo's automatic ADB reverse connection.

The generated `android/` directory is included. Open that directory in Android Studio, select the local JDK in Gradle settings, allow Gradle sync, and run the `app` configuration. For debug builds launched from Android Studio, run `npx expo start` from the repository root first. If needed, run `adb reverse tcp:8081 tcp:8081` to connect the device to Metro.

For an emulator-only server restricted to localhost, use `$env:NODE_OPTIONS='--dns-result-order=ipv4first'` before `npx expo start --localhost`, then launch with `npx expo run:android --no-bundler`. This avoids newer Node versions binding only IPv6 localhost while ADB reverse expects IPv4. No LAN exposure is necessary.

If regenerating native configuration after changing `app.json`:

```powershell
npx expo prebuild --platform android
```

## Installable offline APK for local testing

The built APK is at `android/app/build/outputs/apk/release/app-release.apk`. The supplied build includes ARM64 Android phones and x86-64 emulators, uses local test signing, and has been cold-launched with Metro stopped. The commands below rebuild it; the default Gradle configuration also includes 32-bit architectures.

Debug builds use Metro. To make an APK with the game embedded, requiring no development server:

```powershell
. ./scripts/android-env.ps1
Set-Location android
./gradlew.bat :app:assembleRelease -PlocalTestSigning=true
adb install -r ./app/build/outputs/apk/release/app-release.apk
```

The application ID is `com.warlingrush.app`. Release artifacts now use the dedicated upload key in the ignored `android/upload-signing/` folder. The explicit `-PlocalTestSigning=true` option above preserves the debug signature used by existing emulator APK previews.

## Signed app bundle for Play Console testing

For each new Google Play upload, run `npm run release:android` from the repository root. It increments the patch version and Android version code together, checks the privacy-policy copy, runs TypeScript/game/native tests and release lint, and builds with the dedicated upload key. Release builds use R8 optimization and resource shrinking. To rebuild the same version without another increment, use the Gradle command below. Never pass `-PlocalTestSigning=true` for a Play bundle; the build rejects it.

Upload `android/app/build/outputs/bundle/release/app-release.aab` to the Play Console testing track. Rebuild from the Android folder with `./gradlew.bat :app:bundleRelease` after loading `scripts/android-env.ps1` from the repository root.

Back up the entire private `android/upload-signing/` folder securely, including `warlingrush-upload.p12` and `keystore.properties`. These files contain the upload key and its credentials; they are excluded from Git. The public upload certificate is at `artifacts/warlingrush-upload-certificate.pem`. Future updates must keep this upload key and use a higher Android version code than the last uploaded build. The current bundle uses version code 20 / version 1.0.18.

Launcher icons are generated from `app_icon2.jpg` with `node scripts/generate-icons.cjs`, including legacy, adaptive, and themed variants. Mask previews are saved to `artifacts/adaptive-icon-previews.png`.

## How to play

The app opens on the battlefield. Tap the red rectangular FIGHT! button to start. The bottom icon tabs show Upgrades, Battle, and Store from left to right before battle. The selected tab stays flat and has a subtle yellow edge glow. Store offers four repeatable coin bundles with original pouch, bag, chest, and vault artwork, sound-enabled Buy buttons, and localized Google Play prices. See [STORE_SETUP.md](STORE_SETUP.md) for the exact Play product IDs, prices, purchase-option setup, testing steps, and local-save limitations. Navigation is hidden during combat; use the pause menu to leave. Player units use the original simple character artwork and animated weapons. Enemies are evil green slime globs with animated attacks. There are no ages.

A new game starts at wave 1 with Clubman, Spearman and Rock Thrower unlocked and equipped in the three army slots, zero coins and all upgrades at level zero. In Upgrades, the top half is a scrollable roster ordered with the cheapest unit at the bottom and more expensive units above. Each row shows a portrait, damage per hit above health, and coin price above food cost. Tap a full-width unit row to open a popup: locked units show the coin price with red Cancel and blue Unlock; owned units show red Cancel and blue Use. Locked rows are faded across their artwork, stats and icons. Equipped units move out of the roster into the army below. Remove returns a unit to the roster without losing its unlock. Use fills the first empty slot; when full, the far-left unit returns to the roster, the other two shift left, and the new unit enters the right slot. Only equipped units can deploy in battle. Army slots and unlocks save permanently. Existing health and damage bonuses are preserved. A food-production upgrade strip separates the larger roster from the compact army stats near the bottom menu.

During combat, the food icon and count sit at the top center of the battlefield below the Wave header, while three equal-width deployment slots span the bottom. The food-production rate is shown on Upgrades only. Meat icons show food. Food starts at 2, gains 0.50 per second, and keeps accumulating without a cap. Clubmen cost 1, spearmen 2, and rock throwers 3. The food strip shows the current rate per second and a coin purchase button. Each purchase adds exactly 0.02 food/second, updates battle production, and saves permanently. The next price is ceil(60 * (level + 1)^1.35), a power curve that grows faster than linearly without exponential growth. Prices begin at 60, 153, 265 and 390 coins; unaffordable purchases are disabled. Food and costs always use whole units. Each wave has a finite enemy force that starts entering from beyond the right edge after five seconds. Later waves have more slimes with increasing health and attack, following a power curve between linear and exponential growth. See [ENEMY_WAVES.md](ENEMY_WAVES.md) for the formula and sample waves. Wave one introduces Slime Bruisers, rounded green blobs that swing swords. From wave two, Slime Lobbers join them and fire green slime globs from slingshots. These are the two normal-wave enemy types, independent of player unlocks; neither can be bought, equipped, or deployed by the player.

Every 20th wave is a boss fight, cycling Dreadmaw the dinosaur (20, 120, 220...), Ironback the giant gorilla (40, 140, 240...), Iron Titan the giant robot (60, 160, 260...), Professor Fizz the mad scientist (80, 180, 280...) and the All-Seeing Eye floating pyramid (100, 200, 300...). All are rendered at three times normal unit size. Each replaces the slime army and gains health and attack from the current wave budget. Melee bosses swipe up to three nearby troops; the scientist fires ranged potion globs with splash damage. Wave 20 starts at 9,974 HP and 160 damage per target. Wave 40 Ironback uses an animated knuckle punch and starts at 22,259 HP and 240 damage per target. Wave 60 Iron Titan has gray armor, purple joints, a mint visor and an animated piston punch, with 36,992 HP and 315 damage per target. Wave 80 Professor Fizz has wild white hair, a white coat and a bubbling green beaker, with 53,723 HP and 390 damage per potion hit. Wave 100 is a major difficulty spike: the floating All-Seeing Eye has 183,369 HP and 910 beam damage per target, with 2.5× standard same-wave boss health and 2× attack. Its eye charges before firing a light beam that pierces up to five troops. Bosses cannot be bought or equipped.

Your bunker extends partly off the left edge, protruding into the battlefield, with a health bar underneath. There is no enemy bunker. Defeat every enemy in the wave to win after all scheduled enemies have entered; losing your bunker causes defeat. Troops advance and hold inside the right edge while waiting for more enemies. The header displays the wave number. Tap pause for a two-button popup: red Leave on the left and green Resume on the right. Backgrounding the app pauses combat without fast-forwarding on return.

Backgrounds cycle every ten waves: green grasslands, gray mountains, sandy desert, charcoal lava terrain, black space with faint stars, then deep-green jungle with layered foliage, small leaf clusters, mossy trunks, ferns and long winding vines. Jungle appears at waves 51–60; the cycle repeats at wave 61. Clearing a wave advances the number and theme; defeat retries the same wave. Leaving an unfinished wave keeps its number. All themes share the player bunker and darker brown road.

Coins come from defeated enemies: 10 per normal enemy on waves 1-5, increasing by 1 every five waves (11 on waves 6-10, 12 on waves 11-15). A boss awards the equivalent of that wave's normal enemy army. The balance updates and saves during combat, and earned coins remain after losing or leaving. When a wave ends in victory or defeat, its total reward is topped up to at least 50 coins; higher kill earnings are kept in full. Leaving early keeps only kill earnings. A centered Collected popup summarizes the final payout over the battlefield. The final save must succeed before Continue is enabled; failed saves can be retried. There is no separate result or main menu page. Coins, upgrades, unit unlocks, wins, completed attempts and the current wave save locally. Existing saves retain their army and progress; their previous battle number becomes the current wave.

## Advanced units

The roster also includes sixteen locked advanced units:

| Unit | Coins | Food | Health | Damage per hit | Attack |
| --- | ---: | ---: | ---: | ---: | --- |
| Mech | 1225 | 9 | 543 | 163 | Ranged twin-missile volley |
| Machine Gunner | 1400 | 10 | 423 | 20 | Rapid bullets, 6.25 shots/second |
| Basketball Player | 1575 | 11 | 590 | 103 | Spinning basketball throws |
| Cannon | 1775 | 12 | 522 | 309 | Heavy cannonball every 2 seconds |
| Shark | 1975 | 13 | 786 | 111 | Melee bite every 0.85 seconds |
| Tiger | 2175 | 14 | 611 | 163 | Twin red eye lasers every 0.9 seconds |
| Cyborg Walrus | 2375 | 15 | 1662 | 107 | Melee tusk strike every 1.25 seconds |
| Mafia | 2575 | 16 | 716 | 42 | Tommy-gun bullets, 5 shots/second |
| Rapper | 2775 | 17 | 996 | 183 | Ranged musical note every 1.1 seconds |
| Barbarian | 3000 | 18 | 778 | 323 | Heavy double-axe melee every 1.4 seconds |
| Space Marine | 3200 | 19 | 1079 | 81 | Armored rifle support, shot every 0.45 seconds |
| Mallard Duck | 3425 | 20 | 1125 | 103 | Melee beak peck every 0.55 seconds |
| MiG-17 | 3650 | 21 | 861 | 459 | Underwing missile every 1.8 seconds |
| Gundam Warrior | 3850 | 22 | 1209 | 232 | Melee blue beam sword every 1.15 seconds |
| Skeleton King | 4075 | 23 | 955 | 368 | Glowing green sword melee every 1.3 seconds |
| Dark Mage | 4300 | 24 | 716 | 552 | Staff-cast fireball every 1.4 seconds |

Ranged units hold behind melee troops. Advanced roster units are player-only and start locked in existing saves too.

Melee troops stop when their animated weapon reaches the enemy's body edge, allowing about four logical pixels of contact rather than requiring their centers to overlap. Body widths and weapon tips use the same 1.4 battlefield scale as the artwork, including the extra boss scale. Opposing bodies block further movement across formation lanes. Target selection uses the nearest body edge so a large creature intercepts troops before smaller enemies behind it.

Mallard Duck has a green head, white neck ring, brown chest, gray feathered body and blue wing patch, with an orange bill and orange webbed feet. It waddles forward and lunges its head to peck one enemy at 30 melee range every 0.55 seconds, without projectiles or splash. It uses the normal unlock, equip, upgrades and save flow, with matching battle and portrait artwork.

Space Marine uses the supplied blue armored reference: enormous shoulder plates, a sealed helmet with an orange visor, metal chest armor, power pack, heavy jointed legs and broad steel-soled boots. He braces a large two-handed rifle that fires bullets every 0.45 seconds at 200 range, with muzzle flash and recoil. Each bullet deals 81 damage after travel with no splash. His shop/deployment portrait shares the battle model; the normal unlock, equip, upgrades and save flow applies.

Barbarian follows the supplied axe-warrior reference: long rugged brown hair, a bare muscular torso, leather wrist wraps, boots and a ragged loincloth. He holds a huge long-handled double axe with opposing crescent blades and raises it for a heavy melee chop. He closes to 45 range and deals 323 damage to one enemy every 1.4 seconds, without projectiles. The next tier costs 18 food and uses the normal unlock, equip, upgrades and save flow. Portraits frame the full axe in both idle and raised poses.

Rapper wears gold-rimmed designer sunglasses, a purple jacket and a heavy gold chain with a dollar-sign medallion. He holds a silver microphone and shoots bright pink musical notes at an enemy within 185 range. The notes travel from the microphone before dealing a single hit every 1.1 seconds, with no splash. He uses the normal unlock, equip, upgrades and save flow, with matching portraits and no visible battle-card name labels.

Mafia wears a dark pinstripe suit, white shirt, red tie and a broad-brimmed fedora. His Tommy gun has a wooden stock and foregrip, finned barrel and round drum magazine. It fires individual bullets every 0.2 seconds at 175 range, with recoil and muzzle flash. Food accumulates without a cap; base food production is 0.50/s plus saved bonuses. He uses the normal unlock, equip, upgrades and save flow. Battle cards show portraits and food costs only.

Cyborg Walrus is a heavy melee tank with a rounded brown body, flippers, whiskered muzzle and two long ivory tusks. Half its head is metal plating with bolts and one glowing red eye; the other half has a natural eye. It lunges and swings its tusks into one enemy at 40 range, with 1.25 seconds between attacks. It uses the normal unlock, equip, upgrades and save flow, costing 15 food.

Tiger is a striped orange quadruped with a curled tail, padded paws and glowing red eyes. Both eyes fire straight red laser pulses at a single enemy within 200 range. Each pulse carries half the volley damage, so the displayed 163 damage is the total for both eyes. Its 0.9-second reload, unlock, equip, food cost, upgrades and saving follow the normal roster flow.

Shark is a blue-gray melee creature with a forked tail, dorsal fin, pale belly and sharp teeth. Its tail sways while advancing and its lower jaw opens and snaps during each bite. It closes to 35 range, hits one enemy every 0.85 seconds and uses the same unlock, army, upgrades and save flow as other units.

Cannon is a slow wheeled artillery carriage with wooden spoked wheels, a dark metal barrel and team-colored trim. Its wheels rotate as it advances; firing shows barrel recoil, muzzle flash and smoke. A heavy iron cannonball travels to one enemy before dealing damage. It uses the normal unlock, equip, deployment, upgrades and save flow, with matching roster and deployment portraits.

Machine Gunner has an olive-green steel helmet, fatigues, a belt-fed machine gun and hanging brass ammunition. He fires individual fast-traveling bullets every 0.16 seconds, with muzzle flash, recoil and a moving ammo belt. His shop and deployment portraits share the battle model. Unlock, equip and save him using the normal roster controls.

Basketball Player wears a purple jersey with gold trim, headband and white sneakers. He raises both arms to shoot spinning orange basketballs along a high arc, hitting one enemy after flight. His 1.05-second shot interval, 230 range and base stats use the same balance formula and normal unlock/equip/save flow as the roster.

Mech is a simple two-legged walker with two rectangular shoulder launchers and team-colored markings. Each attack launches two missiles from the pods; each missile carries half the attack's total hit damage. Missiles travel before applying damage, and the Mech uses the same unlock, army slots, food and permanent bonuses as other units.

Player unit stats come from a shared food-budget formula with tank, balanced, damage and glass-cannon profiles. Every cost tier increases combined health/DPS power while preserving tank, balanced and damage roles. Range and movement receive a modest budget allowance; unlock prices scale with food cost. See [UNIT_BALANCE.md](UNIT_BALANCE.md) for formulas and adding a unit. Run `npm run balance` for generated stats and the equal-food matchup report. Existing ownership, coins, armies and purchased bonuses are preserved.

## Project structure

| Location                            | Responsibility                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| `App.tsx`                           | Battlefield home, bottom navigation, reward popup, and saved purchases                                    |
| `src/game/config.ts`                | All unit stats, base HP, resources, AI difficulty, rewards, upgrade costs/scaling |
| `src/game/engine.ts`                | Pure fixed-step simulation                                                        |
| `src/game/units.ts`                 | Deployment, affordability, formations, upgraded stats                             |
| `src/game/combat.ts`                | Movement, targeting, cooldowns, projectiles, deaths, base damage                  |
| `src/game/ai.ts`                    | Weighted troop planning and enemy spending                                        |
| `src/rendering/`                    | Original procedural Skia artwork and animation loop                               |
| `src/ui/`                           | Responsive native battle UI, troop portraits, theme, reusable buttons             |
| `src/progress.ts`, `src/storage.ts` | Validated progression, unit unlocks, purchases, AsyncStorage persistence                   |
| `tests/game.test.ts`                | Deterministic simulation and progression checks                                   |

The game uses a portrait screen with a horizontal path across the middle of the battlefield. The battlefield is a 1,000-unit logical world rendered at a uniform scale so characters keep their proportions. The shared base character contains only a round head, an oval body, and one eye: no hands, feet, limbs, collar, or pouch. `drawCharacterBase` draws that bare model; `drawStoneEquipment` overlays the weapon separately. Battlefield troops and cards use the same renderer, leaving room for later-age armor and accessories. The simulation advances at 60 fixed steps/s using a bounded delta accumulator; Skia receives one picture per animation frame through a shared value. React HUD updates are limited to 10/s, with immediate updates after deploying. There is a configurable 36-unit limit per side and three formation rows. Melee can pass ranged support so a stopped thrower cannot block the frontline. All animation frames, lifecycle subscriptions, and feedback timers are cleaned up on unmount.

## Verification

```powershell
npm run typecheck
npm test
npx expo install --check
npx expo export --platform android
```

Automated tests cover affordability, food generation, upgrade bonuses, AI delay and spending, cooldowns, projectile travel, spacing, damage/death cleanup, base destruction, victory/defeat, price scaling, invalid saves, and progress serialization. Tests do not replace device checks of native rendering, touch input, actual AsyncStorage, or frame rate. See `TESTING.md` for device verification and recorded build results.

Dependency versions follow [Expo's SDK compatibility guidance](https://docs.expo.dev/versions/v55.0.0/). Artwork is drawn entirely with original geometric primitives; `scripts/make-icon.ps1` generates the original launcher icon.















MiG-17 is a low-flying silver jet with a blunt circular nose intake, blue cockpit, swept wings, tall tail, red markings and animated orange exhaust. It fires one underwing missile every 1.8 seconds; the missile descends toward one ground target and deals damage on impact. It costs 21 food and 3,650 coins to unlock, with 861 HP, 459 damage and 230 range. Battle food accumulates without a cap.


Gundam Warrior is a melee robot inspired by the supplied blue-and-white armored reference. It has broad blue shoulder plates, white articulated legs, blue boots, gold chest vents and a V-fin crest, a cyan visor, and a glowing blue beam sword. The sword sweeps from a raised guard into a forward cut, striking one enemy at its body edge without overlapping troop bodies or firing projectiles. It costs 22 food and 3,850 coins, with 1,209 HP and 232 damage every 1.15 seconds. Battle food accumulates without a cap.


Skeleton King has an ivory skull with deep sockets, glowing green eyes, a jeweled gold crown, exposed ribs and bone limbs, and a torn purple royal cloak. Its glowing green sword sweeps forward for one melee hit every 1.3 seconds, with no projectile. It costs 23 food and 4,075 coins, with 955 HP and 368 damage per hit. Battle food accumulates without a cap.

Dark Mage follows the supplied gold-hat and blue-robe reference, with a completely shadowed face, glowing gold eyes, folded robe hem and a gnarled wooden staff holding a fiery orb. Casting ignites the staff tip and launches an orange fireball with a yellow core and flickering flame trail. Each spell travels from the staff to one enemy and deals damage on impact, with no splash. It costs 24 food and 4,300 coins, with 716 HP and 552 damage every 1.4 seconds at 200 range. Battle food accumulates without a cap.

The phone-testing release removes the temporary wave-jump and unlock/lock-all controls. It uses a fresh save namespace so development unlocks, coins, upgrades and waves reset once; progress earned in this release persists normally.

Launcher artwork comes from app_icon2.jpg. Run node scripts/generate-icons.cjs to regenerate the full 800×800 artwork centered at (112,112) on transparent 1024×1024 adaptive foreground and monochrome masters, native density resources, and circle/squircle/rounded-square previews. Foreground and monochrome preserve identical source spacing; Android 13+ themed icons use the monochrome alpha mask.

Jetpack Raccoon is the final 10,000-coin unlock at 21 food: a purple, masked raccoon with a striped tail, assault rifle and animated jet pack. It hovers continuously, fires rapid bullets, and produces small cosmetic impact explosions. It has exactly five times Dark Mage health and sustained DPS. The portrait shares the battlefield model.

Player ranged reach is measured from the enemy’s scaled visible body edge. When a living melee ally is ahead, ranged support can pull back at its own movement speed to keep its firing distance, stopping at the bunker or a rear ally. A lone ranged troop can still be caught.

Raccoon artwork uses alternating dark/lavender fur bands, a broader torso, a compact twin-thruster pack, and an AR-style rifle with adjustable stock, receiver, ribbed magazine, vented handguard, rail, iron sights and flash suppressor. Its supporting paw/body front (46 model pixels) and barrel launch point (77, -49 including hover offset) match the shared geometry and projectile launch configuration.

The raccoon rifle pose uses fixed shoulder anchors and two connected arm segments. The support arm is behind the torso, with its paw under the handguard; the near arm hangs beside the ribs and reaches the pistol grip. Both hands follow weapon recoil while the shoulders remain planted.
