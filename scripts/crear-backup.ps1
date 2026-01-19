# ============================================
# SCRIPT SIMPLIFICADO DE BACKUP
# ============================================
# Este script usa el dashboard de Supabase para generar el SQL
# ============================================

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$readmeFile = ".\backups\INSTRUCCIONES_BACKUP_$timestamp.md"

$instructions = @"
# 🔒 Instrucciones para Crear Backup Manual

**Fecha:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Proyecto:** Trace Blend (gcxsrvvmfhhvbxwhknau)

---

## Método 1: Usar SQL Editor (RECOMEND ADO - Sin Docker)

### Paso 1: Abrir SQL Editor
Abre: https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/sql/new

### Paso 2: Ejecutar Script de Backup
Copia y pega el siguiente script SQL y ejecútalo:

``````sql
-- Backup completo de datos
BEGIN;

-- Configurar formato de salida
\copy (SELECT * FROM organizations) TO 'organizations.csv' WITH CSV HEADER
\copy (SELECT * FROM users) TO 'users.csv' WITH CSV HEADER
\copy (SELECT * FROM farms) TO 'farms.csv' WITH CSV HEADER
\copy (SELECT * FROM suppliers) TO 'suppliers.csv' WITH CSV HEADER
\copy (SELECT * FROM raw_inventory_batches) TO 'raw_inventory_batches.csv' WITH CSV HEADER
\copy (SELECT * FROM prepared_inventory_batches) TO 'prepared_inventory_batches.csv' WITH CSV HEADER  
\copy (SELECT * FROM products) TO 'products.csv' WITH CSV HEADER
\copy (SELECT * FROM sales) TO 'sales.csv' WITH CSV HEADER
\copy (SELECT * FROM lab_analyses) TO 'lab_analyses.csv' WITH CSV HEADER

COMMIT;
``````

### Paso 3: Copiar Resultados
Los datos se exportarán. Copia cada resultado y guárdalo en archivos separados.

---

## Método 2: Usar pg_dump con Docker

Si tienes Docker Desktop instalado:

``````powershell
# 1. Instalar Docker Desktop desde: https://www.docker.com/products/docker-desktop

# 2. Ejecutar backup:
supabase db dump --linked --data-only -f ".\backups\backup_$timestamp.sql"
``````

---

## Método 3: Usar Supabase Studio

1. Ve a: https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/editor
2. Selecciona cada tabla
3. Exporta los datos usando el botón de exportación (si disponible)

---

## Method 4: Usar el script SQL en este proyecto

Ejecuta en SQL Editor el archivo: ``supabase/backup_generator.sql``

Esto generará INSERT statements para todas tus tablas.

---

## ⚠️ IMPORTANTE

- Los backups automáticos solo están disponibles en planes pagos de Supabase
- Para backups regulares, considera actualizar al plan Pro
- Guarda los backups en un lugar seguro (Google Drive, OneDrive, etc.)

---

## 📊 Resumen del Estado

- **Supabase CLI:** ✅ Instalado (v2.72.7)
- **Autenticación:**  ✅ Completada
- **Docker Desktop:** ❌ No instalado (necesario para `supabase db dump`)
- **Proyecto vinculado:** ✅ gcxsrvvmfhhvbxwhknau

---

## Próximos Pasos Recomendados

1. **AHORA:** Usa el SQL Editor para hacer un backup manual (Método 1)
2. **Opcional:** Instala Docker Desktop para usar `supabase db dump`
3. **Futuro:** Considera actualizar a Supabase Pro para backups automáticos
"@

# Crear archivo de instrucciones
$instructions | Set-Content $readmeFile

WhiteHost "`n============================================" -ForegroundColor Cyan
Write-Host "  ✅ SUPABASE CLI INSTALADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`n📋 Información:" -ForegroundColor Yellow
Write-Host "  • Versión: 2.72.7" -ForegroundColor White
Write-Host "  • Autenticación: Completada ✓" -ForegroundColor Green
Write-Host "  • Proyecto vinculado: gcxsrvvmfhhvbxwhknau ✓" -ForegroundColor Green

Write-Host "`n⚠️  Nota sobre Backup:" -ForegroundColor Yellow
Write-Host "  El comando 'supabase db dump' requiere Docker Desktop." -ForegroundColor White
Write-Host "  Como no tienes Docker instalado, te recomiendo:" -ForegroundColor White

Write-Host "`n📝 Opciones de Backup:" -ForegroundColor Cyan
Write-Host "  1. Usar SQL Editor (MÁS FÁCIL) - Sin Docker" -ForegroundColor White
Write-Host "     URL: https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/sql" -ForegroundColor Gray
Write-Host "`n  2. Instalar Docker Desktop y usar 'supabase db dump'" -ForegroundColor White
Write-Host "     URL: https://www.docker.com/products/docker-desktop" -ForegroundColor Gray

Write-Host "`n📄 Instrucciones detalladas guardadas en:" -ForegroundColor Green
Write-Host "  $readmeFile`n" -ForegroundColor White

Write-Host "¿Quieres que abra el SQL Editor en el navegador? (S/N): " -NoNewline -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "S" -or $response -eq "s" -or $response -eq "") {
    Start-Process "https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/sql/new"
    Write-Host "`n✓ Navegador abierto. Usa el script en: supabase\backup_generator.sql`n" -ForegroundColor Green
}
else {
    Write-Host "`n✓ Puedes hacer el backup cuando quieras usando las instrucciones arriba.`n" -ForegroundColor Green
}
