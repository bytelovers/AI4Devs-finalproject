---
doc_id: product/user-stories/TSK-2.2
title: 'TSK-2.2: Reparto Rápido de Entrantes y Platos Comunes'
domain: product
audience: [human, agent]
status: entregado
source_of_truth_for:
  - detalle técnico de TSK-2.2
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-2.2: Reparto Rápido de Entrantes y Platos Comunes

> **Layout de ficheros: el de este registro es el planificado, no el entregado.** Las rutas que
> aparecen más abajo describen la estructura que se proyectó para esta tarea; el árbol real es
> distinto. La estructura entregada está en `/docs/architecture/overview.md`.
>
> | Ruta planificada en este registro | Ruta entregada |
> | :--- | :--- |
> | `frontend/src/views/SplitBoardView.test.tsx` | `frontend/src/components/ticket/AssignmentEditor.test.tsx` |
>
> El estado `entregado` de este registro se refiere a la **capacidad**, no a los ficheros
> planificados.

- **Historia de Usuario Relacionada:** [US-05: Asignación Rápida de Comunes / Entrantes](/docs/product/user-stories/epic-2-advanced/US-05.md)
- **Épica:** Epic 2: Advanced Reparto, Rounding & Gamification Flow
- **Capa:** Frontend (State & UI)
- **Complejidad:** 3 SP
- **Dependencias:** TSK-1.8, TSK-2.1

## 1. Descripción de la Tarea
Añadir soporte para selección múltiple de artículos en el tablero de asignación y un botón de acción rápida que divida la suma de todos los artículos seleccionados equitativamente entre todos los comensales agregados a la mesa.

## 2. Detalles de Implementación
1. **Selección Múltiple en UI:**
   * Añadir un selector de casillas (checkbox) en la lista de artículos de `SplitBoardView`.
   * Mostrar una barra de herramientas flotante inferior (Action Bar) cuando hay al menos 1 plato seleccionado.
2. **Acción "Dividir entre todos":**
   * Crear la función `allocateMultipleItemsToAll(itemIds: string[]): Promise<void>` en `useTicketState`.
   * Esta función asocia a cada uno de los comensales registrados en la mesa una cuota equitativa (`1/N`) de cada plato seleccionado utilizando el algoritmo de ajuste de céntimos.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/views/SplitBoardView.test.tsx` que simule:
  * Seleccionar 3 artículos y pulsar "Dividir entre todos" con 4 comensales creados en la mesa.
  * Validar que los 3 artículos quedan completamente asignados y que los totales de los comensales sumen el valor total exacto.
  * Probar botón de "Deshacer" (Undo) de la acción grupal para devolver el estado anterior.
