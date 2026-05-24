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

## 3. Instrucción de Codificación para la IA (System Prompt)
```text
INSTRUCCIÓN DE CODIFICACIÓN:
Crea un componente SPA en Next.js (App Router, Tailwind CSS, TypeScript) llamado `CardCreatorForm`.
1. Debe consumir mediante fetch los mazos existentes del backend para rellenar un selector. Permitir alternar a modo "Nuevo mazo" que pide: `title` y `slug` (validar en cliente minúsculas y guiones).
2. Renderiza dinámicamente campos basados en un `<select>` de `card_type`:
   - 'classic': 2 textareas (Frente y Dorso).
   - 'single_choice': Input de pregunta, botón para añadir inputs de opciones (Máx 5) y radio buttons para marcar el índice correcto.
   - 'multiple_choice': Igual al anterior pero con checkboxes para almacenar múltiples índices correctos.
   - 'cloze': Input para texto base (con validación de `[...]`) y un input para la palabra oculta.
3. Integra validación mediante la librería `Zod`. Al hacer submit, realiza un POST hacia la API del servidor. El objeto `content` debe ser transformado en un string JSON (`JSON.stringify`) antes de enviarse a Turso.