param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\src-tauri\installer")
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
Add-Type -AssemblyName System.Drawing

function Color-Hex([string]$Hex) {
  $value = $Hex.TrimStart("#")
  if ($value.Length -ne 6) { throw "Expected a 6 digit RGB hex value." }
  return [System.Drawing.Color]::FromArgb(
    [Convert]::ToInt32($value.Substring(0, 2), 16),
    [Convert]::ToInt32($value.Substring(2, 2), 16),
    [Convert]::ToInt32($value.Substring(4, 2), 16)
  )
}

function Font-Segoe([float]$Size, [System.Drawing.FontStyle]$Style = [System.Drawing.FontStyle]::Regular) {
  return [System.Drawing.Font]::new("Segoe UI", $Size, $Style, [System.Drawing.GraphicsUnit]::Point)
}

function New-Canvas([int]$Width, [int]$Height) {
  $bitmap = [System.Drawing.Bitmap]::new(
    $Width,
    $Height,
    [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
  )
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  return @($bitmap, $graphics)
}

function Paint-Background(
  [System.Drawing.Graphics]$Graphics,
  [int]$Width,
  [int]$Height,
  [bool]$Vertical
) {
  $rect = [System.Drawing.Rectangle]::new(0, 0, $Width, $Height)
  $angle = if ($Vertical) { 120.0 } else { 25.0 }
  $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    (Color-Hex "#070B16"),
    (Color-Hex "#19173D"),
    $angle
  )
  try {
    $Graphics.FillRectangle($gradient, $rect)
  } finally {
    $gradient.Dispose()
  }
}

function Paint-Orbits(
  [System.Drawing.Graphics]$Graphics,
  [int]$Width,
  [int]$Height,
  [bool]$Vertical
) {
  $orbitStrong = [System.Drawing.Pen]::new((Color-Hex "#627BFF"), 1.15)
  $orbitSoft = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(105, 117, 91, 244), 1.0)
  try {
    if ($Vertical) {
      $Graphics.DrawEllipse($orbitStrong, -112, 68, 342, 342)
      $Graphics.DrawEllipse($orbitSoft, -76, 104, 270, 270)
      $Graphics.DrawEllipse($orbitSoft, 37, -83, 230, 230)
    } else {
      $Graphics.DrawEllipse($orbitStrong, 83, -92, 178, 178)
      $Graphics.DrawEllipse($orbitSoft, 105, -65, 126, 126)
    }
  } finally {
    $orbitStrong.Dispose()
    $orbitSoft.Dispose()
  }
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$iconPath = Join-Path $PSScriptRoot "..\src-tauri\icons\icon.png"
if (-not (Test-Path $iconPath)) {
  throw "ORBYVEN icon is missing. Run 'npm run icons' before generating installer branding."
}
$icon = [System.Drawing.Image]::FromFile((Resolve-Path $iconPath))

try {
  # NSIS header: recommended by Tauri at 150 x 57 px.
  $header = New-Canvas 150 57
  $headerBitmap = $header[0]
  $headerGraphics = $header[1]
  try {
    Paint-Background $headerGraphics 150 57 $false
    Paint-Orbits $headerGraphics 150 57 $false
    $headerGraphics.DrawImage($icon, 8, 8, 40, 40)

    $titleFont = Font-Segoe 10.2 ([System.Drawing.FontStyle]::Bold)
    $subFont = Font-Segoe 5.8 ([System.Drawing.FontStyle]::Bold)
    $titleBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#EEF4FF"))
    $accentBrush = [System.Drawing.SolidBrush]::new((Color-Hex "#8578FF"))
    try {
      $headerGraphics.DrawString("ORBYVEN", $titleFont, $titleBrush, 53, 9)
      $headerGraphics.DrawString("DESKTOP", $subFont, $accentBrush, 54, 31)
    } finally {
      $titleFont.Dispose(); $subFont.Dispose()
      $titleBrush.Dispose(); $accentBrush.Dispose()
    }
    $headerPath = Join-Path $OutputDirectory "orbyven-header.bmp"
    $headerBitmap.Save($headerPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
  } finally {
    $headerGraphics.Dispose(); $headerBitmap.Dispose()
  }

  # NSIS welcome / finish sidebar: recommended by Tauri at 164 x 314 px.
  $sidebar = New-Canvas 164 314
  $sidebarBitmap = $sidebar[0]
  $sidebarGraphics = $sidebar[1]
  try {
    Paint-Background $sidebarGraphics 164 314 $true
    Paint-Orbits $sidebarGraphics 164 314 $true

    $glow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(30, 98, 123, 255))
    try {
      $sidebarGraphics.FillEllipse($glow, 22, 18, 120, 120)
    } finally {
      $glow.Dispose()
    }

    $sidebarGraphics.DrawImage($icon, 48, 38, 68, 68)

    $brandFont = Font-Segoe 14.0 ([System.Drawing.FontStyle]::Bold)
    $desktopFont = Font-Segoe 7.0 ([System.Drawing.FontStyle]::Bold)
    $bodyFont = Font-Segoe 7.0
    $smallFont = Font-Segoe 5.9
    $white = [System.Drawing.SolidBrush]::new((Color-Hex "#EEF4FF"))
    $accent = [System.Drawing.SolidBrush]::new((Color-Hex "#8A7CFF"))
    $muted = [System.Drawing.SolidBrush]::new((Color-Hex "#A2B1CB"))
    try {
      $brandSize = $sidebarGraphics.MeasureString("ORBYVEN", $brandFont)
      $sidebarGraphics.DrawString("ORBYVEN", $brandFont, $white, (164 - $brandSize.Width) / 2, 127)

      $desktopSize = $sidebarGraphics.MeasureString("DESKTOP", $desktopFont)
      $sidebarGraphics.DrawString("DESKTOP", $desktopFont, $accent, (164 - $desktopSize.Width) / 2, 158)

      $workspaceSize = $sidebarGraphics.MeasureString("Business workspace", $bodyFont)
      $sidebarGraphics.DrawString("Business workspace", $bodyFont, $muted, (164 - $workspaceSize.Width) / 2, 195)

      $installSize = $sidebarGraphics.MeasureString("Secure Windows setup", $smallFont)
      $sidebarGraphics.DrawString("Secure Windows setup", $smallFont, $muted, (164 - $installSize.Width) / 2, 275)
    } finally {
      $brandFont.Dispose(); $desktopFont.Dispose(); $bodyFont.Dispose(); $smallFont.Dispose()
      $white.Dispose(); $accent.Dispose(); $muted.Dispose()
    }

    $sidebarPath = Join-Path $OutputDirectory "orbyven-sidebar.bmp"
    $sidebarBitmap.Save($sidebarPath, [System.Drawing.Imaging.ImageFormat]::Bmp)
  } finally {
    $sidebarGraphics.Dispose(); $sidebarBitmap.Dispose()
  }
} finally {
  $icon.Dispose()
}

Write-Host "ORBYVEN installer branding generated:"
Write-Host " - 150x57 header"
Write-Host " - 164x314 sidebar"
Write-Host " - original OC icon"
