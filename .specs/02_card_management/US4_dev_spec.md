# INSTRUCCIÓN DE CODIFICACIÓN:
1. Agrega un botón de "Editar Tarjeta" en la interfaz. Al pulsarlo, debe abrir el componente `CardCreatorForm` (US1) en modo edición, precargando los estados de React con el JSON del campo `content` actual.
2. Al hacer submit (PUT a la API), actualiza la tabla `cards` mediante una query parametrizada en Turso filtrando por el `id` de la tarjeta.
3. Implementa un botón de "Eliminar Mazo" con un modal de confirmación conteniendo un input de texto de seguridad. El mazo debe borrarse mediante un DELETE hacia `/api/decks/[id]`.