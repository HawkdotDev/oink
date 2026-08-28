# Trusts the Oink developer code signing certificate on CurrentUser store
param(
    [string]$CerPath = "$PSScriptRoot\..\build\oink-dev-cert.cer"
)

$ErrorActionPreference = "Stop"

if (!(Test-Path $CerPath)) {
    Write-Error "Certificate file not found at: $CerPath. Run generate-cert.ps1 first."
}

Write-Host "Importing Oink Certificate into CurrentUser\Root store..." -ForegroundColor Cyan
Import-Certificate -FilePath $CerPath -CertStoreLocation Cert:\CurrentUser\Root | Out-Null

Write-Host "Importing Oink Certificate into CurrentUser\TrustedPublisher store..." -ForegroundColor Cyan
Import-Certificate -FilePath $CerPath -CertStoreLocation Cert:\CurrentUser\TrustedPublisher | Out-Null

Write-Host "Done! Oink Desktop installers and executables are now trusted on this system." -ForegroundColor Green
