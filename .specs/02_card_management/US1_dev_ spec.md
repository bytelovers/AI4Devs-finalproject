# INSTRUCCIÓN DE CODIFICACIÓN:
Crea un componente SPA en Next.js (App Router, Tailwind CSS, TypeScript) llamado `CardCreatorForm`.
1. Debe consumir mediante fetch los mazos existentes del backend para rellenar un selector. Permitir alternar a modo "Nuevo mazo" que pide: `title` y `slug` (validar en cliente minúsculas y guiones).
2. Renderiza dinámicamente campos basados en un `<select>` de `card_type`:
   - 'classic': 2 textareas (Frente y Dorso).
   - 'single_choice': Input de pregunta, botón para añadir inputs de opciones (Máx 5) y radio buttons para marcar el índice correcto.
   - 'multiple_choice': Igual al anterior pero con checkboxes para almacenar múltiples índices correctos.
   - 'cloze': Input para texto base (con validación de `[...]`) y un input para la palabra oculta.
3. Integra validación mediante la librería `Zod`. Al hacer submit, realiza un POST hacia la API del servidor. El objeto `content` debe ser transformado en un string JSON (`JSON.stringify`) antes de enviarse a Turso.

4. Desarrolla el componente frontend `CardCreatorForm` en Next.js. Debe cargar los mazos existentes mediante fetch desde `/api/decks` para poblar el selector de "Mazo Existente".
5. Implementa un switch/toggle para cambiar a "Nuevo Mazo". Si está activo, el formulario muta para pedir `deck_title` y `deck_slug`. Limita por regex el input del slug a '^[a-z0-9-]+$'.
6. Renderiza dinámicamente los campos de la tarjeta según el `card_type` seleccionado en el dropdown principal.
7. Desarrolla el endpoint del backend (`/api/cards` o Server Action). Debe validar el input usando el tipo de TypeScript `CreateCardPayload` mapeado en un esquema de Zod.
8. Para el caso `mode: 'new'`, debes usar la característica de transacciones de Turso (`client.batch()`) o ejecutar de forma secuencial controlada:
   - SQL 1: INSERT INTO decks (slug, title, category) VALUES (?, ?, ?) RETURNING id;
   - SQL 2: INSERT INTO cards (deck_id, card_type, content) VALUES (?, ?, ?);
   Si la inserción del mazo falla por slug duplicado, la base de datos no debe guardar la tarjeta suelta.