# Épica 2 (Extensión): Edición y Limpieza de Contenido

## 1. Historia de Usuario (INVEST)
**Como** Profesor o estudiante,  
**Quiero** poder editar el contenido de una tarjeta existente y eliminar mazos que ya no necesito,  
**Para** corregir errores ortográficos en mis flashcards y mantener mi panel de estudio limpio.

## 2. Criterios de Aceptación (Gherkin)
* Escenario 1: Edición de tarjetas preservando el progreso
    * Given que estoy editando una tarjeta que ya está en la `Caja 4`,
    * When modifico el texto del frente o del dorso y guardo los cambios,
    * Then Turso debe actualizar el campo `content` en la tabla `cards`, pero no debe alterar el registro de `user_progress` (se conserva la racha).

* Escenario 2: Eliminación en cascada de un mazo con confirmación de seguridad
    * Given que decido eliminar un mazo completo por su `slug`,
    * When se despliega el modal de advertencia, el botón de eliminación debe estar bloqueado,
    * Then se desbloquea únicamente cuando escribo la palabra exacta "ELIMINAR" en el input de confirmación. Al confirmar, ejecuta un `DELETE` en la tabla `decks` borrando en cascada tarjetas y progresos.
 
## 3. Requerimientos de Testing (Vitest para API / Playwright para UI)

### Pruebas Unitarias/Integración (src/actions/deckCrud.test.ts):
  1. **Persistencia de Progreso tras Edición:** 
     - Crear una tarjeta ficticia con un estado de progreso en `Caja 4`.
     - Ejecutar la Server Action de actualización modificando el contenido textual de la tarjeta.
     - Realizar un `SELECT` en `user_progress` y comprobar que `current_box` sigue siendo `4`.

### Pruebas E2E (tests/deck-deletion.spec.ts):
  1. **Confirmación de Eliminación:**
     - Hacer clic en el botón "Eliminar Mazo".
     - Verificar que aparece el modal de advertencia y que el botón de confirmación está inicialmente deshabilitado hasta que el usuario escriba la palabra "ELIMINAR" (o confirmación equivalente para evitar accidentes).