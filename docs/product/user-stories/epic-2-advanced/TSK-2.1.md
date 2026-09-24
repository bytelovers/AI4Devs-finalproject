---
doc_id: product/user-stories/TSK-2.1
title: 'TSK-2.1: Implementación del Algoritmo de Ajuste de Céntimos (Penny Adjustment Helper)'
domain: product
audience: [human, agent]
status: parcial
source_of_truth_for:
  - detalle técnico de TSK-2.1
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-2.1: Implementación del Algoritmo de Ajuste de Céntimos (Penny Adjustment Helper)

> **Nota de estado: `parcial`.** El entregable que esta tarea especifica —
> `frontend/src/utils/mathHelper.ts` con `splitAmount(total, partsCount)`— **nunca se creó**: ni esa
> ruta ni su prueba `frontend/src/utils/mathHelper.test.ts` existen, y `grep -rni penny frontend/src`
> devuelve 0 coincidencias.
>
> La capacidad que la tarea perseguía —repartir un plato compartido con cuadre exacto— **sí está
> entregada**, pero por otro camino: el reparto se expresa con pesos por persona (`personItemShare`
> y `computeShares` en `frontend/src/lib/calc.ts`) y el cuadre se **verifica** con `verifyCuadre` en
> el mismo fichero, en lugar de ajustar céntimos con un helper dedicado.
>
> El contenido que sigue se conserva como el plan original de la tarea.

- **Historia de Usuario Relacionada:** [US-04: División de Platos Compartidos con Ajuste de Redondeo Matemático](/docs/product/user-stories/epic-2-advanced/US-04.md)
- **Épica:** Epic 2: Advanced Reparto, Rounding & Gamification Flow
- **Capa:** Frontend (Utilities)
- **Complejidad:** 3 SP
- **Dependencias:** TSK-1.6

## 1. Descripción de la Tarea
Escribir la función matemática que realice la división de platos compartidos a partes iguales evitando descuadres de céntimos flotantes. Si la división produce una fracción infinita (e.g. 10.00€ / 3 = 3.33333...), el algoritmo debe aplicar 3.33€ a todos y asignar la diferencia de 0.01€ al primer comensal o prorratearlo céntimo a céntimo de forma atómica.

## 2. Detalles de Implementación
1. **Lógica Matemática:**
   * Crear `frontend/src/utils/mathHelper.ts`.
   * Implementar función `splitAmount(total: number, partsCount: number): number[]`:
     * Debe retornar un array de números de longitud `partsCount`.
     * Cada elemento debe tener exactamente 2 decimales.
     * La suma de todos los elementos del array resultante debe ser exactamente igual a `total`.
     * *Algoritmo sugerido:*
       ```typescript
       const share = Math.floor((total * 100) / partsCount) / 100;
       const remainder = Math.round((total - (share * partsCount)) * 100) / 100;
       const shares = Array(partsCount).fill(share);
       for (let i = 0; i < Math.round(remainder * 100); i++) {
         shares[i] = Math.round((shares[i] + 0.01) * 100) / 100;
       }
       return shares;
       ```
2. **Integración en Hook de Asignación:**
   * Modificar `allocateItemToParticipant` de `useTicketState` para aplicar esta distribución de decimales dinámicamente cuando un ítem es compartido por más de un comensal.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/utils/mathHelper.test.ts` con casos de prueba:
  * Dividir `10.00` entre 3: devuelve `[3.34, 3.33, 3.33]` (la suma es exactamente 10.00).
  * Dividir `0.01` entre 3: devuelve `[0.01, 0.00, 0.00]`.
  * Dividir `9.99` entre 3: devuelve `[3.33, 3.33, 3.33]`.
  * Ningún comensal recibe un importe con más de 2 posiciones decimales.
