---
doc_id: product/user-stories/TSK-1.2
title: 'TSK-1.2: Inicialización del Esquema Dexie.js (IndexedDB) y Capa Repository (DAL)'
domain: product
audience: [human, agent]
status: parcial
source_of_truth_for:
  - detalle técnico de TSK-1.2
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-1.2: Inicialización del Esquema Dexie.js (IndexedDB) y Capa Repository (DAL)


- **Historia de Usuario Relacionada:** [US-03: Asignación Unitaria Visual](/docs/product/user-stories/epic-1-core/US-03.md)
- **Épica:** Epic 1: Core Digitalization & Basic Assignment Flow
- **Capa:** Frontend (Base de Datos Local)
- **Complejidad:** 3 SP
- **Dependencias:** TSK-1.1

## 1. Descripción de la Tarea
Crear la definición de tablas locales con Dexie.js (`tickets`, `items`, `participants`), la inicialización de la base de datos `SplitEatDB`, y definir la interfaz genérica `ITicketRepository` para permitir la posterior migración/sync a Firestore.

## 2. Detalles de Implementación
1. **Esquema e Interfaces:**
   * Implementar en `frontend/src/services/db/schema.ts` las interfaces TypeScript descritas en [local-model.md](/docs/data/local-model.md): `Ticket`, `TicketItem`, `Participant`, `ItemAllocation`.
2. **Inicialización de Dexie:**
   * Crear `frontend/src/services/db/SplitEatDatabase.ts` extendiendo `Dexie`.
   * Declarar el esquema de indexación en la versión 1:
     * `tickets: 'id, date, syncStatus, lastUpdated'`
     * `items: 'id, ticketId'`
     * `participants: 'id, name'`
3. **Abstracción de Repositorio:**
   * Crear `frontend/src/services/db/ITicketRepository.ts` con la interfaz común:
     ```typescript
     export interface ITicketRepository {
       getTickets(): Promise<Ticket[]>;
       getTicketById(id: string): Promise<Ticket | null>;
       saveTicket(ticket: Ticket, items: TicketItem[], participants: Participant[]): Promise<void>;
       deleteTicket(id: string): Promise<void>;
     }
     ```
   * Crear `frontend/src/services/db/DexieTicketRepository.ts` implementando dicha interfaz con transacciones atómicas (`db.transaction('rw', ...)`).

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/services/db/DexieTicketRepository.test.ts` que valide:
  * Inserción y lectura de un ticket completo con 3 ítems y 2 participantes.
  * Borrado en cascada (al borrar un ticket, se deben eliminar sus ítems de la tabla `items`).
  * Validación de tipos en campos numéricos (precios no negativos).
