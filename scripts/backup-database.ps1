# ============================================
# Script de Backup de Base de Datos TraceBlend
# ============================================
# Este script crea un backup completo de tu base de datos Supabase
# Requisitos: Supabase CLI instalado
# ============================================

param(
    [string]$BackupDir = ".\backups",
    [switch]$IncludeData,
    [switch]$SchemaOnly
)

# Crear directorio de backups si no existe
if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "✓ Directorio de backups creado: $BackupDir" -ForegroundColor Green
}

# Generar nombre de archivo con timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "traceblend_backup_$timestamp"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  BACKUP DE BASE DE DATOS TRACEBLEND" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Verificar que Supabase CLI está instalado
Write-Host "Verificando Supabase CLI..." -ForegroundColor Yellow
try {
    $supabaseVersion = supabase --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Supabase CLI encontrado: $supabaseVersion" -ForegroundColor Green
    }
    else {
        throw "Supabase CLI no encontrado"
    }
}
catch {
    Write-Host "✗ ERROR: Supabase CLI no está instalado" -ForegroundColor Red
    Write-Host "`nInstala Supabase CLI ejecutando:" -ForegroundColor Yellow
    Write-Host "  scoop install supabase" -ForegroundColor White
    Write-Host "  o visita: https://supabase.com/docs/guides/cli`n" -ForegroundColor White
    exit 1
}

# Verificar que estamos en el directorio correcto
if (-not (Test-Path ".\supabase\config.toml")) {
    Write-Host "✗ ERROR: No se encontró la configuración de Supabase" -ForegroundColor Red
    Write-Host "  Ejecuta este script desde la raíz del proyecto TraceBlend`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nIniciando backup..." -ForegroundColor Yellow

# Opción 1: Backup completo usando supabase db dump
Write-Host "`n[1/3] Creando dump de la base de datos..." -ForegroundColor Cyan
$dumpFile = "$backupFile.sql"

try {
    # Ejecutar dump de la base de datos
    if ($SchemaOnly) {
        Write-Host "  → Backup solo del esquema (sin datos)" -ForegroundColor Gray
        supabase db dump --schema public > $dumpFile
    }
    else {
        Write-Host "  → Backup completo (esquema + datos)" -ForegroundColor Gray
        supabase db dump --data-only > "$backupFile`_data.sql"
        supabase db dump --schema public > "$backupFile`_schema.sql"
        
        # Combinar en un solo archivo
        Get-Content "$backupFile`_schema.sql", "$backupFile`_data.sql" | Set-Content $dumpFile
        Remove-Item "$backupFile`_schema.sql", "$backupFile`_data.sql"
    }
    
    if (Test-Path $dumpFile) {
        $fileSize = (Get-Item $dumpFile).Length / 1KB
        Write-Host "  ✓ Dump creado: $dumpFile ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
    }
}
catch {
    Write-Host "  ✗ Error al crear dump: $_" -ForegroundColor Red
}

# Opción 2: Backup de migraciones
Write-Host "`n[2/3] Copiando migraciones..." -ForegroundColor Cyan
$migrationsBackup = "$backupFile`_migrations"
try {
    if (Test-Path ".\supabase\migrations") {
        Copy-Item -Path ".\supabase\migrations" -Destination $migrationsBackup -Recurse -Force
        $migrationCount = (Get-ChildItem -Path $migrationsBackup -File).Count
        Write-Host "  ✓ $migrationCount archivos de migración copiados" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠ No se encontraron migraciones" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ✗ Error al copiar migraciones: $_" -ForegroundColor Red
}

# Opción 3: Crear archivo de metadata
Write-Host "`n[3/3] Creando metadata del backup..." -ForegroundColor Cyan
$metadataFile = "$backupFile`_metadata.json"
$metadata = @{
    timestamp        = $timestamp
    date             = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    schema_only      = $SchemaOnly.IsPresent
    supabase_version = $supabaseVersion
    project_id       = "trace-blend"
    backup_files     = @{
        dump       = (Split-Path $dumpFile -Leaf)
        migrations = (Split-Path $migrationsBackup -Leaf)
    }
}

$metadata | ConvertTo-Json -Depth 10 | Set-Content $metadataFile
Write-Host "  ✓ Metadata creada: $metadataFile" -ForegroundColor Green

# Resumen
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  BACKUP COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "`nArchivos creados:" -ForegroundColor White
Write-Host "  📄 $dumpFile" -ForegroundColor White
Write-Host "  📁 $migrationsBackup" -ForegroundColor White
Write-Host "  📋 $metadataFile" -ForegroundColor White

Write-Host "`nPara restaurar este backup:" -ForegroundColor Yellow
Write-Host "  supabase db reset" -ForegroundColor White
Write-Host "  psql -h localhost -p 54322 -U postgres -d postgres -f `"$dumpFile`"" -ForegroundColor White

Write-Host "`n✓ Backup guardado en: $BackupDir`n" -ForegroundColor Green
