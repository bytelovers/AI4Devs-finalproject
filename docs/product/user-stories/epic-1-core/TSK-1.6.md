---
doc_id: product/user-stories/TSK-1.6
title: 'TSK-1.6: React Hook de Estado Global de Cuentas (useTicketState)'
domain: product
audience: [human, agent]
status: entregado
source_of_truth_for:
  - detalle técnico de TSK-1.6
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-1.6: React Hook de Estado Global de Cuentas (useTicketState)

> **Layout de ficheros: el de este registro es el planificado, no el entregado.** Las rutas que
> aparecen más abajo describen la estructura que se proyectó para esta tarea; el árbol real es
> distinto. La estructura entregada está en `/docs/architecture/overview.md`.
>
> | Ruta planificada en este registro | Ruta entregada |
> | :--- | :--- |
> | `frontend/src/hooks/useTicketState.ts` | `frontend/src/lib/store.ts` |
> | `frontend/src/hooks/useTicketState.test.ts` | `frontend/src/lib/store.test.ts` |
>
> El estado `entregado` de este registro se refiere a la **capacidad**, no a los ficheros
> planificados.

- **Historia de Usuario Relacionada:** [US-03: Asignación Unitaria Visual](/docs/product/user-stories/epic-1-core/US-03.md)
- **Épica:** Epic 1: Core Digitalization & Basic Assignment Flow
- **Capa:** Frontend (State Management)
- **Complejidad:** 3 SP
- **Dependencias:** TSK-1.2

## 1. Descripción de la Tarea
Implementar el gestor de estado interactivo (React Context o Hook custom) que almacene los datos de la sesión actual de reparto de la cuenta en memoria reactiva de React y persista los cambios en IndexedDB (TSK-1.2) en segundo plano (debounce).

## 2. Detalles de Implementación
1. **Diseño del Hook:**
   * Crear `frontend/src/hooks/useTicketState.ts`.
   * Debe exponer el estado de:
     * `activeTicket: Ticket | null`
     * `ticketItems: TicketItem[]`
     * `participants: Participant[]`
   * Debe exponer funciones mutadoras:
     * `addParticipant(name: string, isGroup: boolean): Promise<string>`
     * `removeParticipant(id: string): Promise<void>`
     * `updateItem(itemId: string, updates: Partial<TicketItem>): Promise<void>`
     * `allocateItemToParticipant(itemId: string, participantId: string, share: number): Promise<void>`
     * `deallocateItem(itemId: string, participantId: string): Promise<void>`
2. **Auto-guardado local:**
   * Cada mutación de estado debe programar una actualización asíncrona en `DexieTicketRepository` con una latencia de guardado de 500ms (debounced) para no saturar las transacciones de IndexedDB en asignaciones rápidas.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/hooks/useTicketState.test.ts` que valide:
  * El estado inicial es cargado correctamente desde Dexie si se proporciona un `ticketId` existente.
  * La creación de un comensal actualiza la lista de participantes en el estado reactivo inmediatamente.
  * Validar la persistencia debounced en base de datos local tras realizar 3 asignaciones seguidas.
