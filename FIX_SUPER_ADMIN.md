# 🔧 Solución: Super Admin Bloqueado por RLS

## Problema

Después de ejecutar la migración `db_migration_full.sql`, el super admin (`barrientosverab@gmail.com`) solo puede acceder al Panel Maestro pero no puede ver datos de ninguna organización.

### Causa

Las políticas de **Row Level Security (RLS)** aplicadas en la migración requieren que el usuario tenga un `organization_id` válido en la tabla `profiles`. El super admin no tiene (y no debería tener) un `organization_id` porque debe poder ver datos de **todas** las organizaciones.

Las políticas actuales solo permiten acceso con esta condición:
```sql
organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
```

Como el super admin no tiene `organization_id`, esta consulta retorna vacío y bloquea el acceso.

---

## ✅ Solución Recomendada

Ejecutar el script: `supabase/migrations/20260117_fix_super_admin_rls.sql`

Este script crea políticas especiales que otorgan acceso completo al super admin sin requerir `organization_id`.

### Pasos:

1. **Abrir Supabase SQL Editor:**
   ```
   https://app.supabase.com/project/gcxsrvvmfhhvbxwhknau/sql/new
   ```

2. **Copiar y pegar** todo el contenido del archivo:
   ```
   supabase/migrations/20260117_fix_super_admin_rls.sql
   ```

3. **Ejecutar** el script (botón "Run")

4. **Verificar** que funcionó:
   ```sql
   SELECT * FROM verify_super_admin_policies();
   ```
   
   Deberías ver una tabla con todas las tablas y `has_super_admin_policy = true`

5. **Probar** acceso:
   - Cerrar sesión en la aplicación
   - Iniciar sesión con `barrientosverab@gmail.com`
   - Intentar acceder a cualquier módulo (Ventas, Productos, etc.)
   - ✅ Ahora deberías poder ver datos de todas las organizaciones

---

## 🔍 ¿Qué hace el script?

### 1. Crea una función para verificar si es super admin

```sql
CREATE OR REPLACE FUNCTION is_super_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  ) = 'barrientosverab@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Agrega políticas especiales a todas las tablas

```sql
CREATE POLICY "super_admin_full_access" ON public.organizations
  FOR ALL USING (is_super_admin());

CREATE POLICY "super_admin_full_access" ON public.sales_orders
  FOR ALL USING (is_super_admin());

-- ... y así para todas las tablas
```

### 3. Cómo funciona

Postgres evalúa **todas** las políticas RLS con **OR** lógico:

```
Acceso permitido SI:
  (is_super_admin() = true) 
  OR 
  (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))
```

- **Super admin:** Primera condición es `true` → ✅ Acceso total
- **Usuario normal:** Segunda condición es `true` solo para su org → ✅ Acceso limitado

---

## ⚠️ Solución Alternativa (NO RECOMENDADA)

Si por alguna razón no quieres usar políticas especiales, puedes **deshabilitar RLS temporalmente**:

```sql
-- SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
-- ... etc para todas las tablas
```

**Problemas con esta opción:**
- ❌ Todos los usuarios pueden ver datos de todas las organizaciones
- ❌ No hay aislamiento multi-tenant
- ❌ Violación de seguridad grave

---

## 🔐 Seguridad

### ¿Es seguro darle acceso completo al super admin?

**Sí**, porque:

1. ✅ El email está hardcodeado en la función `is_super_admin()`
2. ✅ Solo ese email específico obtiene acceso
3. ✅ No se puede cambiar sin modificar la base de datos
4. ✅ Los usuarios normales siguen con acceso limitado

### ¿Qué puede hacer el super admin?

- **Ver** todos los datos de todas las organizaciones
- **Modificar** cualquier registro
- **Eliminar** cualquier registro  
- **Insertar** en cualquier tabla

Esto es correcto para un super admin que necesita:
- Gestionar organizaciones
- Solucionar problemas
- Generar reportes globales
- Inyectar datos demo

---

## 📝 Cambiar el Email del Super Admin

Si necesitas cambiar el email del super admin en el futuro:

1. Editar el script `20260117_fix_super_admin_rls.sql`
2. Cambiar la línea 12:
   ```sql
   PERFORM set_config('app.super_admin_email', 'NUEVO_EMAIL@example.com', false);
   ```
3. Ejecutar el script nuevamente

O ejecutar directamente:
```sql
-- Actualizar la función is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  ) = 'nuevo_email@example.com';  -- ← Cambiar aquí
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Checklist de Verificación

Después de ejecutar el script:

- [ ] Script ejecutado sin errores
- [ ] Función `verify_super_admin_policies()` retorna `true` para todas las tablas
- [ ] Cerrado sesión y vuelto a iniciar
- [ ] Puede acceder a Dashboard
- [ ] Puede ver lista de ventas
- [ ] Puede ver lista de productos
- [ ] Puede ver lista de clientes
- [ ] Panel Super Admin sigue funcionando

---

## 🆘 Si Algo Sale Mal

### Error: "policy already exists"

Significa que ya ejecutaste el script antes. Para re-ejecutar:

```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "super_admin_full_access" ON public.organizations;
DROP POLICY IF EXISTS "super_admin_full_access" ON public.sales_orders;
-- ... etc para todas las tablas

-- Luego ejecutar el script nuevamente
```

### Error: "permission denied"

Asegúrate de estar conectado con el usuario de Supabase que tiene permisos de super admin en la base de datos (no en la aplicación).

### Sigo sin poder acceder

1. Verificar que el email en `is_super_admin()` coincide con el tuyo:
   ```sql
   SELECT is_super_admin();  -- Debe retornar true
   ```

2. Verificar que estás autenticado:
   ```sql
   SELECT auth.uid();  -- Debe retornar tu user ID, no null
   ```

3. Verificar que las políticas existen:
   ```sql
   SELECT * FROM verify_super_admin_policies();
   ```

---

## 📚 Referencias

- [Documentación de RLS en Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- [Políticas de PostgreSQL](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- Migración original: `db_migration_full.sql`
