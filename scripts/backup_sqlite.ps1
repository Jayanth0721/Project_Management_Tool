# Tolab SQLite Backup Script
# Usage: .\scripts\backup_sqlite.ps1 [-DbPath <path>] [-OutputDir <path>]

param (
    [string]$DbPath = "./tolab.db",
    [string]$OutputDir = "./backups"
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Filename = "tolab_backup_$Timestamp.db"
$OutPath = Join-Path -Path $OutputDir -ChildPath $Filename

if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created backup directory: $OutputDir"
}

if (Test-Path -LiteralPath $DbPath) {
    Copy-Item -LiteralPath $DbPath -Destination $OutPath
    Write-Host "Backup complete: $OutPath"
} else {
    Write-Host "Database not found at $DbPath"
}
