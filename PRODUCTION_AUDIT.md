# Production review — October 29, 2026

## Release 20 correction: audio regression and complete warning review

Current target: **1.0.18 / Android code 20**. The release-19 evidence below is historical and does not establish that release 19's audio worked.

The release-19 process log contained a **warning-level** native `ExpoAudio.setAudioModeAsync` failure: its `AudioMode` record conversion threw `NullPointerException`. Because sound-player creation follows that call, every sound stayed disabled. The earlier error-only startup check missed this real regression. MP3 files were present and were not stripped.

The fix preserves Expo audio records, record allocators/annotations and Kotlin reflection under R8. Optimization and resource shrinking remain enabled for the rest of the app. Release verification now checks all three sound files by SHA-256 and rejects renamed audio-reflection classes. No new permissions, artwork, gameplay, balance or `/100` label changes were made.

An explicitly requested local-preview launch test now runs the actual optimized native audio APIs. **All 14 players loaded**, and playback advanced for **click (0.168 s), sword (0.125 s), and throw (0.183 s)** in the verified run. Evidence: `artifacts/audio-smoke-20.log`; its separate `.warnings.log` captures every warning/error from that process. The phone/Play build cannot enable this test through its launch flag. Re-run using `scripts/test-release-audio.ps1` after building a local-signature release APK.

Normal cold startup was then checked separately without the test flag: `Game audio initialized: 14 native players`, no unexpected automatic test playback, and no JS exception/native fatal error. The app remains installed on the emulator with its data preserved. The renderer reported 21 startup frames; its high startup-jank percentage was captured while the same machine was compiling the Play build. That small emulator sample is not a gameplay-performance pass or a physical-phone performance measurement.

The final upload-signed code-20 AAB is **96,432,906 bytes**. All **1,110** signed content entries match the existing upload certificate. It contains the real ad IDs, Billing 9.1.0 metadata, both required 64-bit architectures, original MP3 bytes and preserved audio reflection classes. R8 remains enabled: **2 DEX files / 9,184 renamed classes**; 34 required-ABI native libraries passed 16 KB alignment checks. The bundle and its matching original mapping are preserved under `artifacts/releases/20/`. Verification logs: `artifacts/audio-fix-verification-20.log` and `artifacts/audio-fix-signature-20.log`.

All **143 TypeScript/game tests** passed, including audio overlap, seek/replay, foreground/background transitions and released-player races. Native billing offer tests and release lint passed. The following warning groups were reviewed rather than hidden:

| Warning group | Finding / disposition |
| --- | --- |
| Expo audio record conversion | Real release regression; fixed and verified with actual native loading/playback. |
| React Native generated property setters | Framework source explicitly falls back to `FallbackViewManagerSetter`; `ReactProp`/`ReactPropGroup` methods remain protected by consumer rules. No property-update exception appeared in the checked process. |
| Bridgeless/Catalyst compatibility and ReactHost/SoLoader messages | SDK compatibility/initialization logging. Native audio, billing and ad bridges remain registered; bridge names are checked after R8. |
| Edge-to-edge StatusBar and back callback notices | Existing display/back configuration. No navigation redesign or status-bar behavior change was introduced. |
| x86 CPU variant, Mesa/vendor properties, HWUI/GFXSTREAM, SurfaceTexture, rendernode | Android 37 emulator/graphics-stack notices during app/ad setup. They are retained in the logs; physical-device graphics behavior is not established by an emulator build. |
| Codec max-input-size, component-resource query, loudness annotation and Binder unlink notices | Media3/Android 37 codec diagnostics. Actual native decoding and playback succeeded despite these notices. No recording or Bluetooth permission was added to suppress optional SDK checks. |
| Billing API capability / connection warnings (codes 3 and 5) | This emulator's Play billing service cannot complete checkout. The warning's protocol version 3 is not the bundled billing library version; the artifact contains Billing 9.1.0. A Play-distributed license-tester checkout remains required. |
| AdMob optional Firebase integration and service lookup warnings | Firebase analytics integration is not installed. The sample-ad SDK reaches its loaded WebView/`jsLoaded` path. Live fill, regional messages and completed rewarded playback remain account/device checks. |
| Chromium variation seed and optional Bluetooth media checks | WebView/device capability notices; not evidence of an app permission requirement. |
| Surface-release / classloader resource notices | SDK resource notices retained for follow-up, with no native fatal exception or JS exception in the passing audio smoke run. Lifecycle audio cleanup is also covered by tests. |
| InteractionJankMonitor device-config permission | Optional platform monitoring disabled; do not request privileged device-config permission for the game. |
| Gradle 10 Groovy-DSL deprecations | Fully expanded with `--warning-mode all`. Current wrapper remains Gradle 9; these are future build-tool migration work, not a failed current build. Upstream and app DSL call sites are recorded in the full build log. |
| Kotlin/Java deprecation, unchecked-cast and delicate-API warnings | Expo/React Native compatibility code plus legacy ReactPackage overrides. Current builds compile successfully; no broad warning suppression or SDK migration was applied. |

