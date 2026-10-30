# Current redesign acceptance checks

## Optimized-release audio regression and warning audit (October 29, 2026)

- Version 1.0.18 / code 20 fixes the release-19 `ExpoAudio.setAudioModeAsync` record-conversion `NullPointerException` by preserving Expo audio and Kotlin reflection under R8. All three MP3s were present in release 19; the failure prevented player initialization.
- Actual optimized-APK verification loaded all 14 native players and advanced playback for click, sword and throw. Normal cold startup then initialized audio without test playback. Data was preserved. Reproduce after a local-signature APK build with `scripts/test-release-audio.ps1`; it fails on missing setup/playback evidence and saves complete warning/error logs. Its launch flag is inactive in the Play build.
- All 143 tests, TypeScript checks, four native billing tests and release lint pass. Every lint/runtime/build warning group is reviewed in `PRODUCTION_AUDIT.md`; 36 lint warnings remain documented rather than globally suppressed. Native startup/playback checks now include warning-level JS failures, which the earlier error-only check missed.
- Built and verified the upload-signed code-20 AAB (96,432,906 bytes), live service IDs, Billing 9.1 metadata, unchanged sound-file hashes, reflection safeguards, ARM64/x86-64 and 16 KB native alignment. All 1,110 signed content entries match the upload certificate. R8 remains active (two DEX files, 9,184 renamed classes). Matching Play mapping/archive: `artifacts/releases/20/`.
- No browser/account changes or upload performed. Emulator Play checkout is unavailable; live billing/consent and physical-device gameplay performance remain external verification items.

## Store checkout response and purchase-option compatibility (October 29, 2026)

- Removed the silent disabled-price behavior when Play catalog data is missing. Price taps now fetch fresh checkout details, with a spinner and errors when unavailable. Catalog loading and purchase recovery run independently. Outstanding paid purchases are recovered before opening a new checkout.
- Removed the requirement for purchase-option ID `buy`; ordinary unlimited Buy options with custom IDs and legacy options without IDs are accepted, with `buy` preferred if available. Discounts, rentals, preorders and limited-quantity offers remain ineligible for these repeatable coin packs. Product lookup and service connection waits are bounded; an open Play checkout is never timed out by the app.
- TypeScript checking, four coin receipt/accounting tests and four native JUnit tests pass. Native tests use actual Billing 9.1 SDK offer objects to cover custom IDs, legacy data, retained price/token, existing-option preference and rejection of ineligible offers.
- Built code 18 / 1.0.16 offline preview APK (122,802,958 bytes), verified embedded JS and ARM64/x86-64 libraries, installed with saved data preserved and launched on emulator-5554. All four price buttons are enabled without catalog data. Tapping Coin Pouch shows a loading state, followed by the actual Google Play service error (code -1), rather than doing nothing. Dismissal restores all four enabled buttons. Evidence: `artifacts/store-fix-checkout.xml`, `artifacts/store-fix-enabled.xml`. No payment was confirmed; the emulator's Play service could not complete checkout. The user's phone is not connected for diagnostics.
- Built upload-signed AAB (97,796,207 bytes); verified package/version, all 1,620 signed entries against the existing upload certificate, Billing 9.1 metadata, live AdMob IDs, offline JS and required ABIs. Logs: `artifacts/store-fix-apk-build-18.log`, `artifacts/store-fix-aab-build-18.log`. No Play upload performed. Updated `STORE_SETUP.md` with exact license-testing/account steps for Google's test payment methods.

## Compact Collect x2 button (October 29, 2026)

- Replaced the wide video / multiplier / coin offer with a compact green clapperboard icon and the exact label `Collect x2`. Both the reward button and Continue share the same 144 × 60 layout. The icon is drawn with the existing Skia icon system from the supplied clapperboard reference. Existing click sound and rewarded-ad logic remain connected.
- TypeScript checking passes. Built offline local-signature APK 1.0.15 / code 17 and verified the embedded JavaScript and ARM64/x86-64 libraries. Installed and launched on emulator-5554 with data preserved. Visually verified the clapperboard and unwrapped Collect x2 label in `artifacts/collect-x2-size-preview.png`. UI bounds confirm equal 378-pixel widths and 60-dp heights (157/158 device pixels from rounding). Built and verified the upload-signed code 17 AAB, including live AdMob IDs, Billing 9.1.0, offline JS and both required ABIs.

## Rewarded battle payout (October 29, 2026)

- Added a green video / ×2 / coin button above Continue, using the existing click sound. The SDK reward callback earns one extra copy of the displayed battle payout; cancellation/dismissal alone never earns it. Continue skips the offer. Load failures preserve the original payout.
- All 141 tests and TypeScript checking pass. New cases cover battle-only doubling, the minimum 50-coin payout, save/reload duplicate prevention and mismatched entitlement rejection. Native entitlement recovery persists earned bonuses across an interrupted save.
- Integrated Google Mobile Ads 25.0.0 (compatible with the existing Kotlin 2.1.20 compiler) and UMP 4.0.0. Live requests wait for applicable consent; privacy choices are available when required. Local-signature previews use Google's sample app and rewarded placement exclusively.
- Built offline local-signature APK 1.0.14 / code 16: 122,802,570 bytes. Verified offline JS and ARM64/x86-64 libraries; installed with data preserved on emulator-5554. Visually checked the green button (`artifacts/reward-result.png`). Opened the Google Test Ad, observed Reward granted, closed it, and verified payout +50 became +100 (`artifacts/reward-doubled.png`). Wallet 7,646 became 7,696 after the base payout and 7,746 after the bonus. Force-stopped/relaunched: 7,746 persisted without another credit. Emulator remains at the original wave 102 and army.
- Built upload-signed Play AAB with preview flags disabled: 97,794,426 bytes. Verified all 1,620 signed content entries against the existing upload certificate, package/version, Billing 9.1.0 metadata, offline JS, ARM64/x86-64, supplied live AdMob App ID and rewarded placement. Confirmed no Google test rewarded placement in the Play bundle. Live ad serving and regional consent forms require the corresponding AdMob account configuration and were not exercised with live traffic.
- Setup: `ADMOB_SETUP.md`.

## Lowered raccoon rifle for face clearance (October 29, 2026)

- Lowered the entire rifle and both tracked paws by six model pixels, keeping shoulder anchors and connected arm lengths intact. The nose and mouth clear the rifle. Shared muzzle height is now -49 including base hover; body bounds and horizontal muzzle offset stay unchanged.
- Typecheck and all seven focused raccoon/ranged-formation tests pass, including recoil grips, limb lengths and muzzle alignment. Idle/firing artwork and the installed army portrait were visually checked. Previews: `artifacts/raccoon-lowered-rifle-preview.png`, `artifacts/raccoon-lowered-rifle-native.png`.
- Built upload-signed 1.0.13 / code 15 AAB with preview flags disabled; verified upload signature, package/version, billing metadata, offline JavaScript and ARM64/x86-64. AAB: 95,054,220 bytes. Built the local-signature offline preview APK with the existing roster/food preview flag, no wave override, and `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`. APK: 119,969,061 bytes; offline JavaScript and both ABIs verified. Installed using `adb install --no-streaming -r`, launched on emulator-5554, and confirmed installed code 15 / version 1.0.13. Existing army and app data preserved.
- Logs: `artifacts/play-build-15.log`, `artifacts/play-build-15-verification.log`, `artifacts/raccoon-lowered-rifle-apk-build.log`. No Play upload performed.

## Raccoon rifle-arm anatomy and layering (October 29, 2026)

- Replaced the raccoon's neck-originating crossed foreground arm with two fixed shoulder anchors. The far support arm is drawn behind the torso and supports the handguard; the near upper arm hangs beside the ribs and its forearm reaches the pistol grip. Slimmer arm outlines keep the receiver and chest readable.
- Added a shared rifle pose with two connected segments per arm. Shoulders remain planted while both hands and elbows follow recoil. Moved the rifle six model pixels back and three down so the stock fits the shoulder and clears the face. Muzzle configuration is synchronized at (77, -55 including base hover), body front 46 model pixels, and portrait scale 0.46.
- Typecheck and all 137 tests pass. New regression checks shoulder/face clearance, segment lengths, elbow placement, exact two-handed grips through recoil, silhouette bounds, and muzzle alignment. Existing ranged-formation regressions remain. Render/no-render comparison passes for 3,150 frames across all 21 units; balance report regenerated.
- Visually reviewed idle/firing poses, actual card-size portraits and the installed army portrait. Corrected pose: `artifacts/raccoon-fixed-arms-preview.png`; native preview: `artifacts/raccoon-fixed-arms-native.png`. The unit remains equipped in its existing slot; ownership, army, coins and saved progression were preserved.
- Built upload-signed 1.0.12 / code 14 bundle with preview flags disabled. Verified all 1,592 signed content entries against the public upload certificate, package/version, billing metadata, offline JavaScript and ARM64/x86-64 support. AAB: 95,054,244 bytes. Built offline local-signature APK with the existing roster/food preview flag, no wave override, and `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`; APK: 119,969,061 bytes. Offline JavaScript and both ABIs verified. Installed using `adb install --no-streaming -r` and launched on emulator-5554.
- Logs use `raccoon-arms-` and `play-build-14` prefixes. No Play upload performed.

## Ranged stand-off fix and raccoon redraw (October 29, 2026)

- Fixed player ranged distances to use the target's scaled visible body edge. The old fixed 60-pixel boss padding put a raccoon's 348-pixel center stopping distance almost alongside Gundam's 323.4 against the pyramid. Ranged units also pull back at their normal movement speed behind a living melee screen, with a 23-pixel dead zone, bunker floor and rear-ally spacing. Lone ranged units can still be caught; enemy ranges and melee blade reach stay unchanged.
- Added regression coverage for every ranged unit's body-edge range, the screenshot's raccoon/Gundam/Barbarian pyramid fight, pullback behind melee, bunker bounds and loss of the melee screen. The recreated fight settles the raccoon 143.2 game pixels behind Gundam while continuing to attack. Updated the armor-volley test to wait for actual missile flight time at the increased stand-off distance. Reproducible scene: `scripts/render-ranged-spacing.cjs`, `artifacts/ranged-spacing-pyramid.png`.
- Redrew the raccoon with alternating dark/lavender tail and body stripes, a broader torso, smaller twin-thruster pack, cheek tufts and mask, and a detailed AR-style stock/receiver/trigger guard/magazine/vented handguard/rail/sights/barrel. Recoil, shell ejection, hovering and small bullet impacts remain. Shared muzzle offset is now 83 model pixels; body front is 52, matching the support paw outline. Portrait framing fits the longer rifle. Health, DPS, food cost and unlock price are unchanged.
- Typecheck and all 136 tests pass. 3,150 rendered frames across all 21 units preserve exact combat equality and do not consume combat RNG. Balance report regenerated. Visually reviewed full-size idle/firing poses, card-size portraits, the reproduced boss scene, and the installed army portrait. Artwork preview: `artifacts/raccoon-redraw-preview.png`; native preview: `artifacts/raccoon-redraw-native.png`.
- Built upload-signed 1.0.11 / code 13 AAB with preview flags disabled; verified package/version, billing metadata, offline JavaScript, ARM64/x86-64 and all 1,592 entries against the public upload certificate. AAB: 95,053,620 bytes. Built the offline local-signature preview APK with the existing roster/food preview flag, no wave override, and `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`. APK: 119,968,029 bytes; offline JavaScript and both ABIs verified.
- Installed with `adb install --no-streaming -r` and launched on emulator-5554. Existing saved Wave 101 and MiG-17/raccoon/Gundam army were preserved. Previewed the current wave's combat and left it without advancing, preserving earned coins; final army screen shows the redraw. No test wave reset or army replacement was made.
- Logs: `artifacts/raccoon-redraw-tests.log`, `artifacts/raccoon-redraw-render-verification.log`, `artifacts/raccoon-redraw-balance.log`, `artifacts/play-build-13.log`, `artifacts/play-build-13-verification.log`, `artifacts/raccoon-redraw-apk-build.log`. Build 12 was an intermediate range-fix preview; build 13 contains both changes. No Play upload performed.

## Outward sword-arm elbows (October 29, 2026)

- Gundam Warrior and Skeleton King now use the outward elbow solution, keeping their sword arms outside the chest throughout idle, attack and recovery. Gundam's idle grip moved slightly forward/down. Both arm segments remain connected and keep their original lengths; contact grips, blade angles and weapon-tip reach are unchanged.
- Body-front bounds now include the outward arm outline: Gundam 49 model pixels, Skeleton King 37. Shared scale and contact rules remain synchronized with the rendered silhouettes. Added a full-swing regression checking outward elbows, bounds and frame-to-frame continuity; existing limb-length and exact-contact checks cover the new bend direction.
- Typecheck and all 134 tests pass. Swing/portrait sheets visually reviewed; 3,150 rendered frames across all 21 units preserve exact simulation equality without combat RNG consumption. Balance report regenerated.
- Built upload-signed 1.0.9 / code 11 AAB with preview flags disabled; verified all 1,592 signed entries against the public upload certificate, package/version, billing metadata, offline JavaScript and ARM64/x86-64 support. AAB: 95,051,507 bytes. Built offline local-signature preview APK with the existing opt-in roster/food preview, no wave override, and `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`. APK: 119,964,701 bytes; offline bundle and both ABIs verified.
- Installed with `adb install --no-streaming -r` and launched on emulator-5554. Native robot portrait checked, with saved gold, army, ownership and wave preserved. Previews: `artifacts/melee-arm-swings.png`, `artifacts/melee-arm-portraits.png`, `artifacts/outward-arms-native.png`, `artifacts/outward-arms-native-final.png`. Logs use `outward-arms-` and `play-build-11` prefixes. No Play upload performed.

## Flat highlighted tabs and final Jetpack Raccoon (October 29, 2026)

