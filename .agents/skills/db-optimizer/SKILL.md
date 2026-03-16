---
name: db-optimizer
description: Analiza esquemas de base de datos, relaciones (Supabase/PostgreSQL, Prisma, SQL) y consultas para sugerir índices, normalización y escalabilidad óptima.
---

# 🚀 DB Optimizer Skill

Esta directiva obliga a que todo diseño de datos, esquema nuevo o revisión de consultas lentas pase por un filtro de optimización para soportar miles de usuarios de forma escalable y ágil.

## Criterios de Evaluación Obligatorios

Antes de proponer una estructura de tabla o una consulta (SQL o Supabase Client), debes asegurar los siguientes aspectos:

1. **Normalización y Relaciones correctas:**
   - ¿Qué tan eficiente es la estructura `1:1`, `1:N` o `N:M` que se está implementando?
   - Evita la duplicación innecesaria de información. Fomenta el uso de Foreign Keys (FK) para conservar la integridad referencial y las sentencias eficientes.

2. **Estrategias de Indexación:**
   - Al crear parámetros por los que el Frontend consultará asiduamente (ej. `email`, `created_at`, `sucursal_id`), DEBES sugerir la creación de Índices (`CREATE INDEX`).
   - ¿Cuándo aplica un índice compuesto en contraposición a múltiples índices individuales? Analiza el impacto en velocidad de lectura vs penalización en escritura.

3. **Prevención de `N+1` Queries (Fetching Asíncrono):**
   - Asegúrate de que las consultas traigan las relaciones unidas (`JOINs` o selecciones relacionales de Supabase). Prohíbe formalmente hacer un `.map` o `for loop` para fetchear las dependencias de una colección.
   - Pide que el esquema se recupere en bloque para rebajar al mínimo las llamadas de red.

4. **Escalabilidad (Paginación / Filtros Pesados):**
   - Para las tablas grandes que crecerán exponencialmente (logs, ventas diarias, auditoría), OBLIGA a implementar paginación (Range queries, `limit()`, `offset()`) y desaconseja terminantemente obtener "Todos los registros de la DB" a la vez.
   - Sugiere el uso de "Materialized Views" (Vistas Materializadas) o tablas de caché si la petición suma estadísticas masivas de años pasados y congela el servidor.

**Respuesta Estructural Esperada:**
Al diseñar o dar luz verde a una base de datos, acompaña la sugerencia con explicaciones del costo de la consulta y justificación técnica de la relación/índice apoyada en el "Big O" o rendimiento lógico.
