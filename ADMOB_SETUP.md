# Battle reward ads

The Android Play build uses App ID `ca-app-pub-6230290323057717~9311910973` and rewarded ad unit `ca-app-pub-6230290323057717/5950803350`.

After each completed battle, the results popup has a compact green clapperboard / Collect x2 button above Continue. Both buttons are the same size. It plays the existing click sound. Completing the rewarded ad adds one extra copy of that battle's displayed payout, including the 50-coin minimum. Closing without earning the reward adds nothing. The bonus can be collected once per battle. A saved entitlement recovers an earned bonus if the process closes before the coin save finishes. Continue lets the player skip the offer.

## AdMob

1. Keep the placement format **Rewarded**, name **Battle Reward x2**, reward amount **1**, and reward item **Double battle reward**. Leave partner bidding unchecked. The game calculates the variable coin amount; the configured amount represents one boost.
2. In **Privacy & messaging**, configure and publish the applicable consent messages for this app. The integrated Google User Messaging Platform requests consent before live ad requests and provides a shield button for privacy choices when required.
3. Complete any app verification / app readiness steps shown by AdMob. Ensure the Play listing declares that the app contains ads and that its Data safety answers and linked privacy policy cover the Mobile Ads SDK. Live fill depends on the account, app approval, consent and available inventory.

No additional unit IDs are needed for this placement. The Play bundle uses the IDs above. Local preview APK builds using `-PlocalTestSigning=true` use Google's sample app and rewarded unit exclusively, so emulator testing cannot request live ads. Never test by repeatedly watching or clicking your own live ads.

## Builds

Version **1.0.18**, Android version code **20**. Preview APK: `android/app/build/outputs/apk/release/app-release.apk`. Play upload: `android/app/build/outputs/bundle/release/app-release.aab`.

The bridge uses Google Mobile Ads SDK 25.0.0 and UMP 4.0.0. The SDK reward callback is the only point that earns the bonus; dismissal alone never grants coins. Ad load failures leave the base reward intact and Continue available.

Official references: [rewarded ads](https://developers.google.com/admob/android/rewarded), [consent and privacy choices](https://developers.google.com/admob/android/privacy), [ad unit settings](https://support.google.com/admob/answer/7311747?hl=en).
