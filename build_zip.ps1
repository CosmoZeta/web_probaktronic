param()
$zipName = "PROBAKTRONIC_SOLO_CODIGO.zip"
if (Test-Path $zipName) { Remove-Item $zipName -Force }

$codeDirs = @("api", "js", "css", "data")
$rootFiles = Get-ChildItem -Path . -File | Where-Object { 
    $_.Extension -in @(".html", ".php", ".js", ".css", ".json", ".svg", ".png", ".jpg", ".ico") -and
    $_.Name -ne ".htaccess"
}

$itemsToZip = @()
$itemsToZip += $rootFiles.FullName
foreach ($d in $codeDirs) {
    if (Test-Path $d) { $itemsToZip += (Get-Item $d).FullName }
}

Compress-Archive -Path $itemsToZip -DestinationPath $zipName -Force
$size = [math]::Round((Get-Item $zipName).Length / 1MB, 2)
Write-Host "ZIP CREADO EXITOSAMENTE: $zipName ($size MB)"
