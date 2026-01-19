# 🔧 Solución: Usuarios con Plan de Pago Bloqueados

## Problema

Los usuarios que ya pagaron y tienen **Plan Profesional** asignado aún ven el mensaje de **"Función Premium - Contactar para Actualizar"** al intentar acceder a los módulos.

## Causa

El problema tiene **dos partes**:

1. **Base de Datos:** La vista `organization_subscription_details` necesita ser recreada para reflejar las nuevas features configuradas
2. **Frontend:** El caché en memoria está guardando información obsoleta de antes de la limpieza de planes

## ✅ Solución Completa (3 Pasos)

### Paso 1: Ejecutar Script SQL en Supabase ⭐ **CRÍTICO**

1. Abrir Supabase SQL Editor:
   ```
   https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/sql/new
   ```

2. Copiar TODO el contenido del archivo:
   ```
   d:\AppTostaduria\trace-blend\supabase\migrations\20260119_fix_subscription_access.sql
   ```

3. Pegar en el editor y ejecutar (botón "Run")

4. Verificar que aparezcan estos mensajes en los resultados:
   ```
   ✅ Organizaciones con features: 3
   ✅ Todas las organizaciones tienen plan asignado
   📊 Total de features configuradas: 31
   ```

5. Al final debe mostrar una tabla con las organizaciones del Plan Profesional y sus 17 features

### Paso 2: Limpiar Caché del Navegador 🌐 **IMPORTANTE**

**Usuarios afectados deben hacer:**

1. **Hard Refresh** en el navegador:
   - **Windows/Linux:** `Ctrl + Shift + R` o `Ctrl + F5`
   - **Mac:** `Cmd + Shift + R`

2. **Alternativamente**, Limpiar caché del navegador:
   - Chrome/Edge: `Ctrl + Shift + Delete` → Limpiar datos de navegación → Imágenes y archivos en caché
   - Firefox: `Ctrl + Shift + Delete` → Caché

3. **Cerrar sesión y volver a iniciar** en TraceBlend

### Paso 3: Verificar Acceso ✅

1. Iniciar sesión con un usuario del **Plan Profesional**

2. Intentar acceder a cualquier módulo:
   - ✅ Laboratorio
   - ✅ Tueste
   - ✅ Trilla
   - ✅ Proyecciones
   - ✅ Finanzas
   - ✅ Todos los demás

3. ✅ **Ahora deberían funcionar sin mensajes de bloqueo**

---

## 🔍 ¿Por Qué Ocurrió Esto?

Cuando ejecutamos la limpieza de planes (`20260119_cleanup_subscription_plans.sql`):

1. ✅ Eliminamos planes obsoletos
2. ✅ Configuramos features para los 3 planes nuevos
3. ✅ Reasignamos organizaciones al Plan Profesional

**PERO:**

- ❌ La vista `organization_subscription_details` quedó con información desactualizada
- ❌ El caché del frontend guardó el estado "sin features"
- ❌ Los usuarios siguieron viendo "Función Premium"

---

## 🎯 Qué Hace el Script de Corrección

### 1. Recrea laVista de Suscripciones

```sql
CREATE VIEW organization_subscription_details AS
SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    sp.name AS plan_name,
    sp.code AS plan  _code,
    ARRAY_AGG(spf.feature_code) AS available_features  -- ✅ Features actualizadas
FROM organizations o
LEFT JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
LEFT JOIN subscription_plan_features spf ON sp.id = spf.subscription_plan_id
GROUP BY ...
```

### 2. Actualiza la Función de Verificación

```sql
CREATE OR REPLACE FUNCTION has_feature_access(...)
-- Ahora usa la vista recreada
-- Retorna TRUE si la organización tiene la feature
```

### 3. Verifica el Resultado

- Cuenta organizaciones con features ✅
- Muestra total de features configuradas (debería ser 31: 7+12+12) ✅
- Lista organizaciones del Plan Profesional y sus 17 features ✅

---

## 🆘 Si Aún No Funciona

### Diagnóstico Paso a Paso

#### 1. Verificar que el Plan Profesional tiene features

```sql
SELECT sp.name, COUNT(spf.feature_code) as total_features
FROM subscription_plans sp
LEFT JOIN subscription_plan_features spf ON sp.id = spf.subscription_plan_id
WHERE sp.code = 'professional'
GROUP BY sp.name;
```

**Debe retornar:** `Plan Profesional | 17`

#### 2. Verificar que la organización tiene el plan asignado

```sql
SELECT o.name, sp.name as plan
FROM organizations o
LEFT JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
WHERE o.name = '[NOMBRE_ORGANIZACION]';
```

**Debe mostrar:** `[Org] | Plan Profesional`

#### 3. Verificar la vista directamente

```sql
SELECT 
    organization_name,
    plan_name,
    ARRAY_LENGTH(available_features, 1) as feature_count,
    available_features
FROM organization_subscription_details
WHERE organization_name = '[NOMBRE_ORGANIZACION]';
```

**Debe retornar:** `feature_count = 17` y un array con todas las features

#### 4. Si TODO lo anterior está correcto

El problema es **solo** de caché del navegador:

1. Abrir DevTools (F12)
2. Ir a Application → Storage → Clear site data
3. Recargar la página
4. Cerrar sesión y volver a iniciar

---

## 📝 Notas Técnicas

### Super Admin vs Usuarios Normales

- ✅ **Super Admin** (`barrientosverab@gmail.com`): Tiene bypass en el código (no consulta la base de datos)
- ✅ **Usuarios Normales**: Consultan la vista `organization_subscription_details` para obtener sus features

### Proceso de Verificación

1. Usuario intenta acceder a `/laboratorio`
2. `PermissionGuard` verifica si tiene acceso
3. Llama a `useSubscriptionAccess('laboratory')`
4. El hook llama a `hasFeatureAccess(orgId, 'laboratory')`
5. Consulta la vista `organization_subscription_details`
6. Verifica si `'laboratory'` está en `available_features`
7. ✅ Si está: permite acceso
8. ❌ Si no está: muestra pantalla de upgrade

### Dónde Están los Bypasses para Super Admin

1. [`Sidebar.tsx`](file:///d:/AppTostaduria/trace-blend/src/components/layout/Sidebar.tsx) - Línea 64-84
2. [`PermissionGuard.tsx`](file:///d:/AppTostaduria/trace-blend/src/components/auth/PermissionGuard.tsx) - Línea 36-39
3. [`useSubscriptionAccess.ts`](file:///d:/AppTostaduria/trace-blend/src/hooks/useSubscriptionAccess.ts) - Línea 38-43

---

## ✅ Checklist de Verificación

Después de ejecutar el script y limpiar caché:

- [ ] Script SQL ejecutado sin errores
- [ ] Verificación muestra "✅ Organizaciones con features: 3"
- [ ] Usuarios hicieron Hard Refresh (Ctrl+F5)
- [ ] Usuarios cerraron sesión y volvieron a iniciar
- [ ] Pueden acceder a Dashboard
- [ ] Pueden acceder a Laboratorio
- [ ] Pueden acceder a Tueste
- [ ] Pueden acceder a Proyecciones
- [ ] Pueden acceder a Finanzas
- [ ] No ven mensajes de "Función Premium"

---

**Fecha de Solución:** 19 de Enero de 2026, 15:15  
**Archivos Modificados:**
- Script SQL: `20260119_fix_subscription_access.sql`
- Vista recreada: `organization_subscription_details`
- Función actualizada: `has_feature_access()`

**Estado:** ✅ Lista para ejecutar
