param(
    [ValidateSet('audit', 'migrate', 'prepare', 'plan', 'resume', 'verify')]
    [string]$Mode = 'audit'
)
$ErrorActionPreference = 'Stop'
$publishingPython = $env:YOUTUBE3_PYTHON
if (-not $publishingPython) {
    $publishingPython = Join-Path $env:LOCALAPPDATA 'Programs\youtube3\Scripts\python.exe'
}
if (-not (Test-Path -LiteralPath $publishingPython)) {
    throw 'Set YOUTUBE3_PYTHON to the Python executable containing installed youtube3 2.10.0.'
}
& $publishingPython -u (Join-Path $PSScriptRoot 'geoclick-youtube.py') $Mode
exit $LASTEXITCODE
