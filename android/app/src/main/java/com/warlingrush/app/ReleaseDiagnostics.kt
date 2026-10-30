package com.warlingrush.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.uimanager.ViewManager

object ReleaseLaunchOptions {
  @Volatile var audioSmokeTest = false
}

// The explicit launch flag is honored only by locally signed preview APKs.
class ReleaseDiagnosticsPackage : ReactPackage {
  @Suppress("OVERRIDE_DEPRECATION")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
    listOf(object : ReactContextBaseJavaModule(reactContext) {
      override fun getName() = "ReleaseDiagnostics"
      override fun getConstants(): Map<String, Any> = mapOf(
        "audioSmokeTest" to (BuildConfig.ADMOB_TEST_ADS && ReleaseLaunchOptions.audioSmokeTest)
      )
    })
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