- Bottom tabs now share the same flat dimensions and icon size. Selection uses a subdued yellow border and soft yellow edge glow, without elevation or upward movement.
- Added Jetpack Raccoon as the final 10,000-gold, 21-food unlock. Derived from Dark Mage: exactly 5× health (10,250 HP) and sustained DPS (1,581 damage every 0.28 seconds). This final unit intentionally exceeds the standard food-budget curve; the standard roster normalization guard remains, with explicit five-times-power checks for this exception.
- Purple raccoon artwork includes rounded ears, dark eye mask, pale muzzle, striped tail, assault rifle and continuously animated dual jet thrusters/hover. Body front is 39 model pixels, synchronized with the shared battlefield scale. Bullet launch height shares the hover calculation. Renderer-only attribution produces small orange impact explosions without splash or camera shake. Deployment cards still show only portraits and food costs, with descriptive accessibility labels.
- Typecheck and all 133 tests pass. Balance report regenerated (final unit wins all 40 normal/reversed equal-food duels). Preview verification passes; 3,150 rendered frames across all 21 units preserve exact simulation equality without consuming combat RNG. Original pose/contact checks remain intact.
- Built upload-signed 1.0.8 / code 10 AAB with preview flags disabled; verified upload certificate across 1,592 entries, package/version, billing metadata, offline JavaScript and ARM64/x86-64 support. AAB: 95,051,381 bytes. Built the local-signature offline preview APK with `EXPO_PUBLIC_TEST_PREVIEW=1`, no wave override, and `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`; verified offline JavaScript and ARM64/x86-64 support. APK: 119,964,621 bytes.
- Installed with `adb install --no-streaming -r` and launched on emulator-5554. Filled the first army slot with the preview-unlocked raccoon, keeping Gundam/Barbarian in place and Mech owned in the roster. Previewed a single raccoon against Wave 100: hovering, muzzle fire, bullets and small explosions visible. Left the battle without advancing the wave. Existing gold/progress preserved. Screenshots: `artifacts/raccoon-native-equipped.png`, `artifacts/raccoon-native-live.png`, `artifacts/raccoon-native-impact-3.png`. Reproducible art/portraits: `scripts/render-raccoon.cjs`, `artifacts/raccoon.png`.
- Logs: `artifacts/raccoon-tests.log`, `artifacts/raccoon-render-verification.log`, `artifacts/raccoon-balance.log`, `artifacts/play-build-10.log`, `artifacts/play-build-10-verification.log`, `artifacts/raccoon-apk-build.log`. No Play upload performed.

## Compact, minimal coin shop (October 29, 2026)

- Reduced the four tiles to a compact 2×2 grid. The Store header and each bundle's name, coin amount, and price are the only persistent shop text. Removed promotional copy, value badges, Buy labels, availability captions, refresh text, and footer. Pull-to-refresh and automatic recovery remain; purchase-specific errors/pending state use dialogs.
- Simplified original icons to a pouch with one coin in front, larger bag with three coins in front, chest with coin stacks in front, and an open vault filled with coin stacks. Removed sparkles and decorative backgrounds. Shared artwork also regenerates the optional Play product PNGs.
- Typecheck and four purchase regression tests pass. Upload-signed version 1.0.7 / code 9 bundle and local-signature offline APK builds pass. Verified the bundle's upload signature, package/version, billing metadata, offline JavaScript, and ARM64/x86-64 support; final APK offline JavaScript and both ABIs verified.
- Installed with `adb install --no-streaming -r` and launched on emulator-5554 with saved progress preserved. Visually checked `artifacts/store-simple-native.png`: all four compact cards fit, requested text only, icons and price buttons unclipped. Logs: `artifacts/play-build-9.log`, `artifacts/play-build-9-verification.log`, `artifacts/store-simple-apk-build.log`. Live checkout still requires Play product setup/testing.

## Four-tier coin store and checkout (October 29, 2026)

- Added original code-drawn pouch, bag, chest, and vault icons, four cards (500/$0.99, 2,500/$2.99, 7,500/$4.99, 25,000/$9.99 US reference prices), increasing value labels, and a gold Best Value vault. Buy and refresh controls use the existing click-sound pressable.
- Registered a native React Native billing bridge using Play Billing 9.1.0: localized product prices, fresh product details at checkout, pending/cancel handling, purchased-only coin grants, consumption after durable save, and recovery on foreground/purchase callbacks/store refresh. Purchase tokens persist with the coin grant to prevent duplicate credits. Background store loading does not block navigation or gameplay; late recovery cannot credit during a battle. Read/consume timeouts allow retry on slow connections.
- Typecheck and all 131 tests pass, including four new store tests covering the agreed packs, repeat purchases, quantity, duplicate credit after reload/battle, malformed receipts, old saves, and overflow. Full paid checkout remains untested until Play products and license testers are configured. Balances and receipt history are local; no backend verification, account sync, or automatic refund revocation is implemented.
- Built upload-signed version 1.0.6 / code 8 with preview flags disabled and no local signing flag. Release build and lint passed. Verified billing version/permission, offline bundle, ARM64/x86-64 support, package/version, and all 1,592 signed content entries against the public upload certificate. AAB size: 95,050,285 bytes.
- Built local-signature offline release APK (119,962,625 bytes), verified offline JavaScript and ARM64/x86-64 support, installed with `adb install --no-streaming -r`, and launched on emulator-5554 with saved coins, Wave 100, army and ownership preserved. A cold boot without wiping data resolved the emulator's existing stuck install queue. Native shop/scroll/footer and Back navigation checked; unavailable billing fails without a runtime crash or coin grant. Screenshots: `artifacts/store-native-preview.png`, `artifacts/store-native-footer.png`. Icon preview: `artifacts/store-icons.png`; optional Play product icons: `artifacts/store-products/`.
- Setup instructions and exact product/purchase-option IDs are in `STORE_SETUP.md`. Build logs: `artifacts/play-build-8.log`, `artifacts/play-build-8-verification.log`, `artifacts/store-purchases-apk-build.log`. No Play upload or real-money purchase performed.

## Supported Play Billing library (October 29, 2026)

- The permission-only build 6 was rejected by Play Console as legacy AIDL billing. Added the actual `com.android.billingclient:billing:9.1.0` dependency; no purchase controls or checkout flow added.
- Synchronized version 1.0.5 / code 7. Built `:app:bundleRelease --max-workers=2` with preview flags disabled, no local signing flag, and the existing upload key. Build and release lint passed.
- Verified bundled BillingClient bytecode, billing permission, and the library-supplied `com.google.android.play.billingclient.version=9.1.0` manifest metadata. The bundle verifier now optionally asserts that metadata to catch permission-only bundles. All 1,592 content entries match the public upload certificate; package/version, offline JavaScript, and ARM64/x86-64 support verified. AAB size: 95,039,581 bytes. Logs: `artifacts/play-build-7.log`, `artifacts/play-build-7-verification.log`. No upload performed.

## Google Play product setup permission (October 29, 2026)

- Added `com.android.vending.BILLING` to the native manifest and Expo Android permissions so a new upload can enable Play Console product creation. Store remains blank; checkout is not implemented yet.
- Synchronized version 1.0.4 / code 6 across native, Expo, and package metadata. Built `:app:bundleRelease --max-workers=2` with preview flags disabled and the existing upload key, without local test signing.
- Release build and lint passed. Verified the bundled billing permission, package/version, all 1,534 content entries against the public upload certificate, offline JavaScript, and ARM64/x86-64 native support. AAB size: 94,427,476 bytes. Build log: `artifacts/play-build-6.log`. No Play Console upload performed.

## Store tab and raised navigation (October 29, 2026)

- Bottom navigation is now Upgrades, Battle, Store, with a storefront icon on the right. Store is intentionally blank apart from the header title. Android Back returns from either secondary tab to Battle.
- Selected tabs rise above the bar with a larger icon, gold outline, deeper lower edge, and shadow. Existing screen-reader tab labels and selection state remain.
- Typecheck and all 127 tests pass. Offline release APK rebuilt using `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`; embedded JavaScript and ARM64/x86-64 libraries verified. No emulator was connected for installation or visual verification. Build log: `artifacts/store-tabs-build.log`.

## Wave 100 emulator test (October 26, 2026)

- Added optional `EXPO_PUBLIC_TEST_WAVE` inside the existing local preview branch. Valid values 1–100 replace only the saved wave; all other progress fields remain intact. Normal builds retain their saved wave. Android requires the preview flag for this override and tracks it as a JavaScript bundle input.
- Typecheck and the preview verification script pass, including Wave 100 persistence with coins, upgrades, army and unit ownership preserved. Rebuilt with `EXPO_PUBLIC_TEST_PREVIEW=1`, `EXPO_PUBLIC_TEST_WAVE=100`, and `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`. Offline JavaScript and ARM64/x86-64 native support verified.
- Installed with `adb install -r` and launched on emulator-5554 without clearing data. The previously verified Play upload AAB remains unchanged.

## Google Play release 1.0.3 (build 5)

- Incremented native/Expo version to 1.0.3 / code 5 and synchronized package metadata.
- Loaded `scripts/android-env.ps1` and built `:app:bundleRelease --max-workers=2` with `EXPO_PUBLIC_TEST_PREVIEW=0`, without the local test signing flag, using the existing ignored upload key. Build and release lint passed.
- Verified all 1,534 content entries against the existing public upload certificate. Packaged manifest is `com.warlingrush.app`, version 1.0.3, code 5. ARM64/x86-64 native libraries and embedded offline JavaScript are present. AAB size: 94,427,041 bytes.
- Inspected the compiled Hermes bytecode: the normal food upgrade formula remains, loadProgress only reads/decodes saved progress, and no runtime test-preview environment reference remains. Confirmed the signed bundle's embedded JavaScript matches this inspected bytecode exactly. Production includes the larger attack effects with normal progression and food rates.
- Bundle: `android/app/build/outputs/bundle/release/app-release.aab`. Logs: `artifacts/play-build-5.log`, `artifacts/play-build-5-verification.log`; checksum: `artifacts/play-build-5.sha256`. No Play Console upload performed. Existing emulator test APK remains installed.

## Larger attack animations and sustained impacts (October 26, 2026)

- Replaced the restrained first effects pass with full blade-sized cyan/green crescents, branching lightning around Stormblade and a tall lightning impact, Gundam thruster streaks/afterimages, larger casting runes and comets, layered fire-cloud explosions, expanding shock rings, flying debris and smoke. Barbarian/Stormblade now raise their weapons and sweep down through their existing contact pose; jump/bank motions, muzzle flashes, bass rings and other roster effects are more visible at phone scale.
- Cosmetic source metadata on existing damage effects identifies the actual attacking weapon, including lethal hits and moving targets. Renderer-owned bursts persist for up to one second independently of the existing half-second damage effect. Small camera shake is confined to the rendered battlefield. Damage, hit timing, reach, body geometry, cooldowns, targeting and progression math are unchanged; explosions do not add splash or knockback.
- Updated the pose direction assertions for the intentional overhead swings. Arm segment connectivity/body bounds and exact weapon contact continue to pass. Typecheck, all 127 tests, the 3,000-frame render/no-render simulation comparison, and the all-units/5-food preview check pass.
- Rendered and reviewed ordered animation frames and GIFs for Stormblade, Cannon, Dark Mage, Barbarian, Gundam, Mech, Basketball Player and Skeleton King. Reproducible previews: `scripts/render-epic-preview.cjs` and `scripts/encode-epic-preview.py`; artifacts use the `epic-` prefix.
- Rebuilt offline release using `EXPO_PUBLIC_TEST_PREVIEW=1` and `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`; APK is 119,253,994 bytes with ARM64/x86-64 libraries and embedded JavaScript. Installed with `adb install -r`, preserving save data, and launched on emulator-5554. Native Wave 8 captures `artifacts/epic-native-01.png`, `05.png` and `12.png` confirm the large Stormblade lightning/crescent and Dark Mage explosion in the installed game. All units remain unlocked with 5/s food production.

## Local roster/food test preview (October 26, 2026)

- Opt-in build environment `EXPO_PUBLIC_TEST_PREVIEW=1` unlocks every active unit on load, preserving all other saved fields, and sets displayed and simulated food regeneration to exactly 5/s regardless of upgrade level. Normal builds retain the regular food formula and ownership behavior. No testing control is exposed in the phone UI.
- Android rejects this preview flag without `-PlocalTestSigning=true`. The flag is a bundle-task input so switching back to a regular build invalidates the preview JavaScript cache.
- Typecheck and all 127 tests pass. `node scripts/check-test-preview.cjs` verifies persisted roster unlocks, exact 5/s at several upgrade levels, preserved coins/wave/army/upgrades, and unchanged normal food rates.
- Offline release APK rebuilt with the opt-in flag and local signing; ARM64/x86-64 libraries and embedded JavaScript verified. Installed on emulator-5554 with `adb install -r` and relaunched with saved data preserved.

## Cosmetic attack effects (October 26, 2026)

- Added renderer-only lightning, beam/cursed blade trails, mage casting runes, fiery projectile impacts, missile smoke, basketball/rock trails, bass rings, gun casings, tusk sparks, splash droplets and feathers. Small jump, bank and dash flourishes use existing attack timers; melee models retain their original position at the damage frame.
- Simulation, unit stats, geometry, damage, cooldowns, targeting, progression and deployment UI are unchanged. All effect attribution lives in a renderer-owned WeakMap; it never writes to World or consumes combat randomness. Explosions and shock rings apply no splash or knockback.
- Typecheck and all 127 existing tests pass. `node scripts/render-attack-effects.cjs` checks 3,000 frames across all 20 playable units against identical battles without rendering, asserting full World equality and rejecting any renderer call to Math.random. Contact-frame motion is checked within floating point tolerance.
- Visually inspected `artifacts/cosmetic-attacks-roster.png` and the mage, cannon and barbarian impact previews. Projectile impacts track target IDs so moving targets still receive the proper visual burst.
- Built the offline release APK using `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`; verified embedded JavaScript and native libraries for ARM64 and x86-64. Installed with `adb install -r` and launched `com.warlingrush.app/.MainActivity` on emulator-5554 with app data preserved.

