# INSTRUCCIÓN DE CODIFICACIÓN:
Implementa la interfaz de usuario de la pantalla de estudio en Next.js bajo la ruta `/deck/[slug]/study`.
1. Fetching de Datos: Consulta las tarjetas vencidas conectándote al backend que lee de Turso. Si no hay tarjetas, renderiza un componente de "Empty State" indicando que el mazo está completamente al día.
2. Estado de la Tarjeta: Renderiza el frente de la tarjeta ocultando las soluciones según su tipo. Al pulsar un botón "Ver respuesta", revela el dorso o las opciones correctas y habilita dos botones: "Lo sabía" y "No lo sabía" que disparan el backend de la US2.
3. Pomodoro con Persistencia en `sessionStorage`:
   - Diseña un Custom Hook llamado `usePomodoro` que maneje el estado de los minutos y segundos del ciclo (Estudio: 25 min / Descanso: 5 min).
   - En cada tick del intervalo (1 segundo), escribe el timestamp de finalización esperado en el `sessionStorage`.
   - Al inicializar el hook (montaje del componente), verifica si existe un valor válido en el `sessionStorage` de la sesión actual; si existe, calcula la diferencia de tiempo restante para evitar reinicios por F5.
4. UI de Bloqueo: Cuando el estado del hook sea `BREAK_MODE`, renderiza un modal con `backdrop-blur` y un `z-index` máximo que cubra la pantalla por completo impidiendo clics externos o interacción alguna, mostrando el temporizador de descanso de 5:00.
