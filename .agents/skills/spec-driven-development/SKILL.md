# Skill: Spec-Driven Development (SDD) & Logic Validator
# Trigger: At the start of any feature implementation, or when reviewing/writing business logic

## Directives
1. Before writing frontend or backend code, look for and read existing functional requirements, markdown specifications, or PRD files in the repository.
2. Align all generated components, hooks, or business logic strictly with the rules defined in the project documentation.
3. If an implementation detail contradicts or is missing from the local specifications, pause and request clarification from the developer instead of writing generic code.

## La Directiva del "Caso de Borde" (Logic Validation)
Antes de confirmar cualquier implementación o dar por terminado el código, debes forzar el análisis explícito de escenarios en los que el sistema pueda romperse o comportarse inesperadamente. DEBES cuestionarte (y solventar en el código) lo siguiente:

- **Pérdidas de Conexión, Fallos o Latencia en la Red:** Manejo activo de estados de carga (`loading`), timeouts en peticiones y recuperación o persistencia intermedia.
- **Doble Envío (Double Submission):** Deshabilitar de inmediato botones tras el clic (ej. `disabled={isSubmitting}`) o aplicar bloqueos lógicos (debouncing/throttling).
- **Operaciones Transaccionales Fraccionadas:** Emplear endpoints en el backend o RPCs atómicos (`BEGIN... COMMIT... ROLLBACK`) para operaciones dependientes en lugar de peticiones fraccionadas.
- **Variables Indefinidas o Vacías:** Proveer UI para "Estados vacíos" (Empty States) y aplicar tipado estricto o fallbacks (`??`, `?.`).