## Rocket launcher icon and Google Play build 4

- Replaced launcher artwork with `app_icon2.jpg` through the reproducible icon generator. Regenerated Expo, legacy density, adaptive color, and Android 13+ themed resources. Kept the full source artwork with 112-pixel master padding so the rocket tip fits circular masks.
- Inspected circle, squircle, and rounded-square previews in `artifacts/adaptive-icon-previews.png`. Monochrome artwork at alpha >128 has zero pixels outside the 341-pixel resting circle; maximum radius is 316.78 pixels.
- Incremented native/Expo version to 1.0.2 / code 4 and synchronized package metadata. Upload-signed `:app:bundleRelease --max-workers=2` succeeded; all 1,534 content entries verified against the existing upload certificate, with expected package/version, offline JavaScript, and ARM64/x86-64 libraries. AAB: 94,407,517 bytes.
- Built `:app:assembleRelease -PlocalTestSigning=true --max-workers=2`. APK signature, package, version, launch activity, and all four configured architectures verified. APK: 119,235,414 bytes. Installed using `adb install -r` on emulator-5554 and launched successfully without clearing data.
- Build/verification logs: `artifacts/play-build-4.log`, `artifacts/play-build-4-verification.log`, and `artifacts/icon2-apk-build.log`. No Play upload performed.

## Google Play release 1.0.1 (build 3)

- Incremented Android and Expo version code to 3 and version name to 1.0.1; synchronized package metadata.
- Loaded `scripts/android-env.ps1` and ran `:app:bundleRelease --max-workers=2` without local test signing. Build and release lint succeeded.
- Verified the finished `android/app/build/outputs/bundle/release/app-release.aab` manifest contains `com.warlingrush.app`, version 1.0.1, code 3. All 1,534 content entries passed JAR signature verification against the existing public upload certificate. ARM64 and x86-64 native libraries and embedded offline JavaScript are present.
- Build log: `artifacts/play-build-3.log`. Verification log: `artifacts/play-build-3-verification.log`. No Play Console upload performed.

## Lowered ready poses and upward slashes

- Stormblade and Barbarian now hold their weapons downward at rest, raise them through contact, follow through upward, and return along a smooth connected-arm path. Faces remain in front of the weapons. The axe grip's return arc avoids the shoulder's folding point to prevent elbow flips.
- Shared timing in `src/game/meleeTiming.ts` gives these two attacks an 80 ms rising phase before damage, a short contact hold, follow-through, and recovery. Feet remain planted through the 250 ms animation. Hits are applied once to the captured target only if it remains alive, opposing, and within weapon reach; dead attackers and completed battles cannot land delayed hits.
- Per-hit damage, cooldowns, and contact reach (Stormblade 104 and Barbarian 72 model units) are unchanged. A moving enemy may close slightly during the rising phase; body separation and weapon contact remain covered in both directions.
- TypeScript and all 124 tests pass, including new lowered/upward pose, delayed contact, planted feet, escape/death cancellation, and single-hit checks. Balance report regenerated, with a win and counter for each unit. Native-size portraits and multi-frame artwork checked with `node scripts/render-melee-swings.cjs`.

## Keep Stormblade and Barbarian faces visible

- Stormblade's and Barbarian's heads/hair now render in front of their far-side weapons and arms, preventing raised grips/blades from covering their faces. Swing poses, connected arm motion, attack timing, silhouettes, and melee reach are unchanged.
- Visually checked idle, contact, and two recovery frames at full size and in 72x64 portraits using `node scripts/render-melee-swings.cjs`. TypeScript and all 10 relevant pose/contact/Barbarian combat tests pass.

## Enemy counters and burst waves

- Wave 3 introduces shielded steel-gray melee variants: 30% less damage from ranged hits and 30% more from melee, with the same scaled HP/attack. Wave 5 introduces cracked orange ranged variants: half scaled health and double scaled damage, preserving HP × DPS before integer rounding. Orange globs distinguish their heavier hits. Other enemies remain green; no variants apply to bosses.
- Wave 1 has groups of three at 1.2-second intervals with 3-second rests. Later normal waves have groups of four at 0.9-second intervals with 4.5-second rests. Initial delay stays five seconds, complete group/rest cycles average 1.8 seconds per spawn, and partial final groups add no enemies. Blocked attempts retain their planned kind/variant position and retry without spending budget.
- The power curve, normal enemy-count formula, original 5:2 kind weights, gold per kill, full-wave gold, boss stat budgets/cycle, and endless progression remain intact. Counter variants consume one normal spawn and pay the same gold. Existing saves need no migration.
- TypeScript and all 120 tests pass. Coverage verifies live shield damage for melee/projectile volleys, delayed orange projectiles, gradual introductions, type restrictions, equivalent variant stat budgets, burst timing, blocked entry/cap retries, and exact count/gold totals across normal/boss waves through 999. Existing starter victory, scaling-through-1000, boss, and reward tests also pass. Balance report regenerated.
- Actual artwork inspected at full and compact phone sizes; variant armor remains inside the existing body bounds. Reproduce with `node scripts/render-enemy-tactics.cjs` (`artifacts/enemy-tactics.png`, `artifacts/enemy-tactics-battle.png`, `artifacts/enemy-tactics-phone.png`). A compact counter reminder appears only on normal-wave preparation screens, with no extra battle controls or deployment status text.
- Offline release APK rebuilt, signature and ARM64/x86-64 contents verified, and installed/launched on the connected phone and emulator using the compatible preview signature. Existing app data preserved.

## Unlimited player deployment without status text

- Removed the player deployment cap and player bunker-entry occupancy rejection. Repeated taps can deploy into occupied lanes at the bunker whenever food is available. Enemy wave pacing retains its existing entry checks and on-field cap, now explicitly named `maxEnemyUnits`.
- Removed the unit-count display and deployment-success/busy messages from the battle screen. Deployment buttons now depend on affordability and pause state; descriptive accessibility labels and food fills remain.
- TypeScript and all 112 tests pass. The new regression deploys 121 melee or ranged troops without advancing simulation time, checks balanced lane placement and exact food spending, and verifies insufficient-food/finished-battle rejection. Existing enemy spawn-budget and blocked-entry tests pass.

## Food production and deployment-card fills

- The battle food icon starts muted and reveals its full color from bottom to top over one production interval, resetting at the same whole-food payout boundary used by the engine. It follows the actual upgraded food rate and pauses with simulation time.
- Deployment cards reveal their blue background, portrait, and food cost upward according to `(stored food + next-food progress) / unit cost`, capped at full. Spending food updates fills immediately; fractional progress never makes a unit affordable early. Pause/unit-cap blocking still dims the controls, and descriptive screen-reader labels remain on the buttons.
- Shared animation values update once per battle frame without adding React renders. Muted/full-color layers remain aligned while clipping grows upward; native Android screenshots checked full and partial fills at different costs (`artifacts/food-fill-preview.png`, `artifacts/food-fill-partial.png`).
- TypeScript and all 111 tests pass, covering production reset, upgrade rates, fixed-step payout continuity, cost ratios, and spending/affordability boundaries. Release APK signature, offline bundle, ARM64, and x86-64 contents verified; installed and launched on the phone and emulator with existing app data preserved.

## Connected weapon-arm swings

- Stormblade (4 food), Barbarian (14), Gundam Warrior (18), and Skeleton King (19) now move their grips and bend their elbows through the swing while shoulders remain attached to the torso. Hands and weapons share the same pose transform; the Barbarian and Stormblade keep both hands on their weapons.
- Full extension is held at the instant combat applies damage, followed by a smooth recovery into the raised ready stance. Body/contact bounds now include the Barbarian's grip at 30 model units and the complete Gundam/Skeleton King blade halos at 90/84. Stormblade retains its 104-model-unit tip.
- Adjusted the Barbarian's portrait framing and raised the Barbarian/Stormblade health bars to clear their raised weapons. Visually checked idle, contact, mid-recovery, and late-recovery frames, including native 72x64 portraits. Reproduce with `node scripts/render-melee-swings.cjs`; outputs are `artifacts/melee-arm-swings.png` and `artifacts/melee-arm-portraits.png`.
- TypeScript and all 107 tests pass, including connected limb lengths, hand/elbow movement, contact geometry, and the existing combat suite. Regenerated the balance report; each unit retains a win and counter.

## Twenty-percent ranged reach increase

- All player ranged units use 1.2x their blueprint range in actual combat (for example, 250 becomes 300), with existing large-target padding. The bonus does not alter HP, damage, attack speed, or prices. Enemy ranged attacks and melee contact retain their existing reach.
- TypeScript and all 105 tests pass. New coverage checks every ranged troop fires at the extended boundary, cannot fire beyond it, and preserves boss padding. Regenerated the balance report; every unit retains a winning matchup and a counter.

## Close the retired-unit food-tier gap

- Active roster food costs now run consecutively from 1 through 20: Stormblade 4, Mech 5, Machine Gunner 6, through Dark Mage 20. Shared maximum food cost is 20; stored food remains uncapped.
- The existing formula regenerates HP, per-hit damage, and coin unlock prices at each new food tier. Existing unlocks and army slots retain their unit IDs.
- TypeScript and all 103 tests pass, including a new consecutive-tier regression. Regenerated `artifacts/unit-balance-report.md`; every unit retains a winning matchup and a counter across 380 equal-food fights.

## Bundled button and attack sounds

- `assets/sounds/click.mp3` plays on enabled button/tab presses throughout battle, shop, dialogs, army controls, and navigation. Android's default button click is suppressed to avoid doubling the effect.
- `sword.mp3` plays when any melee unit attacks; `throw.mp3` plays when any ranged unit attacks. Both armies and bosses use the same mapping, with one sound per attack/volley and no duplicate sound on projectile impact or cooldown frames.
- Expo Audio preloads reusable players for overlapping effects, pauses on backgrounding, cancels pending playback on background/unmount, and releases players on unmount. All three files are bundled for offline play; microphone and background-audio permissions are disabled.
- TypeScript and the 101-test suite pass, plus the additional native-player lifecycle test. Coverage includes attack mapping, repeated attacks, silent movement/cooldowns/dead units, overlapping playback, foreground/background transitions, and resource cleanup.
- Rebuilt offline release APK with preview-compatible signing and installed/launched it on the connected phone and emulator with data preserved. Verified APK signature, ARM64/x86-64 libraries, and exact hashes of all three bundled MP3s. Repeated emulator navigation presses produced native 44.1 kHz media playback with no audio errors in the checked logs.

## Wave 100 goal in the battle header

- Battle header shows `Wave X/100`, retaining the boss indicator. The counter continues beyond the goal (for example, `Wave 101/100`).
- Wave progression stays uncapped, with the existing difficulty formula and five-boss cycle every 20 waves. TypeScript and all 20 wave/boss regression tests pass, including difficulty through wave 1000 and boss recycling through wave 300.

## Larger launcher artwork, version code 2

- Enlarged the complete adaptive artwork from 640 to 896 pixels on the 1024-pixel canvas, reducing outer transparent padding to 64 pixels. Color and monochrome retain identical layout. Legacy/app-icon previews use the matching resting adaptive composition.
- Circle-mask alpha check confirms zero clipped artwork pixels at alpha >128; the farthest visible detail is 337.82 pixels from center, within the resting circle's 341-pixel radius. Circle, squircle and rounded-square previews regenerated, plus `artifacts/icon-circle-before-after.png` (old left, new right).
- Android version code incremented to 2 in native and Expo config for the next Play upload.
- Both APK and AAB rebuilt successfully. APK identity/architectures verified; AAB signature verified against the existing dedicated upload certificate. Updated and launched the APK on the connected Pixel 9 and emulator with `adb install -r`, preserving app data.

## First boss melee contact and single-target damage

- Dreadmaw's lower-body contact front is 28 model units and its animated hand edge is 34, both using the shared 3x boss and 1.4x battlefield scale. This replaces the stale 48/66 bounds from the larger artwork and brings both sides into visible melee contact.
- Dreadmaw hits one troop per claw attack, including when multiple troops are within range across different lanes.
- TypeScript and all 97 tests pass. Regression coverage checks both attack directions, excludes hits outside hand/weapon contact, and verifies single-target damage.
- Offline release APK rebuilt and signature verified, with ARM64 and x86-64 native libraries. Compatible local preview installed and launched on the open emulator with app data preserved; the final `app-release.apk` uses the normal release signing key.

## Play Console AAB and upload signing

- Created a dedicated RSA-3072 upload key for the user's first Play upload. Private PKCS12 key and credentials live in the Git-ignored `android/upload-signing/` folder, restricted to the current Windows user and SYSTEM. Public certificate: `artifacts/warlingrush-upload-certificate.pem`.
- Release builds use the upload key. Explicit `-PlocalTestSigning=true` retains the existing debug signature only for local emulator preview APKs.
- `:app:bundleRelease` succeeded. Verified `android/app/build/outputs/bundle/release/app-release.aab` (91,351,616 bytes), its JAR signature against the upload certificate, package `com.warlingrush.app`, bundle layout, embedded offline JS, and ARM64/x86-64 native libraries. Version 1.0.0 / code 1.

## Package identity and adaptive launcher icon

