# Preserve the existing command as an entry point to the source-artwork pipeline.
& node (Join-Path $PSScriptRoot 'generate-icons.cjs')
if ($LASTEXITCODE -ne 0) { throw 'Icon generation failed.' }
