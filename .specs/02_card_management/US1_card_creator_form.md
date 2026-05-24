# Épica 2: Gestión de Tarjetas y Formulario Dinámico

## 1. Historia de Usuario (INVEST)
**Como** Profesor o creador de contenido,  
**Quiero** un formulario adaptativo donde pueda seleccionar un mazo existente o crear uno nuevo con un alias amigable,  
**Para** registrar tarjetas multimedia de diferentes tipos sin cometer errores de formato estructural.

## 2. Criterios de Aceptación (Gherkin)
* **Escenario 1: Selección o creación de mazo con alias**
    * **Given** que estoy en el formulario de creación de tarjetas,
    * **When** elijo la opción "Crear nuevo mazo",
    * **Then** la UI debe solicitar un título y un "Alias de URL" (slug). Al guardar, si el slug ya existe, debe lanzar un error visual. Si es válido, genera un nuevo UUID asociado a ese alias.
    * **When** elijo "Seleccionar mazo existente",
    * **Then** un elemento `<select>` debe poblarse con los mazos devueltos desde Turso para su selección.

* **Escenario 2: Validación estricta del formato Cloze**
    * **Given** que seleccioné el tipo de tarjeta `cloze`,
    * **When** escribo un texto base en el input que NO contenga los caracteres exactos `[...]`,
    * **Then** el cliente bloquea el envío y muestra un mensaje de error: "El texto de la tarjeta tipo Cloze debe contener obligatoriamente el marcador [...]".

## 3. Requerimientos de Testing de Interfaz y Validación (Playwright)

La IA debe crear un archivo de pruebas en `tests/card-creator.spec.ts`.
* Caso de prueba 1 (Cambio de Estado Dinámico): Seleccionar el tipo de tarjeta 'single_choice'. Verificar que los inputs de 'Frente' y 'Dorso' desaparecen y que el botón "Añadir opción" aparece en el DOM. Pulsar el botón 5 veces y validar que el botón se deshabilita al llegar a la quinta opción.
* Caso de prueba 2 (Intercepción de Validación Zod): Seleccionar tipo 'cloze', escribir un texto sin el marcador `[...]` y pulsar "Guardar". Validar que el formulario no dispara la petición de red (API POST). Verificar que aparece el texto de error reglamentario.
* Caso de prueba 3 (Flujo Alternativo): Rellenar el formulario seleccionando "Nuevo Mazo", rellenar título, slug y contenido válido. Mockear la respuesta de la API para simular un HTTP 409 (Slug Duplicado). Verificar que la interfaz muestra una alerta: "El alias del mazo ya está en uso".