- Android application ID/namespace and Kotlin entry points now use `com.warlingrush.app`; Expo Android and iOS identifiers match. Launcher supports standard and round adaptive icons, with Android 13+ monochrome resources and legacy density fallbacks.
- `app_icon1.jpg` is preserved as complete artwork. Foreground is exactly 640×640 centered at (192,192) on a transparent 1024×1024 canvas. Monochrome uses the same untrimmed source layout/padding; its silhouette excludes the original blue field. Background matches the source's #0086ff blue.
- `node scripts/generate-icons.cjs` reproduces assets and native resources, verifies transparent outer padding, and generates `artifacts/adaptive-icon-previews.png` (color top row, monochrome bottom; circle, squircle, rounded square) plus `artifacts/adaptive-icon-padding.png` (transparent-padding checkerboard).
- TypeScript passes; actual generated previews inspected for full artwork and consistent spacing.
- Release APK rebuilt successfully. `aapt` confirms package/launch activity `com.warlingrush.app`, ARM64/x86-64 libraries, density fallbacks and adaptive XML at API 26/33. Compiled API-33 XML includes background, foreground and monochrome layers. Installed with `adb install -r` and launched the new package successfully at wave 1. The old package and its data were retained separately.

## Phone-testing release defaults

- Removed the temporary Go to wave dialog/button and lock/unlock-all button, their handlers, state and unused styles. Removed the production testing-unlock helper.
- Starting production is 0.50 food/s, displayed with two decimal places; stored food remains uncapped. Food upgrades still add 0.02/s, with the base first purchase costing 60 coins.
- Fresh progress has wave 1, zero coins, zero wins/battles, all upgrade levels zero, and only Clubman, Spearman and Rock Thrower unlocked/equipped in slots 1–3.
- Uses `warling-rush.progress.phone.v1` for a one-time reset of development progress without clearing app data. Subsequent phone-release progress saves normally in that namespace.
- Regression checks cover exact starter state, base upgrade price, save round-trip, starter deployment, locked advanced units, updated income and uncapped storage. The first-wave simulation now uses the three actual starter units; the boss-win scenario uses level-10 upgrades for the slower economy.
- TypeScript and all 97 tests pass. Release APK built successfully with ARM64/x86-64 libraries verified. Installed with `adb install -r`; native UI confirms wave 1, zero coins, 0.50/s, the 60-coin first food upgrade, three starter army slots and locked advanced units, with both testing buttons absent. Left the emulator at the wave-one FIGHT screen.

## Unlimited stored battle food

- Removed the production clamp: battle food continues accumulating regardless of equipped units, their prices, or an empty army. Whole-food payouts, production upgrades and deployment costs still work as before.
- Renamed the roster price ceiling to `BATTLE.maxUnitFoodCost` so it cannot be mistaken for a limit on stored food. Updated test/simulation setup and current documentation.
- TypeScript and all 97 tests pass. Regression coverage verifies cheap, expensive and empty armies accumulating 102 then 152 food, continuing beyond 10,000, and spending from that surplus.
- Rebuilt and verified the offline release APK with ARM64/x86-64 support, installed using `adb install -r`, and reopened the emulator game with saved progress preserved. Live battlefield screenshot `artifacts/uncapped-food-emulator.png` confirms 107 stored food with a 24-food Dark Mage equipped.

## Shorter Dark Mage and straw hat correction

- Follow-up reference: lengthened the hat into a tall, narrow swept point while keeping the short body, single brim and buckle. Raised health-bar clearance above the new tip. Checked idle/casting models and 72×64 portraits with the actual renderer; TypeScript passes.
- Reduced the mage's drawn height by 22%, keeping its feet on the battlefield baseline. Replaced the stepped, bent hat with a single pointed straw cone, straw seams, a band/buckle and one broad brim; removed the extra shelf above the buckle.
- Matched the spell launch height and health-bar clearance to the shorter model. Body contact geometry now includes the 33-unit front of the brim. Combat stats and portrait/food-only battle cards remain as before.
- TypeScript and all 97 tests pass. Actual Skia idle, casting and portrait previews are in `artifacts/darkMage.png`; regenerate with `node scripts/render-dark-mage.cjs`.
- Offline release APK rebuilt with ARM64 and x86-64 libraries verified, installed with `adb install -r`, and game reopened with saved progress preserved. Existing army already had Dark Mage in slot 2; left that loadout in place and displayed the updated army preview. Screenshot: `artifacts/dark-mage-revision-emulator.png`.

## Purchasable Stormblade

- Original anime-style melee swordsman with oversized golden spiky hair, dark clothing, a red scarf, and a giant steel sword. The attack holds the sword at full extension before recovering, with a pale blue slash trail.
- Shared balance formula: 1,025-coin unlock, 8 food, 384 HP, 165 damage per swing, 35 movement speed and a 1.45-second attack interval. Uses normal unlock, army, deployment, and save controls. Battle cards retain portrait and food cost only, with descriptive accessibility labels.
- Geometry matches the 31-unit body front and 104-unit extended sword edge before shared battlefield scaling. Melee contact checks cover both directions and separate troop bodies; purchase/equip/save/deploy checks include Stormblade.
- TypeScript and all 97 tests pass. The balance report includes the new unit. Actual Skia idle, attack and portrait previews are in `artifacts/stormblade.png`; regenerate with `node scripts/render-stormblade.cjs`.
- Release APK rebuilt successfully with ARM64 and x86-64 libraries and the offline JavaScript bundle verified. Installed with `adb install -r`, preserving the existing save. Started the emulator/game, used the existing test unlock button, equipped Stormblade in empty slot 2, and deployed it successfully. Battle is paused for manual testing; `artifacts/stormblade-emulator.png` records the preview.

## Purchasable Basketball Player

- Added a player-only athlete in a purple jersey with gold trim, white number seven, purple headband and white sneakers. He holds a visible orange basketball with dark curved seams and raises both arms into a shooting follow-through. Balls spin along a high arc in battle and damage one target after flight.
- Shared formula: 1,575-coin unlock, 11 food, 590 HP, 103 damage per basketball, 230 range, 42 movement speed and 1.05-second shot interval. Starts locked in new/existing saves and uses normal shop, army, deployment and persistence controls.
- All 71 tests and TypeScript pass. Advanced-unit tests include affordability, purchase, equip, save/reload, deployment and ranged-row passing. Basketball combat checks cover launch position, projectile identity, travel delay, exact single-target damage, no splash and repeat attacks.
- Regenerated `artifacts/unit-balance-report.md`: all eleven roster types retain winning matchups and counters across 110 equal-food duels with reversed attack priority.
- Actual Skia idle/shooting portraits and battle checked: `artifacts/basketball-player.png`, `artifacts/basketball-player-portrait-idle.png`, `artifacts/basketball-player-portrait-shooting.png`. Render with `node scripts/render-basketball.cjs`.
- Android release build passed for ARM64/x86-64 and installed on the connected emulator with saved progress preserved.

## Purchasable Machine Gunner

- Added a player-only unit with olive-green WWII-style helmet, fatigues/webbing, an oversized machine gun with wooden stock and vented barrel, and a hanging brass ammunition belt. Same simple character base as the existing player roster. Firing animates recoil, muzzle flash, ejected brass and ammo-belt motion.
- Shared formula: 1,400 coins to unlock, 10 food, 423 HP, 20 damage per bullet, 250 range, 0.16-second interval (6.25 shots/second, 125 base DPS). Individual bullets travel rapidly from the muzzle in a straight line and damage one target after flight, with no splash.
- Integrated into shop colors, unlock/use dialog, three-slot army, deployment and save/load. Starts locked in new and existing saves. Portrait framing checks helmet, stock and muzzle flash within 72×64 at idle and during fire; battlefield health bars clear the helmet.
- TypeScript and all 70 tests pass. Existing advanced-unit tests now include this unit's price, affordability, purchase, equip, spawn, persistence and support-row passing. New combat coverage verifies firing cadence, bullet travel, muzzle origin, exact per-hit damage and no splash. Enemy wave spawning continues to reject player units.
- `npm run balance` regenerated `artifacts/unit-balance-report.md`. All ten roster units retain a winning matchup and counter across 90 equal-food fights with reversed attack priority.
- Actual Skia artwork and portrait renders checked: `artifacts/machine-gunner.png`, `artifacts/machine-gunner-portrait-idle.png` and `artifacts/machine-gunner-portrait-firing.png`. Regenerate with `node scripts/render-gunner.cjs`.
- Android release build passed for ARM64/x86-64 and installed on the connected emulator with saved progress preserved.

## Wave-100 All-Seeing Eye milestone boss

- A floating gold pyramid with a central eye, shaded side, detached ground shadow, bobbing motion and floating fragments. The eye charges with a pulsing glow and thin aim line, then releases a layered gold/white beam directly from the eye. Full and compact actual Skia previews checked: `artifacts/pyramid-boss.png` and `artifacts/pyramid-boss-phone.png`.
- Boss cycle is now dinosaur 20/120, gorilla 40/140, robot 60/160, scientist 80/180 and pyramid 100/200. Each replaces its slime wave and remains enemy-only.
- Pyramid gets 2.5× standard same-wave boss HP and 2× damage: wave 100 has 183,369 HP and 910 damage per target. Range 360; attack interval 2.2 seconds; charge 0.9 seconds; visible beam 0.35 seconds; up to five pierced troops per shot. It holds position while charging/firing, damages once, and cancels the beam on death.
- All 69 tests and TypeScript pass. Coverage verifies the extra same-level difficulty premium, five-boss schedule through wave 300, enemy-only restrictions, delayed beam damage, stationary charging, piercing cap, out-of-range exclusion, no repeated damage, beam expiry, bunker damage and source-death cancellation.
- `scripts/boss-report.ts 100` confirms a large challenge increase: level-20 armies lose; upgraded advanced armies at level 60+ can win. Weaker setups can time out in the 300-second test. These simulations do not replace manual balance testing.
- Generate the beam preview with `node scripts/render-boss.cjs 100`. The staged preview uses level-100 health bonuses so the player models survive the first beam for visual inspection.
- Android release build passed for ARM64/x86-64 and installed on the connected emulator with saved progress preserved.

## Wave-80 mad scientist boss

- Professor Fizz wears a white lab coat with lapels, dark trousers and broad shoes, with wild white hair, a bald forehead, round glasses and a white moustache. His visible green beaker bubbles continuously and tips as he attacks. Same 3× boss scale and shaded three-quarter style.
- The five-boss sequence above supersedes the original four-boss cycle. Single-boss waves and enemy-only restrictions remain.
- Wave 80: 53,723 HP, 390 damage per hit, 240 range, 1.8-second cooldown. Potion globs launch from the beaker and splash at most three troops within 55 world units; they damage the bunker and create green impact particles.
- All 66 tests and TypeScript pass, including the four-boss schedule through wave 240, enemy-only scientist restrictions, flight delay, scaled potion damage, bounded splash, exclusion outside the splash radius, single damage application, bunker damage and victory to wave 81.
- Actual Skia renders checked at full battle and compact phone sizes: `artifacts/scientist-boss.png` and `artifacts/scientist-boss-phone.png`. Generate using `node scripts/render-boss.cjs 80`. The report at `scripts/boss-report.ts 80` confirms an upgraded advanced-army victory; weak-army runs lose. Manual late-game balance remains unverified.
- Android release build passed for ARM64/x86-64 and installed on the connected emulator with saved progress preserved.

## Wave-60 giant robot boss

- Added Iron Titan, a humanoid robot with gray armor, purple exposed frame, rounded shoulders, mint visor, broad feet and a connected animated piston punch. Three-quarter armor planes match the mech and existing bosses. Model scale is 3×; its health bar clears the helmet.
- The five-boss schedule above supersedes the original three-boss cycle. Each boss replaces its normal slime wave; incorrect boss types cannot spawn.
- Wave 60 uses the shared boss premium and power curve: 36,992 HP, 315 damage per target, three-target melee and a 1.3-second attack interval. Robot cannot be purchased, equipped or saved as owned.
- All 63 tests and TypeScript pass, including the three-boss sequence through wave 180, robot combat, enemy-only restrictions, victory to wave 61 and defeat retaining wave 60.
- Actual Skia full battle and compact phone renders verified: `artifacts/titan-boss.png` and `artifacts/titan-boss-phone.png`. Regenerate with `node scripts/render-boss.cjs 60`. Simulation report at `scripts/boss-report.ts 60` includes upgraded mixed-army wins and weak-army defeats; manual balance remains unverified.
- Android release build passed for ARM64/x86-64 and installed on the connected emulator with saved progress preserved.

## Wave-40 giant gorilla boss

- Added Ironback, a giant gorilla with a broad hunched torso, long arms, oversized rounded fists, heavy brow and projecting muzzle. Dark fur, shaded far limbs and restrained top planes match Dreadmaw/mech styling. A large knuckle punch animates the existing three-target boss melee strike.
- The five-boss cycle above supersedes the original dinosaur/gorilla alternation. All bosses remain enemy-only and 3× normal model scale; the wrong boss type is rejected.
- Ironback uses wave-40 scaling and the shared boss difficulty premium: 22,259 HP, 240 damage per target, 1.3-second attack interval. Later appearances scale further.
- All 62 tests and TypeScript pass, including alternating selection, correct boss restrictions, actual gorilla damage, shop/save/deployment exclusion, and victory advancing to wave 41. Existing dinosaur fights continue to pass.
- Verified actual Skia battle and compact phone renders: `artifacts/ironback-boss.png` and `artifacts/ironback-boss-phone.png`. Regenerate with `node scripts/render-boss.cjs 40`.
- `scripts/boss-report.ts 40` confirmed feasible upgraded mixed-army victories and defeats with some weaker deployments; full manual balance across player strategies remains unverified.
- Android release build passed for ARM64/x86-64 and was installed on the connected emulator with saved progress preserved.

## Recurring dinosaur boss fights

