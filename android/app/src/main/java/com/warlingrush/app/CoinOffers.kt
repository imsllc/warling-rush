package com.warlingrush.app

import com.android.billingclient.api.ProductDetails

// Purchase-option IDs are configured by the publisher, not prescribed by Play.
// Packs need an ordinary, immediate, unlimited Buy option. Never substitute a
// rental, preorder, limited purchase or a promotion with different eligibility.
internal fun selectCoinOffer(offers: List<ProductDetails.OneTimePurchaseOfferDetails>): ProductDetails.OneTimePurchaseOfferDetails? {
  val ordinary = offers.filter {
    it.offerId.isNullOrEmpty() && it.rentalDetails == null &&
      it.preorderDetails == null && it.limitedQuantityInfo == null
  }
  return ordinary.firstOrNull { it.purchaseOptionId == "buy" } ?: ordinary.firstOrNull()
}
