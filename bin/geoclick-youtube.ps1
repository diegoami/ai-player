param(
    [ValidateSet('audit', 'migrate', 'prepare', 'plan', 'resume', 'verify')]
    [string]$Mode = 'audit',
    [ValidateSet('asia', 'africa')]
    [string]$Series
)
$ErrorActionPreference = 'Stop'
$publishingPython = $env:YOUTUBE3_PYTHON
if (-not $publishingPython) {
    $publishingPython = Join-Path $env:LOCALAPPDATA 'Programs\youtube3\Scripts\python.exe'
}
if (-not (Test-Path -LiteralPath $publishingPython)) {
    throw 'Set YOUTUBE3_PYTHON to the Python executable containing installed youtube3 2.10.0.'
}
$publishingArgs = @($Mode)
if ($Series) {
    if ($Mode -ne 'prepare') { throw '-Series applies only to offline prepare.' }
    $publishingArgs += @('--series', $Series)
}
& $publishingPython -u (Join-Path $PSScriptRoot 'geoclick-youtube.py') @publishingArgs
exit $LASTEXITCODE