- Every 20th wave replaces the slime army with its scheduled boss. The header marks boss waves; normal waves resume after victory. Defeat/retry preserves the wave.
- Dreadmaw is rendered at 3× normal scale, with a clean three-quarter dark-green body, angled snout and head-top plane, darker far limbs, heavy thighs, broad feet, curled tail and blue-green dorsal plates. A narrow eye and brow give a fiercer kaiju expression; subtle contour shading replaces the light-green belly patch; a wide red health bar shows remaining health. Full-size and compact actual Skia renders were checked: `artifacts/dreadmaw-boss.png` and `artifacts/dreadmaw-boss-phone.png`.
- Boss health is 1.6× the expected full mixed slime army health; damage is scaled bruiser damage × 5. Wave 20: 9,974 HP, 160 damage per target, up to three targets per swipe, 1.3-second cooldown. Later boss appearances use the same growing power curve.
- TypeScript and all 61 tests pass. Coverage includes recurring schedule, single-boss-only spawning, enemy-only restrictions, stats and size multiplier, body contact, bounded cleave, victory/progression, and wave-20 victory with a level-5 upgraded mixed starter army versus defeat when ignored.
- `scripts/boss-report.ts` tested starter and advanced mixed armies at upgrade levels 0/5/10/20. Simulated victories took 43–90 seconds; the unupgraded advanced army lost. These scenarios establish feasibility, not full balance across all player strategies.
- Android release build passed for ARM64/x86-64. Actual device interaction was not part of the boss verification.

## Rounded slime models with distinct weapons

- Slime bodies use a stronger saturated green palette. Damage flashes brighten within green instead of turning cream/white; gloss spots stay green-tinted too. Verified the idle models and a hit-flashing melee slime in the Skia preview.
- Replaced the multi-lobed bodies, stretching arms and teeth with a smooth jelly silhouette inspired by the supplied reference: dark outline, green body, light rim, shaded bottom, two gloss spots and simple angry eyes.
- Both enemies share the same rounded body. Bruisers carry a broad pale-blue sword with an animated slash; lobbers carry a wooden Y-shaped slingshot with a stretching pouch and green slime ammunition.
- Existing enemy scaling, combat timing, slime projectiles and player roster remain unchanged. Enemy health bars sit above the weapons.
- TypeScript passed. Visually verified idle and attack poses plus an actual mixed battle through Skia/CanvasKit in `artifacts/slime-enemies.png`.
- Android release build passed and was installed on the connected emulator with saved progress preserved.

## Power-curve enemy wave progression

- `src/game/waves.ts` defines combined strength `(1 + 0.08 × (wave - 1))^1.5`, split into count, health and attack growth. See `ENEMY_WAVES.md` for formulas and sample waves.
- Replaced enemy food with an exact remaining-slime count. Both types consume one spawn; neither composition nor the former 120-food cap stops count growth. The concurrent limit of 36 living enemies remains, with blocked spawns retained.
- Wave one keeps 12 base-stat bruisers. Both slime types gain health and damage on later waves; player upgrades do not alter their stats. Projectile damage uses the scaled attack stat.
- TypeScript and all 56 tests pass, covering increasing power-curve increments, easing percentage growth through wave 1000, exact scheduled counts and victory, spawned stats, player-stat independence, invalid inputs and scaled damage to the bunker.
- Android release build passed for ARM64/x86-64 and was installed on the connected emulator with saved progress preserved. Late-game win rates have not been manually playtested.

## Enemy-only slime waves

- Enemy waves use only Slime Bruisers (stretching slime-arm melee) and Slime Lobbers (thrown green slime projectiles). Both have green glob bodies, angry eyes, teeth, squish animation and hit/death feedback. Lobber health bars clear the raised throwing arm.
- Wave one introduces bruisers; lobbers join from wave two. Wave budgets and growth remain finite. Player unlocks do not change the enemy pool.
- The shop and army retain the player roster. Slimes cannot be bought, unlocked, equipped, saved as owned units or deployed by the player; normal enemy spawning rejects the player roster.
- TypeScript and all 51 tests pass, including starter-wave victory, unlock independence, faction restrictions, projectile flight, slime damage to troops and the bunker, budget exhaustion and blocked spawn retries.
- Visually checked actual Skia idle/attack models and a mixed battle in `artifacts/slime-enemies.png`. Render with `node scripts/render-slimes.cjs`.
- Android release APK rebuilt successfully for ARM64/x86-64 and installed on the connected emulator with `adb install -r`, preserving saved progress. Device interaction was not part of this verification.

## Background patterns behind the road and bunker

- Removed the empty exclusion bands above/below the road across all six themes. Mountain, desert, lava and jungle layers now meet under the opaque road; grass and stars also render through the former exclusion area. The road and bunker draw over the continuous pattern.
- TypeScript passes. Visually checked actual Skia tall and compact renders for all six themes: artifacts/battle-themes.png, artifacts/battle-themes-compact.png, artifacts/jungle-background.png.
- Android release build passed and installed on the emulator.


## Stable battlefield during fight/leave transitions

- Battle navigation overlays the battlefield instead of consuming layout height in the ready/result phases. Removing it during combat no longer expands the field and moves its ground line, bunker, health bar and background. Upgrades navigation keeps its existing layout.
- Food, pause, FIGHT and deployment controls remain overlays. TypeScript check passes.
- Android release build passed and installed. Compared emulator screenshots before FIGHT, during combat and after Leave: the bunker/road/health-bar region is pixel-identical across all three (zero differing pixels in the 160×550 check region). No runtime errors in the checked log. Screenshots: `artifacts/layout-before.png`, `artifacts/layout-playing.png`, `artifacts/layout-after.png`.


## Player bunker visibility and health bar

- Shifted bunker artwork 20 logical units right to show a little more of it. The health bar is 11 points tall (previously 8), with the visible numeric health label removed. Remaining health is still available in its accessibility label.
- TypeScript check passes.


## Battlefield food position and deployment width

- During combat, food is a meat icon and count centered over the background just below the Wave header. The overlay does not intercept touches and its text has a dark shadow for contrast across themes. The production rate stays on Upgrades.
- Removed the bottom food column and deployment-card width cap. Three equal-width army slots now span the bottom bar with the existing outer padding and gaps.
- TypeScript and Android release build pass. Installed on the emulator and verified the centered food icon/count, no rate on the battlefield, and equal-width bottom slots. Screenshot: `artifacts/battle-food-top.png`. Left the test wave without completing it.

## Cost-scaled unit value and damage-per-hit cards

- Reduced the excessive reach penalty (range allowance 250 → 1500) and tuned food exponent 0.9 → 0.8 to retain cheap-unit value. Every roster cost tier now has a strictly larger raw geometric HP/DPS budget, independent of reach/speed credit, while roles still trade health against DPS.
- Axe Thrower (5 food / 525 coins) now has 249 HP and 73.3 DPS versus Axeman (4 food / 375 coins) at 231 HP and 68.3 DPS. Tank Puncher has 858 HP / 44.6 DPS; glass-cannon Spear Thrower has 206 HP / 113.8 DPS. Costs, ownership and purchased bonuses are preserved.
- Roster and army attack stats show rounded damage per hit, including upgrades, with explicit damage-per-hit accessibility labels and no /s suffix. Combat still applies damage per hit/volley using the existing cooldown and projectile system.
- TypeScript and all 49 tests pass. Guards cover monotonic raw roster power, no higher tier losing both health and DPS, role tradeoffs, normalized budgets, all 72 equal-food matchups with reversed priorities, mixed tank/glass-cannon teamwork and starter-wave clearance. Each unit retains a winning matchup and a counter. Updated report: artifacts/unit-balance-report.md. Android release build passed and installed; previously verified Axe Thrower/Axeman values in roster and army without clipping. The damage-per-hit display supersedes the DPS labels in artifacts/unit-value-comparison.png.


## Enemy waves

- The header/picker display Wave. Removed the enemy bunker and its health overlay; enemy units spawn fully beyond the right edge and walk onto the field. Player troops wait inside the right edge instead of attacking a missing base.
- Enemy food is now a finite wave budget: 12 initially, increasing by 2 per wave to a maximum of 120. Spawns begin after 5 seconds and occur at 1.8-second intervals. Blocked spawns retain their planned unit and budget. Victory requires the budget to be spent and every enemy defeated; player bunker destruction causes defeat.
- A new player's first wave has Clubmen; Spearmen enter the basic pool at wave 2, Rock Throwers at wave 3, and owned advanced units can join waves. Player food production and existing damage/health balance remain intact.
- Only clearing advances the saved wave and ten-wave background bands; defeat retries it. Existing saves migrate their old battle number to the wave number while preserving coins, army, unlocks and upgrades. Victory/defeat rewards remain 100/25 and use the existing save/retry flow.
- TypeScript and all 48 tests pass, including starter-only wave clearance, finite spawns, entry blocking, no early wins, holding the edge, missiles against units/player bunker, defeat priority, save migration and wave/theme advancement. Older base-versus-base notes below are historical.
- Android release build passed and installed on the emulator. Verified the migrated Wave 8 header, absent right bunker/health bar, and enemy units entering from the right; left the test wave using the pause popup. Screenshots: `artifacts/wave-ready.png`, `artifacts/wave-entry.png`.


## Two-button pause popup

- Pause shows only two equal-width buttons: red Leave on the left and green Resume on the right. The panel width, padding, button borders, corner radius, spacing, text and press opacity match the unit-selection popup.
- Leave returns to the prepared battlefield; Resume continues the current battle. Android Back dismisses the popup and resumes as before. Removed the Paused heading and Restart action.
- TypeScript check passes.

## Jungle background

- Added jungle after space at battles 51–60. Six ten-battle themes now repeat every 60 battles, returning to grasslands at 61.
- Deep-green terrain uses continuous shaded foliage layers, broad leaves, smaller paired leaves along winding stems, long vines, three shaded trunks with branches/bark and moss, and scattered fern fans. The muted pattern continues behind the shared road and bunker and is checked in tall/compact fields. Artwork uses the existing Skia vector style and adapts to tall and compact fields.
- TypeScript and all 40 tests pass, including three full six-theme cycles, space-to-jungle boundaries and returning to grasslands after a completed battle 60. Actual Skia previews: `artifacts/jungle-background.png` and `artifacts/battle-themes.png`.

## Larger battle units and angled Mech

- Battlefield units render at 1.4× their original size (30% smaller than the first 2× enlargement), including equipped weapons and death animations. Menu portraits retain their card sizing; the Mech portrait is fitted to show its full silhouette.
- Mech retains the reference's shoulder missile grids, chunky bent legs with round knees, and broad feet in the existing outlined, flat-shaded style. Raised lids are removed; the cabin is square with an upright window. Mech artwork scale is 1.05 (previously 0.74), so its lidless body is taller than the people. Both teams face inward and retain their team colors and hit flash. Portrait framing and health-bar clearance accommodate the enlarged model.
- Projectile sizes, launch/impact heights and damage-effect heights follow the enlarged battle artwork; health bars sit above the larger silhouettes. Missile pod offsets are adjusted visually without changing simulation range, flight time or damage.
- TypeScript, all 39 tests and the Android release build pass. Actual Skia renders checked for both teams, portrait framing, missile flight, and enlarged mixed troops in tall/compact fields: `artifacts/mech-art.png`, `artifacts/mech-missiles.png`, `artifacts/larger-battle-units.png`.

## Unit testing toggle

- Top-right Upgrades button reads Unlock all if any roster unit is locked, otherwise Lock all. Unlocking grants every current unit without charging coins and preserves army slots; locking returns to the starter Clubman and removes locked units from army slots, equipping Clubman if needed. Coins, upgrades, battle count and wins stay unchanged.
- Changes use the existing save-before-display preparation flow, refresh the prepared battle world and persist across launches. The control disables while saving or outside the ready phase. Save failures retain the previous state and show the existing retryable error.
- TypeScript and all 39 tests pass, including both toggle directions, valid saved army cleanup, preserving other progress, and keeping existing Clubman slot gaps.

## Mech unit

- Android release build passed; installed over the existing emulator app and launched successfully, with no errors in the checked runtime log.
- Added Mech to the roster: 1225 coins, 9 food, 409 HP, 123 damage per two-missile volley, 250 range and 1.8-second cooldown, generated by the shared balance formula. Starts locked in existing/new saves; enemies use it only once owned.
- Simple flat two-leg walker, compact body and two rectangular missile pods with mint/coral markings. Portrait and battlefield use the same drawing function; pods and feet fit the existing portrait frame. No raster assets or realistic armor details.
- Both pods fire a missile, splitting the attack damage equally. Each projectile starts at its own pod, arcs toward the target, and applies damage on arrival. Walking, hit flash, death cleanup, army selection, food costs and purchased bonuses use existing systems.
- TypeScript and all 38 tests pass, including Mech unlock/equip/save/deploy, affordability, both teams' volleys, distinct pod origins and exact impact damage, melee passing and AI ownership gating. Equal-food balance report includes winning and losing matchups for Mech. Artwork and portrait checked using the actual Skia renderer; previews: `artifacts/mech-art.png`, `artifacts/mech-portrait-player.png`, `artifacts/mech-missiles.png`.

## Battle background cycle

