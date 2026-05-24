# INSTRUCCIÓN DE CODIFICACIÓN:

Desarrollar una Server Action o API Route en Next.js llamada `submitCardReview(cardId: string, isCorrect: boolean)`.
1. Seguridad: Debe extraer el JWT de las cabeceras de autorización (`Authorization: Bearer <token>`) o de las cookies de sesión seguras. Si el token no existe o es inválido, rechaza con HTTP 401. Extrae el `user_id` de los claims del JWT.
2. Lógica de Negocio con Turso (SQLite):
   - Realizar una consulta a `user_progress` buscando la fila con el `user_id` y `card_id`.
   - Si no existe el registro, ejecutar un INSERT inicializando `current_box = 1`, `fail_count = 0`.
   - Si existe y `isCorrect` es TRUE: `current_box = MIN(current_box + 1, 5)`.
     Calcular `next_review_date` en base a la nueva caja:
     * Caja 1: +1 día
     * Caja 2: +2 días
     * Caja 3: +4 días
     * Caja 4: +7 días
     * Caja 5: +14 días
     Forzar por software o query que el string guardado tenga el formato exacto `YYYY-MM-DD 00:00:00` (Inicio del día UTC).
   - Si `isCorrect` es FALSE: `current_box = 1`, incrementa `fail_count = fail_count + 1`, y `next_review_date` se iguala al día de hoy en formato `YYYY-MM-DD 00:00:00`.
3. Ejecutar los cambios en Turso mediante una sentencia `client.execute()` parametrizada para mitigar SQL Injection. Retornar el nuevo estado del progreso.