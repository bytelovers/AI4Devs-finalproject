# Épica 5: Panel de Analíticas y Retención

## 1. Historia de Usuario (INVEST)
**Como** Estudiante competitivo,  
**Quiero** ver un tablero visual con la distribución de mis tarjetas por cada una de las 5 cajas de Leitner,  
**Para** entender cuánta información he consolidado en mi memoria a largo plazo (Caja 5) y cuánta sigo fallando (Caja 1).

## 2. Criterios de Aceptación (Gherkin)
* **Escenario 1: Renderizado del gráfico de cajas**
    * **Given** que accedo a mi `/dashboard`,
    * **When** el componente se monta y valida mi JWT,
    * **Then** realiza una consulta agregada a Turso y muestra un gráfico de barras (o contador visual) con el total de tarjetas que el usuario tiene en cada `current_box` (del 1 al 5).

* **Escenario 2: Contador de tarjetas pendientes hoy**
    * **Given** que tengo 5 tarjetas que vencen hoy a las 00:00:00 y 10 que vencen mañana,
    * **When** carga el dashboard,
    * **Then** debe mostrar un contador destacado: *"Tienes 5 tarjetas listas para repaso hoy"*.