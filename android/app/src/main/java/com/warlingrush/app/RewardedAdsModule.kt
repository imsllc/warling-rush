package com.warlingrush.app

import android.os.Handler
import android.os.Looper
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import com.google.android.gms.ads.*
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform

class RewardedAdsPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(RewardedAdsModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class RewardedAdsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val handler = Handler(Looper.getMainLooper())
  private val prefs = context.getSharedPreferences("rewarded-battle-bonus", 0)
  private val consent = UserMessagingPlatform.getConsentInformation(context)
  private var initialized = false
  private var initializing = false
  private var ad: RewardedAd? = null
  private var loadedAt = 0L
  private var loading = false
  private var showing = false
  private val readyTasks = mutableListOf<Pair<() -> Unit, (String) -> Unit>>()
  private val adTasks = mutableListOf<Pair<(RewardedAd) -> Unit, (String) -> Unit>>()

  override fun getName() = "BattleRewardAds"
  private fun privacyRequired() = !BuildConfig.ADMOB_TEST_ADS && consent.privacyOptionsRequirementStatus == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED
  private fun status() = Arguments.createMap().apply { putBoolean("privacyRequired", privacyRequired()) }

  private fun ready(success: () -> Unit, failure: (String) -> Unit) {
    if (initialized) { success(); return }
    readyTasks.add(success to failure)
    if (initializing) return
    initializing = true
    fun fail(message: String) {
      initializing = false
      val tasks = readyTasks.toList(); readyTasks.clear()
      tasks.forEach { it.second(message) }
    }
    fun startSdk() {
      MobileAds.setRequestConfiguration(RequestConfiguration.Builder().setMaxAdContentRating(RequestConfiguration.MAX_AD_CONTENT_RATING_G).build())
      MobileAds.initialize(context) {
        handler.post {
          initialized = true; initializing = false
          val tasks = readyTasks.toList(); readyTasks.clear()
          tasks.forEach { it.first() }
        }
      }
    }
    // Local APK previews exclusively use Google's test placement and no live requests.
    if (BuildConfig.ADMOB_TEST_ADS) { startSdk(); return }
    val activity = context.currentActivity
    if (activity == null) { fail("Reopen the game to load an ad."); return }
    consent.requestConsentInfoUpdate(activity, ConsentRequestParameters.Builder().build(), {
      UserMessagingPlatform.loadAndShowConsentFormIfRequired(activity) { error ->
        if (consent.canRequestAds()) startSdk()
        else fail(error?.message ?: "Ads are unavailable with the current privacy settings.")
      }
    }, { error ->
      if (consent.canRequestAds()) startSdk() else fail(error.message)
    })
  }

  private fun load(success: (RewardedAd) -> Unit, failure: (String) -> Unit) {
    val cached = ad
    if (cached != null && System.currentTimeMillis() - loadedAt < 55 * 60 * 1000) { success(cached); return }
    ad = null
    adTasks.add(success to failure)
    if (loading) return
    loading = true
    RewardedAd.load(context, BuildConfig.ADMOB_REWARDED_ID, AdRequest.Builder().build(), object : RewardedAdLoadCallback() {
      override fun onAdLoaded(loaded: RewardedAd) {
        loading = false; ad = loaded; loadedAt = System.currentTimeMillis()
        val tasks = adTasks.toList(); adTasks.clear()
        tasks.forEach { it.first(loaded) }
      }
      override fun onAdFailedToLoad(error: LoadAdError) {
        loading = false; ad = null
        val tasks = adTasks.toList(); adTasks.clear()
        tasks.forEach { it.second("No ad available right now. Please try again later.") }
      }
    })
  }

  @ReactMethod fun prepare(promise: Promise) { handler.post {
    ready({
      // Consent status is useful even if the placement has no fill.
      promise.resolve(status())
      load({}, {})
    }, { promise.resolve(status()) })
  } }

  @ReactMethod fun show(id: String, promise: Promise) { handler.post {
    if (id.isBlank()) { promise.reject("INVALID_REWARD", "Missing battle reward."); return@post }
    if (showing) { promise.reject("AD_BUSY", "An ad is already open."); return@post }
    val pending = prefs.getString("pending", null)
    if (pending == id || prefs.getString("lastEarned", null) == id) { promise.resolve(true); return@post }
    if (pending != null) { promise.reject("PENDING_REWARD", "An earlier reward needs to finish saving."); return@post }
    showing = true
    var finished = false
    var presented = false
    var earned = false
    val timeout = Runnable {
      if (!finished && !presented) {
        finished = true; showing = false
        promise.reject("AD_TIMEOUT", "The ad could not load. Please try again later.")
      }
    }
    handler.postDelayed(timeout, 45000)
    fun fail(message: String) {
      if (finished) return
      finished = true; showing = false; handler.removeCallbacks(timeout)
      promise.reject("AD_UNAVAILABLE", message)
    }
    ready({
      if (!finished) load({ loaded ->
        if (!finished) {
          val activity = context.currentActivity
          if (activity == null || activity.isFinishing) fail("Reopen the game to watch the ad.")
          else {
            ad = null
            loaded.fullScreenContentCallback = object : FullScreenContentCallback() {
              override fun onAdShowedFullScreenContent() { presented = true; handler.removeCallbacks(timeout) }
              override fun onAdDismissedFullScreenContent() {
                if (!finished) { finished = true; showing = false; handler.removeCallbacks(timeout); promise.resolve(earned) }
                load({}, {})
              }
              override fun onAdFailedToShowFullScreenContent(error: AdError) { fail("The ad could not open. Please try again.") }
            }
            loaded.show(activity) {
              // Durable entitlement is written only from the SDK reward callback.
              earned = true
              prefs.edit().putString("pending", id).putString("lastEarned", id).commit()
            }
          }
        }
      }, { fail(it) })
    }, { fail(it) })
  } }

  @ReactMethod fun pendingReward(promise: Promise) { promise.resolve(prefs.getString("pending", null)) }
  @ReactMethod fun clearReward(id: String, promise: Promise) {
    if (prefs.getString("pending", null) != id || prefs.edit().remove("pending").commit()) promise.resolve(null)
    else promise.reject("SAVE_FAILED", "Could not finish saving the reward. Please retry.")
  }
  @ReactMethod fun privacy(promise: Promise) { handler.post {
    val activity = context.currentActivity
    if (activity == null) promise.reject("NO_ACTIVITY", "Reopen the game to change privacy choices.")
    else UserMessagingPlatform.showPrivacyOptionsForm(activity) { error ->
      ad = null
      if (error != null) promise.reject("PRIVACY_ERROR", error.message)
      else { initialized = false; promise.resolve(status()) }
    }
  } }
}
