---
name: e2e-tester
description: Habilita y obliga a usar el agente de navegación (browser subagent) para realizar pruebas End-to-End simulando comportamiento real de usuario, como un registro o un flujo de pago.
---

# 🤖 E2E Tester Skill

Esta directriz indica a la IA que deje de lado las asunciones teóricas y ponga a prueba el código generado simulando interacciones reales con un navegador a través de la herramienta `browser_subagent`.

## ¿Cuándo y Cómo se activa?

Se activa obligatoriamente al finalizar la implementación de un **Flujo Crítico** (por ejemplo: Registro de Usuario, Login, Creación de un Reporte nuevo, o un Proceso de Pago), o cuando el usuario solicita una verificación "en el mundo real".

### Protocolo de Prueba Estándar (Ejemplo: Registro de Usuario)

Si vas a lanzar el subagente para probar el "Registro Completo", el prompt al `browser_subagent` debe contemplar explícitamente los siguientes pasos que harían de QA automatizado:

1. **Arranque y Navegación:**
   - Navegar a la URL local (ej. `http://localhost:5173`) o de staging.
2. **Interacción con el DOM:**
   - Hacer clic en el botón de "Registrarse" o ir a `/register`.
   - Llenar los campos de prueba (ej. `test-e2e@example.com`, `password123`, `Mi Cafetería`).
   - Hacer clic en "Crear Cuenta".
3. **Validación Visual de Éxito:**
   - Esperar a que la página redirija (por ejemplo, al `/dashboard`).
   - Observar si se muestra alguna notificación de "Toast" temporal (ej. "Cuenta creada exitosamente").
4. **Verificación de Casos Falsos (Opcional pero recomendado):**
   - Intentar usar un correo ya registrado para comprobar que el frontend captura correctamente el error (siguiendo lo estipulado en el `logic-validator`).
5. **Reporte:**
   - Al retornar el agente, la IA (el sistema principal) debe informar al usuario si el flujo funcionó de principio a fin, adjuntando la grabación (.webm/.webp) generada por el agente para que el humano vea visualmente el hito cumplido.
