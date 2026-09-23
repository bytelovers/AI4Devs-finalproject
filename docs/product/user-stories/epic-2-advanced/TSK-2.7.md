---
doc_id: product/user-stories/TSK-2.7
title: 'TSK-2.7: Recuperación Automática de Sesiones y Borrado de Datos Locales'
domain: product
audience: [human, agent]
status: entregado
source_of_truth_for:
  - detalle técnico de TSK-2.7
last_verified: 2026-09-22
verified_against: c66fd3f
---

# TSK-2.7: Recuperación Automática de Sesiones y Borrado de Datos Locales

> **Layout de ficheros: el de este registro es el planificado, no el entregado.** Las rutas que
> aparecen más abajo describen la estructura que se proyectó para esta tarea; el árbol real es
> distinto. La estructura entregada está en `/docs/architecture/overview.md`.
>
> | Ruta planificada en este registro | Ruta entregada |
> | :--- | :--- |
> | `frontend/src/services/db/Recovery.test.ts` | `frontend/src/lib/store.ts` |
>
> El estado `entregado` de este registro se refiere a la **capacidad**, no a los ficheros
> planificados.

- **Historia de Usuario Relacionada:** [US-09: Pantalla de Dictado al Camarero e Historial de Sesión Local](/docs/product/user-stories/epic-2-advanced/US-09.md)
- **Épica:** Epic 2: Advanced Reparto, Rounding & Gamification Flow
- **Capa:** Frontend (Persistence Logic)
- **Complejidad:** 2 SP
- **Dependencias:** TSK-1.2, TSK-1.6

## 1. Descripción de la Tarea
Añadir control de guardado de emergencia de la sesión activa en el almacenamiento local permanente ante cierres accidentales del navegador y proporcionar un menú en la configuración de la app para vaciar todo el historial e IndexedDB de forma segura según el RGPD.

## 2. Detalles de Implementación
1. **Auto-guardado ante cierre (BeforeUnload):**
   * Guardar la clave `active_ticket_id` en `localStorage` ante el evento `window.addEventListener('beforeunload')`.
2. **Banner de Recuperación:**
   * Al iniciar la aplicación, si `localStorage.getItem('active_ticket_id')` no está vacío, consultar en IndexedDB si el ticket está incompleto.
   * Mostrar un banner emergente: *"Tienes una cuenta a medias del restaurante X. ¿Quieres reanudarla?"* con opciones de Reanudar y Descartar.
3. **Limpieza General de Datos:**
   * Implementar función `clearAllLocalData()` que purgue todas las tablas de IndexedDB y vacíe el `localStorage`.

## 3. Criterios de Aceptación y Pruebas (DoD)
* Fichero de test `frontend/src/services/db/Recovery.test.ts` que valide:
  * Si la sesión se cierra a la mitad, al volver a inicializar la base de datos se puede recuperar el estado reactivo completo.
  * Ejecutar el borrado de datos elimina físicamente los registros y vacía las tablas de IndexedDB, comprobándolo mediante `db.tickets.count() === 0`.
