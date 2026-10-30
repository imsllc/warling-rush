# Unit changes

Keep visible unit names off the battle screen. Deployment cards show the unit portrait and food cost only; preserve descriptive accessibility labels for screen readers.

Melee attacks must contact the enemy at the animated weapon edge, without requiring overlapping troop bodies. Keep model body bounds and melee reach in `src/game/geometry.ts` synchronized with unit artwork and its shared battlefield scale.

After adding or changing a unit, rebuild the offline release APK so the user can preview it. This is a standing user preference.

From the repository root, load `scripts/android-env.ps1`, then run `android/gradlew.bat :app:assembleRelease` from `android/`. Preserve ARM64 phone and x86-64 emulator support. Verify the rebuilt file at `android/app/build/outputs/apk/release/app-release.apk` and include its link in the final response.

For local emulator APK previews, add `-PlocalTestSigning=true` to retain compatibility with the installed preview signature. Play Console bundles use `:app:bundleRelease` without this flag and the dedicated upload key in the ignored `android/upload-signing/` folder. Never print or commit private signing credentials, overwrite the upload key, or use debug signing for Play uploads.

When the user's emulator is open, install the rebuilt APK with `adb install -r` and launch `com.warlingrush.app/.MainActivity` so the change is visible there. Preserve app data. For unit previews, equip the new unit in an empty army slot when available; the phone release has no test unlock control.
