param([string]$LogPath = 'artifacts/audio-smoke.log')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Push-Location $taskRoot
try {
    . ./scripts/android-env.ps1
    adb install -r android/app/build/outputs/apk/release/app-release.apk
    if ($LASTEXITCODE) { throw 'Preview APK installation failed.' }
    adb shell am force-stop com.warlingrush.app
    Start-Sleep -Milliseconds 750
    adb shell am start -W -n com.warlingrush.app/.MainActivity --ez audioSmokeTest true
    if ($LASTEXITCODE) { throw 'Audio test launch failed.' }
    $taskAudioPid = ((adb shell pidof com.warlingrush.app) -join '').Trim()
    if (-not $taskAudioPid) { throw 'The game did not remain running.' }
    $taskDeadline = [DateTime]::UtcNow.AddSeconds(30)
    do {
        adb logcat -d --pid=$taskAudioPid -v brief *> $LogPath
        if (Select-String -Path $LogPath -Pattern 'Audio smoke test: playback|Could not play game audio|FATAL EXCEPTION' -Quiet) { break }
        Start-Sleep -Milliseconds 250
    } while ([DateTime]::UtcNow -lt $taskDeadline)
    node scripts/check-audio-smoke.cjs $LogPath
    if ($LASTEXITCODE) { throw 'Optimized native audio playback verification failed. Inspect the complete process log.' }
    adb logcat -d --pid=$taskAudioPid -v brief '*:W' *> ($LogPath + '.warnings.log')
} finally { Pop-Location }
