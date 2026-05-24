# Épica 4: Interfaz de Estudio y Sistema Pomodoro

## 1. Historia de Usuario (INVEST)
**Como** Estudiante,  
**Quiero** una pantalla fluida que consuma tarjetas vencidas y un temporizador Pomodoro que resista recargas de la página mientras siga logueado,  
**Para** estudiar de manera disciplinada y sin perder el hilo de mi sesión actual.

## 2. Criterios de Aceptación (Gherkin)
* **Escenario 1: Consumo de tarjetas agendadas**
    * **Given** que accedo a la ruta `/deck/[slug]/study`,
    * **When** el sistema realiza la petición al backend,
    * **Then** debe buscar el ID del mazo usando el `slug` de la URL, y traer solo las tarjetas de ese mazo asociadas al usuario donde `next_review_date <= strftime('%Y-%m-%d %H:%M:%S', 'now')`.

* **Escenario 2: Persistencia del Pomodoro en Session y Modo Break**
    * **Given** que inicio el temporizador Pomodoro de 25 minutos,
    * **When** refresco la pestaña del navegador (F5),
    * **Then** el frontend recupera el estado de `sessionStorage` y reanuda el conteo exactamente en el segundo donde se quedó.
    * **When** el contador llega a `00:00`,
    * **Then** entra en `BREAK_MODE`, inyectando un modal opaco absoluto en toda la pantalla con una cuenta atrás de 5 minutos, bloqueando los botones de respuesta "Lo sabía" y "No lo sabía".