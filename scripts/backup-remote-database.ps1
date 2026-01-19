# ============================================
# Backup de Base de Datos REMOTA de Supabase
# ============================================
# Este script crea un backup de tu base de datos en Supabase Cloud
# Requiere: Supabase CLI instalado y autenticado
# ============================================

param(
    [string]$BackupDir = ".\backups",
    [string]$ProjectRef = "",  # Tu project ref de Supabase (ej: abcdefghijklmnop)
    [switch]$SchemaOnly = $false
)

# Crear directorio de backups si no existe
if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = Join-Path $BackupDir "traceblend_remote_backup_$timestamp.sql"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  BACKUP DE BASE DE DATOS REMOTA" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Verificar autenticación
Write-Host "Verificando autenticación de Supabase..." -ForegroundColor Yellow
try {
    $authStatus = supabase projects list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ No estás autenticado en Supabase CLI" -ForegroundColor Red
        Write-Host "`nPara autenticarte, ejecuta:" -ForegroundColor Yellow
        Write-Host "  supabase login`n" -ForegroundColor White
        exit 1
    }
    Write-Host "✓ Autenticado correctamente" -ForegroundColor Green
} catch {
    Write-Host "✗ Error verificando autenticación: $_" -ForegroundColor Red
    exit 1
}

# Si no se proporcionó el project ref, intentar obtenerlo del .env
if ([string]::IsNullOrEmpty($ProjectRef)) {
    Write-Host "`nBuscando Project Reference..." -ForegroundColor Yellow
    
    if (Test-Path ".\.env") {
        $envContent = Get-Content ".\.env" -Raw
        if ($envContent -match "VITE_SUPABASE_URL=https://([a-z0-9]+).supabase.co") {
            $ProjectRef = $matches[1]
            Write-Host "✓ Project Reference encontrado: $ProjectRef" -ForegroundColor Green
        } else {
            Write-Host "⚠ No se pudo extraer el Project Reference del .env" -ForegroundColor Yellow
        }
    }
    
    if ([string]::IsNullOrEmpty($ProjectRef)) {
        Write-Host "`nListado de proyectos disponibles:" -ForegroundColor Cyan
        supabase projects list
        
        Write-Host "`nPor favor, proporciona el Project Reference:" -ForegroundColor Yellow
        Write-Host "Ejecuta: .\scripts\backup-remote-database.ps1 -ProjectRef <tu-project-ref>" -ForegroundColor White
        exit 1
    }
}

Write-Host "`nCreando backup del proyecto: $ProjectRef" -ForegroundColor Cyan

# Realizar el backup remoto
try {
    if ($SchemaOnly) {
        Write-Host "  → Backup solo del esquema (sin datos)..." -ForegroundColor Gray
        supabase db dump --project-ref $ProjectRef --schema public > $backupFile
    } else {
        Write-Host "  → Backup completo (esquema + datos)..." -ForegroundColor Gray
        Write-Host "  ⚠ Este proceso puede tardar varios minutos..." -ForegroundColor Yellow
        
        # Primero el esquema
        $schemaFile = "$backupFile.schema"
        supabase db dump --project-ref $ProjectRef --schema public > $schemaFile
        
        # Luego los datos
        $dataFile = "$backupFile.data"
        supabase db dump --project-ref $ProjectRef --data-only > $dataFile
        
        # Combinar
        Get-Content $schemaFile, $dataFile | Set-Content $backupFile
        Remove-Item $schemaFile, $dataFile -ErrorAction SilentlyContinue
    }
    
    if (Test-Path $backupFile) {
        $fileSize = (Get-Item $backupFile).Length / 1KB
        Write-Host "`n✓ Backup creado exitosamente!" -ForegroundColor Green
        Write-Host "  📄 Archivo: $backupFile" -ForegroundColor White
        Write-Host "  📊 Tamaño: $([math]::Round($fileSize, 2)) KB" -ForegroundColor White
    } else {
        throw "El archivo de backup no se creó correctamente"
    }
} catch {
    Write-Host "`n✗ Error al crear backup: $_" -ForegroundColor Red
    exit 1
}

# Crear metadata
$metadataFile = "$backupFile.metadata.json"
$metadata = @{
    timestamp = $timestamp
    date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    project_ref = $ProjectRef
    schema_only = $SchemaOnly.IsPresent
    backup_type = "remote"
    file_size_kb = [math]::Round((Get-Item $backupFile).Length / 1KB, 2)
}

$metadata | ConvertTo-Json -Depth 10 | Set-Content $metadataFile

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  BACKUP REMOTO COMPLETADO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`nPara restaurar este backup en local:" -ForegroundColor Yellow
Write-Host "  supabase db reset" -ForegroundColor White
Write-Host "  psql -h localhost -p 54322 -U postgres -d postgres -f `"$backupFile`"`n" -ForegroundColor White
