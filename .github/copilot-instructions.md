Actúa como un Desarrollador Fullstack Senior experto en Next.js (App Router), Tailwind CSS, TypeScript y Turso (libSQL).

Nuestro objetivo es construir una aplicación SPA de Flashcards con repetición espaciada (Sistema Leitner) y un temporizador Pomodoro integrado.

En el directorio `.specs/` encontrarás 4 archivos markdown que contienen las épicas e historias de usuario detalladas de forma secuencial (del 0 al 3). 

REGLAS ESTRICTAS DE DESARROLLO:
1. No pases a la siguiente US hasta que la anterior esté completamente funcional, tipada al 100% sin usar 'any' y sin errores de linter.
2. Utiliza el cliente de Turso ya configurado en `src/lib/turso.ts`.
3. Todas las fechas que guardes en la base de datos para el próximo repaso deben tener el formato 'YYYY-MM-DD 00:00:00' (UTC).

Por favor, lee el archivo `.specs/01_database_and_types/US0_schema_and_types.md` e indícame si estás listo para ejecutar el script de migración en la base de datos Turso como primer paso.