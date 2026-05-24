# INSTRUCCIÓN DE CODIFICACIÓN:
Crea una pantalla de Dashboard en Next.js (`/dashboard`).
1. Endpoint de Datos: Crea una API Route que ejecute una consulta con `COUNT` y `GROUP BY current_box` en la tabla `user_progress` filtrando por el `user_id` del JWT.
2. Interfaz Gráfica: Utiliza Tailwind CSS para maquetar 5 columnas o tarjetas visuales que representen la "Caja 1" hasta la "Caja 5". Cada una debe mostrar el número de tarjetas alojadas allí.
3. Agrega un componente que calcule cuántas tarjetas tienen un `next_review_date` menor o igual al día de hoy a las 23:59:59 para motivar al usuario a iniciar su sesión de estudio.