- Lava refinement: three medium-width angular cuts share exact junctions, with straight rock edges, dark recessed walls and orange floors set slightly below the surface. Removed thin branches and bright center stripes; all cuts share the same restrained molten texture. Other themes, road and bases are unchanged. TypeScript and the tall/compact Skia renders pass.
- Mountain, desert and lava art now uses large continuous terrain with clean anti-aliased edges and smooth dune/lava curves: broad connected mountain faces and snowy peaks, three full-width sweeping dune layers, and shaded charcoal regions with long irregular orange lava channels. Grasslands, space, bunkers and road remain unchanged. The Skia preview covers tall and compact sizes in `artifacts/battle-themes.png`.
- Temporary testing control: on the ready battlefield, the top-right Go to button opens a numeric battle picker. Enter a positive whole number and press Go to immediately prepare that battlefield; Cancel and Android Back dismiss it. Try 1, 11, 21, 31 and 41. Selection stays in this app session through preparation, play and restart; completing a selected battle advances to the next number. Jumping itself does not alter saved battles, wins, coins or upgrades; cold launch returns to saved progression.
- Battles 1–10 use green grasslands with subtle grass tufts; 11–20 use gray mountains; 21–30 use sandy dunes; 31–40 use charcoal rock with lava veins; 41–50 use near-black space with faint stars; 51–60 use jungle. The sequence repeats at battle 61.
- Both wins and losses count toward the next battle. Existing saved completed-battle totals select the theme on load; restart and leaving an unfinished battle do not advance it. The header shows the current world's battle number, including while the reward is being saved.
- Trees and old rocks are removed. Bunker artwork, positions and road outline are unchanged; the road fill and speckles are slightly darker brown across all themes.
- TypeScript and all 37 tests pass, including three full theme cycles and saved win/loss progression. `node scripts/render-themes.cjs` exercises the actual Skia drawing code at tall and compact viewport sizes and generates `artifacts/battle-themes.png` (visually checked).
- Android release build passed for all four configured architectures; APK installed over the existing emulator app and launched successfully.

- Bases use simple angled gray bunkers: three flat shaded faces, one window slit, a plain side doorway and a mint/coral marking. Roof and side faces provide depth without panel seams or small door details. Both face inward with their existing health overlays and battlefield positions.

- Bottom menu is 56 points tall, with two full-width equal halves and centered icons only. Visible labels are removed while accessibility labels remain. Crossed swords include outlined brown grips below their guards.

## Food production and layout

- Layout refinement: food controls sit closer to the army with extra height given to the roster. Food and army areas use the screen's plain background without colored section bands or dividers; army height follows portrait width, with the compact size retained.
- Larger roster area, tighter army stat spacing and reduced bottom padding. A strip between roster and army shows the meat icon, current food/second and a blue coin-price purchase button. Compact screens reserve enough height for all army stats.
- Each purchase adds exactly 0.02 food/second. Prices use `ceil(60 * (level + 1)^1.35)` (60, 153, 265, 390...), with the existing 100-level limit. Purchases save before updating the displayed rate, coins and prepared battle world; unaffordable, saving and maximum-level states disable buying.
- The battle HUD and simulation share the rate helper. Whole-food payouts and the 15-food cap remain intact. Existing saved food upgrade levels now use the 0.02 increment.
- TypeScript and all 35 tests pass, including repeated purchases, saved rates, exact 50-second battle income, affordability, the level limit and power-curve price growth.
- Android release rebuilt and installed. Verified normal and compact layouts, all army stats visible, the current 0.52/s rate, disabled 153-coin purchase with a 65-coin balance, and scrolling to the expensive end. Coins, unlocks and army were preserved. Screenshots: `artifacts/food-upgrades.png` and `artifacts/food-upgrades-small.png`.

## Shared unit balance formula

- Every unit is generated by `defineUnit` with a food budget and role profile. HP and DPS trade off; cooldown supplies damage per hit, while range and movement consume power. Coins scale nonlinearly with food cost. See `UNIT_BALANCE.md`.
- Puncher is a high-HP tank; Spear Thrower is a fragile ranged damage dealer. Units are no longer required to have monotonically increasing HP or per-hit damage. Current stats/prices are in `artifacts/unit-balance-report.md`; older expansion notes below record the previous manual values.
- TypeScript and all 33 tests pass. The balance checks cover 180 tier/profile/range combinations, normalized power, unlock prices, invalid inputs, 56 equal-food fights with reversed attack priorities, and tank/glass-cannon teamwork. Every roster unit has both a winning matchup and a counter in the tested setup.
- `npm run balance` regenerates the report after future roster changes. Starter mixed-army battles still win in the six seeded simulations, within 45–180 seconds. Ownership, coins, saved slots and previously purchased bonuses persist through rebalancing.
- Android release rebuilt and installed. Verified generated prices in the roster and 1043-HP/35-hit Puncher versus 154-HP/123-hit Spear Thrower without clipping; existing 65 coins and Clubman army remained intact. No runtime errors observed. Screenshot: `artifacts/unit-balance-in-game.png`.

- Unit-list jump controls: a small up circle appears at the list's top when more expensive units are above, and a down circle at its bottom when cheaper units are below. Both appear mid-list. Tapping jumps to that end; the corresponding arrow hides when reached. Neither appears when the list fits without scrolling.
- Jump icons use centered vector chevrons (^ / v), with cream rounded strokes matching the army X controls. No vertical arrow stem or text baseline affects alignment.
- Emulator-verified up-only at the cheapest end, jump to Swordsman with down-only at the expensive end, both arrows mid-list, and down jump back to the cheapest end. TypeScript and Android release build pass. Screenshots: `artifacts/scroll-arrows-bottom.png` and `artifacts/scroll-arrows-top.png`.

## Expanded unit roster

- Five new units start locked in new and existing saves: Axeman (300 coins / 4 food / 180 HP / 30 damage), Axe Thrower (400 / 5 / 200 / 35), Spear Thrower (500 / 6 / 220 / 40), Puncher (600 / 7 / 240 / 45), Swordsman (700 / 8 / 260 / 50).
- All share the simple character model, with distinct weapon art in portraits and battle. Puncher uses bare fists; axes spin in flight; thrown spears follow their trajectory. Melee units can pass all ranged support types at the cave exit.
- Roster remains sorted cheapest at the bottom; scroll upward through increasingly expensive unlocks. Existing saves retain their unlocks, coins, bonuses and army; no new unit is automatically unlocked or equipped.
- Advanced enemy unit types enter AI choices only after the player owns them. Starting enemy choices and weights are unchanged.
- TypeScript and all 26 tests pass, including unlock/equip/save/deployment for every new unit, projectile flight and damage, melee damage, support-row passing, enemy gating, and replacement with a fourth owned unit.
- Android release rebuilt and installed. Visually verified all five locked portraits, scrolling from cheapest to most expensive, and the Puncher's 600-coin popup with bare fists. No runtime errors observed; no coins spent or unlocks changed. Screenshots: `artifacts/new-units-start.png`, `artifacts/new-units-top.png`, `artifacts/new-puncher-popup.png`.

- Buttons use a subtle 6-point corner radius; unit cards, army slots and dialogs use 8 points. Circular red X controls remain round, and the bottom menu remains two full-width halves.

- Clubman artwork restored to the original simple character and club in battles and all portraits. The generated sprite atlas is no longer loaded by the game.

## Unit roster and three-slot army

- No age badge or Stone Age/tribe headings. Header shows coins and the page title.
- Top half scrolls independently, cheapest at the bottom. Full-width tappable rows show portrait, damage over health, coin price over food cost; no unit names or separate action buttons. A gray overlay fades the entire locked row, including artwork, stats and icons.
- Selecting an owned unit opens a portrait popup with red Cancel on the left and blue Use on the right. Selecting a locked unit shows its coin price at the top with red Cancel and blue Unlock. Unaffordable units can be inspected, but Unlock is disabled. Confirmation closes only after saving succeeds; failure leaves the popup available for retry. Cancel and Android Back dismiss without changing ownership or army slots.
- Emulator-verified full-width rows, faded locked stats/icons, coin price and disabled unaffordable Unlock, Cancel dismissal, and successful Use confirmation into an empty slot. Original army restored after testing. Screenshots: `artifacts/unit-selection.png`, `artifacts/unit-use-popup.png`, and `artifacts/unit-unlock-popup.png`.
- Three army slots sit near the bottom menu with portraits, stats, and food costs. Equipped portraits have a circular red X in the top-right corner; empty slots have no X. Removal returns an owned unit to the roster. Use fills the first hole, or shifts a full army left and puts the new unit on the right. Duplicate equipped units are prevented.
- Only equipped, owned units can deploy. Empty slots remain in place in the deployment bar. FIGHT! with an empty army opens Upgrades.
- Old saves retain coins and bonuses and equip their first three owned units. Slot gaps, order, and an empty army survive save/reload.
- TypeScript and all 19 tests pass, including migration, validation, replacement, ownership, removal/reuse and deployment restrictions.
- Android release rebuilt and installed. Verified the normal and compact layouts, lock affordability states, removal and reuse without coin changes, empty-army and equipped-army persistence after cold launch, empty-army FIGHT! routing, and exactly one equipped deployment control plus two empty slots in battle. No runtime errors observed. Screenshots: `artifacts/army-builder.png` and `artifacts/army-builder-small.png`.

## Earlier redesign checks

## Caveman sprite integration

- Clubmen on both teams use the illustrated caveman atlas; player faces right and enemy faces left, with mint/coral ground markers.
- Deployment and upgrade portraits use the same idle sprite. Windup, strike and recovery follow the existing attack cooldown; damage and unit stats are unchanged.
- TypeScript and all 13 simulation/progression tests pass. Android release APK rebuilt for arm64-v8a and x86_64 and installed on the API 37 emulator. Verified deployment portrait, player deployment, enemy rendering, and combat without React Native or Android runtime errors.
- In-game screenshot: `artifacts/caveman-in-game.png`. Sprite atlas and original generation prompt: `assets/units/`.

- Cold launch opens the battlefield with a red rectangular FIGHT! button centered in the play area, 176 wide by 88 tall, with sharp corners. Tapping it starts combat and hides the button. Bottom Battle/Upgrades tabs span the full width in two equal halves, with a center divider and a slightly darker selected half; there are no inset rounded tab buttons.
- Both caves are half offscreen. Health bars and numbers sit at the caves; no tribe health is shown in the header.
- Currency uses yellow coin icons; food uses meat icons with whole amounts.
- A fresh save has only the Clubman. Locked unit prices are visible in Upgrades; unaffordable purchase buttons are disabled.
- Unlock a Spearman for 100, cold launch again, and verify it remains unlocked and can deploy in the next battle. Duplicate unlock purchases must not charge again.
- Check production, attack, and health upgrade purchases and persistence.
- Bottom navigation disappears during combat, including while paused. Leave battle restores navigation; backgrounding the app opens the pause dialog on return.
- On victory/defeat, verify the centered reward popup overlays the battlefield and saves 100/25 exactly once. Continue returns to the battlefield home. Verify retry on save failure and no duplicate reward on retry/close.
- Check short and tall portrait screens for clipping, troop card visibility, and scrollable upgrades.

## Automated checks for the redesign

- Strict TypeScript check passes.
- All 13 tests pass, including new-save unit restrictions, unlock purchases, persistence, duplicate purchase prevention, and legacy save migration.

## Emulator verification for the redesign

- Final release APK rebuilt for arm64-v8a and x86_64, installed, and cold launched on Android API 37.
- Checked the battlefield home, bottom icon tabs, half-cropped caves, local health bars with numbers below, and icon-based food and prices at 1080 × 2400.
- Migrated the existing test save, purchased Spearman for 100 (365 → 265), cold launched, and verified Spearman still unlocked and its deployment card available.
- Finished a defeat and verified a centered Collected popup with the yellow coin icon and +25. Balance became 290, stayed 290 after Continue and cold launch, and the Spearman unlock remained saved.
- Checked the reward popup and scrollable unlock screen at 900 × 1600, then restored the emulator resolution.
- Deployed the purchased Spearman in the final build. Switching to Upgrades held food at 13 while the battle was hidden; returning resumed the same battle with the troop still present. Left the test battle paused.
- Screenshots: artifacts/redesign-home.png, artifacts/redesign-upgrades.png, artifacts/redesign-battle.png, artifacts/redesign-reward.png, and artifacts/redesign-small-upgrades.png.
- Storage-failure retry is retained; forced storage failures were not manually injected in this pass.

The following sections are historical notes for earlier builds; their older layouts and values are superseded by the checks above.

# Device acceptance checks

Run these on a portrait emulator or physical Android phone. Progress lives in AsyncStorage under `warling-rush.progress.v1`.

- Start a battle: food reads 2; Clubman and Spearman are affordable; Rock Thrower is disabled.
- Deploy a Clubman: food immediately drops by 1. Deploy a Spearman after saving 2. Deploy a Rock Thrower after saving 3. Verify each silhouette and ranged rock travel.
- Verify the rival waits five seconds, spends its own food, and eventually fields all three troop types across repeated battles.
- Watch melee stop to fight, attack with cooldowns, display hit particles and health bars, and fall/disappear on death. Check troop spacing with a crowded frontline.
- Destroy the rival base. Verify victory, +100 coins, Replay, Menu, and Camp upgrades. Leave the player idle in another battle to verify defeat and +25 coins.
- Pause for ten seconds: food, positions, and base health must stay fixed. Resume, restart, and return to the menu. Put the app in the background and reopen: it should be paused without catching up missed time.
- Buy each upgrade. Verify the balance and level change once, costs increase, insufficient funds disable purchase, and the next battle reflects the bonus.
- Force-stop and reopen after a completed save. Verify coins and upgrade levels remain. Cold launch goes to the menu.
- Check the menu, battle, pause dialog, upgrades, and both results on a small portrait phone and a tablet. No controls should be hidden behind cutouts or system navigation.
- Profile an army near the unit cap using Android Studio; confirm frame rate on the target phone. The 60 FPS goal is a target until measured on hardware.

## Stone Age cave bases

- Both bases now use a rock mound, a dark cave opening, and a painted tribe mark.
- Team health bars remain below the caves.
- TypeScript check and Android release build pass. Rebuilt APK installed and cave bases visually verified in the portrait battle screen on the emulator. Screenshot: `artifacts/stone-age-caves.png`.

## Whole-number food economy

