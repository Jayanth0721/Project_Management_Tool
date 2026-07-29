# Tolab PostgreSQL Backup Script
# Usage: .\scripts\backup.ps1 [-OutputDir <path>]

param (
    [string]$OutputDir = "./backups"
)

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$Filename = "tolab_backup_$Timestamp.sql.gz"
$OutPath = Join-Path -Path $OutputDir -ChildPath $Filename

if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "Created backup directory: $OutputDir"
}

$EnvVars = @{
    PGHOST = $env:POSTGRES_HOST
    PGPORT = $env:POSTGRES_PORT
    PGUSER = $env:POSTGRES_USER
    PGPASSWORD = $env:POSTGRES_PASSWORD
    PGDATABASE = $env:POSTGRES_DB
}

Write-Host "Backing up database to $OutPath ..."

# Use pg_dump if available, otherwise print instructions
$pgDump = Get-Command "pg_dump" -ErrorAction SilentlyContinue

if ($pgDump) {
    & pg_dump --host $EnvVars.PGHOST --port $EnvVars.PGPORT `
              --username $EnvVars.PGUSER --dbname $EnvVars.PGDATABASE `
              --format=custom --verbose `
    | & gzip > $OutPath

    Write-Host "Backup complete: $OutPath"
} else {
    Write-Host @"
pg_dump not found. To perform the backup manually:

   set PGHOST=$($EnvVars.PGHOST)
   set PGPORT=$($EnvVars.PGPORT)
   set PGUSER=$($EnvVars.PGUSER)
   set PGPASSWORD=$($EnvVars.PGPASSWORD)
   pg_dump --host %PGHOST% --port %PGPORT% --username %PGUSER% --dbname $($env:POSTGRES_DB) --format=custom > "$OutPath"
"@
}
