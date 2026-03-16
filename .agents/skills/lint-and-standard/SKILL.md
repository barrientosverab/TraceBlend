---
name: lint-and-standard
description: Obliga a correr linters (ej. ESLint, TypeScript), formateadores, y validar vulnerabilidades de seguridad comunes (OWASP) de forma automática al cerrar una tarea.
---

# 🧹 Lint & Standard Skill

Esta directiva actúa como el **último gatekeeper (guardia)** antes de dar por completada cualquier implementación o refactorización.

## 1. Verificación Automática de Tipos y Estilos
Antes de decirle al usuario "He terminado la tarea", OBLIGATORIAMENTE debes proponer y ejecutar los scripts de revisión configurados en el proyecto. Por ejemplo:
- Correr el paso de linter: `npm run lint` o ejecutar el linter de la plataforma.
- Correr el chequeo de tipos estáticos: `tsc --noEmit` o el chequeador de TypeScript.
- **Corregir**: Si recibes errores sobre variables no utilizadas, dependencias faltantes en arrays de dependencias de React (`useEffect`), o tipos `any` implícitos, *debes solucionarlos en el código de forma proactiva* antes de dar por buena la tarea.

## 2. Auditoría de Seguridad Básica (Filtro OWASP)
Al generar código o revisarlo, mantén una rápida validación mental/explícita sobre vulnerabilidades clásicas:
- **Inyección (XSS / SQLi):** ¿Estamos renderizando HTML no sanitizado directamente con `dangerouslySetInnerHTML`? ¿Estamos concatenando `strings` en vez de parametrizar llamadas en la Base de Datos o Supabase? *(Prohibido)*.
- **Autenticación Rota:** ¿El endpoint confía ciegamente en inputs ocultos del cliente en vez de verificar el ID del usuario directamente del token/JWT en el backend (ej. `auth.uid()`)?
- **Control de Acceso Inseguro (IDOR):** ¿Puede un usuario modificar la orden o perfil de *otro* usuario alterando el parámetro `id` en la petición porque no pusiste un límite de "solo donde el propietario sea igual al usuario logeado"?
- **Exposición de Datos Sensibles:** Verifica que los `.env` no queden impresos en logs (`console.log`) locales del componente y revisa que los endpoints devuelvan *solo* lo que la UI necesita renderizar, omitiendo tokens, claves y arrays completos ocultos.

## 3. Formato
Las correcciones de código finales deben presentarse en línea con el estilo (`Prettier`/`ESLint`) configurado en el repositorio (ej. sangrado, uso de comillas simples o dobles, export default, etc.).

Al cerrar un issue o módulo, responde en tu resumen: "Validado por Linters, y sin alertas aparentes estilo OWASP Top 10".
