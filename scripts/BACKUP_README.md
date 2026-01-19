# 📦 Guía de Backup y Restauración de Base de Datos

Esta carpeta contiene scripts para crear backups de la base de datos TraceBlend.

## 🎯 Opciones de Backup Disponibles

### 1. Backup Local (Base de datos de desarrollo)

**Archivo:** `backup-database.ps1`

**Uso:**
```powershell
# Backup completo (esquema + datos)
.\scripts\backup-database.ps1

# Solo esquema (sin datos)
.\scripts\backup-database.ps1 -SchemaOnly

# Especificar directorio personalizado
.\scripts\backup-database.ps1 -BackupDir "D:\MisBackups"
```

**Requisitos:**
- Supabase CLI instalado
- Base de datos local corriendo (`supabase start`)

---

### 2. Backup Remoto (Supabase Cloud)

**Archivo:** `backup-remote-database.ps1`

**Uso:**
```powershell
# Backup completo de la base de datos en Supabase Cloud
.\scripts\backup-remote-database.ps1 -ProjectRef "tu-project-ref"

# El script intentará detectar automáticamente el project ref del .env
.\scripts\backup-remote-database.ps1

# Solo esquema
.\scripts\backup-remote-database.ps1 -ProjectRef "tu-project-ref" -SchemaOnly
```

**Requisitos:**
- Supabase CLI instalado y autenticado (`supabase login`)
- Project Reference de tu proyecto en Supabase

---

### 3. Backup Manual SQL (Desde Supabase Dashboard)

**Archivo:** `backup_database.sql`

**Pasos:**
1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a SQL Editor
3. Copia y pega el contenido de `supabase/backup_database.sql`
4. Ejecuta el script
5. Los datos se exportarán en formato CSV

---

## 🔄 Restaurar un Backup

### Restaurar en base de datos local:

```powershell
# Resetear la base de datos
supabase db reset

# Restaurar desde un backup
psql -h localhost -p 54322 -U postgres -d postgres -f ".\backups\traceblend_backup_YYYYMMDD_HHMMSS.sql"
```

### Restaurar en Supabase Cloud:

```powershell
# Usando Supabase CLI
supabase db push --project-ref tu-project-ref

# O usando el Dashboard de Supabase:
# 1. Ve a Database > SQL Editor
# 2. Copia y pega el contenido del archivo .sql
# 3. Ejecuta el script
```

---

## 📁 Estructura de Archivos de Backup

Cuando ejecutas un backup, se crean los siguientes archivos:

```
backups/
└── traceblend_backup_20260116_151607/
    ├── traceblend_backup_20260116_151607.sql          # Dump completo
    ├── traceblend_backup_20260116_151607_migrations/  # Copia de migraciones
    └── traceblend_backup_20260116_151607_metadata.json # Info del backup
```

---

## ⚙️ Instalación de Supabase CLI

Si no tienes Supabase CLI instalado:

**Windows (usando Scoop):**
```powershell
scoop install supabase
```

**Windows (usando npm):**
```powershell
npm install -g supabase
```

**Verificar instalación:**
```powershell
supabase --version
```

---

## 🔐 Autenticación en Supabase

Para hacer backups remotos, necesitas autenticarte:

```powershell
# Iniciar sesión
supabase login

# Verificar autenticación
supabase projects list
```

---

## 📋 Mejores Prácticas

1. **Backup regular:** Haz backups antes de:
   - Cambios importantes en la base de datos
   - Ejecutar migraciones
   - Actualizar el esquema
   - Desplegar a producción

2. **Almacenamiento:**
   - Guarda los backups fuera del repositorio Git
   - Considera usar servicios cloud (Google Drive, Dropbox, etc.)
   - Mantén múltiples versiones (al menos las últimas 3-5)

3. **Verificación:**
   - Prueba restaurar los backups periódicamente
   - Verifica que los datos estén completos

4. **Seguridad:**
   - No compartas backups públicamente (contienen datos sensibles)
   - Encripta los backups si los envías por internet

---

## 🆘 Solución de Problemas

### Error: "Supabase CLI no encontrado"
```powershell
# Instala Supabase CLI
scoop install supabase
```

### Error: "No estás autenticado"
```powershell
# Inicia sesión
supabase login
```

### Error: "Base de datos no está corriendo"
```powershell
# Inicia la base de datos local
supabase start
```

### El backup está vacío o incompleto
- Verifica que la base de datos tenga datos
- Revisa los logs de Supabase: `supabase status`
- Intenta con el backup remoto en lugar del local

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la documentación de Supabase: https://supabase.com/docs
2. Verifica los logs: `supabase status`
3. Consulta el historial de conversaciones de este proyecto
