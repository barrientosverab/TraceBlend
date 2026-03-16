---
name: logic-validator
description: Exige y valida el manejo de "casos de borde" (edge cases) y condiciones de fallo para garantizar la solidez en la lógica de negocio.
---

# 🛡️ Logic Validator Skill

Esta directriz entra en acción de forma automática durante la escritura, revisión y planeación de lógica de negocio (ej. llamadas a base de datos, transacciones financieras, inserciones/actualizaciones en lote).

## La Directiva del "Caso de Borde"

**Antes de confirmar cualquier implementación o dar por terminado el código, debes forzar el análisis explícito de escenarios en los que el sistema pueda romperse o comportarse inesperadamente.** 

DEBES cuestionarte (y solventar en el código) lo siguiente:

1. **Pérdidas de Conexión, Fallos o Latencia en la Red:**
   - ¿Qué pasa si el servidor (ej. Supabase) tarda 15 segundos en responder?
   - ¿Qué pasa si el usuario pierde la conexión en medio de un proceso crítico (ej. al procesar un pago)?
   - *Mitigación esperada:* Manejo activo de estados de carga (`loading`), timeouts en peticiones y recuperación o persistencia intermedia.

2. **Doble Envío (Double Submission):**
   - ¿Qué pasa si el usuario hace clics múltiples y muy rápidos en el botón de confirmación?
   - *Mitigación esperada:* Deshabilitar de inmediato botones tras el clic (ej. `disabled={isSubmitting}`) o aplicar bloqueos lógicos en backend/frontend (debouncing/throttling).

3. **Operaciones Transaccionales Fraccionadas:**
   - Si la funcionalidad crea 3 cosas (ej. Usuarios, Perfil, Preferencias), ¿qué ocurre si el registro del Usuario triunfa pero falla la creación del Perfil?
   - *Mitigación esperada:* Emplear endpoints en el backend o RPCs de Supabase (`BEGIN... COMMIT... ROLLBACK`) de manera atómica para evitar datos "zombis" o incompletos, en lugar de 3 peticiones distintas en el frontend que pueden fallar a medias.

4. **Variables Indefinidas o Vacías:**
   - ¿Qué sucede visual y lógicamente si el arreglo de datos llega vacío `[]`, `null` o `undefined`?
   - *Mitigación esperada:* UI para "Estados vacíos" (Empty States) y tipado estricto o fallbacks en el código (ej. validaciones con nullish coalescing `??` y optional chaining `?.`).

Aplica esta metodología en la creación del Implementation Plan y dentro de los bloques `try/catch` del código fuente generado.