All **36 lint warnings** were also reviewed: 2 ScopedStorage warnings on permission-*removal* directives; 1 API-level attribute notice; 1 portrait-orientation recommendation; 6 generated React Native private-resource references; 1 Android 16 orientation notice; 6 generated/legacy unused resources; 10 launcher-shape heuristics; 2 monochrome warnings on API-26 variants (API-33 variants supply monochrome artwork); 5 identical round/normal launcher image notices; and 2 SharedPreferences KTX-style suggestions. The latter use synchronous `commit()` deliberately for recoverable ad entitlements. These warnings are not equivalent to 36 functional defects, and they were not globally disabled.

Real-money checkout, live ad inventory/consent, consumed-coin cloud recovery, the existing upstream tooling advisories and physical-device graphics checks remain the explicit limits of this local verification. No browser/account access or Play upload was performed.

## Release 19 original audit (historical)

Target release: **1.0.17 / Android code 19**.

## Completed app and build changes

- Release builds enable R8 minification/optimization and resource shrinking, using `proguard-android-optimize.txt`.
- Live Play builds retain AdMob app ID `ca-app-pub-6230290323057717~9311910973` and rewarded placement `ca-app-pub-6230290323057717/5950803350`. Local preview APKs use Google's sample placements.
- Google UMP requests consent information on launch, gates live ad requests with `canRequestAds`, and exposes required privacy choices. Reward grants use the SDK reward callback and persisted recovery records.
- Play Billing 9.1.0 remains wired to the four coin products. Completed purchases save their receipt and coins before consumption, preventing duplicate grants during recovery. The Store now offers an explicit **Recover purchases** action alongside automatic recovery.
- The Store now includes the full offline **Privacy policy**, generated from `warling_rush_privacy.html` with the supplied developer name and support email. `npm run privacy:check` checks that both copies match.
- Microphone, external storage and overlay permissions are explicitly excluded from the release manifest and Expo configuration.
- Release lint's unused Expo audio notification-service false positive has a narrow suppression. Background audio is disabled; artifact verification rejects accidental registration of either Expo background audio service. Other notification permission checks remain enabled.
- `.gitignore` covers environment files, private signing keys/configuration, native build caches, dependencies and generated release archives. The public upload certificate and standard local preview keystore remain available intentionally.
- `npm run release:android` increments the version and code together for each new upload, runs release checks, builds with the upload key, and verifies the artifact. Direct Gradle rebuilding retains the current version.
- Play bundles reject local preview signing, and release bundling checks preview flags loaded from both the shell and Expo dotenv files.
- The battle's `/100` label, gameplay, army data and unit artwork are unchanged.

## Verification evidence

- TypeScript checking passed. All 141 existing tests passed; two additional tests cover dotenv build protection and synchronized repeated version increments.
- Four native billing offer-selection tests passed.
- Release lint passed with **0 errors / 36 warnings**. Remaining warnings include generated resources, launcher-icon heuristics, portrait orientation, and deprecated storage permission names on removal directives.
- Build and artifact results are recorded in `artifacts/production-release-19.log` and the verification logs produced for this release.
- The upload-signed AAB built successfully: **96,279,671 bytes**, code 19 / version 1.0.17. All 1,105 signed content entries match the existing public upload certificate. Live ad IDs, billing metadata, offline JavaScript and required ABIs were verified from the artifact.
- R8 produced **1 DEX file** and **10,138 renamed classes**. Its configuration contains no global `dontoptimize`, `dontshrink` or `dontobfuscate` flags; native billing/ad bridge method names are preserved. All 34 ARM64/x86-64 native libraries passed 16 KB ELF segment-alignment checks.
- The Play artifact and its original R8 mapping are preserved in ignored `artifacts/releases/19/`, so preview builds cannot replace the release mapping. AAB SHA-256: `1985c9944ff6119b866dee5bc2fcaa258fbcedccaf23c9fc1300b2ee90315779`.
- The optimized, locally signed preview APK built successfully (**113,956,545 bytes**), passed APK signature and 16 KB ZIP alignment verification, and was installed with `adb install -r` on the open emulator. Version 19 / 1.0.17 launched successfully, remained running, and had no AndroidRuntime or ReactNativeJS startup errors in the checked process log. Existing app data was preserved.

## Remaining external verification and limitations

- No browser/account changes or Play upload were performed. Live AdMob approval/fill, published regional consent messages, Play product activation/country availability, and license-tester checkout must be verified in the user's accounts and a Play-distributed test install.
- Coin balances and receipt history remain local. Already-consumed packs are not returned by Google Play and cannot be restored after clearing app data without an account/backend service. The Store now discloses this before purchase. Backend receipt verification, cloud wallets and refund/revocation handling require that separate service.
- Compatible dependency fixes reduce the npm audit from 12 findings to **8 (5 low, 3 high)**, involving Expo tooling and its Zod/deepmerge dependencies. Neither Zod nor deepmerge is present in the generated app JavaScript source map. No incompatible SDK downgrade or forced Zod major upgrade was applied. Build tooling still needs upstream fixes; do not describe the dependency audit as clean.
- Interactive emulator inspection was not approved. Installation/launch and native error logs can be checked locally, but visual and end-to-end checkout/consent verification must not be inferred from build success.

References: [Android R8 optimization](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization), [Play Billing security](https://developer.android.com/google/play/billing/security), [AdMob consent](https://developers.google.com/admob/android/privacy), [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [deepmerge advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4).
