# Google Play coin store setup

The Android store uses Play Billing Library 9.1.0. Build 20 (version 1.0.18) contains the purchase bridge and shop. The app queries localized prices from Play. If prices have not loaded, buttons show the US reference price and still request fresh product details when tapped; the Google checkout confirms the actual price. Failures produce an actionable alert instead of a silent disabled button. The compact 2×2 shop shows only bundle names, coin amounts, and price buttons beneath the Store title. Pull down to refresh.

## Create these four one-time products

In Play Console, open **Monetize with Play → Products → One-time products → Create one-time product**. Enter these IDs exactly; the app uses them to determine the coin amount.

| Product ID | Name | Description | US price |
| --- | --- | --- | --- |
| `coins_pouch_500` | Coin Pouch | Adds 500 coins to spend on units and upgrades in Warling Rush. | $0.99 |
| `coins_bag_2500` | Coin Bag | Adds 2,500 coins to spend on units and upgrades in Warling Rush. | $2.99 |
| `coins_chest_7500` | Coin Chest | Adds 7,500 coins to spend on units and upgrades in Warling Rush. | $4.99 |
| `coins_vault_25000` | Coin Vault | Adds 25,000 coins to spend on units and upgrades in Warling Rush. | $9.99 |

For **each** product:

1. Add the name and description, then complete the applicable tax/compliance fields.
2. Create a purchase option with **Purchase type Buy**. Any purchase option ID works; `buy` remains preferred if several ordinary Buy options exist. Use Digital content where prompted.
3. Leave quantity/limited-purchase settings off, so this is an ordinary repeatable purchase. Do not add rent, pre-order, or discount offers for this initial setup.
4. Set the US price above. Set regional availability and convert/review prices for other countries where the app is available.
5. **Activate** the product and purchase option. Draft products are not returned to the app.

Optional matching product icons are generated in `artifacts/store-products/`, named after the product IDs above. Regenerate them with `node scripts/render-store-icons.cjs`.

There is no separate consumable switch required in the app: after a confirmed payment, it saves coins plus the purchase token together, then consumes the Play purchase, allowing another purchase of that pack. Cancelled or pending payments do not grant coins. Pull-to-refresh, foreground resume, and purchase callbacks recover outstanding purchases. A saved receipt prevents duplicate credit if consumption needs retrying.

## Test before release

The Store footer provides **Recover purchases** for completed, unconsumed Play purchases and **Privacy policy** for the full offline policy. Recovery saves coins and receipt tokens before consuming purchases. Already delivered consumable packs are not returned by Play after consumption; local balances cannot be recovered after clearing data without a future account/backend service. This limitation is shown in the Store before purchase.

1. Upload `android/app/build/outputs/bundle/release/app-release.aab` (build 20) to your internal or closed testing track and make that release available to testers.
2. Add the testing Google account to the track's tester list and to **Settings → License testing** in Play Console.
3. Join through the track's opt-in link, then install/update the game **from Google Play** using that account. On phones with multiple Google accounts, the account that downloaded the app is used for checkout; that account must be a license tester. The publishing account is automatically a license tester. A closed-test invitation alone does not enable test payment methods. Local APK sideloading is also supported by Google for license testers, but the Play install is the simplest way to verify the distributed release.
4. Open Store and pull down to refresh. Confirm that all four prices load.
5. Checkout should show **Test card, always approves** (also called **Test instrument, always approves**), plus a test-purchase notice. If it shows a real card without the test notice, the account is not being treated as a license tester; fix the account/license configuration before completing checkout. Check successful purchase, cancellation, decline, and delayed approval. Verify the exact coin increase, persistence after restart, and the ability to buy the same pack again.
6. Test recovery after closing the app during checkout and reopening it. A recovered purchase must credit only once.

This game currently keeps balances and receipt history in its local save. It does not have account-based cloud balances, backend receipt verification, or automatic refund/revocation handling. Clearing app data or reinstalling can lose consumed coin balances; Google Play does not return already-consumed packs as owned purchases. Backend verification and account storage would be separate work.

Google documentation: [Create one-time products](https://support.google.com/googleplay/android-developer/answer/16430488?hl=en), [Test billing](https://developer.android.com/google/play/billing/test), [Billing security](https://developer.android.com/google/play/billing/security).
