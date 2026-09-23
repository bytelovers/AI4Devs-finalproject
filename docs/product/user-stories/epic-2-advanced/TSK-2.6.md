---
doc_id: product/user-stories/TSK-2.6
title: 'TSK-2.6: Vista de Dictado al Camarero'
domain: product
audience: [human, agent]
status: entregado
source_of_truth_for:
  - detalle técnico de TSK-2.6
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-2.6: Vista de Dictado al Camarero

> **Layout de ficheros: el de este registro es el planificado, no el entregado.** Las rutas que
> aparecen más abajo describen la estructura que se proyectó para esta tarea; el árbol real es
> distinto. La estructura entregada está en `/docs/architecture/overview.md`.
>
> | Ruta planificada en este registro | Ruta entregada |
> | :--- | :--- |
> | `frontend/src/views/WaiterDictationView.tsx` | `Ninguna: no se implementó` |
>
> El estado `entregado` de este registro se refiere a la **capacidad**, no a los ficheros
> planificados.

- **Historia de Usuario Relacionada:** [US-09: Pantalla de Dictado al Camarero e Historial de Sesión Local](/docs/product/user-stories/epic-2-advanced/US-09.md)
- **Épica:** Epic 2: Advanced Reparto, Rounding & Gamification Flow
- **Capa:** Frontend (UI View)
- **Complejidad:** 2 SP
- **Dependencias:** TSK-1.1, TSK-1.6

## 1. Descripción de la Tarea
Crear una pantalla limpia y con diseño de alta accesibilidad (modo de alto contraste para exteriores) que liste los totales consolidados a cobrar a cada persona o familia, facilitando dictarle las cantidades una a una al camarero.

## 2. Detalles de Implementación
1. **Diseño Adaptivo para Mesa:**
   * Crear `frontend/src/views/WaiterDictationView.tsx`.
   * Mostrar tarjetas verticales de gran tamaño. Cada tarjeta contendrá:
     * Nombre del comensal / Subgrupo Familiar.
     * Importe final a pagar en tamaño de fuente grande (e.g. `2.5rem`), incluyendo el redondeo si lo tuviera.
     * Checkbox táctil gigante para marcar como "Pagado". Al marcarlo, la tarjeta se atenúa al 50% de opacidad para no confundirse.
2. **Totales del Restaurante:**
   * Mostrar el total neto del ticket original a cobrar y el total acumulado cobrado hasta el momento para control del organizador.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Validar por test unitario y manual que el contraste cumple con WCAG AAA en exteriores (contraste superior a 7:1 en textos principales de pago).
* Los botones táctiles de "Marcar Pagado" responden en menos de 50ms (sin retardo de clic móvil de 300ms de navegadores antiguos).
