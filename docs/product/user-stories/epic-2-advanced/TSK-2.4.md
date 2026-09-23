---
doc_id: product/user-stories/TSK-2.4
title: 'TSK-2.4: Módulo de Redondeo Individual y Propina Común'
domain: product
audience: [human, agent]
status: parcial
source_of_truth_for:
  - detalle técnico de TSK-2.4
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-2.4: Módulo de Redondeo Individual y Propina Común

> **Layout de ficheros: el de este registro es el planificado, no el entregado.** Las rutas que
> aparecen más abajo describen la estructura que se proyectó para esta tarea; el árbol real es
> distinto. La estructura entregada está en `/docs/architecture/overview.md`.
>
> | Ruta planificada en este registro | Ruta entregada |
> | :--- | :--- |
> | `frontend/src/hooks/useTicketState.test.ts` | `frontend/src/lib/store.test.ts` |
>
> El estado `parcial` de este registro se refiere a la **capacidad**, no a los ficheros
> planificados.

> **Qué está entregado y qué no.** La **propina común** sí está entregada: `tipMode`, `tipAmount` y
> `calcTipAmount` en `frontend/src/lib/calc.ts`.
>
> El **redondeo seleccionable** no lo está. El ajuste `settings.roundingMode`, con sus valores
> `'cents' | 'fifty' | 'unit'`, está declarado en `frontend/src/lib/types.ts:222` y se persiste con
> el valor por defecto `'cents'` en `frontend/src/lib/store.ts:91`, pero **no alimenta ningún
> cálculo**: las únicas lecturas fuera del propio almacén están en pruebas. El redondeo real es
> siempre a céntimos, con `round2` en `frontend/src/lib/calc.ts`. Es un ajuste que se puede
> configurar y no hace nada.

- **Historia de Usuario Relacionada:** [US-07: Redondeo Visual e Individual y Propina Común](/docs/product/user-stories/epic-2-advanced/US-07.md)
- **Épica:** Epic 2: Advanced Reparto, Rounding & Gamification Flow
- **Capa:** Frontend (State & UI)
- **Complejidad:** 2 SP
- **Dependencias:** TSK-1.6

## 1. Descripción de la Tarea
Implementar la posibilidad de redondear la cuenta de un comensal individual al euro más cercano (e.g., de 14.30€ a 15.00€) a petición suya, acumulando el remanente (0.70€) en una bolsa común de propina para el restaurante.

## 2. Detalles de Implementación
1. **Actualización de Schema y Estado:**
   * Crear la propiedad `isRounded: boolean` para los participantes en la base de datos local IndexedDB.
   * Modificar `useTicketState` para incluir una función `toggleParticipantRounding(id: string): Promise<void>`.
2. **Cálculo de Totales con Redondeo:**
   * El total final a pagar por cada comensal se calcula como `Math.ceil(baseAmount)` si la opción `isRounded` está activa.
   * La propina acumulada de la mesa se calcula sumando la diferencia de todos los participantes con redondeo activado: `totalTips = sum(Math.ceil(base) - base)`.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/hooks/useTicketState.test.ts`:
  * Validar que si 3 participantes consumen 12.33€ cada uno y todos activan redondeo, el total a pagar individual sube a 13.00€ cada uno, y la propina acumulada total se calcula correctamente en 2.01€.
  * El desglose visual en la pantalla de resumen detalla qué porción del pago corresponde al consumo real y cuál a propina.
