---
name: log-analyzer
description: Lee de manera proactiva los logs (terminal, navegador o hosting como Supabase/Vercel) para detectar errores de rendimiento o fallos silenciosos no fatales.
---

# 🕵️ Log Analyzer & Performance Monitor Skill

A veces las aplicaciones "funcionan" y pasan los tests de extremo a extremo (E2E), pero las consolas o el servidor sueltan advertencias silenciosas que a la larga destruirán la experiencia del usuario (como memory leaks, fetchs dobles y renderizaciones masivas). 

Esta directiva te obliga a detenerte y "leer el monitor cardíaco" del código.

## Focos de Análisis de Logs Obligatorio:

Durante una sesión de desarrollo o al terminar un módulo complejo, DEBES revisar u ordenar la lectura de:

1. **Consola del Navegador (Frontend React/Vite):**
   - **Renderizados Innecesarios:** ¿Se montó la vista 8 veces por un mal manejo de estado global u observadores? Si la consola hace un spam de logs o peticiones de red idénticas, debe ser refactorizado.
   - **Advertencias Clásicas:** `Warning: Each child in a list should have a unique 'key' prop` o `React Hook useEffect has a missing dependency`.
   - **Memory Leaks:** `Warning: Can't perform a React state update on an unmounted component`.

2. **Consola del Terminal (Node/Vite Build):**
   - Errores crudos de TypeScript que no crashean el servidor dev pero ensucian el transpilado.
   - Advertencias de tamaño de paquete (`chunk size warning`), obligándote a sugerir *Code Splitting* o *Lazy Loading* (ej. importar gráficos pesados asíncronamente solo cuando el usuario haga scroll a ellos).

3. **Logs del Hosting y Bases de Datos (ej. Supabase):**
   - Leer herramientas de diagnóstico para *Slow Queries*. ¿Hay una consulta que demoró 850ms en un backend que debe rendir a 50ms? (Aplicable de la mano del `db-optimizer`).
   - Problemas con Rate Limiting (Demasiados HTTP 429).

### Método de Reparación:
Nunca silencies estas advertencias con comentarios estilo `// eslint-disable-next-line`. Tu trabajo es atacar la causa raíz para mantener un "Clean Log" (Consola Limpia) en todo el ciclo de vida del SaaS.
