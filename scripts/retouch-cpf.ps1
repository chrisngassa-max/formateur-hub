# Retouche les captures MonCompteFormation pour le tutoriel d'aide CPF.
# - Crop barre onglets Chrome (haut) et barre nav Android (bas)
# - Masque les donnees personnelles (numero de tel, solde reel)
# Sortie : public/aide-cpf/step-1.png ... step-6.png

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$rawDir = Join-Path $root "public\aide-cpf\raw"
$outDir = Join-Path $root "public\aide-cpf"

$cropTop = 145
$cropBottom = 70

$files = @(
    @{ raw = "raw-1-connexion.png.jpeg";       out = "step-1.png"; masks = @() },
    @{ raw = "raw-2-choix-identite.png.jpeg";  out = "step-2.png"; masks = @() },
    @{ raw = "raw-3-numero-vide.png.jpeg";     out = "step-3.png"; masks = @() },
    @{ raw = "raw-4-numero-saisi.png.jpeg";    out = "step-4.png"; masks = @() },
    @{ raw = "raw-5-validation-app.png.jpeg";  out = "step-5.png";
       masks = @(
         @{ x=420; y=1055; w=475; h=80; r=255; g=255; b=255; text="+33 6 XX XX XX XX"; tc="black"; size=38 }
       )
    },
    @{ raw = "raw-6-solde.png.jpeg"; out = "step-6.png";
       masks = @(
         @{ x=45;   y=895;  w=560; h=110; r=40; g=40; b=90; text="1 234,56 EUR"; tc="white"; size=62 },
         @{ x=1060; y=1025; w=290; h=65;  r=40; g=40; b=90; text="1 234,56 EUR"; tc="white"; size=30 }
       )
    }
)

foreach ($f in $files) {
    $rawPath = Join-Path $rawDir $f.raw
    $outPath = Join-Path $outDir $f.out

    if (-not (Test-Path $rawPath)) {
        Write-Warning "Manque: $rawPath"
        continue
    }

    $img = [System.Drawing.Bitmap]::FromFile($rawPath)
    $w = $img.Width
    $h = $img.Height

    # Applique les masques sur l'image originale
    if ($f.masks.Count -gt 0) {
        $g = [System.Drawing.Graphics]::FromImage($img)
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

        foreach ($m in $f.masks) {
            $color = [System.Drawing.Color]::FromArgb(255, $m.r, $m.g, $m.b)
            $brush = New-Object System.Drawing.SolidBrush $color
            $g.FillRectangle($brush, [int]$m.x, [int]$m.y, [int]$m.w, [int]$m.h)

            $textBrush = if ($m.tc -eq "white") {
                [System.Drawing.Brushes]::White
            } else {
                [System.Drawing.Brushes]::Black
            }
            $font = New-Object System.Drawing.Font("Arial", [single]$m.size, [System.Drawing.FontStyle]::Bold)
            $textSize = $g.MeasureString($m.text, $font)
            $tx = [single]($m.x + ($m.w - $textSize.Width) / 2)
            $ty = [single]($m.y + ($m.h - $textSize.Height) / 2)
            $g.DrawString($m.text, $font, $textBrush, $tx, $ty)

            $brush.Dispose()
            $font.Dispose()
        }
        $g.Dispose()
    }

    # Crop top + bottom
    $newH = $h - $cropTop - $cropBottom
    $cropped = New-Object System.Drawing.Bitmap $w, $newH
    $gc = [System.Drawing.Graphics]::FromImage($cropped)
    $srcRect = New-Object System.Drawing.Rectangle 0, $cropTop, $w, $newH
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $w, $newH
    $gc.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $gc.Dispose()

    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    $img.Dispose()

    Write-Output ("OK: " + $f.out + " (" + $w + "x" + $newH + ")")
}

Write-Output "Termine."
