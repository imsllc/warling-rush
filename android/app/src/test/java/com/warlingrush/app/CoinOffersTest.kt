package com.warlingrush.app

import com.android.billingclient.api.ProductDetails
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test

class CoinOffersTest {
  // Use actual Billing 9.1 SDK offer objects, with representative Play payloads.
  private fun offer(option: String? = "buy", extra: String = ""): ProductDetails.OneTimePurchaseOfferDetails {
    val json = JSONObject("""{"formattedPrice":"$0.99","priceAmountMicros":990000,"priceCurrencyCode":"USD","offerIdToken":"checkout-token"$extra}""")
    option?.let { json.put("purchaseOptionId", it) }
    val constructor = ProductDetails.OneTimePurchaseOfferDetails::class.java.getDeclaredConstructor(JSONObject::class.java)
    constructor.isAccessible = true
    return constructor.newInstance(json)
  }

  @Test fun arbitraryActiveBuyOptionKeepsThePlayPriceAndToken() {
    val standard = offer("standard-purchase")
    val selected = selectCoinOffer(listOf(standard))!!
    assertSame(standard, selected)
    assertEquals("$0.99", selected.formattedPrice)
    assertEquals("checkout-token", selected.offerToken)
  }
  @Test fun legacyBuyWithoutAnOptionIdStillWorks() {
    val legacy = offer(null)
    assertSame(legacy, selectCoinOffer(listOf(legacy)))
  }
  @Test fun existingBuyOptionRemainsPreferredWhenSeveralOptionsExist() {
    val standard = offer("standard")
    val existing = offer("buy")
    assertSame(existing, selectCoinOffer(listOf(standard, existing)))
  }
  @Test fun ineligibleOptionsCannotBeUsedForImmediateRepeatableCoins() {
    for (extra in listOf(
      ",\"offerId\":\"discount\"",
      ",\"rentalDetails\":{\"rentalPeriod\":\"P1D\"}",
      ",\"preorderDetails\":{\"preorderReleaseTimeMillis\":2000000000000,\"preorderPresaleEndTimeMillis\":1999999990000}",
      ",\"limitedQuantityInfo\":{\"maximumQuantity\":1,\"remainingQuantity\":1}"
    )) {
      val special = offer("buy", extra)
      val standard = offer("standard")
      assertNull(selectCoinOffer(listOf(special)))
      assertSame(standard, selectCoinOffer(listOf(special, standard)))
    }
    assertNull(selectCoinOffer(emptyList()))
  }
}
