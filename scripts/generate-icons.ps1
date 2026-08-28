Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\build\icon.png"
if (!(Test-Path $srcPath)) {
    Write-Error "Source icon not found at $srcPath"
}

$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
$iconsDir = Join-Path $PSScriptRoot "..\build\icons"

if (!(Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

$sizes = @(16, 24, 32, 48, 64, 128, 256, 512, 1024)
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $size, $size)
    $g.Dispose()
    
    $outPath = Join-Path $iconsDir "$($size)x$($size).png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated $outPath"
}

# Also generate high-res 512x512 icon.png in build/
$highResBmp = New-Object System.Drawing.Bitmap 512, 512
$gHigh = [System.Drawing.Graphics]::FromImage($highResBmp)
$gHigh.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gHigh.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gHigh.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gHigh.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$gHigh.DrawImage($srcImg, 0, 0, 512, 512)
$gHigh.Dispose()
$srcImg.Dispose()

$mainIconPath = Join-Path $PSScriptRoot "..\build\icon.png"
$highResBmp.Save($mainIconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$highResBmp.Dispose()
Write-Host "Updated $mainIconPath with 512x512 PNG"
