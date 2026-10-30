# Each new Play upload gets a fresh version. Rebuilding the same upload can use
# gradlew :app:bundleRelease directly without incrementing it again.
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
Push-Location $taskRoot
try {
    . ./scripts/android-env.ps1
    node scripts/check-release-env.cjs false
    if ($LASTEXITCODE) { throw 'Production environment validation failed.' }
    node scripts/bump-version.cjs
    if ($LASTEXITCODE) { throw 'Version update failed.' }
    npm run privacy:check
    if ($LASTEXITCODE) { throw 'Privacy policy is out of sync.' }
    npm run typecheck
    if ($LASTEXITCODE) { throw 'TypeScript checking failed.' }
    npm test
    if ($LASTEXITCODE) { throw 'Tests failed.' }
    Set-Location android
    ./gradlew.bat :app:testReleaseUnitTest :app:lintRelease :app:bundleRelease
    if ($LASTEXITCODE) { throw 'Android release checks/build failed.' }
    Set-Location $taskRoot
    $taskConfig = (Get-Content app.json -Raw | ConvertFrom-Json).expo
    $taskBundle = 'android/app/build/outputs/bundle/release/app-release.aab'
    node scripts/verify-release.cjs $taskBundle
    if ($LASTEXITCODE) { throw 'Release artifact verification failed.' }
    java scripts/VerifyPlayBundle.java $taskBundle artifacts/warlingrush-upload-certificate.pem $taskConfig.android.versionCode $taskConfig.version '9.1.0' 'ca-app-pub-6230290323057717~9311910973' 'ca-app-pub-6230290323057717/5950803350'
    if ($LASTEXITCODE) { throw 'Upload signature or service configuration verification failed.' }
    $taskArchive = Join-Path $taskRoot ('artifacts/releases/' + $taskConfig.android.versionCode)
    New-Item -ItemType Directory -Path $taskArchive -Force | Out-Null
    Copy-Item -LiteralPath $taskBundle -Destination (Join-Path $taskArchive 'app-release.aab')
    Copy-Item -LiteralPath 'android/app/build/outputs/mapping/release/mapping.txt' -Destination (Join-Path $taskArchive 'mapping.txt')
    Copy-Item -LiteralPath 'android/app/build/outputs/mapping/release/configuration.txt' -Destination (Join-Path $taskArchive 'configuration.txt')
    Get-FileHash -Algorithm SHA256 -LiteralPath $taskBundle | Format-List
} finally { Pop-Location }
