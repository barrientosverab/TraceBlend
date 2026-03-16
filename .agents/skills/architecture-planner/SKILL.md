---
name: architecture-planner
description: Obliga a generar un plan de implementación (implementation_plan.md) detallando la comunicación frontend/backend y los cambios propuestos antes de escribir código.
---

# 🏗️ Architecture Planner Skill

**Regla de Oro:** *Antes de escribir o modificar código de la aplicación*, **DEBES** crear o actualizar un archivo `implementation_plan.md` (o proponer un resumen de la arquitectura al usuario) para obtener su aprobación explícita.

## Requisitos del Plan de Implementación

Al realizar una tarea que involucre nuevas vistas, conexiones a base de datos, o flujos lógicos, genera un plan que conteste lo siguiente:

1. **Objetivo de la Tarea:** 
   - Descripción del problema o funcionalidad a resolver.
   - Posible impacto en archivos existentes frente a la creación de nuevos archivos.

2. **Diseño de la Comunicación Frontend <-> Backend:**
   - **Endpoints / Queries de Supabase:** Nombra las funciones RPC, funciones Edge de Supabase o las tablas involucradas que vas a consumir.
   - **Contratos (Interfaces/Tipos):** Define claramente qué estructura de datos viaja entre el cliente y el backend. ¿Qué recibe la petición de red y qué responde?
   - **Manejo de Errores y Carga:** Define cómo el Frontend reaccionará cuando el servidor esté cargando, falle o retorne datos vacíos.

3. **Plan de Ejecución:**
   - Lista paso a paso de lo que se va a modificar o crear (Backend primero, Frontend después, o viceversa).
   - Pruebas o verificaciones manuales/automáticas para validar que todo funcione tras los cambios.

## Restricción de Ejecución

**NO** comiences a realizar llamadas a las herramientas de edición de código (ej. modficando componentes React, esquemas de SQL) hasta que el plan estructurado haya sido compartido con el usuario y este te responda positivamente dando "luz verde" a la arquitectura.
