---
name: architectural-pillars
description: Fundamenta toda toma de decisiones, arquitectura y refactorización del código estrictamente bajo los principios de Clean Architecture, Patrones GoF y System Design Primer.
---

# 🏛️ Architectural Pillars Skill

Esta es tu directiva fundacional. Cada vez que diseñes, estructures, refactorices o resuelvas un problema técnico complejo para **Trace Blend**, **DEBES** recurrir obligatoriamente a los siguientes 3 pilares de la ingeniería de software y **citar cuál estás empleando en tu razonamiento**:

## Pilar 1: Estructura - "Clean Architecture" (Robert C. Martin)
Todo el código debe diseñarse en capas concéntricas con **Inversión de Dependencias** (Dependency Rule).
- **Entidades/Core:** Lógica de negocio pura (ej. Tipos Base de Tostaduría, Funciones matemáticas).
- **Casos de Uso (Interactors):** La lógica de la aplicación (ej. "Crear Reporte de Venta", "Procesar Tueste").
- **Adaptadores de Interfaz:** Controladores, Hooks en React, Presentadores. *Deben estar aislados de las reglas de negocio.*
- **Frameworks & Drivers:** UI (React), Base de Datos (Supabase), Librerías externas. Reemplazables en la medida de lo posible.

*Acción obligada:* Jamás mezcles lógica de extracción de datos de Supabase incrustada de manera rígida dentro de un `<button>` de React. Usa servicios o Hooks personalizados.

## Pilar 2: Patrones - "Design Patterns" (Gang of Four - GoF)
Al encontrar un problema repetitivo de diseño orientado a objetos (o composición en funciones), aplica y menciona soluciones estándar:
- **Creacionales:** `Factory`, `Builder`, `Singleton` (ideal para manejar instanciaciones del cliente de Supabase).
- **Estructurales:** `Adapter` (para traducir respuestas de APIs externas a tu modelo interno), `Facade`, `Decorator`.
- **De Comportamiento:** `Observer` (para estados globales y suscripciones en tiempo real), `Strategy`, `Command`.

*Acción obligada:* Si propones refactorizar 5 sentencias `if/else` complejas, menciona si estás aplicando un patrón `Strategy` u otra alternativa GoF.

## Pilar 3: Escalabilidad - "System Design Primer" (Donne Martin)
Al tocar sistemas distribuidos, bases de datos masivas o rendimiento general del backend, implementa conceptos del System Design Primer:
- **Disponibilidad vs Consistencia (CAP Theorem):** Si es necesario, elige sabiendo las consecuencias.
- **Bases de Datos:** Evalúa Índices, Sharding, RDBMS vs NoSQL, y Replicación. (Respalda al `db-optimizer`).
- **Caché y Red:** Sugiere CDNs, Memcached/Redis conceptual o *SWR* (Stale-While-Revalidate) en el frontend.
- **Asincronía:** Si un reporte demora mucho, sugiere moverlo a un paso asíncrono (*Background Job* / Edge Function) en lugar de que el usuario vea una carga infinita.

**Instrucción Final:** Al presentar un `implementation_plan.md` o la revisión del `refactor-expert`, DEBES escribir un pequeño bloque de "Fundamento Arquitectónico" citando en cuál de estos tres libros justificas tu propuesta.
