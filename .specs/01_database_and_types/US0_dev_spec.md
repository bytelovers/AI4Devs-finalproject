# INSTRUCCIÓN DE CONFIGURACIÓN:
1. Configura una conexión a base de datos Turso utilizando el SDK oficial `@libsql/client`.
2. Crea un archivo de definición de tipos `types/flashcards.ts` que contenga exactamente la unión discriminada de tipos expuesta arriba.
3. Asegúrate de implementar una función helper de parseo seguro que valide que el string JSON recuperado de la columna `cards.content` se mapee correctamente al tipo `CardContent` en tiempo de ejecución.ßß