# Épica 3: Motor Algorítmico Leitner (Backend)

## 1. Historia de Usuario (INVEST)
**Como** Sistema de aprendizaje inteligente,  
**Quiero** procesar las respuestas de los usuarios validando su token de sesión JWT,  
**Para** calcular de manera determinista la degradación o el aumento de la caja Leitner y agendar el próximo repaso al inicio del día correspondiente.

## 2. Criterios de Aceptación (Gherkin)
* Escenario 1: Acierto del usuario (Incremento de Caja y Días al inicio del día)
    * Given que un usuario tiene una tarjeta en la caja 2 (`current_box = 2`),
    * When el servidor procesa una petición válida con `isCorrect: true`,
    * Then actualiza el registro en `user_progress` a `current_box = 3` y calcula la fecha sumando 4 días a partir de hoy, forzando la hora a las 00:00:00 UTC (Formato: `YYYY-MM-DD 00:00:00`).

* Escenario 2: Fallo del usuario (Degradación inmediata a caja 1)
    * Given que un usuario tiene una tarjeta en la caja 5 (`current_box = 5`),
    * When el servidor procesa una petición con `isCorrect: false`,
    * Then reinicia `current_box = 1`, incrementa `fail_count` en 1, y setea `next_review_date` al día de hoy a las 00:00:00 UTC para que esté disponible inmediatamente.

## 4. Requerimientos de Testing (Vitest)
La IA debe crear un archivo de pruebas unitarias `src/actions/submitCardReview.test.ts`.

* Mocking: Debe mockear el cliente de Turso (`@libsql/client`) para interceptar las consultas SQL (`execute`).
* Casos de prueba obligatorios:
  1. Test de Degradación: Si la tarjeta simulada está en `current_box: 4` y la acción recibe `isCorrect: false`, verificar que la query de actualización ejecute un `SET current_box = 1` y sume 1 a `fail_count`.
  2. Test de Límite Superior: Si la tarjeta está en `current_box: 5` y recibe `isCorrect: true`, verificar que la query mantenga `current_box = 5` y que la fecha calculada sea exactamente hoy + 14 días a las `00:00:00`.
  3. Test de Idempotencia: Si no existe registro previo en `user_progress`, validar que la primera query sea un `INSERT` con los valores base correctamente calculados.