- Unit costs are 1, 2, and 3 food. Starting food is 2 and capacity is 15.
- Base production is 1 food every 2 seconds; production upgrades add 1 food per 20 seconds. Rival food production and starting food are also scaled down by 10.
- Both sides receive whole food payouts; HUD and upgrade labels use whole numbers.
- TypeScript and all 12 tests pass, including whole payouts at upgraded rates and at the cap.

## Minimal character model correction

- Bare base is exactly a round head, oval body, and one eye. Hands, feet, collar, pouch, and limb animation have been removed.
- Stone Age weapons draw in a separate equipment function over the shared base.
- TypeScript and the Android release build pass.
- `artifacts/character-models.png` shows the bare base and all three weapon overlays, rendered from the drawing functions.

## Portrait art and layout update

- TypeScript check and all 11 simulation/progression tests pass.
- Expo and the Android activity now both request portrait orientation.
- The path runs horizontally across the center of the field, matching the portrait reference. Heads, bodies, buildings, and scenery use uniform scaling.
- Menu, upgrades, results, pause dialog, and deployment controls now stack or wrap for portrait screens.
- Release APK rebuilt successfully for arm64-v8a and x86_64 and installed on the Android API 37 emulator.
- Visually checked the portrait menu, centered battlefield, all three troop portraits, deployment of all three troop types, pause/resume/menu controls, and stacked upgrades at 1080 × 2400.
- Screenshots: `artifacts/portrait-menu.png`, `artifacts/portrait-battle.png`, `artifacts/portrait-pause.png`, and `artifacts/portrait-upgrades.png`.
- Earlier device results below describe the original landscape build.

## Previous automated results

- Strict TypeScript check: passed.
- Simulation/progression suite: passed (see `npm test`).
- Expo native dependency compatibility: passed.
- Android native project generation: passed.
- Metro + Hermes Android export: passed.
- Six seeded mixed-army balance runs: player victories within the requested 1–3 minute window with no permanent upgrades.

Native debug build succeeded with JDK 17 and installed/launched on the Medium Phone API 37 emulator. The Android Studio JBR 25 runtime failed native CMake/Prefab configuration; switching only the build process to the cached JDK 17 resolved it.

Visually verified on the landscape emulator: main menu, battlefield, all three touch deployment controls, food spending/regeneration, enemy troop production, melee/ranged combat, projectiles, health bars, hit/death feedback, pause, and restart. The pause check held food at 114 and battle time at 0:36 while the dialog was open. The restarted battle began without troops and the base subsequently took damage from the rival army.

Also verified on the emulator: repeatable defeat results, exactly 25 coins per completed loss, upgrade purchase (75 coins → 15 coins, Food Production level 0 → 1, next price 60 → 93), and cold-launch persistence of the 15-coin balance, level-1 food upgrade, and three completed battles. A new battle displayed the upgraded 5.5 food/s generation rate.

The release APK also built successfully for arm64-v8a and x86_64 (about 63.5 MiB). Installed it over the debug build, stopped Metro, removed ADB's port-8081 reverse mapping, and cold-launched successfully with the embedded game bundle. Verified a battle, troop deployment, enemy attacks/base damage, and automatic pause after going Home and returning in this standalone build. Progress survived the debug-to-release installation. The emulator currently retains the test profile (40 coins, Food Production level 1, four completed losses); a fresh install starts with no upgrades and no coins.

Remaining device checks: physical-device frame-rate profiling. Victory conditions and reward calculation are covered by the deterministic simulation and progression tests; a complete manual victory remains a recommended acceptance check.



## Wheeled Cannon unit (October 23, 2026)

- Added the locked 12-food Cannon: 1,775 coins, 522 base HP, 309 damage per shot, 2-second reload and 260 range, using the shared stat formula.
- Verified purchase, equip, food affordability, deployment and save round trips through the expanded new-unit tests. Cannon-specific combat checks cover muzzle origin, projectile travel, single-target damage, reload timing and permanent bonuses.
- `npm run typecheck` passed; `npm test` passed all 72 tests. `npm run balance` passed the twelve-unit roster's progression and 132 equal-food matchups; Cannon has wins and counters.
- `node scripts/render-cannon.cjs` generated `artifacts/cannon.png` and both 72x64 portrait poses. Visually inspected the actual Skia output for wheel/barrel geometry, recoil, flash, portrait clipping and battlefield scale.
- Android Hermes export passed to `artifacts/cannon-export` with TEMP/TMP directed to the writable workspace. The initial attempt could not write Hermes bytecode in the sandbox system temp directory.
- No native APK rebuild or device touch-input check was performed for this change.

### Cannon APK preview rebuild

Rebuilt `android/app/build/outputs/apk/release/app-release.apk` after the Cannon addition with `:app:assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64`. Gradle completed successfully; the updated offline APK is 68,341,853 bytes and supports ARM64 phones and x86-64 emulators. No device install or launch was performed. The standing preference to rebuild the APK after every unit change is recorded in `AGENTS.md`.

## Shark and faster testing food (October 23, 2026)

- Added Shark, a 13-food balanced melee unit with 786 HP, 111 damage per bite, 0.85-second attack interval and 35 range. Unlock costs 1,975 coins from the shared formula. Its procedural model has a forked tail, dorsal fin, gills, pale belly and animated toothed jaws; shop and battle share the model.
- Raised base food production from 0.5/s to 5/s for easier testing. Saved bonuses still add 0.02/s per level, and food remains whole-numbered with a cap of 15.
- `npm run typecheck` and all 73 tests passed, including Shark approach/range, direct single-target bites, reload timing, no projectiles, purchase/equip/save, five-food-per-second income, cap and upgrade production checks.
- `npm run balance` generated the thirteen-unit report with 156 equal-food fights; Shark has both wins and counters. Inspected `artifacts/shark.png` and both portrait poses from the actual Skia renderer.
- Release APK rebuilt successfully for ARM64 and x86-64 at `android/app/build/outputs/apk/release/app-release.apk` (68,343,597 bytes). Installed with `adb install -r` on emulator-5554, launched, and preserved app data.
- Used existing test unlocks and replaced Spearman in slot 1 with Shark, keeping Cannon and Basketball Player. Native UI confirms Shark equipped and 5.04/s production including the saved two upgrade levels. Screenshot: `artifacts/shark-emulator.png`.

## Tiger eye-laser unit (October 23, 2026)

- Added the next roster tier: Tiger, 14 food, 2,175 coins, 611 HP and 163 total volley damage every 0.9 seconds, with 200 range and shared stat scaling.
- Procedural orange tiger has black stripes, four paws, curled tail and glowing red eyes. Twin straight red laser pulses originate at separate eye positions and each carries half the volley damage. Lasers deal damage after traveling and hit one enemy without splash.
- `npm run typecheck` and all 74 tests passed. Coverage includes both eye origins, launch lane, damage budget, travel, reload, ranged formation passing and normal purchase/equip/save behavior. `npm run balance` generated 182 equal-food matchups; Tiger has wins and counters.
- `node scripts/render-tiger.cjs` generated `artifacts/tiger.png` and 72x64 idle/firing portraits. Visually inspected the actual Skia output for recognizable tiger features, portrait framing and straight red eye rays.
- Release APK rebuilt successfully for ARM64/x86-64 (68,346,633 bytes), installed with `adb install -r` on emulator-5554, and launched with saved progress intact.
- Existing test control unlocked Tiger. Replaced Basketball Player in slot 3, leaving Shark and Cannon equipped. Native UI confirms Tiger in slot 3 and the existing 5.04/s production. Screenshot: `artifacts/tiger-emulator.png`.

## Cyborg Walrus tusk melee unit (October 23, 2026)

- Added the fifteenth roster tier: Cyborg Walrus, 15 food, 2,375 coins, 1,662 HP and 107 damage every 1.25 seconds, with 40 melee range and the shared tank profile.
- Model has a rounded brown body, flippers, whiskers, two long ivory tusks, half a plated metal head and exactly one glowing red cybernetic eye alongside its natural eye. Head and tusks lunge forward during melee attacks. Damage applies to one target with no projectiles. The taller health bar clears the head.
- `npm run typecheck` and all 75 tests passed. Tests cover movement into tusk range, single-target hits, reload timing, no projectiles, food affordability and purchase/equip/save. `npm run balance` produced the fifteen-unit report and 210 equal-food matchups; Walrus has wins and counters.
- Generated and visually inspected actual Skia idle/attack artwork and 72x64 portraits using `node scripts/render-walrus.cjs`: `artifacts/cyborgWalrus.png`.
- Release APK rebuilt successfully for ARM64/x86-64 (68,349,217 bytes), installed with `adb install -r` on emulator-5554 and launched while preserving saved progress.
- Used the existing test unlock control and replaced Cannon in slot 2 with Cyborg Walrus, keeping Shark and Tiger equipped. Verified native UI and `artifacts/walrus-emulator.png`; production remains 5.04/s including saved bonuses.

## Remove visible unit names from battle (October 23, 2026)

Removed the unit-name text and its style from deployment cards, leaving portraits and food cost. Successful deployment feedback now says only "Unit deployed". Descriptive screen-reader labels are preserved. Recorded the user's preference in AGENTS.md. Typecheck and the ARM64/x86-64 release APK rebuild passed. Installed the corrected APK on emulator-5554 with app data preserved and launched it.

## Mafia Tommy-gun unit (October 23, 2026)

- Added Mafia with a dark pinstripe suit, white shirt, red tie, fedora and a Tommy gun with wooden furniture, finned barrel and round drum. Recoil, muzzle flash and bullet visuals share the battle/portrait model.
- New tier costs 16 food and 2,575 coins, with 716 HP and 42 damage per bullet every 0.2 seconds at 175 range. Increased the shared food cap/maximum supported budget to 16 so the unit is deployable. Base production stays 5/s plus existing bonuses.
- Typecheck and all 76 tests passed. Mafia checks cover fast individual shots, travel before impact, muzzle origin, shot interval and no splash. Existing generic tests cover purchase, equip, food affordability, serialization and melee passing ranged support. Updated cap-bound checks and the leftover-food expectation for the new cap.
- Balance report covers 16 units and 240 equal-food fights. Mafia has both wins and counters. Visually inspected `artifacts/mafia.png` and the 72x64 idle/firing portraits generated with `node scripts/render-mafia.cjs`.
- Rebuilt the offline ARM64/x86-64 APK (68,352,061 bytes), installed with `adb install -r` on emulator-5554 and launched with saved progress preserved.
- Used the existing testing unlock and replaced Shark in slot 1 with Mafia, keeping Cyborg Walrus and Tiger. Native UI confirms Mafia equipped and production 5.04/s; screenshot `artifacts/mafia-emulator.png`. Battle-screen visible name labels remain removed.

## Rapper musical-note unit (October 23, 2026)

- Added Rapper with oversized gold-rimmed designer sunglasses, purple clothes, gold chain with a dollar-sign medallion and a silver microphone. Vocal attacks open his mouth and pulse from the microphone; a bright pink connected musical note travels to the enemy and deals one hit.
- New tier costs 17 food and 2,775 coins, with 996 HP and 183 damage every 1.1 seconds at 185 range. Raised the shared food cap/maximum budget to 17 to keep it deployable. Production stays 5/s plus saved bonuses; battle cards keep only portraits and food costs.
- Typecheck and all 77 tests passed. Added ranged note travel, mic origin, launch height/lane, damage, cooldown and no-splash checks; existing tests cover purchase/equip/deploy/save and ranged support formations. After adding explicit mic height/lane assertions, reran and passed the Rapper test.
- `npm run balance` generated 272 equal-food fights across 17 units; Rapper has wins and counters. Generated and visually inspected `artifacts/rapper.png` and both 72x64 portraits using `node scripts/render-rapper.cjs`.
- ARM64/x86-64 release APK rebuilt successfully (68,355,777 bytes), installed with `adb install -r` on emulator-5554, and launched with saved progress preserved.
- Used the testing unlock and equipped Rapper in slot 3 in place of Tiger, keeping Mafia and Cyborg Walrus. Native UI confirms the army and saved 5.04/s production; inspected screenshot `artifacts/rapper-emulator.png`.

## Barbarian reference-based double-axe melee unit (October 23, 2026)

- Added Barbarian using the supplied pixel-art warrior as a visual reference, translated into the game's procedural style: long brown hair, rugged scarred face, muscular bare torso, ragged leather loincloth, wraps, boots and a huge double-headed crescent axe with a long wooden haft.
- Axe raises with both hands during the melee attack; no projectiles or splash. New tier costs 18 food and 3,000 coins, with 778 HP and 323 damage every 1.4 seconds at 45 range. Raised the shared maximum food budget/cap to 18 so deployment remains possible. Food production and saved bonuses are preserved.
- Typecheck and all 78 tests passed, including melee approach, single-target axe damage, attack interval and no projectiles. Generic unit checks cover unlocking, equipping, affordability and save round trips. The 18-unit balance report includes 306 equal-food fights with wins and counters for Barbarian.
- Generated and inspected `artifacts/barbarian.png` plus 72x64 idle/swinging portraits. Preview framing includes the entire raised axe; the health bar sits above the weapon's arc.
- ARM64/x86-64 release APK rebuilt successfully (68,359,325 bytes), installed with `adb install -r` on emulator-5554 and launched without clearing app data.
- Used the existing testing unlock, replaced Cyborg Walrus in slot 2 with Barbarian and kept Mafia and Rapper. Verified native army state and inspected `artifacts/barbarian-emulator.png`. Production remains 5.04/s with existing bonuses; visible battle unit names stay removed.

## Space Marine reference-based armored ranged unit (October 23, 2026)

