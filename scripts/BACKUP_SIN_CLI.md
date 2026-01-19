# ============================================
# GUÍA RÁPIDA: BACKUP SIN SUPABASE CLI
# ============================================
# Si no tienes Supabase CLI instalado, puedes hacer backup de las siguientes formas:
# ============================================

## OPCIÓN 1: Backup desde Supabase Dashboard (RECOMENDADO)
## ========================================================

### Pasos:
1. Ve a https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau
2. Navega a: Database > Backups
3. Haz clic en "Download backup" para obtener un backup completo
4. El backup se descargará en formato .sql

### Ventajas:
- ✓ No requiere instalación de herramientas
- ✓ Backup completo y oficial
- ✓ Incluye esquema y datos
- ✓ Fácil de usar


## OPCIÓN 2: Exportar datos usando SQL Editor
## ============================================

### Pasos:
1. Ve a: SQL Editor en tu proyecto de Supabase
2. Copia y pega el script: supabase/backup_database.sql
3. Ejecuta el script
4. Los datos se exportarán en formato CSV (una tabla a la vez)

### Ventajas:
- ✓ Control granular sobre qué tablas exportar
- ✓ Formato CSV fácil de importar
- ✓ Útil para backups parciales


## OPCIÓN 3: Instalar Supabase CLI (Recomendado para automatización)
## ===================================================================

### Instalación en Windows:

#### Opción A: Usando Scoop (Recomendado)
```powershell
# Si no tienes Scoop, instálalo primero:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Luego instala Supabase CLI:
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Opción B: Usando npm
```powershell
npm install -g supabase
```

#### Opción C: Usando Chocolatey
```powershell
choco install supabase
```

### Verificar instalación:
```powershell
supabase --version
```

### Autenticarse:
```powershell
supabase login
```

### Ejecutar backup:
```powershell
# Backup local (si tienes base de datos local)
.\scripts\backup-database.ps1

# Backup remoto (Supabase Cloud)
.\scripts\backup-remote-database.ps1
```


## OPCIÓN 4: Backup Manual Simple (Para emergencias)
## ==================================================

Si necesitas un backup AHORA y no puedes instalar nada:

### Pasos Rápidos:
1. Ve a tu proyecto en Supabase Dashboard
2. Para cada tabla importante, ejecuta en SQL Editor:
   ```sql
   COPY (SELECT * FROM nombre_tabla) TO STDOUT WITH CSV HEADER;
   ```
3. Copia el resultado y guárdalo en un archivo .csv
4. Repite para cada tabla

### Tablas críticas a respaldar (en orden de prioridad):
1. organizations
2. users
3. farms
4. raw_inventory_batches
5. prepared_inventory_batches
6. products
7. sales
8. lab_analyses


## INFORMACIÓN DE TU PROYECTO
## ============================

Project URL: https://gcxsrvvmfhhvbxwhknau.supabase.co
Project Ref: gcxsrvvmfhhvbxwhknau
Dashboard: https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau


## RECOMENDACIÓN INMEDIATA
## ========================

Para hacer un backup AHORA sin instalar nada:

1. Ve a: https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/database/backups

2. Si tienes backups automáticos habilitados:
   - Descarga el backup más reciente
   - Guárdalo en un lugar seguro

3. Si no tienes backups automáticos:
   - Habilita los backups automáticos ahora
   - Luego descarga el backup cuando esté listo

4. Para backups futuros:
   - Instala Supabase CLI (Opción 3)
   - Usa los scripts que creé: backup-database.ps1 o backup-remote-database.ps1
