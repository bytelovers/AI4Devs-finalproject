# Épica 2 (Extensión): Edición y Limpieza de Contenido

## 1. Historia de Usuario (INVEST)
**Como** Profesor o estudiante,  
**Quiero** poder editar el contenido de una tarjeta existente y eliminar mazos que ya no necesito,  
**Para** corregir errores ortográficos en mis flashcards y mantener mi panel de estudio limpio.

## 2. Criterios de Aceptación (Gherkin)
* **Escenario 1: Edición de tarjetas preservando el progreso**
    * **Given** que estoy editando una tarjeta que ya está en la `Caja 4`,
    * **When** modifico el texto del frente o del dorso y guardo los cambios,
    * **Then** Turso debe actualizar el campo `content` en la tabla `cards`, pero **no** debe alterar el registro de `user_progress` (el usuario no debe perder su racha de estudio por corregir una tilde).

* **Escenario 2: Eliminación en cascada de un mazo**
    * **Given** que decido eliminar un mazo completo por su `slug`,
    * **When** confirmo la acción en el modal de advertencia,
    * **Then** el backend ejecuta un `DELETE` en la tabla `decks`. Por integridad referencial (`ON DELETE CASCADE`), se deben borrar automáticamente todas sus tarjetas asociadas en `cards` y los registros de progreso en `user_progress`.
