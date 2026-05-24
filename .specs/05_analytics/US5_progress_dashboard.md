# Épica 5: Panel de Analíticas y Retención

## 1. Historia de Usuario (INVEST)
**Como** Estudiante competitivo,  
**Quiero** ver un tablero visual con la distribución de mis tarjetas por cada una de las 5 cajas de Leitner,  
**Para** entender cuánta información he consolidado en mi memoria a largo plazo (Caja 5) y cuánta sigo fallando (Caja 1).

## 2. Criterios de Aceptación (Gherkin)
* Escenario 1: Renderizado del gráfico de cajas
    * Given que accedo a mi `/dashboard`,
    * When el componente se monta y valida mi JWT,
    * Then realiza una consulta agregada a Turso y muestra un gráfico de barras o contador visual con el total de tarjetas que el usuario tiene en cada `current_box` (del 1 al 5).

* Escenario 2: Contador de tarjetas pendientes hoy
    * Given que tengo 5 tarjetas que vencen hoy a las 00:00:00 y 10 que vencen mañana,
    * When carga el dashboard,
    * Then debe mostrar un contador destacado: "Tienes 5 tarjetas listas para repaso hoy".

## 3. Requerimientos de Testing de Agregación (Vitest)
La IA debe crear un archivo de pruebas para el endpoint de analíticas en `src/api/dashboard.test.ts`.
* Mocks y Semillado de Prueba: Simular que en la tabla `user_progress` hay 3 tarjetas en Caja 1, 0 tarjetas en Caja 2, y 5 tarjetas en Caja 5.
* Casos de prueba obligatorios:
  1. Exactitud del Group By: Verificar que la respuesta JSON de la API devuelva exactamente un objeto mapeado con los valores simulados (`{ box1: 3, box2: 0, box3: 0, box4: 0, box5: 5 }`).
  2. Cálculo de Tarjetas Pendientes: Insertar una tarjeta cuyo `next_review_date` sea el día de mañana. Verificar que el contador de "Tarjetas pendientes para hoy" no la sume en el resultado final del dashboard.