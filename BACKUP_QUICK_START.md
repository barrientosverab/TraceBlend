# 🔒 Sistema de Backup - TraceBlend Database

## 📊 Estado Actual

- **Base de datos:** Supabase Cloud (Remota)
- **Project ID:** gcxsrvvmfhhvbxwhknau
- **URL:** https://gcxsrvvmfhhvbxwhknau.supabase.co
- **Supabase CLI:** ❌ No instalado

---

## ✅ OPCIÓN RECOMENDADA (Más Rápida)

### 🎯 Backup desde Supabase Dashboard

1. **Abre el Dashboard:**
   - Ve a: https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/database/backups

2. **Descarga el Backup:**
   - Haz clic en "Download" en el backup más reciente
   - O crea un nuevo backup manual y descárgalo

3. **Guarda el archivo:**
   - Guárdalo en: `D:\AppTostaduria\trace-blend\backups\`
   - Nombre sugerido: `backup_YYYYMMDD.sql`

**⏱️ Tiempo estimado:** 2-3 minutos

---

## 📋 Opciones Alternativas

### Opción 1: Usar el SQL Editor (Sin instalación)

**Archivo a usar:** `supabase\backup_generator.sql`

**Pasos:**
1. Abre: https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/sql
2. Copia el contenido de `supabase\backup_generator.sql`
3. Ejecuta el script
4. Copia los resultados y guárdalos en un archivo

**Pros:**
- ✓ No requiere instalación
- ✓ Control total sobre qué exportar

**Contras:**
- ✗ Más manual
- ✗ Requiere ejecutar múltiples queries

---

### Opción 2: Instalar Supabase CLI (Para automatización futura)

**Scripts disponibles:**
- `scripts\backup-database.ps1` - Backup local
- `scripts\backup-remote-database.ps1` - Backup remoto

**Instalación rápida (PowerShell como Admin):**

```powershell
# Opción A: Scoop (Recomendado)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Opción B: npm
npm install -g supabase

# Verificar
supabase --version

# Autenticarse
supabase login

# Ejecutar backup
.\scripts\backup-remote-database.ps1
```

**Pros:**
- ✓ Automatizable
- ✓ Backups programados
- ✓ Integración con CI/CD

**Contras:**
- ✗ Requiere instalación inicial

---

## 📚 Documentación Detallada

- **Guía completa:** `scripts\BACKUP_README.md`
- **Sin CLI:** `scripts\BACKUP_SIN_CLI.md`

---

## ⚡ Acción Inmediata Recomendada

1. **AHORA:** Ve al dashboard y descarga un backup manual
   - Link directo: https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/database/backups

2. **Guárdalo en:**
   ```
   D:\AppTostaduria\trace-blend\backups\backup_20260116.sql
   ```

3. **Después:** Habilita backups automáticos diarios en Supabase

4. **Futuro:** Instala Supabase CLI para backups automatizados

---

## 🔄 Restaurar un Backup

### Desde archivo .sql:

1. Ve al SQL Editor: https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/sql
2. Abre el archivo de backup
3. Copia y pega el contenido
4. Ejecuta el script

### Con Supabase CLI:

```powershell
supabase db push --project-ref gcxsrvvmfhhvbxwhknau
```

---

## 📞 Necesitas Ayuda?

Si tienes problemas:

1. **Dashboard no carga:** Revisa tu conexión a internet
2. **No ves opción de backups:** Verifica tu plan de Supabase
3. **Error en SQL:** Contacta al equipo de desarrollo

---

## 🎯 Resumen de Archivos Creados

```
trace-blend/
├── scripts/
│   ├── backup-database.ps1              # Backup local automático
│   ├── backup-remote-database.ps1       # Backup remoto automático
│   ├── BACKUP_README.md                 # Documentación completa
│   └── BACKUP_SIN_CLI.md                # Guía sin Supabase CLI
└── supabase/
    ├── backup_database.sql              # Backup manual CSV
    └── backup_generator.sql             # Generador de backups SQL
```

---

> **💡 Tip:** El método más rápido y confiable es usar el Dashboard de Supabase.
> Los scripts de PowerShell son útiles para automatización futura.
