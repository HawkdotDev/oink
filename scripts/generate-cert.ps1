# Generates a self-signed Code Signing Certificate for local/CI Windows builds
param(
    [string]$CertPassword = "oink-desktop-signing",
    [string]$OutputDir = "$PSScriptRoot\..\build"
)

$ErrorActionPreference = "Stop"

Write-Host "Creating Code Signing Certificate for Oink Desktop..." -ForegroundColor Cyan

# 1. Create Self-Signed Code Signing Certificate
$cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=Oink Desktop (HawkdotDev), O=HawkdotDev, C=US" `
    -KeyUsage DigitalSignature `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -KeyExportPolicy Exportable `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddYears(5)

Write-Host "Certificate generated successfully with Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green

# Ensure output directory exists
if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$pfxPath = Join-Path $OutputDir "oink-dev-cert.pfx"
$cerPath = Join-Path $OutputDir "oink-dev-cert.cer"

# 2. Export PFX (Private Key + Certificate)
$securePwd = ConvertTo-SecureString -String $CertPassword -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $securePwd | Out-Null
Write-Host "Exported PFX certificate to: $pfxPath" -ForegroundColor Green

# 3. Export CER (Public Certificate)
Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null
Write-Host "Exported CER certificate to: $cerPath" -ForegroundColor Green

Write-Host "`nTo install and trust this certificate on your Windows machine (removes SmartScreen warning for local builds):" -ForegroundColor Yellow
Write-Host "Import-Certificate -FilePath '$cerPath' -CertStoreLocation Cert:\CurrentUser\Root" -ForegroundColor White
