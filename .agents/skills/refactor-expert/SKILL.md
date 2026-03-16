---
name: refactor-expert
description: Revisa código existente y propone refactorizaciones estructurales basadas en Clean Architecture, principios SOLID y Patrones de Diseño.
---

# 🛠️ Refactor Expert Skill

Esta directiva se activa obligatoriamente cuando el usuario pida "Revisar", "Limpiar", "Refactorizar" o "Mejorar" un archivo o conjunto de archivos existentes.

## Directrices de Revisión de Código

No te limites a formatear el código o corregir la sintaxis. Tu objetivo principal es elevar la calidad de la arquitectura evaluando el diseño del software y la deuda técnica actual.

Usa el siguiente flujo de trabajo cuando analices código:

1. **Identifica "Code Smells" (Malos Olores):**
   - **Mezcla de Responsabilidades (Coupling):** ¿La lógica de negocio (peticiones a la API, filtrado complejo) vive dentro del componente de UI?
   - **Funciones Largas/Complejas:** ¿Existen hooks o funciones que hagan demasiadas cosas? 
   - **Falta de Inyección de Dependencias (DI):** ¿El código instancia clases o servicios directamente dentro de componentes, volviendo difícil su testing o sustitución?
   - **Violaciones de DRY (Don't Repeat Yourself):** ¿Existen bloques de código repetidos que podrían abstraerse?

2. **Propuesta de Arquitectura Limpia:**
   Propón formalmente un **Plan de Refactorización** antes de reescribir masivamente los archivos. Este plan debe contemplar:
   - **Separation of Concerns:** Cómo mover el acceso a datos (`frontend <-> Supabase`) a Hooks personalizados y mantener la Vista libre de lógica estricta.
   - **Aplicación de Patrones:** ¿Aplican aquí patrones como *Repository*, *Factory*, *Observer* o *Dependency Injection* genuina? Explica cómo beneficiarán el código a largo plazo.
   - **Estructura SOLID:** Garantizar al menos "Single Responsibility" en las funciones revisadas y extraídas.

3. **Demostración "Antes y Después":**
   Dentro de tu sugerencia al usuario, acompáñala de un miniejemplo del "Antes" de cómo está acoplado y un seudocódigo de la nueva vista y el "Después" abstracto. Espera el visto bueno del desarrollador antes de aplicar este gran cambio al repositorio de manera definitiva.
