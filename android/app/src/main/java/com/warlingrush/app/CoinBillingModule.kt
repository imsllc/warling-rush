package com.warlingrush.app

import android.os.Handler
import android.os.Looper
import com.android.billingclient.api.*
import com.facebook.react.bridge.*
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.modules.core.DeviceEventManagerModule

class CoinBillingPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(CoinBillingModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class CoinBillingModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val ids = setOf("coins_pouch_500", "coins_bag_2500", "coins_chest_7500", "coins_vault_25000")
  private var buying: Promise? = null
  private var connecting = false
  private val handler = Handler(Looper.getMainLooper())
  private val waiting = mutableListOf<Pair<Promise, () -> Unit>>()
  private val client = BillingClient.newBuilder(context)
    .setListener { result, purchases ->
      UiThreadUtil.runOnUiThread {
        val promise = buying
        buying = null
        if (promise != null) {
          when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> promise.resolve(Arguments.createMap().apply {
              putString("state", if (purchases.orEmpty().any { it.purchaseState == Purchase.PurchaseState.PENDING }) "pending" else "purchased")
              putArray("purchases", purchaseArray(purchases.orEmpty()))
            })
            BillingClient.BillingResponseCode.USER_CANCELED -> promise.resolve(Arguments.createMap().apply {
              putString("state", "cancelled"); putArray("purchases", Arguments.createArray())
            })
            else -> fail(promise, result)
          }
        } else if (result.responseCode == BillingClient.BillingResponseCode.OK && context.hasActiveReactInstance()) {
          context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit("CoinPurchasesUpdated", null)
        }
      }
    }
    .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
    .enableAutoServiceReconnection()
    .build()

  override fun getName() = "CoinBilling"
  @ReactMethod fun addListener(eventName: String) {}
  @ReactMethod fun removeListeners(count: Double) {}

  private fun fail(promise: Promise, result: BillingResult) {
    promise.reject("PLAY_${result.responseCode}", when (result.responseCode) {
      BillingClient.BillingResponseCode.ITEM_UNAVAILABLE -> "Google Play cannot offer this bundle to this account yet. Check the active Buy option and country availability in Play Console."
      BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED -> "An earlier purchase needs to finish. Pull down to recover it."
      BillingClient.BillingResponseCode.BILLING_UNAVAILABLE -> "Google Play purchases are unavailable. Check your Play Store account."
      BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE, BillingClient.BillingResponseCode.NETWORK_ERROR -> "Google Play could not connect. Check your internet connection and try again."
      else -> "Google Play could not complete the request (code ${result.responseCode}). Please try again."
    })
  }

  private fun connected(promise: Promise, action: () -> Unit) { UiThreadUtil.runOnUiThread {
    if (client.isReady) action() else {
      val task = promise to action
      waiting.add(task)
      handler.postDelayed({
        if (waiting.remove(task)) promise.reject("PLAY_TIMEOUT", "Google Play took too long to connect. Open the Play Store, check that you are signed in, then try again.")
      }, 15000)
      if (!connecting) {
        connecting = true
        client.startConnection(object : BillingClientStateListener {
          override fun onBillingSetupFinished(result: BillingResult) { UiThreadUtil.runOnUiThread {
            connecting = false
            val tasks = waiting.toList(); waiting.clear()
            for ((pending, task) in tasks) {
              if (result.responseCode == BillingClient.BillingResponseCode.OK) task() else fail(pending, result)
            }
          } }
          override fun onBillingServiceDisconnected() { UiThreadUtil.runOnUiThread {
            connecting = false
            buying?.reject("PLAY_DISCONNECTED", "Google Play disconnected. Pull down to check your purchase.")
            buying = null
            val tasks = waiting.toList(); waiting.clear()
            tasks.forEach { it.first.reject("PLAY_DISCONNECTED", "Google Play disconnected. Please try again.") }
          } }
        })
      }
    }
  } }

  private fun productParams(productIds: Collection<String>) = QueryProductDetailsParams.newBuilder().setProductList(
    productIds.map { QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(BillingClient.ProductType.INAPP).build() }
  ).build()

  private fun offer(product: ProductDetails) = selectCoinOffer(
    product.oneTimePurchaseOfferDetailsList.orEmpty().ifEmpty { listOfNotNull(product.oneTimePurchaseOfferDetails) }
  )

  @ReactMethod fun products(promise: Promise) = connected(promise) {
    client.queryProductDetailsAsync(productParams(ids)) { result, details ->
      if (result.responseCode != BillingClient.BillingResponseCode.OK) fail(promise, result)
      else promise.resolve(Arguments.createArray().apply {
        details.productDetailsList.forEach { product -> offer(product)?.let { price ->
          pushMap(Arguments.createMap().apply { putString("id", product.productId); putString("price", price.formattedPrice) })
        } }
      })
    }
  }

  private fun purchaseArray(purchases: List<Purchase>): WritableArray = Arguments.createArray().apply {
    purchases.filter { it.purchaseState == Purchase.PurchaseState.PURCHASED && it.products.size == 1 && it.products[0] in ids }.forEach {
      pushMap(Arguments.createMap().apply {
        putString("productId", it.products[0]); putString("token", it.purchaseToken); putInt("quantity", it.quantity)
      })
    }
  }

  @ReactMethod fun purchases(promise: Promise) = connected(promise) {
    client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build()) { result, purchases ->
      if (result.responseCode == BillingClient.BillingResponseCode.OK) promise.resolve(purchaseArray(purchases)) else fail(promise, result)
    }
  }

  @ReactMethod fun buy(id: String, promise: Promise) = connected(promise) {
    if (id !in ids) { promise.reject("UNKNOWN_PRODUCT", "Unknown coin bundle."); return@connected }
    if (buying != null) { promise.reject("BUSY", "A purchase is already in progress."); return@connected }
    // Fetch a fresh ProductDetails immediately before checkout; never cache it.
    buying = promise
    // Bound the product lookup, but never time out an open Google checkout.
    val lookupTimeout = Runnable {
      if (buying === promise) {
        buying = null
        promise.reject("PLAY_TIMEOUT", "Google Play took too long to load this bundle. Please try again.")
      }
    }
    handler.postDelayed(lookupTimeout, 15000)
    client.queryProductDetailsAsync(productParams(listOf(id))) { result, details ->
      UiThreadUtil.runOnUiThread {
        if (buying !== promise) return@runOnUiThread
        handler.removeCallbacks(lookupTimeout)
        if (result.responseCode != BillingClient.BillingResponseCode.OK) { buying = null; fail(promise, result); return@runOnUiThread }
        val product = details.productDetailsList.firstOrNull { it.productId == id }
        val selected = product?.let { offer(it) }
        val activity = context.currentActivity
        if (product == null || selected == null) {
          buying = null; promise.reject("UNAVAILABLE", "This coin bundle is not available to the Google Play account on this phone. Check that its Buy option is active and available in your country."); return@runOnUiThread
        }
        if (activity == null) {
          buying = null; promise.reject("NO_ACTIVITY", "Reopen the game and try your purchase again."); return@runOnUiThread
        }
        val item = BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(product).apply {
          selected.offerToken?.let { setOfferToken(it) }
        }.build()
        val launched = client.launchBillingFlow(activity, BillingFlowParams.newBuilder().setProductDetailsParamsList(listOf(item)).build())
        if (launched.responseCode != BillingClient.BillingResponseCode.OK) { buying = null; fail(promise, launched) }
      }
    }
  }

  @ReactMethod fun consume(token: String, promise: Promise) = connected(promise) {
    // JS calls this only after coins and the receipt are durably saved together.
    client.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(token).build()) { result, _ ->
      if (result.responseCode == BillingClient.BillingResponseCode.OK || result.responseCode == BillingClient.BillingResponseCode.ITEM_NOT_OWNED)
        promise.resolve(null) else fail(promise, result)
    }
  }

  override fun invalidate() {
    buying?.reject("CLOSED", "Purchase interrupted. Reopen the store to recover it."); buying = null
    waiting.forEach { it.first.reject("CLOSED", "Store closed.") }; waiting.clear()
    client.endConnection()
    super.invalidate()
  }
}