- Added Space Marine based on the supplied blue armored reference: huge blue shoulder plates, enclosed metal helmet with orange visor, chest plating, power pack, broad armored legs and steel-soled boots. He braces a large two-handed rifle with recoil and muzzle flash.
- New tier costs 19 food and 3,200 coins, with 1,079 HP and 81 damage per bullet every 0.45 seconds at 200 range. Raised the shared maximum food budget/cap to 19 for deployability. Production stays 5/s plus saved bonuses; no visible battle name labels.
- Typecheck and all 79 tests passed. Space Marine checks cover bullet travel before impact, muzzle origin/height, cadence and single-target damage. Generic tests verify unlock/equip/affordability/save and ranged formations. The balance report covers 19 units and 342 equal-food fights; Marine has wins and counters.
- Generated and visually inspected `artifacts/spaceMarine.png` and both 72x64 portraits with `node scripts/render-space-marine.cjs` for armor silhouette, visor, rifle and framing.
- ARM64/x86-64 release APK rebuilt successfully (68,363,477 bytes), installed with `adb install -r` on emulator-5554 and launched while preserving saved progress.
- Used existing testing unlocks and replaced Mafia in slot 1 with Space Marine, keeping Barbarian and Rapper. Native UI confirms the army and unchanged 5.04/s saved production; inspected `artifacts/space-marine-emulator.png`.

## Mallard Duck melee peck unit (October 23, 2026)

- Added Mallard Duck with a green head, white neck ring, brown chest, gray feathered body, blue wing patch, orange bill and two orange webbed feet. Feet alternate while waddling; the neck/head lunges and the bill snaps during pecks.
- New tier costs 20 food and 3,425 coins, with 1,125 HP and 103 damage every 0.55 seconds at 30 melee range. The attack hits one enemy and produces no projectile or splash. Raised shared maximum food budget/cap to 20; base production remains 5/s plus saved upgrades.
- Typecheck and all 80 tests passed, including melee approach, peck timing, single-target damage, no projectiles, unlock/equip/deploy/save, food cap and progression. The 20-unit balance report includes 380 equal-food fights with wins and counters for Duck.
- Generated and inspected `artifacts/duck.png` and 72x64 idle/pecking portraits using `node scripts/render-duck.cjs` for mallard colors, bill animation, webbed feet and framing.
- Rebuilt ARM64/x86-64 release APK successfully (68,365,645 bytes), installed with `adb install -r` on emulator-5554 and launched with saved progress preserved.
- Used existing testing unlocks and equipped Mallard Duck in slot 3 in place of Rapper, keeping Space Marine and Barbarian. Verified native army state and inspected `artifacts/duck-emulator.png`. Production stays 5.04/s with saved bonuses, and visible battle unit-name labels remain removed.

## Melee weapon contact and opposing body overlap fix (October 23, 2026)

- Root cause: melee used small center-to-center blueprint ranges while unit artwork was rendered at 1.4 scale. Ordinary target body widths were not included, so bodies could substantially overlap before an attack began.
- Added `src/game/geometry.ts` with model body-front extents and animated melee-tip reach for each melee troop, slime and melee boss. Renderer and simulation share `BATTLE_UNIT_SCALE`; boss extents also apply the boss's 3x model scale. Melee contact uses weapon reach plus target body front minus three model pixels (4.2 battlefield units) of allowed overlap.
- Movement is capped at opposing body contact across formation lanes. Target selection uses nearest body edge, so a large boss intercepts troops before smaller enemies behind its edge. Boss cleave uses the same physical reach. Normal ranged distance and projectile timing remain unchanged, with a body-contact floor for large targets.
- Existing unit stats, costs, cooldowns, food production, ownership, army and progression are preserved. Blueprint melee range remains an input to stat budgeting; physical contact uses artwork geometry.
- Typecheck and all 86 tests passed. Six new regression cases cover every player melee kind from both directions, weapon/body-edge contact with only slight overlap, short versus long weapons, a just-out-of-reach target, large movement steps with long cooldowns, full boss size and a boss blocking a smaller enemy. Updated earlier melee approach tests to use physical contact distances.
- `npm run balance` regenerated the 380 equal-food matchup report; every unit still has wins and counters. No stat tuning was needed.
- `node scripts/render-melee-contact.cjs` generated `artifacts/melee-contact.png`. Visually inspected the actual Skia weapon-contact poses for Clubman, Spearman, Axeman, Puncher, Swordsman, Shark, Cyborg Walrus, Barbarian, Duck and Slime Bruiser. Troop bodies are separated while the attack reaches the enemy edge.
- Rebuilt the offline ARM64/x86-64 APK successfully (68,367,613 bytes), installed with `adb install -r` on emulator-5554 and launched with app data preserved. Verified the native ready screen; no automated native battle was played for this change.

## Per-enemy kill coins (October 24, 2026)

- Removed the flat 100-coin victory and 25-coin defeat awards. Normal enemies award 10 coins each on waves 1-5, with +1 coin per kill every five waves. Boss kills award the equivalent of the normal enemy army for their wave.
- Award coins at lethal damage, once per enemy, across melee and all projectile damage. Track kills and cumulative earnings in the battle world. The result popup summarizes those earnings and records the outcome without paying a second reward.
- Update the coin counter and save cumulative earnings during combat. Final and leave saves wait for in-flight coin saves; retries use the battle's starting balance to avoid double credit. Backgrounding flushes pending earnings. Leaving retains coins without advancing the wave or recording a completed attempt; failed leave saves keep the battle paused with a retry message.
- Typecheck and all 92 tests passed. New tests cover gradual scaling, boss rewards, partial versus lethal damage, repeated damage to a dead enemy, melee/projectile kills, player and bunker deaths, zero-kill outcomes, loss retention, cumulative snapshots and save round trips.
- Rebuilt ARM64/x86-64 offline release APK successfully (68,370,569 bytes), installed with adb install -r on emulator-5554 and launched with saved data preserved.
- Native preview started at Wave 9 with 187 coins. Space Marine and Duck defeated eight enemies for 88 coins, producing a 275 balance. Leaving retained 275 at Wave 9; force-stop/relaunch retained the same balance. A second battle left with zero kills also retained 275. Game left open on the ready screen. Inspected artifacts/kill-coins-preview.png for the live counter and battle presentation.

## MiG-17 missile jet (October 24, 2026)

- Added a silver MiG-17 with a blunt circular nose intake, blue cockpit, swept wings, tall tail, red identification stripes, underwing missile and animated orange exhaust. It flies low above its ground shadow and fires one descending missile per attack, with ignition animation and impact-only single-target damage.
- New tier costs 21 food and 3,650 coins; shared formula supplies 861 HP and 459 missile damage every 1.8 seconds at 230 range. Raised the maximum food budget/cap to 21. Set geometry body-front extent to match the jet nose; missile launch offsets also support mirrored combat without changing Mech's twin-pod behavior.
- Typecheck and all 93 tests passed. New missile test checks single launch, pylon position/height/lane, travel before damage, full attack budget, reload and no splash; existing generic tests cover unlock/equip/deploy/save. The balance report covers 420 equal-food fights across 21 units, with 26 wins and 14 counters for MiG-17.
- Generated and visually inspected artifacts/mig17.png plus idle/firing 72x64 portraits. Inspected artifacts/mig17-emulator.png for actual battlefield height, flat nose silhouette and deployment portrait. Native deployment worked at 21 food, and a missile kill increased the Wave 9 coin balance from 275 to 286 during the preview.
- A concurrent build/test attempt exhausted system memory. Reran all tests with test-concurrency=1 and built separately with two Gradle workers; both succeeded. Rebuilt offline ARM64/x86-64 release APK is 68,374,077 bytes, installed with adb install -r and launched on emulator-5554 without clearing app data.
- Used the existing test unlock control and equipped MiG-17. Native army is Barbarian, Mallard Duck and MiG-17; saved production stays 5.04/s. Left the native battle preview paused for inspection/resume. Visible battle unit names remain removed.

## Gundam-style blue beam sword warrior (October 24, 2026)

- Added Gundam Warrior inspired by the supplied robot reference: broad blue shoulder armor, white faceplate and articulated leg armor, blue gauntlets/boots, gold V-fin crest and chest vents, cyan visor and dark backpack. A glowing blue beam sword sweeps from raised guard to a forward cut; it is a melee-only single-target attack with no projectile.
- New tier costs 22 food and 3,850 coins, with 1,209 HP and 232 damage every 1.15 seconds. Raised the shared maximum food budget/cap to 22. Geometry tracks the robot's 37-model-unit body front and blue blade's 88-unit animated edge; shared battlefield scale preserves contact without overlapping bodies.
- Typecheck and all 94 tests passed. Added melee approach, single-target sword damage, cooldown and no-projectile checks; generic unlock/equip/deploy/save tests include the new unit. Added Gundam to the contact regression loop and reran all six contact tests, including first contact in both directions. Balance report covers 462 equal-food fights across 22 units; Warrior has 21 wins and 21 counters.
- Generated and visually inspected artifacts/gundam.png and idle/swinging 72x64 portraits. Rebuilt ARM64/x86-64 offline release successfully (68,378,705 bytes), installed with adb install -r and launched on emulator-5554 with saved progress preserved.
- Used the test unlock control and equipped the warrior; native army is Mallard Duck, MiG-17 and Gundam Warrior. Saved food production remains 5.04/s. Confirmed 22-food deployment and inspected artifacts/gundam-emulator.png for the native blue sword, armor colors and portrait. Visible battle names remain removed.
- Native melee preview defeated five enemies, increasing Wave 10 coins from 550 to 605. Inspected artifacts/gundam-contact-emulator.png for separated bodies near sword range; left the preview battle paused for inspection/resume.

## Remove five pictured starter-style units (October 24, 2026)

- Removed Axeman, Axe Thrower, Spear Thrower, Puncher and Swordsman from the active roster, collection colors, unit art dispatch and body/weapon geometry. Kept Spearman and Barbarian because they were not among the pictured cards. Remaining unit stats, prices and food production are unchanged.
- Local save decoding recognizes the five retired identifiers only for migration: it strips their unlock entries and clears their equipped slots while preserving coins, upgrades, wins, attempts, wave and surviving army order. A previously equipped army consisting entirely of retired units receives Clubman in slot 1; intentionally empty armies stay empty. Unknown, duplicate and unowned save entries still fail validation.
- Typecheck and all 95 tests passed. Added four retirement/migration tests; removed combat assertions for deleted units and updated general army/formation checks to use surviving units. Rebuilt the balance report for 17 units and 272 equal-food fights; all remaining units still have wins and counters. Updated roster documentation and preview/report scripts to remove retired-unit references.
- Rebuilt the ARM64/x86-64 offline release APK successfully (68,377,565 bytes), installed with adb install -r and launched on emulator-5554. Native collection now goes directly from Rock Thrower (3 food) to Mech (9 food), with all five removed cards absent. Inspected artifacts/retired-units-emulator.png. The save loaded with 704 coins, 5.04/s production and the existing Mallard Duck/MiG-17/Gundam Warrior army intact. Left Upgrades open so the updated collection is visible.

## Skeleton King green-sword melee unit (October 24, 2026)

- Added Skeleton King with a clearly skeletal ivory skull, black eye sockets, glowing green eyes, visible teeth and nasal cavity, exposed rib cage, spine, pelvis and bone limbs. A jeweled gold crown and torn purple cloak give it a royal silhouette. Its green glowing sword sweeps from a raised guard into a forward single-target melee cut; there is no projectile or splash.
- New tier costs 23 food and 4,075 coins, with 955 HP and 368 damage every 1.3 seconds. Raised the shared maximum food budget/cap to 23. Geometry tracks a 32-model-unit body front and 82-unit animated green blade edge; contact accounts for the shared 1.4 battlefield scale.
- Typecheck and all 96 tests passed. Added approach, hit, cooldown, no-projectile and single-target checks; generic unlock/equip/deploy/save coverage includes the King. Contact regressions include it from both directions, keeping bodies separate. The 18-unit balance report covers 306 equal-food fights; Skeleton King has 10 wins and 24 counters.
- Generated and visually inspected artifacts/skeletonKing.png and idle/swinging 72x64 portraits. Portrait framing includes the crown, raised blade and bone feet.
- Rebuilt the offline ARM64/x86-64 APK successfully (68,381,741 bytes), installed with adb install -r and launched on emulator-5554 while preserving saved data. Used the existing testing unlock and equipped Skeleton King; native army is MiG-17, Gundam Warrior and Skeleton King, with saved food production still 5.04/s. Confirmed native 23-food deployment and captured artifacts/skeleton-king-emulator.png. Battle cards continue to show portraits and food costs only.
- Inspected artifacts/skeleton-king-contact-emulator.png during native melee combat: the King and enemies remain separated at sword range and kills increase coins normally (704 to at least 770 during preview). Left the battle paused for inspection/resume.

## Reference-based Dark Mage and ranged fire spell (October 24, 2026)

- Added Dark Mage following the supplied gold pointed-hat and blue-robe reference, with a completely shadowed face, glowing gold eyes, bent hat tip, cyan robe folds/hem, and a gnarled wooden staff with an amber fire orb. Casting ignites the staff and sends an orange/yellow fireball with flickering trailing flames toward one enemy.
- New tier costs 24 food and 4,300 coins, with 716 HP and 552 damage every 1.4 seconds at 200 range. Raised the shared maximum food budget/cap to 24. Fireballs carry staff-tip horizontal/vertical offsets and launch lane, travel before dealing one hit, and do not splash. Body-front geometry follows the robe/hat outline.
- Typecheck and all 97 tests passed, including fireball origin/height/lane, delayed impact, damage, cooldown, no splash and ranged classification. Existing generic tests cover unlock/equip/deploy/save, while retired-unit migration remains covered. Generated the exact native Skia art and 72x64 idle/casting portraits with scripts/render-dark-mage.cjs and inspected artifacts/darkMage.png.
- Regenerated the 19-unit balance report with 342 equal-food fights; Dark Mage has 17 wins and 19 counters. Updated the preview scene to show a fireball in flight from the staff and visually checked the casting burst, flame trail, target direction and complete hat/robe portrait framing.
