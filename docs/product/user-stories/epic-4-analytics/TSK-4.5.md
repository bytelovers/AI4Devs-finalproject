---
doc_id: product/user-stories/TSK-4.5
title: 'TSK-4.5: Panel de Analíticas y Gráficos de Gasto Colectivo'
domain: product
audience: [human, agent]
status: parcial
source_of_truth_for:
  - detalle técnico de TSK-4.5
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-4.5: Panel de Analíticas y Gráficos de Gasto Colectivo


- **Historia de Usuario Relacionada:** [US-14: Mapa de Restaurantes y Analíticas de Consumo (EXIF Geolocalización)](/docs/product/user-stories/epic-4-analytics/US-14.md)
- **Épica:** Epic 4: Analytics and Paid Features
- **Capa:** Frontend (UI View / Canvas)
- **Complejidad:** 3 SP
- **Dependencias:** TSK-1.1, TSK-1.2

## 1. Descripción de la Tarea
Implementar el cuadro de mandos con gráficos interactivos sencillos sobre hábitos de consumo colectivo para el organizador (gasto mensual medio, distribución de categorías de alimentos, propinas totales aportadas).

## 2. Detalles de Implementación
1. **Renderizado de Gráficos:**
   * Crear `frontend/src/views/AnalyticsView.tsx`.
   * Utilizar un motor de renderizado de gráficos ligero basado en Canvas o SVG (ej: Chart.js o Recharts) que soporte responsividad en móviles.
2. **Métricas a calcular:**
   * Gasto promedio por comida grupal.
   * Distribución de platos por comensal habitual.
   * Gráfico de líneas con la evolución mensual de gastos grupales acumulados.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/views/AnalyticsView.test.tsx` que verifique que el cálculo de promedios matemáticos a partir del array de tickets es correcto.
* Comprobar que los gráficos se adaptan correctamente al reescalado de pantalla de dispositivos móviles en horizontal y vertical (responsive layout check).
