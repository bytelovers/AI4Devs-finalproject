---
doc_id: product/user-stories/TSK-4.4
title: 'TSK-4.4: Vista de Mapa Interactivo de Restaurantes'
domain: product
audience: [human, agent]
status: parcial
source_of_truth_for:
  - detalle técnico de TSK-4.4
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-4.4: Vista de Mapa Interactivo de Restaurantes


- **Historia de Usuario Relacionada:** [US-14: Mapa de Restaurantes y Analíticas de Consumo (EXIF Geolocalización)](/docs/product/user-stories/epic-4-analytics/US-14.md)
- **Épica:** Epic 4: Analytics and Paid Features
- **Capa:** Frontend (UI View)
- **Complejidad:** 4 SP
- **Dependencias:** TSK-1.1, TSK-4.3

## 1. Descripción de la Tarea
Crear la vista de mapa interactivo para usuarios Premium. Mostrará marcadores agrupados (clusters) en las coordenadas donde fueron capturados los tickets de restaurantes del historial del comensal.

## 2. Detalles de Implementación
1. **Lógica del Mapa:**
   * Crear `frontend/src/views/MapView.tsx`.
   * Utilizar una biblioteca ligera de mapas como Leaflet (con tiles libres de OpenStreetMap) o la API de Google Maps de forma diferida.
   * Si la aplicación está offline, ocultar el mapa mostrando un mensaje alternativo o renderizar un mapa SVG local interactivo simplificado.
2. **Marcadores:**
   * Cada marcador representará un restaurante del historial. Al pulsarlo, abrir una pequeña tarjeta de resumen emergente (Popup) con el nombre del restaurante, la fecha y el importe total de la cena correspondiente.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/views/MapView.test.tsx` (con mocks del contenedor de mapas) que verifique:
  * Los marcadores se pintan en pantalla para cada ticket que contenga coordenadas válidas en base de datos.
  * El componente no rompe la interfaz ni genera errores fatales de JS si el mapa se carga sin conexión activa a internet.
